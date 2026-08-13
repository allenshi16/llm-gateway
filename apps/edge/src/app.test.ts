import { describe, expect, it } from "vitest";
import { buildEdge } from "./app.js";

describe("edge request boundary", () => {
  it("does not expose an internal assertion without authentication", async () => {
    const app = buildEdge();
    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: { model: "approved-model", messages: [{ role: "user", content: "hello" }] }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "missing_api_key" });
    expect(response.body).not.toContain("assertion");
    await app.close();
  });

  it("rejects malformed authorization before any provider or wallet operation", async () => {
    const app = buildEdge();
    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: "Basic test_key" },
      payload: { model: "approved-model", messages: [] }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "missing_api_key" });
    await app.close();
  });

  it("does not leak internal state when the key service is unavailable", async () => {
    const previousPepper = process.env["API_KEY_PEPPER"];
    delete process.env["API_KEY_PEPPER"];
    try {
      const app = buildEdge();
      const response = await app.inject({
        method: "POST",
        url: "/v1/chat/completions",
        headers: { authorization: "Bearer test_key" },
        payload: { model: "approved-model", messages: [{ role: "user", content: "hello" }] }
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ error: "key_service_unconfigured" });
      expect(response.body).not.toContain("DATABASE_URL");
      await app.close();
    } finally {
      if (previousPepper === undefined) delete process.env["API_KEY_PEPPER"];
      else process.env["API_KEY_PEPPER"] = previousPepper;
    }
  });
});
