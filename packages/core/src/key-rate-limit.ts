export interface KeyRateLimits {
  rpmLimit: number | null;
  tpmLimit: number | null;
}

export interface KeyRateWindowSnapshot {
  requests: number;
  tokens: number;
}

export type KeyRateLimitVerdict = { allowed: true } | { allowed: false; reason: "rpm_limit_exceeded" | "tpm_limit_exceeded" };

export function evaluateKeyRateLimit(input: { limits: KeyRateLimits; window: KeyRateWindowSnapshot; inputTokenEstimate: number; maximumOutputTokens: number }): KeyRateLimitVerdict {
  if (input.limits.rpmLimit !== null && input.window.requests >= input.limits.rpmLimit) {
    return { allowed: false, reason: "rpm_limit_exceeded" };
  }
  if (input.limits.tpmLimit !== null && input.window.tokens + input.inputTokenEstimate + input.maximumOutputTokens > input.limits.tpmLimit) {
    return { allowed: false, reason: "tpm_limit_exceeded" };
  }
  return { allowed: true };
}
