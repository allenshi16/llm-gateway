import { createHmac, randomBytes } from "node:crypto";

export interface GeneratedApiKey {
  secret: string;
  prefix: string;
  hash: string;
}

export function generateApiKey(pepper: string, environment: "live" | "test" = "test"): GeneratedApiKey {
  const secret = randomBytes(32).toString("base64url");
  const prefix = `sk_${environment}_${secret.slice(0, 8)}`;
  const presented = `${prefix}_${secret}`;
  return {
    secret: presented,
    prefix,
    hash: hashApiKey(presented, pepper)
  };
}

export function hashApiKey(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value, "utf8").digest("hex");
}

export function constantTimeApiKeyMatch(value: string, expectedHash: string, pepper: string): boolean {
  const actual = hashApiKey(value, pepper);
  if (actual.length !== expectedHash.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) {
    mismatch |= actual.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return mismatch === 0;
}
