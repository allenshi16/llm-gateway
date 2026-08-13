import { describe, expect, it } from "vitest";
import { buildControlPlane } from "./app.js";

describe("control plane", () => {
  it("exposes a health endpoint", async () => {
    const app = buildControlPlane();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "control-plane" });
    await app.close();
  });

  it("exposes a liveness endpoint without requiring database access", async () => {
    const app = buildControlPlane();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it("rejects malformed organization requests", async () => {
    const previousToken = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
    process.env["CONTROL_PLANE_ADMIN_TOKEN"] = "test-admin-token";
    const app = buildControlPlane();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/v1/organizations",
        headers: { authorization: "Bearer test-admin-token" },
        payload: { name: "x" }
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
      if (previousToken === undefined) delete process.env["CONTROL_PLANE_ADMIN_TOKEN"];
      else process.env["CONTROL_PLANE_ADMIN_TOKEN"] = previousToken;
    }
  });

  it("protects mutation endpoints with the control-plane token", async () => {
    const previousToken = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
    process.env["CONTROL_PLANE_ADMIN_TOKEN"] = "test-admin-token";
    const app = buildControlPlane();
    try {
      const response = await app.inject({ method: "POST", url: "/v1/api-keys", payload: {} });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "control_plane_authentication_required" });
    } finally {
      await app.close();
      if (previousToken === undefined) delete process.env["CONTROL_PLANE_ADMIN_TOKEN"];
      else process.env["CONTROL_PLANE_ADMIN_TOKEN"] = previousToken;
    }
  });

  it("rejects Stripe webhooks without a signature", async () => {
    const app = buildControlPlane();
    const response = await app.inject({ method: "POST", url: "/v1/webhooks/stripe", payload: { id: "evt_test" } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "invalid_webhook" });
    await app.close();
  });
});
