import Fastify, { type FastifyInstance } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import { chatCompletionRequestSchema } from "@gateway/contracts";
import { acceptAndReserveRequest, authenticateApiKey, calculateCustomerCharge, createRateLimiter, finishProviderAttempt, loadConfig, releaseRequest, resolveModelAccess, securityHeaders, settleRequest, signInternalAssertion, startProviderAttempt } from "@gateway/core";
import { query } from "@gateway/database";
import { parseProviderUsage } from "./provider-response.js";
import { dispatchProvider } from "./provider-transport.js";

function digestBody(body: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(JSON.stringify(body), "utf8").digest("hex")}`;
}

function inputTokenEstimate(body: unknown): number {
  return Math.max(1, Math.ceil(JSON.stringify(body).length / 4));
}

export function buildEdge(): FastifyInstance {
  const app = Fastify({
    bodyLimit: 2 * 1024 * 1024,
    logger: { redact: ["req.headers.authorization", "req.headers.cookie"] }
  });
  const siteLimiter = createRateLimiter(Number(process.env["EDGE_RATE_LIMIT"] ?? 300), 60_000);
  app.addHook("onSend", async (_request, reply, payload) => {
    for (const [name, value] of Object.entries(securityHeaders())) reply.header(name, value);
    return payload;
  });
  app.addHook("preHandler", async (request, reply) => {
    if (request.raw.url === "/health" || request.raw.url === "/ready") return;
    if (siteLimiter.limited(request.ip ?? "unknown")) return reply.code(429).send({ error: "too_many_requests" });
  });
  app.get("/health", async () => ({ status: "ok", service: "edge" }));
  app.get("/ready", async (_request, reply) => {
    try {
      await query("SELECT 1");
      loadConfig();
      return { status: "ready", service: "edge" };
    } catch {
      return reply.code(503).send({ status: "not_ready", service: "edge" });
    }
  });
  app.post("/v1/chat/completions", async (request, reply) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return reply.code(401).send({ error: "missing_api_key" });
    const pepper = process.env["API_KEY_PEPPER"];
    const secret = authorization.slice("Bearer ".length);
    if (!pepper) return reply.code(503).send({ error: "key_service_unconfigured" });
    const key = await authenticateApiKey(secret, pepper);
    if (!key) return reply.code(401).send({ error: "invalid_api_key" });
    const config = loadConfig();
    const parsed = chatCompletionRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    if (parsed.data.model.length === 0) return reply.code(400).send({ error: "invalid_model" });
    if (parsed.data.stream) return reply.code(501).send({ error: "streaming_not_implemented" });
    if (key.allowedRegion !== "US") return reply.code(403).send({ error: "region_not_served" });
    let access;
    try {
      access = await resolveModelAccess(key.workspaceId, parsed.data.model, key.allowedRegion, key.retentionMode);
    } catch (error) {
      request.log.warn({ err: error }, "route policy denied request");
      return reply.code(403).send({ error: "model_route_not_approved" });
    }
    {
      if (!config.EDGE_ENABLE_DISPATCH) return reply.code(402).send({ error: "wallet_authorization_required" });
      if (!process.env["INTERNAL_ASSERTION_SECRET"] || !process.env["LITELLM_MASTER_KEY"]) return reply.code(503).send({ error: "dispatch_service_unconfigured" });

      const requestId = randomUUID();
      const estimate = inputTokenEstimate(parsed.data);
      const maximumOutputTokens = Math.min(parsed.data.max_completion_tokens ?? parsed.data.max_tokens ?? access.maximumOutputTokens, access.maximumOutputTokens);
      const maximumChargeUsd = calculateCustomerCharge(access.price, { inputTokens: estimate, outputTokens: maximumOutputTokens });
      const bodyDigest = digestBody(parsed.data);
      await acceptAndReserveRequest({
        requestId,
        organizationId: key.organizationId,
        workspaceId: key.workspaceId,
        apiKeyId: key.id,
        modelProductId: access.modelProductId,
        priceVersionId: access.priceVersionId,
        billingMode: "PREPAID",
        region: key.allowedRegion,
        bodyDigest,
        inputTokenEstimate: estimate,
        maximumOutputTokens,
        maximumChargeUsd,
        priceSnapshot: access.price,
        reservationExpiresAt: new Date(Date.now() + config.EDGE_PROVIDER_TIMEOUT_MS + 30_000)
      });

      const assertion = await signInternalAssertion({
        version: 1,
        requestId,
        organizationId: key.organizationId,
        workspaceId: key.workspaceId,
        apiKeyId: key.id,
        modelProductId: access.modelProductId,
        modelAlias: access.alias,
        priceVersionId: access.priceVersionId,
        allowedProviders: [access.route.provider],
        allowedRegion: key.allowedRegion,
        bodyDigest,
        retentionMode: key.retentionMode,
        allowCrossRegionFallback: key.allowCrossRegionFallback
      }, process.env["INTERNAL_ASSERTION_SECRET"], config.INTERNAL_ASSERTION_ISSUER, config.INTERNAL_ASSERTION_AUDIENCE, 30);

      const attemptId = randomUUID();
      await startProviderAttempt({ attemptId, requestId, organizationId: key.organizationId, provider: access.route.provider, providerModel: access.providerModel, region: key.allowedRegion });
      try {
        const providerResponse = (await dispatchProvider({
            endpoint: access.endpoint,
            masterKey: process.env["LITELLM_MASTER_KEY"],
            assertion,
            body: { ...parsed.data, model: access.providerModel },
            timeoutMs: config.EDGE_PROVIDER_TIMEOUT_MS
        })).response;
        const responseBody: unknown = await providerResponse.json().catch(() => null);
        if (!providerResponse.ok) {
          await finishProviderAttempt({ attemptId, requestId, organizationId: key.organizationId, status: "FAILED", errorCode: `provider_http_${providerResponse.status}`, responseDelivered: false });
          await releaseRequest({ requestId, organizationId: key.organizationId, reason: `provider_http_${providerResponse.status}` });
          return reply.code(502).send({ error: "provider_request_failed" });
        }
        const usage = parseProviderUsage(responseBody);
        if (!usage) {
          await finishProviderAttempt({ attemptId, requestId, organizationId: key.organizationId, status: "AMBIGUOUS", errorCode: "provider_usage_missing", responseDelivered: true });
          return reply.code(503).send({ error: "settlement_pending" });
        }
        try {
          await settleRequest({ requestId, organizationId: key.organizationId, usage, priceSnapshot: access.price, provider: { attemptId, model: access.providerModel, region: key.allowedRegion, costUsd: "0", inputTokens: usage.inputTokens, outputTokens: usage.outputTokens } });
        } catch (settlementError) {
          request.log.error({ err: settlementError, requestId }, "provider succeeded but settlement failed");
          return reply.code(503).send({ error: "settlement_pending" });
        }
        return reply.send(responseBody);
      } catch (error) {
        request.log.error({ err: error, requestId }, "provider dispatch failed");
        const ambiguous = error instanceof DOMException && error.name === "AbortError";
        await finishProviderAttempt({ attemptId, requestId, organizationId: key.organizationId, status: ambiguous ? "AMBIGUOUS" : "FAILED", errorCode: ambiguous ? "provider_timeout" : "provider_dispatch_failed", responseDelivered: false });
        if (ambiguous) return reply.code(503).send({ error: "provider_reconciliation_required" });
        await releaseRequest({ requestId, organizationId: key.organizationId, reason: "provider_dispatch_failed" });
        return reply.code(502).send({ error: "provider_request_failed" });
      }
    }
  });
  return app;
}
