import { describe, expect, it } from "vitest";
import { signInternalAssertion, verifyInternalAssertion } from "./assertion.js";

describe("internal assertions", () => {
  const assertion = { version: 1 as const, requestId: "00000000-0000-4000-8000-000000000001", organizationId: "00000000-0000-4000-8000-000000000002", workspaceId: "00000000-0000-4000-8000-000000000003", apiKeyId: "00000000-0000-4000-8000-000000000004", modelProductId: "00000000-0000-4000-8000-000000000005", modelAlias: "qwen-fast", priceVersionId: "00000000-0000-4000-8000-000000000006", allowedProviders: ["qwen"], allowedRegion: "US" as const, bodyDigest: `sha256:${"a".repeat(64)}` as `sha256:${string}`, retentionMode: "ZERO" as const, allowCrossRegionFallback: false };

  it("binds issuer, audience, and signature", async () => {
    const token = await signInternalAssertion(assertion, "s".repeat(32), "edge", "litellm-us", 30);
    await expect(verifyInternalAssertion(token, "s".repeat(32), "edge", "litellm-us")).resolves.toMatchObject(assertion);
    await expect(verifyInternalAssertion(token, "x".repeat(32), "edge", "litellm-us")).rejects.toThrow();
    await expect(verifyInternalAssertion(token, "s".repeat(32), "other", "litellm-us")).rejects.toThrow();
  });
});
