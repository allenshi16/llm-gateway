import { randomUUID } from "node:crypto";
import { withTransaction } from "@gateway/database";
import { recordAudit } from "./audit-repository.js";

export interface WalletCreditInput {
  organizationId: string;
  amountUsd: string;
  currency: string;
  source: string;
  sourceEventId: string;
  stripePaymentIntentId?: string;
  actorId?: string | null;
}

export async function creditWalletFromPayment(input: WalletCreditInput): Promise<{ credited: boolean; ledgerTransactionId: string | null }> {
  return withTransaction(async (client) => {
    const projection = await client.query<{ id: string; ledger_transaction_id: string | null }>(
      `SELECT id, ledger_transaction_id FROM payment_projections WHERE stripe_event_id=$1 FOR UPDATE`,
      [input.sourceEventId]
    );
    const existing = projection.rows[0];
    if (existing) return { credited: false, ledgerTransactionId: existing.ledger_transaction_id ?? null };

    const wallet = await client.query<{ id: string }>(`SELECT id FROM wallets WHERE organization_id=$1 AND currency=$2 FOR UPDATE`, [input.organizationId, input.currency]);
    const walletId = wallet.rows[0]?.id;
    if (!walletId) throw new Error("Wallet not found");

    const transactionId = randomUUID();
    const amountBig = BigInt(Math.round(Number(input.amountUsd) * 1_000_000_000_000_000_000));
    const amountMicros = (amountBig / 1_000_000_000_000_000_000n).toString();
    await client.query(
      `INSERT INTO ledger_transactions (id, organization_id, type, idempotency_key, reference_type, reference_id, description) VALUES ($1,$2,'PAYMENT_CREDIT',$3,'STRIPE_PAYMENT',$4,$5)`,
      [transactionId, input.organizationId, `stripe:payment:${input.sourceEventId}`, input.stripePaymentIntentId ?? input.sourceEventId, input.source]
    );
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, wallet_id, account_code, direction, amount) VALUES ($1,$2,'CUSTOMER_WALLET','CREDIT',$3)`,
      [transactionId, walletId, amountMicros]
    );
    const updated = await client.query(
      `UPDATE wallets SET available_balance=available_balance+$1, version=version+1, updated_at=now() WHERE id=$2`,
      [amountMicros, walletId]
    );
    if (updated.rowCount !== 1) throw new Error("Wallet credit failed");
    await client.query(
      `INSERT INTO payment_projections (id, organization_id, stripe_event_id, stripe_payment_intent_id, amount_cents, currency, status, ledger_transaction_id, processed_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,'CAPTURED',$6,now())`,
      [input.organizationId, input.sourceEventId, input.stripePaymentIntentId ?? null, Number(input.amountUsd) * 100, input.currency, transactionId]
    );
    await recordAudit({ organizationId: input.organizationId, accountId: input.actorId ?? null, actorId: input.actorId ?? null, action: "billing.payment_credited", resourceType: "payment", resourceId: input.sourceEventId, metadata: { amountUsd: input.amountUsd, currency: input.currency } });
    return { credited: true, ledgerTransactionId: transactionId };
  });
}

export async function listPayments(input: { organizationId: string; limit: number }): Promise<{ id: string; amount_cents: number; currency: string; status: string; received_at: string }[]> {
  const { query } = await import("@gateway/database");
  const result = await query(`SELECT id, amount_cents, currency, status, received_at FROM payment_projections WHERE organization_id=$1 ORDER BY received_at DESC LIMIT $2`, [input.organizationId, input.limit]);
  return result.rows as { id: string; amount_cents: number; currency: string; status: string; received_at: string }[];
}