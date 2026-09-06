import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { query } from "@gateway/database";
import { processUnprocessedUsageEvents } from "@gateway/core";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);

interface SweepFixture {
  accountId: string;
  organizationId: string;
  workspaceId: string;
  modelProductId: string;
  priceVersionId: string;
  apiKeyId: string;
  walletId: string;
  requestId: string;
  attemptId: string;
}

async function createFixture(): Promise<SweepFixture> {
  const fixture: SweepFixture = {
    accountId: randomUUID(),
    organizationId: randomUUID(),
    workspaceId: randomUUID(),
    modelProductId: randomUUID(),
    priceVersionId: randomUUID(),
    apiKeyId: randomUUID(),
    walletId: randomUUID(),
    requestId: randomUUID(),
    attemptId: randomUUID()
  };
  await query(`INSERT INTO accounts (id, email, password_hash) VALUES ($1,$2,'unused')`, [fixture.accountId, `sweep-${fixture.accountId.slice(0, 8)}@example.com`]);
  await query(`INSERT INTO organizations (id, name, slug, home_region) VALUES ($1,$2,$3,'US')`, [fixture.organizationId, "Sweep Org", `sweep-${fixture.accountId.slice(0, 8)}`]);
  await query(`INSERT INTO workspaces (id, organization_id, name, slug, allowed_region) VALUES ($1,$2,'Default','default','US')`, [fixture.workspaceId, fixture.organizationId]);
  await query(`INSERT INTO model_products (id, public_name, display_name, default_max_output_tokens) VALUES ($1,$2,'Sweep Model',1024)`, [fixture.modelProductId, `sweep-model-${fixture.accountId.slice(0, 8)}`]);
  await query(`INSERT INTO price_versions (id, model_product_id, version, input_per_million, output_per_million, effective_from) VALUES ($1,$2,1,1,1,now())`, [fixture.priceVersionId, fixture.modelProductId]);
  await query(`INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash) VALUES ($1,$2,$3,'sweep-key',$4,$5)`, [fixture.apiKeyId, fixture.workspaceId, fixture.accountId, `sk_sweep_${fixture.accountId.slice(0, 8)}`, `hash-${fixture.accountId}`]);
  await query(`INSERT INTO wallets (id, organization_id, currency, available_balance, reserved_balance) VALUES ($1,$2,'USD',4.5,0.5)`, [fixture.walletId, fixture.organizationId]);
  await query(
    `INSERT INTO logical_requests (id, organization_id, workspace_id, api_key_id, model_product_id, price_version_id, billing_mode, region, request_body_digest, input_token_estimate, maximum_output_tokens, maximum_charge_usd, customer_price_snapshot, status)
     VALUES ($1,$2,$3,$4,$5,$6,'PREPAID','US','sha256:sweep',8,1024,0.5,'{}'::jsonb,'RESERVED')`,
    [fixture.requestId, fixture.organizationId, fixture.workspaceId, fixture.apiKeyId, fixture.modelProductId, fixture.priceVersionId]
  );
  await query(`INSERT INTO wallet_reservations (wallet_id, request_id, amount, expires_at) VALUES ($1,$2,0.5, now() + interval '10 minutes')`, [fixture.walletId, fixture.requestId]);
  await query(`INSERT INTO provider_attempts (id, request_id, sequence, provider, provider_model, region, status) VALUES ($1,$2,1,'deepseek','deepseek-chat','US','AMBIGUOUS')`, [fixture.attemptId, fixture.requestId]);
  return fixture;
}

async function insertUsageEvent(fixture: SweepFixture, overrides: Record<string, unknown>): Promise<string> {
  const sourceEventId = `sweep-${randomUUID()}`;
  const payload = {
    version: 1,
    source: "litellm",
    sourceEventId,
    requestId: fixture.requestId,
    attemptId: fixture.attemptId,
    status: "SUCCEEDED",
    provider: "deepseek",
    providerModel: "deepseek-chat",
    region: "US",
    inputTokens: 16,
    outputTokens: 8,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    providerCostUsd: "0",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    responseDelivered: true,
    errorCode: null,
    ...overrides
  };
  await query(`INSERT INTO raw_usage_events (source, source_event_id, request_id, attempt_id, payload) VALUES ('litellm',$1,$2,$3,$4::jsonb)`, [sourceEventId, fixture.requestId, fixture.attemptId, JSON.stringify(payload)]);
  return sourceEventId;
}

async function destroyFixture(fixture: SweepFixture): Promise<void> {
  await query(`DELETE FROM raw_usage_events WHERE request_id=$1`, [fixture.requestId]);
  await query(`DELETE FROM provider_attempts WHERE request_id=$1`, [fixture.requestId]);
  await query(`DELETE FROM customer_charges WHERE request_id=$1`, [fixture.requestId]);
  await query(`DELETE FROM wallet_reservations WHERE request_id=$1`, [fixture.requestId]);
  await query(`DELETE FROM logical_requests WHERE id=$1`, [fixture.requestId]);
  await query(`DELETE FROM ledger_entries WHERE wallet_id=$1`, [fixture.walletId]);
  await query(`DELETE FROM ledger_transactions WHERE organization_id=$1`, [fixture.organizationId]);
  await query(`DELETE FROM wallets WHERE id=$1`, [fixture.walletId]);
  await query(`DELETE FROM api_keys WHERE id=$1`, [fixture.apiKeyId]);
  await query(`DELETE FROM price_versions WHERE id=$1`, [fixture.priceVersionId]);
  await query(`DELETE FROM model_products WHERE id=$1`, [fixture.modelProductId]);
  await query(`DELETE FROM workspaces WHERE id=$1`, [fixture.workspaceId]);
  await query(`DELETE FROM organizations WHERE id=$1`, [fixture.organizationId]);
  await query(`DELETE FROM accounts WHERE id=$1`, [fixture.accountId]);
}

