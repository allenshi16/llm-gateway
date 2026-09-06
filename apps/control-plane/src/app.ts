import Fastify, { type FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createApiKey, createOrganization, creditWalletFromPayment, createRateLimiter, loadConfig, reconcileUsageEvent, recordAudit, recordStripeWebhookEvent, revokeApiKey, securityHeaders } from "@gateway/core";
import { query } from "@gateway/database";
import { usageEventSchema } from "@gateway/contracts";
import { createStripeClient } from "@gateway/core";
import { registerAccountRoutes } from "./account-routes.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

const organizationRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  billingEmail: z.string().email().optional(),
  homeRegion: z.enum(["US", "EU", "APAC"]).default("US"),
  ownerEmail: z.string().email(),
  workspaceName: z.string().trim().min(2).max(120),
  workspaceSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  workspaceRegion: z.enum(["US", "EU", "APAC"]).default("US")
});

const keyRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  createdById: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  environment: z.enum(["live", "test"]).default("test"),
  rpmLimit: z.number().int().positive().optional(),
  tpmLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional()
});

const keyLimitsSchema = z.object({
  rpmLimit: z.number().int().positive().nullable(),
  tpmLimit: z.number().int().positive().nullable()
});

function hasControlPlaneAdminToken(request: { headers: { authorization?: string | undefined } }): boolean {
  const configured = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
  const presented = request.headers.authorization?.startsWith("Bearer ")
    ? request.headers.authorization.slice("Bearer ".length)
    : undefined;
  if (!configured || !presented) return false;
  const expected = Buffer.from(configured, "utf8");
  const actual = Buffer.from(presented, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function buildControlPlane(): FastifyInstance {
  const app = Fastify({ logger: { redact: ["req.headers.authorization", "req.headers.cookie"] } });
  const siteLimiter = createRateLimiter(Number(process.env["CONTROL_PLANE_RATE_LIMIT"] ?? 300), 60_000);
  app.addHook("onSend", async (_request, reply, payload) => {
    for (const [name, value] of Object.entries(securityHeaders())) reply.header(name, value);
    return payload;
  });
  app.addHook("preHandler", async (request, reply) => {
    if (request.raw.url === "/health" || request.raw.url === "/ready") return;
    if (siteLimiter.limited(request.ip ?? "unknown")) return reply.code(429).send({ error: "too_many_requests" });
  });
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "unhandled control-plane error");
    const dbError = error as { code?: string };
    if (dbError.code === "23505") return reply.code(409).send({ error: "resource_conflict" });
    const status = error instanceof z.ZodError ? 400 : 500;
    const message = error instanceof Error && error.message === "Account already exists" ? "account_already_exists" : error instanceof Error && error.message === "Organization creation failed" ? "organization_creation_failed" : error instanceof Error && error.message === "Workspace creation failed" ? "workspace_creation_failed" : error instanceof Error && error.message === "Insufficient wallet balance" ? "insufficient_wallet_balance" : error instanceof Error && error.message === "Plan not found" ? "plan_not_found" : "request_failed";
    return reply.code(status).send({ error: message });
  });
  void registerAccountRoutes(app);
  app.addHook("preParsing", async (request, _reply, payload) => {
    if (request.url !== "/v1/webhooks/stripe") return payload;
    const chunks: Buffer[] = [];
    for await (const chunk of payload) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const rawBody = Buffer.concat(chunks);
    request.rawBody = rawBody;
    return Readable.from([rawBody]);
  });

  app.get("/health", async () => ({ status: "ok", service: "control-plane" }));
  app.get("/ready", async (_request, reply) => {
    try {
      await query("SELECT 1");
      loadConfig();
      return { status: "ready", service: "control-plane" };
    } catch {
      return reply.code(503).send({ status: "not_ready", service: "control-plane" });
    }
  });

  app.post("/v1/webhooks/stripe", async (request, reply) => {
    const secret = process.env["STRIPE_WEBHOOK_SECRET"];
    const signingHeader = request.headers["stripe-signature"];
    if (!secret || typeof signingHeader !== "string" || !request.rawBody) return reply.code(400).send({ error: "invalid_webhook" });
    try {
      const stripe = createStripeClient({ secretKey: process.env["STRIPE_SECRET_KEY"] ?? "sk_invalid" });
      const event = stripe.webhooks.constructEvent(request.rawBody, signingHeader, secret);
      const inserted = await recordStripeWebhookEvent({ id: event.id, type: event.type, payload: event });
      if (event.type === "payment_intent.succeeded") {
        const payment = event.data.object as { customer?: string; amount_received?: number; currency?: string; id?: string; metadata?: Record<string, string> };
        const customerId = payment.customer;
        const org = customerId ? await query<{ id: string }>(`SELECT id FROM organizations WHERE stripe_customer_id=$1`, [customerId]) : null;
        if (org?.rows[0]) {
          const amountUsd = ((payment.amount_received ?? 0) / 100).toString();
          await creditWalletFromPayment({ organizationId: org.rows[0].id, amountUsd, currency: (payment.currency ?? "usd").toUpperCase(), source: "stripe_payment", sourceEventId: event.id, ...(payment.id ? { stripePaymentIntentId: payment.id } : {}) });
        }
      }
      if (event.type === "checkout.session.completed") {
        const checkout = event.data.object as { id?: string; customer?: string; subscription?: string; metadata?: Record<string, string> | undefined } | undefined;
        const orgId = checkout?.metadata?.["organization_id"];
        const planId = checkout?.metadata?.["plan_id"];
        if (orgId) {
          const org = await query<{ id: string }>(`SELECT id FROM organizations WHERE id=$1`, [orgId]);
          if (org.rows[0] && checkout.customer) await query(`UPDATE organizations SET stripe_customer_id=$1 WHERE id=$2`, [checkout.customer, orgId]);
          await query(
            `INSERT INTO subscriptions (organization_id, plan_id, stripe_subscription_id, status, current_period_end)
             VALUES ($1,$2,$3,'ACTIVE', now() + interval '1 month')
             ON CONFLICT (stripe_subscription_id) DO UPDATE SET status='ACTIVE', updated_at=now()`,
            [orgId, planId ?? null, checkout.subscription ?? null]
          );
        }
      }
      if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const sub = event.data.object as { id?: string; status?: string };
        if (sub.id) {
          const status = event.type === "customer.subscription.deleted" ? "CANCELLED" : (sub.status === "active" ? "ACTIVE" : (sub.status ?? "UNKNOWN").toUpperCase());
          await query(`UPDATE subscriptions SET status=$1, updated_at=now() WHERE stripe_subscription_id=$2`, [status, sub.id]);
        }
      }
      return reply.code(inserted ? 200 : 200).send({ received: true, duplicate: !inserted });
    } catch (error) {
      request.log.warn({ err: error }, "stripe webhook rejected");
      return reply.code(400).send({ error: "invalid_webhook" });
    }
  });

  app.post("/v1/organizations", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = organizationRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    }
    try {
      const organizationInput = parsed.data.billingEmail
        ? {
            name: parsed.data.name,
            slug: parsed.data.slug,
            billingEmail: parsed.data.billingEmail,
            homeRegion: parsed.data.homeRegion,
            ownerEmail: parsed.data.ownerEmail,
            workspaceName: parsed.data.workspaceName,
            workspaceSlug: parsed.data.workspaceSlug,
            workspaceRegion: parsed.data.workspaceRegion
          }
        : {
            name: parsed.data.name,
            slug: parsed.data.slug,
            homeRegion: parsed.data.homeRegion,
            ownerEmail: parsed.data.ownerEmail,
            workspaceName: parsed.data.workspaceName,
            workspaceSlug: parsed.data.workspaceSlug,
            workspaceRegion: parsed.data.workspaceRegion
          };
      const created = await createOrganization(organizationInput);
      return reply.code(201).send(created);
    } catch (error) {
      request.log.error({ err: error }, "organization creation failed");
      return reply.code(409).send({ error: "organization_creation_failed" });
    }
  });

  app.post("/v1/internal/usage-events", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = usageEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const event = parsed.data;
    const lookup = await query<{
      organization_id: string; input_per_million: string; output_per_million: string;
      cache_read_per_million: string; cache_write_per_million: string; reasoning_per_million: string; request_fee: string;
    }>(
      `SELECT lr.organization_id, pv.input_per_million, pv.output_per_million, pv.cache_read_per_million, pv.cache_write_per_million, pv.reasoning_per_million, pv.request_fee
       FROM logical_requests lr JOIN price_versions pv ON pv.id=lr.price_version_id WHERE lr.id=$1`,
      [event.requestId]
    );
    const row = lookup.rows[0];
    if (!row) return reply.code(404).send({ error: "request_not_found" });
    try {
      return await reconcileUsageEvent({
        event,
        organizationId: row.organization_id,
        priceSnapshot: {
          inputPerMillion: row.input_per_million,
          outputPerMillion: row.output_per_million,
          cacheReadPerMillion: row.cache_read_per_million,
          cacheWritePerMillion: row.cache_write_per_million,
          reasoningPerMillion: row.reasoning_per_million,
          requestFee: row.request_fee
        }
      });
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : "reconcile_failed" });
    }
  });

  app.post("/v1/api-keys", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = keyRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const pepper = process.env["API_KEY_PEPPER"];
    if (!pepper || pepper.length < 32) return reply.code(503).send({ error: "key_service_unconfigured" });
    try {
      const membership = await query(`SELECT 1 FROM memberships WHERE workspace_id=$1 AND account_id=$2 AND role IN ('OWNER','ADMIN') LIMIT 1`, [parsed.data.workspaceId, parsed.data.createdById]);
      if (membership.rowCount !== 1) return reply.code(403).send({ error: "workspace_admin_required" });
      const keyInput = {
        workspaceId: parsed.data.workspaceId,
        createdById: parsed.data.createdById,
        name: parsed.data.name,
        environment: parsed.data.environment,
        pepper,
        ...(parsed.data.rpmLimit !== undefined ? { rpmLimit: parsed.data.rpmLimit } : {}),
        ...(parsed.data.tpmLimit !== undefined ? { tpmLimit: parsed.data.tpmLimit } : {}),
        ...(parsed.data.expiresAt ? { expiresAt: new Date(parsed.data.expiresAt) } : {})
      };
      const key = await createApiKey(keyInput);
      return reply.code(201).send(key);
    } catch (error) {
      request.log.error({ err: error }, "api key creation failed");
      return reply.code(409).send({ error: "api_key_creation_failed" });
    }
  });

  app.post<{ Params: { workspaceId: string; keyId: string } }>("/v1/workspaces/:workspaceId/api-keys/:keyId/revoke", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const revoked = await revokeApiKey(request.params.workspaceId, request.params.keyId);
    return revoked ? reply.code(204).send() : reply.code(404).send({ error: "api_key_not_found" });
  });

  app.get<{ Params: { workspaceId: string } }>("/v1/workspaces/:workspaceId/api-keys", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const result = await query(`SELECT id, name, key_prefix, status, rpm_limit, tpm_limit, expires_at, last_used_at, created_at FROM api_keys WHERE workspace_id=$1 ORDER BY created_at DESC`, [request.params.workspaceId]);
    return { keys: result.rows };
  });

  app.patch<{ Params: { workspaceId: string; keyId: string } }>("/v1/workspaces/:workspaceId/api-keys/:keyId/limits", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = keyLimitsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const result = await query<{ id: string; rpm_limit: number | null; tpm_limit: number | null }>(
      `UPDATE api_keys SET rpm_limit=$1, tpm_limit=$2 WHERE id=$3 AND workspace_id=$4 RETURNING id, rpm_limit, tpm_limit`,
      [parsed.data.rpmLimit, parsed.data.tpmLimit, request.params.keyId, request.params.workspaceId]
    );
    const key = result.rows[0];
    if (!key) return reply.code(404).send({ error: "api_key_not_found" });
    return reply.send({ keyId: key.id, rpmLimit: key.rpm_limit, tpmLimit: key.tpm_limit });
  });

  app.get<{ Params: { workspaceId: string } }>("/v1/workspaces/:workspaceId/models", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const result = await query(`SELECT mp.public_name, mp.display_name, mp.default_max_output_tokens, me.billing_mode, pr.region route_region, pr.provider, pr.provider_model FROM model_entitlements me JOIN model_products mp ON mp.id=me.model_product_id JOIN provider_routes pr ON pr.model_product_id=mp.id WHERE me.workspace_id=$1 AND me.enabled AND mp.active AND pr.status='APPROVED' AND pr.resale_approved AND pr.dpa_approved AND pr.security_approved AND pr.residency_approved AND NOT pr.kill_switch ORDER BY mp.public_name, pr.priority`, [request.params.workspaceId]);
    return { models: result.rows };
  });

  app.get<{ Params: { organizationId: string } }>("/v1/organizations/:organizationId/usage", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const result = await query(`SELECT count(DISTINCT lr.id)::text request_count, count(DISTINCT lr.id) FILTER (WHERE lr.status='SETTLED')::text settled_count, coalesce(sum(cc.amount_usd),0)::text charged_usd, coalesce(sum(pa.provider_cost_usd),0)::text provider_cost_usd FROM logical_requests lr LEFT JOIN customer_charges cc ON cc.request_id=lr.id LEFT JOIN provider_attempts pa ON pa.request_id=lr.id WHERE lr.organization_id=$1`, [request.params.organizationId]);
    return { usage: result.rows[0] ?? { request_count: "0", settled_count: "0", charged_usd: "0", provider_cost_usd: "0" } };
  });

  app.get<{ Params: { organizationId: string } }>("/v1/organizations/:organizationId/billing", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const result = await query(`SELECT currency, available_balance::text, reserved_balance::text, status FROM wallets WHERE organization_id=$1 ORDER BY currency`, [request.params.organizationId]);
    return { wallets: result.rows };
  });

  app.get("/v1/admin/billing/plans", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const { listPlans } = await import("@gateway/core");
    return { plans: await listPlans() };
  });

  app.patch<{ Params: { organizationId: string } }>("/v1/admin/organizations/:organizationId/status", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const result = await query<{ id: string; status: string }>(
      `UPDATE organizations SET status=$1, updated_at=now() WHERE id=$2 RETURNING id, status`,
      [parsed.data.status, request.params.organizationId]
    );
    const organization = result.rows[0];
    if (!organization) return reply.code(404).send({ error: "organization_not_found" });
    await recordAudit({ organizationId: organization.id, action: `organization.status_${organization.status.toLowerCase()}`, resourceType: "organization", resourceId: organization.id, metadata: { status: organization.status } });
    return reply.send({ organizationId: organization.id, status: organization.status });
  });

  app.patch<{ Params: { accountId: string } }>("/v1/admin/accounts/:accountId/status", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const result = await query<{ id: string; status: string }>(
      `UPDATE accounts SET status=$1, updated_at=now() WHERE id=$2 RETURNING id, status`,
      [parsed.data.status, request.params.accountId]
    );
    const account = result.rows[0];
    if (!account) return reply.code(404).send({ error: "account_not_found" });
    await recordAudit({ accountId: account.id, actorId: account.id, action: `account.status_${account.status.toLowerCase()}`, resourceType: "account", resourceId: account.id, metadata: { status: account.status } });
    return reply.send({ accountId: account.id, status: account.status });
  });

  app.post<{ Params: { workspaceId: string } }>("/v1/admin/workspaces/:workspaceId/model-entitlements", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = z.object({ modelPublicName: z.string().trim().min(1).max(120), billingMode: z.enum(["PREPAID", "POSTPAID", "INCLUDED", "PROMOTIONAL", "NON_BILLABLE"]).default("PREPAID") }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const approvedModel = await query<{ id: string; public_name: string }>(
      `SELECT mp.id, mp.public_name
       FROM model_products mp
       JOIN provider_routes pr ON pr.model_product_id=mp.id
       WHERE mp.public_name=$1 AND mp.active AND pr.region='US' AND pr.status='APPROVED'
         AND pr.resale_approved AND pr.dpa_approved AND pr.security_approved
         AND pr.residency_approved AND NOT pr.kill_switch
       LIMIT 1`,
      [parsed.data.modelPublicName]
    );
    const model = approvedModel.rows[0];
    if (!model) return reply.code(409).send({ error: "model_route_not_approved" });
    const entitlement = await query<{ workspace_id: string; model_product_id: string; billing_mode: string; enabled: boolean; inserted: boolean }>(
      `INSERT INTO model_entitlements (workspace_id, model_product_id, billing_mode, enabled)
       VALUES ($1,$2,$3,true)
       ON CONFLICT (workspace_id, model_product_id)
       DO UPDATE SET billing_mode=EXCLUDED.billing_mode, enabled=true, updated_at=now()
       RETURNING workspace_id, model_product_id, billing_mode, enabled, (xmax = 0) AS inserted`,
      [request.params.workspaceId, model.id, parsed.data.billingMode]
    );
    const result = entitlement.rows[0];
    if (!result) return reply.code(500).send({ error: "model_entitlement_failed" });
    const workspace = await query<{ organization_id: string }>(`SELECT organization_id FROM workspaces WHERE id=$1`, [request.params.workspaceId]);
    const organizationId = workspace.rows[0]?.organization_id;
    if (!organizationId) return reply.code(404).send({ error: "workspace_not_found" });
    await recordAudit({ organizationId, workspaceId: request.params.workspaceId, action: result.inserted ? "model_entitlement.grant" : "model_entitlement.enable", resourceType: "model_entitlement", resourceId: result.model_product_id, metadata: { publicName: model.public_name, billingMode: result.billing_mode } });
    return reply.code(result.inserted ? 201 : 200).send({ workspaceId: result.workspace_id, modelProductId: result.model_product_id, billingMode: result.billing_mode, enabled: result.enabled, publicName: model.public_name });
  });

  app.delete<{ Params: { workspaceId: string; modelProductId: string } }>("/v1/admin/workspaces/:workspaceId/model-entitlements/:modelProductId", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const result = await query(
      `UPDATE model_entitlements SET enabled=false, updated_at=now() WHERE workspace_id=$1 AND model_product_id=$2 AND enabled RETURNING id`,
      [request.params.workspaceId, request.params.modelProductId]
    );
    if (result.rowCount === 1) {
      const workspace = await query<{ organization_id: string }>(`SELECT organization_id FROM workspaces WHERE id=$1`, [request.params.workspaceId]);
      const organizationId = workspace.rows[0]?.organization_id;
      if (organizationId) await recordAudit({ organizationId, workspaceId: request.params.workspaceId, action: "model_entitlement.revoke", resourceType: "model_entitlement", resourceId: request.params.modelProductId });
    }
    return result.rowCount === 1 ? reply.code(204).send() : reply.code(404).send({ error: "model_entitlement_not_found" });
  });

  app.post<{ Params: { organizationId: string } }>("/v1/admin/organizations/:organizationId/promotional-credit", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = z.object({ amountUsd: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/).refine((value) => Number(value) > 0, "amountUsd must be positive"), sourceEventId: z.string().trim().min(1).max(160) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    try {
      const { grantPromotionalCredit } = await import("@gateway/core");
      const result = await grantPromotionalCredit({ organizationId: request.params.organizationId, amountUsd: parsed.data.amountUsd, sourceEventId: parsed.data.sourceEventId });
      return reply.code(result.credited ? 201 : 200).send(result);
    } catch (cause) {
      if (cause instanceof Error && cause.message === "Promotional credit source conflicts with another organization") return reply.code(409).send({ error: "promotional_credit_source_conflict" });
      throw cause;
    }
  });

  app.put<{ Params: { planId: string } }>("/v1/admin/billing/plans/:planId", async (request, reply) => {
    if (!hasControlPlaneAdminToken(request)) return reply.code(401).send({ error: "control_plane_authentication_required" });
    const parsed = z.object({ stripePriceId: z.string().optional(), unitAmountCents: z.number().int().positive().optional(), active: z.boolean().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const { setPlanConfig } = await import("@gateway/core");
    const plan = await setPlanConfig({ planId: request.params.planId, ...(parsed.data.stripePriceId ? { stripePriceId: parsed.data.stripePriceId } : {}), ...(parsed.data.unitAmountCents ? { unitAmountCents: parsed.data.unitAmountCents } : {}), ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}) });
    return reply.send(plan);
  });

  return app;
}
