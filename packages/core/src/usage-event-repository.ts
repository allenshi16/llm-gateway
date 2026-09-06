import { usageEventSchema, type UsageEvent } from "@gateway/contracts";
import { query } from "@gateway/database";

export async function recordRawUsageEvent(event: UsageEvent): Promise<boolean> {
  const result = await query(
    `INSERT INTO raw_usage_events (source, source_event_id, request_id, attempt_id, payload)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (source, source_event_id) DO NOTHING`,
    [event.source, event.sourceEventId, event.requestId, event.attemptId, JSON.stringify(event)]
  );
  return result.rowCount === 1;
}

export async function finalizeRawUsageEvent(id: string, processingError: string | null): Promise<void> {
  await query(
    `UPDATE raw_usage_events SET processed_at=now(), processing_error=$2 WHERE id=$1`,
    [id, processingError]
  );
}

export async function ingestRawUsageEvent(input: unknown): Promise<{ accepted: boolean; event: UsageEvent }> {
  const parsed = usageEventSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid usage event");
  return { accepted: await recordRawUsageEvent(parsed.data), event: parsed.data };
}
