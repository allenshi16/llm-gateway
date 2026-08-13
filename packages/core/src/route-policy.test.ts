import { describe, expect, it } from "vitest";
import { selectApprovedRoute } from "./route-policy.js";

describe("route policy", () => {
  const base = { provider: "qwen", region: "US" as const, status: "APPROVED" as const, resaleApproved: true, dpaApproved: true, securityApproved: true, residencyApproved: true, killSwitch: false, zeroRetention: true };

  it("rejects cross-region and kill-switched routes", () => {
    expect(() => selectApprovedRoute([{ ...base, region: "EU" }], "US", "STANDARD")).toThrow();
    expect(() => selectApprovedRoute([{ ...base, killSwitch: true }], "US", "STANDARD")).toThrow();
  });

  it("requires zero retention for zero-retention tenants", () => {
    expect(() => selectApprovedRoute([{ ...base, zeroRetention: false }], "US", "ZERO")).toThrow();
    expect(selectApprovedRoute([base], "US", "ZERO").provider).toBe("qwen");
  });

  it("selects a later approved route when an earlier route is not eligible", () => {
    const route = selectApprovedRoute([
      { ...base, provider: "pending-provider", resaleApproved: false },
      { ...base, provider: "approved-provider" }
    ], "US", "ZERO");
    expect(route.provider).toBe("approved-provider");
  });
});
