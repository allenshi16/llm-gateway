import { afterAll, describe, expect, it } from "vitest";
import { database, query } from "@gateway/database";
import { createStripeClient } from "@gateway/core";
import { buildControlPlane } from "./app.js";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!integrationEnabled)("stripe webhook integration", () => {
  afterAll(async () => {
    await database.end();
  });

  it("verifies a signed raw event and acknowledges a duplicate idempotently", async () => {
    const secret = "whsec_integration_test";
    const stripe = createStripeClient({ secretKey: "sk_test_integration" });
    const payload = JSON.stringify({ id: "evt_integration_signed", object: "event", api_version: "2025-01-27.acacia", created: Math.floor(Date.now() / 1000), data: { object: {} }, livemode: false, pending_webhooks: 1, request: null, type: "payment_intent.succeeded" });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const previousSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    const previousKey = process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_WEBHOOK_SECRET"] = secret;
    process.env["STRIPE_SECRET_KEY"] = "sk_test_integration";
    const app = buildControlPlane();
    try {
      const first = await app.inject({ method: "POST", url: "/v1/webhooks/stripe", headers: { "stripe-signature": signature, "content-type": "application/json" }, payload });
      const second = await app.inject({ method: "POST", url: "/v1/webhooks/stripe", headers: { "stripe-signature": signature, "content-type": "application/json" }, payload });
      expect(first.statusCode).toBe(200);
      expect(first.json()).toEqual({ received: true, duplicate: false });
      expect(second.statusCode).toBe(200);
      expect(second.json()).toEqual({ received: true, duplicate: true });
      const stored = await query<{ count: string }>("SELECT count(*)::text AS count FROM stripe_webhook_events WHERE event_id=$1", ["evt_integration_signed"]);
      expect(stored.rows[0]?.count).toBe("1");
      await query("DELETE FROM stripe_webhook_events WHERE event_id=$1", ["evt_integration_signed"]);
    } finally {
      await app.close();
      if (previousSecret === undefined) delete process.env["STRIPE_WEBHOOK_SECRET"];
      else process.env["STRIPE_WEBHOOK_SECRET"] = previousSecret;
      if (previousKey === undefined) delete process.env["STRIPE_SECRET_KEY"];
      else process.env["STRIPE_SECRET_KEY"] = previousKey;
    }
  });
});
