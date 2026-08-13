import { describe, expect, it } from "vitest";
import { captureWallet, releaseWallet, reserveWallet } from "./wallet-math.js";

describe("wallet invariants", () => {
  it("reserves and releases without creating balance", () => {
    const reserved = reserveWallet({ available: 100n, reserved: 0n }, 25n);
    expect(reserved).toEqual({ available: 75n, reserved: 25n });
    expect(releaseWallet(reserved, 25n)).toEqual({ available: 100n, reserved: 0n });
  });

  it("rejects reservations above available balance", () => {
    expect(() => reserveWallet({ available: 10n, reserved: 0n }, 11n)).toThrow("Insufficient wallet balance");
  });

  it("removes the full reservation during capture", () => {
    expect(captureWallet({ available: 75n, reserved: 25n }, 25n, 5n)).toEqual({ available: 75n, reserved: 0n });
  });
});
