import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { query, database } from "@gateway/database";
import { createOutboxWorker } from "./worker.js";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!integrationEnabled)("postgres outbox worker", () => {
  afterAll(async () => {
    await database.end();
  });

  it("claims and marks a handled event as processed", async () => {
    const eventId = randomUUID();
    await query(`INSERT INTO outbox_events (id, topic, aggregate_type, aggregate_id, payload) VALUES ($1,'integration.test','test',$2,'{}'::jsonb)`, [eventId, eventId]);
    const handler = vi.fn(async () => undefined);
    const worker = createOutboxWorker({ workerId: `integration-${eventId}`, handlers: { "integration.test": handler } });
    await expect(worker.runOnce()).resolves.toBe(1);
    expect(handler).toHaveBeenCalledOnce();
    const result = await query<{ status: string }>(`SELECT status FROM outbox_events WHERE id=$1`, [eventId]);
    expect(result.rows[0]?.status).toBe("PROCESSED");
    await query(`DELETE FROM outbox_events WHERE id=$1`, [eventId]);
  });

  it("moves handler failures to retry without losing the event", async () => {
    const eventId = randomUUID();
    await query(`INSERT INTO outbox_events (id, topic, aggregate_type, aggregate_id, payload) VALUES ($1,'integration.retry','test',$2,'{}'::jsonb)`, [eventId, eventId]);
    const worker = createOutboxWorker({ workerId: `integration-${eventId}`, handlers: { "integration.retry": async () => { throw new Error("expected failure"); } } });
    await expect(worker.runOnce()).resolves.toBe(1);
    const result = await query<{ status: string; attempts: number; last_error: string }>(`SELECT status, attempts, last_error FROM outbox_events WHERE id=$1`, [eventId]);
    expect(result.rows[0]).toMatchObject({ status: "RETRY", attempts: 1, last_error: "expected failure" });
    await query(`DELETE FROM outbox_events WHERE id=$1`, [eventId]);
  });
});
