import { query } from "@gateway/database";

export async function recordStripeWebhookEvent(event: { id: string; type: string; payload: unknown }): Promise<boolean> {
  const result = await query(
    `INSERT INTO stripe_webhook_events (event_id, event_type, payload)
     VALUES ($1,$2,$3) ON CONFLICT (event_id) DO NOTHING`,
    [event.id, event.type, JSON.stringify(event.payload)]
  );
  return result.rowCount === 1;
}
