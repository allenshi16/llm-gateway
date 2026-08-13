import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { database, query, withTransaction } from "./index.js";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!integrationEnabled)("postgres integration contract", () => {
  afterAll(async () => {
    await database.end();
  });

  it("has the authoritative wallet, journal, ledger, and outbox tables", async () => {
    const result = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name = ANY($1::text[])
       ORDER BY table_name`,
      [["logical_requests", "wallet_reservations", "ledger_transactions", "ledger_entries", "outbox_events", "stripe_webhook_events"]]
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      "ledger_entries",
      "ledger_transactions",
      "logical_requests",
      "outbox_events",
      "stripe_webhook_events",
      "wallet_reservations"
    ]);
  });

  it("rolls back an integration transaction", async () => {
    await expect(withTransaction(async (client) => {
      await client.query("SELECT 1");
      throw new Error("intentional rollback");
    })).rejects.toThrow("intentional rollback");
  });

  it("allows only one concurrent reservation to consume the same balance", async () => {
    const organizationId = randomUUID();
    const slug = `integration-${organizationId.slice(0, 8)}`;
    await query(`INSERT INTO organizations (id, name, slug) VALUES ($1, 'Integration', $2)`, [organizationId, slug]);
    const walletId = randomUUID();
    await query(`INSERT INTO wallets (id, organization_id, currency, available_balance) VALUES ($1,$2,'USD', '1.00000000')`, [walletId, organizationId]);
    const reserve = async (): Promise<boolean> => withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE wallets SET available_balance=available_balance-'1.00000000', reserved_balance=reserved_balance+'1.00000000', version=version+1
         WHERE id=$1 AND available_balance >= '1.00000000'`,
        [walletId]
      );
      return result.rowCount === 1;
    });
    const results = await Promise.all([reserve(), reserve()]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const balance = await query<{ available_balance: string; reserved_balance: string }>(`SELECT available_balance, reserved_balance FROM wallets WHERE id=$1`, [walletId]);
    expect(balance.rows[0]).toEqual({ available_balance: "0.00000000", reserved_balance: "1.00000000" });
    await query(`DELETE FROM wallets WHERE id=$1`, [walletId]);
    await query(`DELETE FROM organizations WHERE id=$1`, [organizationId]);
  });
});
