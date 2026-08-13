import { describe, expect, it } from "vitest";
import { constantTimeApiKeyMatch, generateApiKey, hashApiKey } from "./api-key.js";

describe("API key security", () => {
  it("stores only a keyed digest and validates the presented secret", () => {
    const generated = generateApiKey("a".repeat(32), "test");
    expect(generated.secret).not.toBe(generated.hash);
    expect(constantTimeApiKeyMatch(generated.secret, generated.hash, "a".repeat(32))).toBe(true);
    expect(constantTimeApiKeyMatch(`${generated.secret}x`, generated.hash, "a".repeat(32))).toBe(false);
    expect(hashApiKey(generated.secret, "b".repeat(32))).not.toBe(generated.hash);
  });
});
