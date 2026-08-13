import { describe, expect, it } from "vitest";
import { calculateCustomerCharge } from "./pricing.js";

describe("accounting pricing boundary", () => {
  it("keeps customer price calculation separate from provider cost", () => {
    const charge = calculateCustomerCharge({ inputPerMillion: "1", outputPerMillion: "2", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "3", requestFee: "0" }, { inputTokens: 1_000_000, outputTokens: 500_000, reasoningTokens: 100 });
    expect(charge).toBe("2.000003");
  });
});