describe.skipIf(!integrationEnabled)("raw usage event reconciliation sweep", () => {
  it("settles a late successful usage event, marks it processed, and conserves the wallet", async () => {
    const fixture = await createFixture();
    try {
      const sourceEventId = await insertUsageEvent(fixture, {});
      const result = await processUnprocessedUsageEvents(50);
      expect(result.processed).toBeGreaterThanOrEqual(1);
      const request = await query<{ status: string }>(`SELECT status FROM logical_requests WHERE id=$1`, [fixture.requestId]);
      expect(request.rows[0]?.status).toBe("SETTLED");
      const charge = await query<{ amount_usd: string }>(`SELECT amount_usd FROM customer_charges WHERE request_id=$1`, [fixture.requestId]);
      expect(Number(charge.rows[0]?.amount_usd)).toBeCloseTo(0.000024, 9);
      const wallet = await query<{ available_balance: string; reserved_balance: string }>(`SELECT available_balance::text, reserved_balance::text FROM wallets WHERE id=$1`, [fixture.walletId]);
      expect(Number(wallet.rows[0]?.available_balance)).toBeCloseTo(4.999976, 8);
      expect(Number(wallet.rows[0]?.reserved_balance)).toBe(0);
      const attempt = await query<{ status: string }>(`SELECT status FROM provider_attempts WHERE id=$1`, [fixture.attemptId]);
      expect(attempt.rows[0]?.status).toBe("SUCCEEDED");
      const raw = await query<{ processed_at: string | null; processing_error: string | null }>(`SELECT processed_at, processing_error FROM raw_usage_events WHERE source_event_id=$1`, [sourceEventId]);
      expect(raw.rows[0]?.processed_at).not.toBeNull();
      expect(raw.rows[0]?.processing_error).toBeNull();
      const again = await processUnprocessedUsageEvents(50);
      expect(again.processed).toBe(0);
    } finally {
      await destroyFixture(fixture);
    }
  });

  it("releases the reservation for a late failed usage event", async () => {
    const fixture = await createFixture();
    try {
      await insertUsageEvent(fixture, { status: "FAILED", responseDelivered: false, errorCode: "provider_dispatch_failed" });
      const result = await processUnprocessedUsageEvents(50);
      expect(result.processed).toBeGreaterThanOrEqual(1);
      const reservation = await query<{ status: string }>(`SELECT status FROM wallet_reservations WHERE request_id=$1`, [fixture.requestId]);
      expect(reservation.rows[0]?.status).toBe("RELEASED");
      const request = await query<{ status: string }>(`SELECT status FROM logical_requests WHERE id=$1`, [fixture.requestId]);
      expect(request.rows[0]?.status).toBe("FAILED");
      const wallet = await query<{ available_balance: string; reserved_balance: string }>(`SELECT available_balance::text, reserved_balance::text FROM wallets WHERE id=$1`, [fixture.walletId]);
      expect(Number(wallet.rows[0]?.available_balance)).toBeCloseTo(5, 8);
      expect(Number(wallet.rows[0]?.reserved_balance)).toBe(0);
      const charge = await query<{ amount_usd: string }>(`SELECT amount_usd FROM customer_charges WHERE request_id=$1`, [fixture.requestId]);
      expect(charge.rows[0]).toBeUndefined();
    } finally {
      await destroyFixture(fixture);
    }
  });

  it("records a terminal processing error when the reservation was already released", async () => {
    const fixture = await createFixture();
    try {
      const sourceEventId = await insertUsageEvent(fixture, {});
      await query(`UPDATE wallet_reservations SET status='RELEASED' WHERE request_id=$1`, [fixture.requestId]);
      await query(`UPDATE wallets SET reserved_balance=0, available_balance=5 WHERE id=$1`, [fixture.walletId]);
      const result = await processUnprocessedUsageEvents(50);
      expect(result.processed).toBeGreaterThanOrEqual(1);
      const raw = await query<{ processed_at: string | null; processing_error: string | null }>(`SELECT processed_at, processing_error FROM raw_usage_events WHERE source_event_id=$1`, [sourceEventId]);
      expect(raw.rows[0]?.processed_at).not.toBeNull();
      expect(raw.rows[0]?.processing_error).toBe("Reservation is not active");
      const charge = await query<{ amount_usd: string }>(`SELECT amount_usd FROM customer_charges WHERE request_id=$1`, [fixture.requestId]);
      expect(charge.rows[0]).toBeUndefined();
      const wallet = await query<{ available_balance: string }>(`SELECT available_balance::text FROM wallets WHERE id=$1`, [fixture.walletId]);
      expect(Number(wallet.rows[0]?.available_balance)).toBe(5);
    } finally {
      await destroyFixture(fixture);
    }
  });
});
