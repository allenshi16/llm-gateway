import { randomUUID } from "node:crypto";
import { query, withTransaction } from "@gateway/database";
import { calculateCustomerCharge, type PriceSnapshot, type UsageUnits } from "./pricing.js";

export interface AcceptRequestInput {
  requestId: string; organizationId: string; workspaceId: string; apiKeyId: string; modelProductId: string; priceVersionId: string; billingMode: string; region: string; bodyDigest: string; inputTokenEstimate: number; maximumOutputTokens: number; maximumChargeUsd: string; priceSnapshot: PriceSnapshot; reservationExpiresAt: Date;
}

export async function acceptAndReserveRequest(input: AcceptRequestInput): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(`INSERT INTO logical_requests (id, organization_id, workspace_id, api_key_id, model_product_id, price_version_id, billing_mode, region, request_body_digest, input_token_estimate, maximum_output_tokens, maximum_charge_usd, customer_price_snapshot, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'RESERVED')`, [input.requestId, input.organizationId, input.workspaceId, input.apiKeyId, input.modelProductId, input.priceVersionId, input.billingMode, input.region, input.bodyDigest, input.inputTokenEstimate, input.maximumOutputTokens, input.maximumChargeUsd, JSON.stringify(input.priceSnapshot)]);
    const wallet = await client.query<{ id: string }>(`SELECT id FROM wallets WHERE organization_id=$1 AND currency='USD' FOR UPDATE`, [input.organizationId]);
    const row = wallet.rows[0];
    if (!row) throw new Error("Wallet not found");
    const updated = await client.query(
      `UPDATE wallets SET available_balance=available_balance-$1, reserved_balance=reserved_balance+$1,
       version=version+1, updated_at=now()
       WHERE id=$2 AND available_balance >= $1`,
      [input.maximumChargeUsd, row.id]
    );
    if (updated.rowCount !== 1) throw new Error("Insufficient wallet balance");
    await client.query(`INSERT INTO wallet_reservations (wallet_id, request_id, amount, expires_at) VALUES ($1,$2,$3,$4)`, [row.id, input.requestId, input.maximumChargeUsd, input.reservationExpiresAt]);
  });
}

