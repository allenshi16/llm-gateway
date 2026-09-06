import { usageEventSchema, type UsageEvent } from "@gateway/contracts";
import { query } from "@gateway/database";
import { finalizeRawUsageEvent, recordRawUsageEvent } from "./usage-event-repository.js";
import { releaseRequest, settleRequest } from "./accounting-repository.js";
import type { PriceSnapshot } from "./pricing.js";

export interface ReconcileUsageInput {
  event: unknown;
  organizationId: string;
  priceSnapshot: PriceSnapshot;
}

export async function reconcileUsageEvent(input: ReconcileUsageInput): Promise<{ accepted: boolean; settled: boolean; event: UsageEvent }> {
  const parsed = usageEventSchema.safeParse(input.event);
  if (!parsed.success) throw new Error("Invalid usage event");
  const event = parsed.data;
  if (event.status !== "SUCCEEDED" || !event.responseDelivered) {
    const accepted = await recordRawUsageEvent(event);
    if (event.status === "FAILED") {
      const active = await query<{ id: string }>(
        `SELECT wr.id FROM wallet_reservations wr WHERE wr.request_id=$1 AND wr.status='ACTIVE'`,
        [event.requestId]
      );
      if (active.rows[0]) {
        await releaseRequest({ requestId: event.requestId, organizationId: input.organizationId, reason: "provider_failed" });
      }
    }
    return { accepted, settled: false, event };
  }
  const accepted = await recordRawUsageEvent(event);
  await settleRequest({
    requestId: event.requestId,
    organizationId: input.organizationId,
    usage: {
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cacheReadTokens: event.cacheReadTokens,
      cacheWriteTokens: event.cacheWriteTokens,
      reasoningTokens: event.reasoningTokens
    },
    priceSnapshot: input.priceSnapshot,
    provider: {
      attemptId: event.attemptId,
      model: event.providerModel,
      region: event.region,
      costUsd: event.providerCostUsd,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens
    }
  });
  return { accepted, settled: true, event };
}

export interface RawUsageEventSweep {
  processed: number;
  failed: number;
}

interface RawUsageEventRow {
  id: string;
  payload: unknown;
}

const TERMINAL_SETTLEMENT_ERRORS = new Set([
  "Reservation not found",
  "Reservation is not active",
  "Provider attempt is not active"
]);

async function reconcileRawUsageEventRow(row: RawUsageEventRow): Promise<void> {
  const parsed = usageEventSchema.safeParse(row.payload);
  if (!parsed.success) {
    await finalizeRawUsageEvent(row.id, "invalid_usage_event_payload");
    return;
  }
  const event = parsed.data;
  const lookup = await query<{
    organization_id: string; input_per_million: string; output_per_million: string;
    cache_read_per_million: string; cache_write_per_million: string; reasoning_per_million: string; request_fee: string;
  }>(
    `SELECT lr.organization_id, pv.input_per_million, pv.output_per_million, pv.cache_read_per_million, pv.cache_write_per_million, pv.reasoning_per_million, pv.request_fee
     FROM logical_requests lr JOIN price_versions pv ON pv.id=lr.price_version_id WHERE lr.id=$1`,
    [event.requestId]
  );
  const price = lookup.rows[0];
  if (!price) {
    await finalizeRawUsageEvent(row.id, "request_not_found");
    return;
  }
  if (event.status === "SUCCEEDED" && event.responseDelivered) {
    try {
      await settleRequest({
        requestId: event.requestId,
        organizationId: price.organization_id,
        usage: {
          inputTokens: event.inputTokens,
          outputTokens: event.outputTokens,
          cacheReadTokens: event.cacheReadTokens,
          cacheWriteTokens: event.cacheWriteTokens,
          reasoningTokens: event.reasoningTokens
        },
        priceSnapshot: {
          inputPerMillion: price.input_per_million,
          outputPerMillion: price.output_per_million,
          cacheReadPerMillion: price.cache_read_per_million,
          cacheWritePerMillion: price.cache_write_per_million,
          reasoningPerMillion: price.reasoning_per_million,
          requestFee: price.request_fee
        },
        provider: {
          attemptId: event.attemptId,
          model: event.providerModel,
          region: event.region,
          costUsd: event.providerCostUsd,
          inputTokens: event.inputTokens,
          outputTokens: event.outputTokens
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "settlement failed";
      if (!TERMINAL_SETTLEMENT_ERRORS.has(message)) throw error;
      await finalizeRawUsageEvent(row.id, message);
      return;
    }
    await finalizeRawUsageEvent(row.id, null);
    return;
  }
  if (event.status === "FAILED") {
    const active = await query<{ id: string }>(
      `SELECT wr.id FROM wallet_reservations wr WHERE wr.request_id=$1 AND wr.status='ACTIVE'`,
      [event.requestId]
    );
    if (active.rows[0]) {
      await releaseRequest({ requestId: event.requestId, organizationId: price.organization_id, reason: "provider_failed" });
    }
  }
  await finalizeRawUsageEvent(row.id, null);
}

export async function processUnprocessedUsageEvents(limit = 50): Promise<RawUsageEventSweep> {
  const pending = await query<RawUsageEventRow>(
    `SELECT id, payload FROM raw_usage_events WHERE processed_at IS NULL ORDER BY received_at LIMIT $1`,
    [limit]
  );
  let processed = 0;
  let failed = 0;
  for (const row of pending.rows) {
    try {
      await reconcileRawUsageEventRow(row);
      processed += 1;
    } catch {
      // Deliberately left unprocessed: the next sweep retries; not a swallowed error.
      failed += 1;
    }
  }
  return { processed, failed };
}
