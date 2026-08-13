export interface RateLimiter {
  limited(key: string): boolean;
  readonly windowMs: number;
  readonly max: number;
}

export function createRateLimiter(max: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    windowMs,
    max,
    limited(key: string): boolean {
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return false;
      }
      bucket.count += 1;
      if (bucket.count > max) return true;
      if (buckets.size > 100_000) {
        for (const [entryKey, entry] of buckets) {
          if (now >= entry.resetAt) buckets.delete(entryKey);
        }
      }
      return false;
    }
  };
}

export interface SecurityHeaders {
  [name: string]: string;
}

export function securityHeaders(): SecurityHeaders {
  return {
    "content-security-policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin"
  };
}