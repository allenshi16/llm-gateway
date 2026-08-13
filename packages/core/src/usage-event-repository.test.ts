import { describe, expect, it } from "vitest";
import { ingestRawUsageEvent } from "./usage-event-repository.js";

const event = {
  version: 1 as const,
  source: "litellm" as const,
  sourceEventId: "evt-1",
  requestId: "00000000-0000-4000-8000-000000000001",
  attemptId: "00000000-0000-4000-8000-000000000002",
  status: "SUCCEEDED" as const,
  provider: "sandbox",
  providerModel: "sandbox-model",
  region: "US" as const,
  inputTokens: 10,
  outputTokens: 4,
  providerCostUsd: "0.001",
  startedAt: "2026-08-10T00:00:00.000Z",
  completedAt: "2026-08-10T00:00:01.000Z",
  responseDelivered: true
};

describe("usage event boundary", () => {
  it("rejects malformed provider callbacks before persistence", async () => {
    await expect(ingestRawUsageEvent({ ...event, inputTokens: -1 })).rejects.toThrow("Invalid usage event");
  });
});
