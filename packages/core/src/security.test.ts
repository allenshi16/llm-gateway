import { describe, expect, it } from "vitest";
import { createRateLimiter, securityHeaders } from "./security.js";

describe("security", () => {
  it("limits requests within a window and resets after", () => {
    const limiter = createRateLimiter(2, 1000);
    expect(limiter.limited("a")).toBe(false);
    expect(limiter.limited("a")).toBe(false);
    expect(limiter.limited("a")).toBe(true);
    expect(limiter.limited("b")).toBe(false);
    return new Promise<void>((resolve) => setTimeout(() => { expect(limiter.limited("a")).toBe(false); resolve(); }, 1100));
  });

  it("returns hardening response headers", () => {
    const headers = securityHeaders();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["referrer-policy"]).toBe("no-referrer");
  });
});