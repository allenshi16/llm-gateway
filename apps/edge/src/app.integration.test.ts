import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { query } from "@gateway/database";
import { generateApiKey } from "@gateway/core";
import { buildEdge } from "./app.js";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!integrationEnabled)("edge account verification boundary", () => {
  it("rejects an unverified account before model or wallet admission", async () => {
    const pepper = "01234567890123456789012345678901";
    process.env["API_KEY_PEPPER"] = pepper;
    process.env["EDGE_ENABLE_DISPATCH"] = "false";
    const accountId = randomUUID();
    const organizationId = randomUUID();
    const workspaceId = randomUUID();
    const key = generateApiKey(pepper, "live");
    await query(`INSERT INTO accounts (id, email, password_hash) VALUES ($1,$2,$3)`, [accountId, `edge-unverified-${accountId.slice(0, 8)}@example.com`, "unused"]);
    await query(`INSERT INTO organizations (id, name, slug, home_region) VALUES ($1,$2,$3,'US')`, [organizationId, "Edge Verification Org", `edge-verification-${accountId.slice(0, 8)}`]);
    await query(`INSERT INTO workspaces (id, organization_id, name, slug, allowed_region) VALUES ($1,$2,'Default','default','US')`, [workspaceId, organizationId]);
    await query(`INSERT INTO memberships (organization_id, workspace_id, account_id, role) VALUES ($1,$2,$3,'OWNER')`, [organizationId, workspaceId, accountId]);
    await query(`INSERT INTO wallets (organization_id, currency, available_balance) VALUES ($1,'USD',5)`, [organizationId]);
    await query(`INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash) VALUES ($1,$2,$3,'unverified-key',$4,$5)`, [randomUUID(), workspaceId, accountId, key.prefix, key.hash]);
    const app = buildEdge();
    try {
      const response = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: `Bearer ${key.secret}` }, payload: { model: "unconfigured-model", messages: [{ role: "user", content: "hello" }] } });
      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({ error: "email_verification_required" });
    } finally {
      await app.close();
      await query(`DELETE FROM wallets WHERE organization_id=$1`, [organizationId]);
      await query(`DELETE FROM organizations WHERE id=$1`, [organizationId]);
    }
  });

  it("rejects keys for suspended accounts and organizations", async () => {
    const pepper = "01234567890123456789012345678901";
    process.env["API_KEY_PEPPER"] = pepper;
    process.env["EDGE_ENABLE_DISPATCH"] = "false";
    const accountId = randomUUID();
    const organizationId = randomUUID();
    const workspaceId = randomUUID();
    const key = generateApiKey(pepper, "live");
    await query(`INSERT INTO accounts (id, email, password_hash, email_verified_at) VALUES ($1,$2,$3,now())`, [accountId, `edge-suspended-${accountId.slice(0, 8)}@example.com`, "unused"]);
    await query(`INSERT INTO organizations (id, name, slug, home_region) VALUES ($1,$2,$3,'US')`, [organizationId, "Edge Suspended Org", `edge-suspended-${accountId.slice(0, 8)}`]);
    await query(`INSERT INTO workspaces (id, organization_id, name, slug, allowed_region) VALUES ($1,$2,'Default','default','US')`, [workspaceId, organizationId]);
    await query(`INSERT INTO memberships (organization_id, workspace_id, account_id, role) VALUES ($1,$2,$3,'OWNER')`, [organizationId, workspaceId, accountId]);
    await query(`INSERT INTO wallets (organization_id, currency, available_balance) VALUES ($1,'USD',5)`, [organizationId]);
    await query(`INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash) VALUES ($1,$2,$3,'suspended-key',$4,$5)`, [randomUUID(), workspaceId, accountId, key.prefix, key.hash]);
    const app = buildEdge();
    try {
      await query(`UPDATE accounts SET status='SUSPENDED' WHERE id=$1`, [accountId]);
      const suspendedAccount = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: `Bearer ${key.secret}` }, payload: { model: "unconfigured-model", messages: [{ role: "user", content: "hello" }] } });
      expect(suspendedAccount.statusCode).toBe(401);
      expect(suspendedAccount.json()).toEqual({ error: "invalid_api_key" });

      await query(`UPDATE accounts SET status='ACTIVE' WHERE id=$1`, [accountId]);
      await query(`UPDATE organizations SET status='SUSPENDED' WHERE id=$1`, [organizationId]);
      const suspendedOrganization = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: `Bearer ${key.secret}` }, payload: { model: "unconfigured-model", messages: [{ role: "user", content: "hello" }] } });
      expect(suspendedOrganization.statusCode).toBe(401);
      expect(suspendedOrganization.json()).toEqual({ error: "invalid_api_key" });
    } finally {
      await app.close();
      await query(`DELETE FROM wallets WHERE organization_id=$1`, [organizationId]);
      await query(`DELETE FROM organizations WHERE id=$1`, [organizationId]);
      await query(`DELETE FROM accounts WHERE id=$1`, [accountId]);
    }
  });

  it("rejects requests over the per-key RPM limit before model resolution and admits under-limit requests", async () => {
    const pepper = "01234567890123456789012345678901";
    process.env["API_KEY_PEPPER"] = pepper;
    process.env["EDGE_ENABLE_DISPATCH"] = "false";
    const accountId = randomUUID();
    const organizationId = randomUUID();
    const workspaceId = randomUUID();
    const modelProductId = randomUUID();
    const priceVersionId = randomUUID();
    const overKey = generateApiKey(pepper, "live");
    const underKey = generateApiKey(pepper, "live");
    await query(`INSERT INTO accounts (id, email, password_hash, email_verified_at) VALUES ($1,$2,$3,now())`, [accountId, `edge-ratelimit-${accountId.slice(0, 8)}@example.com`, "unused"]);
    await query(`INSERT INTO organizations (id, name, slug, home_region) VALUES ($1,$2,$3,'US')`, [organizationId, "Edge Rate Limit Org", `edge-ratelimit-${accountId.slice(0, 8)}`]);
    await query(`INSERT INTO workspaces (id, organization_id, name, slug, allowed_region) VALUES ($1,$2,'Default','default','US')`, [workspaceId, organizationId]);
    await query(`INSERT INTO model_products (id, public_name, display_name, default_max_output_tokens) VALUES ($1,$2,'Rate Limit Model',1024)`, [modelProductId, `rate-limit-model-${accountId.slice(0, 8)}`]);
    await query(`INSERT INTO price_versions (id, model_product_id, version, input_per_million, output_per_million, effective_from) VALUES ($1,$2,1,1,1,now())`, [priceVersionId, modelProductId]);
    const overKeyId = randomUUID();
    await query(`INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash, rpm_limit) VALUES ($1,$2,$3,'over-limit',$4,$5,1)`, [overKeyId, workspaceId, accountId, overKey.prefix, overKey.hash]);
    const underKeyId = randomUUID();
    await query(`INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash, rpm_limit) VALUES ($1,$2,$3,'under-limit',$4,$5,2)`, [underKeyId, workspaceId, accountId, underKey.prefix, underKey.hash]);
    await query(
      `INSERT INTO logical_requests (id, organization_id, workspace_id, api_key_id, model_product_id, price_version_id, billing_mode, region, request_body_digest, input_token_estimate, maximum_output_tokens, maximum_charge_usd, customer_price_snapshot, status)
       VALUES ($1,$2,$3,$4,$5,$6,'PREPAID','US','sha256:ratelimit',8,16,0.5,'{}'::jsonb,'SETTLED')`,
      [randomUUID(), organizationId, workspaceId, overKeyId, modelProductId, priceVersionId]
    );
    const app = buildEdge();
    try {
      const limited = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: `Bearer ${overKey.secret}` }, payload: { model: "anything", messages: [{ role: "user", content: "hello" }] } });
      expect(limited.statusCode).toBe(429);
      expect(limited.json()).toEqual({ error: "key_rate_limited" });
      expect(limited.headers["retry-after"]).toBe("60");

      const admitted = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: `Bearer ${underKey.secret}` }, payload: { model: "anything", messages: [{ role: "user", content: "hello" }] } });
      expect(admitted.statusCode).toBe(403);
      expect(admitted.json()).toEqual({ error: "model_route_not_approved" });
    } finally {
      await app.close();
      await query(`DELETE FROM logical_requests WHERE workspace_id=$1`, [workspaceId]);
      await query(`DELETE FROM price_versions WHERE id=$1`, [priceVersionId]);
      await query(`DELETE FROM model_products WHERE id=$1`, [modelProductId]);
      await query(`DELETE FROM organizations WHERE id=$1`, [organizationId]);
      await query(`DELETE FROM accounts WHERE id=$1`, [accountId]);
    }
  });
});
