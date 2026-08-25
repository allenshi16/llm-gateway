import { usageEventSchema, type UsageEvent } from "@gateway/contracts";
import { query } from "@gateway/database";
import { recordRawUsageEvent } from "./usage-event-repository.js";
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
