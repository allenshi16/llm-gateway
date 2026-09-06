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

  it("keeps the prefix parseable as exactly three underscore-separated segments", () => {
    for (let index = 0; index < 200; index += 1) {
      const generated = generateApiKey("a".repeat(32), index % 2 === 0 ? "live" : "test");
      const extracted = generated.secret.split("_").slice(0, 3).join("_");
      expect(extracted).toBe(generated.prefix);
    }
  });
});
