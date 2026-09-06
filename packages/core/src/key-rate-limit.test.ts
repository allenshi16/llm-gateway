import { describe, expect, it } from "vitest";
import { evaluateKeyRateLimit } from "./key-rate-limit.js";

describe("per-key rate limit verdict", () => {
  it("allows requests when no limits are configured", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: null, tpmLimit: null }, window: { requests: 999, tokens: 999_999 }, inputTokenEstimate: 100, maximumOutputTokens: 100 });
    expect(verdict).toEqual({ allowed: true });
  });

  it("rejects when the request count reaches the RPM limit", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: 60, tpmLimit: null }, window: { requests: 60, tokens: 0 }, inputTokenEstimate: 10, maximumOutputTokens: 10 });
    expect(verdict).toEqual({ allowed: false, reason: "rpm_limit_exceeded" });
  });

  it("allows the request that stays under the RPM limit", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: 60, tpmLimit: null }, window: { requests: 59, tokens: 0 }, inputTokenEstimate: 10, maximumOutputTokens: 10 });
    expect(verdict).toEqual({ allowed: true });
  });

  it("rejects when worst-case reserved tokens would exceed the TPM limit", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: null, tpmLimit: 1000 }, window: { requests: 5, tokens: 900 }, inputTokenEstimate: 50, maximumOutputTokens: 100 });
    expect(verdict).toEqual({ allowed: false, reason: "tpm_limit_exceeded" });
  });

  it("allows when worst-case reserved tokens fit the TPM limit", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: null, tpmLimit: 1000 }, window: { requests: 5, tokens: 900 }, inputTokenEstimate: 50, maximumOutputTokens: 40 });
    expect(verdict).toEqual({ allowed: true });
  });

  it("checks RPM before TPM when both limits apply", () => {
    const verdict = evaluateKeyRateLimit({ limits: { rpmLimit: 10, tpmLimit: 1000 }, window: { requests: 10, tokens: 999 }, inputTokenEstimate: 100, maximumOutputTokens: 100 });
    expect(verdict).toEqual({ allowed: false, reason: "rpm_limit_exceeded" });
  });
});
