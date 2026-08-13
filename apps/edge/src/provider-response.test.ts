import { describe, expect, it } from "vitest";
import { parseProviderUsage } from "./provider-response.js";

describe("provider response usage", () => {
  it("accepts complete non-negative OpenAI usage", () => {
    expect(parseProviderUsage({ usage: { prompt_tokens: 12, completion_tokens: 8 } })).toEqual({ inputTokens: 12, outputTokens: 8 });
  });

  it("rejects missing, fractional, and negative usage", () => {
    expect(parseProviderUsage({})).toBeNull();
    expect(parseProviderUsage({ usage: { prompt_tokens: 1.5, completion_tokens: 1 } })).toBeNull();
    expect(parseProviderUsage({ usage: { prompt_tokens: 1, completion_tokens: -1 } })).toBeNull();
  });
});
