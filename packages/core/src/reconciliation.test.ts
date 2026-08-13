import { describe, expect, it } from "vitest";
import { reconcileUsageEvent } from "./reconciliation.js";

describe("usage reconciliation boundary", () => {
  it("rejects malformed events before any persistence or settlement", async () => {
    await expect(reconcileUsageEvent({ event: { status: "AMBIGUOUS" }, organizationId: "00000000-0000-4000-8000-000000000003", priceSnapshot: { inputPerMillion: "1", outputPerMillion: "1", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "0", requestFee: "0" } })).rejects.toThrow("Invalid usage event");
  });
});