export async function releaseRequest(input: { requestId: string; organizationId: string; reason: string }): Promise<void> {
  await withTransaction(async (client) => {
    const result = await client.query<{ wallet_id: string; amount: string; status: string }>(
      `SELECT wr.wallet_id, wr.amount, wr.status
       FROM wallet_reservations wr
       JOIN logical_requests lr ON lr.id = wr.request_id
       WHERE wr.request_id=$1 AND lr.organization_id=$2
       FOR UPDATE`,
      [input.requestId, input.organizationId]
    );
    const reservation = result.rows[0];
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status === "RELEASED") return;
    if (reservation.status !== "ACTIVE") throw new Error("Reservation is not releasable");

    const transactionId = randomUUID();
    await client.query(
      `INSERT INTO ledger_transactions (id, organization_id, type, idempotency_key, reference_type, reference_id, description)
       VALUES ($1,$2,'RESERVATION_RELEASE',$3,'LOGICAL_REQUEST',$4,$5)`,
      [transactionId, input.organizationId, `request:${input.requestId}:release`, input.requestId, input.reason]
    );
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, wallet_id, account_code, direction, amount)
       VALUES ($1,$2,'CUSTOMER_WALLET','CREDIT',$3)`,
      [transactionId, reservation.wallet_id, reservation.amount]
    );
    await client.query(
      `UPDATE wallets SET available_balance=available_balance+$1, reserved_balance=reserved_balance-$1,
       version=version+1, updated_at=now() WHERE id=$2`,
      [reservation.amount, reservation.wallet_id]
    );
    await client.query(
      `UPDATE wallet_reservations SET status='RELEASED', updated_at=now() WHERE request_id=$1 AND status='ACTIVE'`,
      [input.requestId]
    );
    await client.query(
      `UPDATE logical_requests SET status='FAILED', updated_at=now() WHERE id=$1 AND organization_id=$2`,
      [input.requestId, input.organizationId]
    );
  });
}

export interface SettleRequestInput {
  requestId: string; organizationId: string; usage: UsageUnits; priceSnapshot: PriceSnapshot; provider: { attemptId: string; model: string; region: string; costUsd: string; inputTokens: number; outputTokens: number };
}

export async function startProviderAttempt(input: { attemptId: string; requestId: string; organizationId: string; provider: string; providerModel: string; region: string }): Promise<void> {
  await withTransaction(async (client) => {
    const request = await client.query<{ id: string }>(
      `SELECT lr.id FROM logical_requests lr WHERE lr.id=$1 AND lr.organization_id=$2 AND lr.status='RESERVED' FOR UPDATE`,
      [input.requestId, input.organizationId]
    );
    if (!request.rows[0]) throw new Error("Request is not available for provider attempt");
    await client.query(
      `INSERT INTO provider_attempts (id, request_id, sequence, provider, provider_model, region, status)
       SELECT $1,$2,COALESCE(MAX(sequence), 0)+1,$3,$4,$5,'STARTED'
       FROM provider_attempts WHERE request_id=$2`,
      [input.attemptId, input.requestId, input.provider, input.providerModel, input.region]
    );
  });
}

export async function finishProviderAttempt(input: { attemptId: string; requestId: string; organizationId: string; status: "FAILED" | "CANCELLED" | "AMBIGUOUS"; errorCode: string; responseDelivered: boolean }): Promise<void> {
  await query(
    `UPDATE provider_attempts pa SET status=$1, error_code=$2, response_delivered=$3, completed_at=now()
     FROM logical_requests lr
     WHERE pa.id=$4 AND pa.request_id=$5 AND lr.id=pa.request_id AND lr.organization_id=$6 AND pa.status='STARTED'`,
    [input.status, input.errorCode, input.responseDelivered, input.attemptId, input.requestId, input.organizationId]
  );
}

export async function settleRequest(input: SettleRequestInput): Promise<{ customerChargeUsd: string; providerCostUsd: string }> {
  return withTransaction(async (client) => {
    const request = await client.query<{ wallet_id: string; amount: string; status: string }>(
      `SELECT wr.wallet_id, wr.amount, wr.status
       FROM wallet_reservations wr
       JOIN logical_requests lr ON lr.id=wr.request_id
       WHERE wr.request_id=$1 AND lr.organization_id=$2
       FOR UPDATE`,
      [input.requestId, input.organizationId]
    );
    const reservation = request.rows[0];
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status === "CAPTURED") {
      const existing = await client.query<{ amount_usd: string }>(`SELECT amount_usd FROM customer_charges WHERE request_id=$1 AND component='logical_request'`, [input.requestId]);
      return { customerChargeUsd: existing.rows[0]?.amount_usd ?? "0", providerCostUsd: input.provider.costUsd };
    }
    if (reservation.status !== "ACTIVE") throw new Error("Reservation is not active");
    const customerChargeUsd = calculateCustomerCharge(input.priceSnapshot, input.usage);
    const transactionId = randomUUID();
    const ledgerKey = `request:${input.requestId}:capture`;
    const attempt = await client.query<{ id: string }>(
      `UPDATE provider_attempts pa SET status='SUCCEEDED', input_tokens=$1, output_tokens=$2, provider_cost_usd=$3, response_delivered=true, completed_at=now()
       FROM logical_requests lr
       WHERE pa.id=$4 AND pa.request_id=$5 AND lr.id=pa.request_id AND lr.organization_id=$6 AND pa.status='STARTED'
       RETURNING pa.id`,
      [input.provider.inputTokens, input.provider.outputTokens, input.provider.costUsd, input.provider.attemptId, input.requestId, input.organizationId]
    );
    if (!attempt.rows[0]) throw new Error("Provider attempt is not active");
    await client.query(`INSERT INTO customer_charges (request_id, component, amount_usd, billing_mode, price_version_id, usage_snapshot) SELECT $1,'logical_request',$2,billing_mode,price_version_id,$3 FROM logical_requests WHERE id=$1 ON CONFLICT (request_id, component) DO NOTHING`, [input.requestId, customerChargeUsd, JSON.stringify(input.usage)]);
    if (customerChargeUsd !== "0") {
      await client.query(`INSERT INTO ledger_transactions (id, organization_id, type, idempotency_key, reference_type, reference_id, description) VALUES ($1,$2,'RESERVATION_CAPTURE',$3,'LOGICAL_REQUEST',$4,'Customer logical request charge')`, [transactionId, input.organizationId, ledgerKey, input.requestId]);
      await client.query(`INSERT INTO ledger_entries (transaction_id, wallet_id, account_code, direction, amount) VALUES ($1,$2,'CUSTOMER_WALLET','DEBIT',$3)`, [transactionId, reservation.wallet_id, customerChargeUsd]);
    }
    await client.query(`UPDATE wallets SET available_balance=available_balance+($1-$2), reserved_balance=reserved_balance-$1, version=version+1, updated_at=now() WHERE id=$3`, [reservation.amount, customerChargeUsd, reservation.wallet_id]);
    await client.query(`UPDATE wallet_reservations SET captured_amount=$1,status='CAPTURED',updated_at=now() WHERE request_id=$2 AND status='ACTIVE'`, [customerChargeUsd, input.requestId]);
    await client.query(`UPDATE logical_requests SET status='SETTLED',completed_at=now(),updated_at=now() WHERE id=$1`, [input.requestId]);
    return { customerChargeUsd, providerCostUsd: input.provider.costUsd };
  });
}
