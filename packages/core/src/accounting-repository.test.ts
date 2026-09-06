import { describe, expect, it } from "vitest";
import { calculateCustomerCharge } from "./pricing.js";

describe("accounting pricing boundary", () => {
  it("keeps customer price calculation separate from provider cost", () => {
    const charge = calculateCustomerCharge({ inputPerMillion: "1", outputPerMillion: "2", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "3", requestFee: "0" }, { inputTokens: 1_000_000, outputTokens: 500_000, reasoningTokens: 100 });
    expect(charge).toBe("2.0003");
  });

  it("charges per-million prices on token counts exactly", () => {
    const charge = calculateCustomerCharge({ inputPerMillion: "1", outputPerMillion: "1", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "0", requestFee: "0" }, { inputTokens: 16, outputTokens: 8 });
    expect(charge).toBe("0.000024");
  });

  it("adds the request fee in dollars", () => {
    const charge = calculateCustomerCharge({ inputPerMillion: "0", outputPerMillion: "0", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "0", requestFee: "0.50" }, { inputTokens: 0, outputTokens: 0 });
    expect(charge).toBe("0.5");
  });

  it("keeps whole-dollar charges free of fractional padding", () => {
    const charge = calculateCustomerCharge({ inputPerMillion: "2", outputPerMillion: "0", cacheReadPerMillion: "0", cacheWritePerMillion: "0", reasoningPerMillion: "0", requestFee: "0" }, { inputTokens: 1_000_000, outputTokens: 0 });
    expect(charge).toBe("2");
  });
});
