import { describe, expect, it } from "vitest";
import { validateReleaseImage } from "./release-config.js";

describe("release configuration", () => {
  it("requires an immutable LiteLLM digest", () => {
    expect(() => validateReleaseImage("ghcr.io/berriai/litellm:latest")).toThrow();
    expect(() => validateReleaseImage("ghcr.io/berriai/litellm@sha256:replace-with-verified-digest")).toThrow();
    expect(() => validateReleaseImage(`ghcr.io/berriai/litellm@sha256:${"a".repeat(64)}`)).not.toThrow();
  });
});
