import { describe, expect, it } from "vitest";
import { dispatchProvider } from "./provider-transport.js";

describe("provider transport", () => {
  it("passes the internal assertion and request body", async () => {
    const response = await dispatchProvider({
      endpoint: "https://sandbox.invalid/v1/chat/completions",
      masterKey: "master",
      assertion: "assertion",
      body: { model: "sandbox" },
      timeoutMs: 100,
      fetchImpl: async (_input, init) => {
        expect(init?.headers).toMatchObject({ authorization: "Bearer master", "x-gateway-assertion": "assertion" });
        expect(init?.body).toBe(JSON.stringify({ model: "sandbox" }));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
    });
    expect(response.response.status).toBe(200);
  });

  it("aborts a stalled provider request", async () => {
    await expect(dispatchProvider({
      endpoint: "https://sandbox.invalid/v1/chat/completions",
      masterKey: "master",
      assertion: "assertion",
      body: {},
      timeoutMs: 5,
      fetchImpl: async (_input, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      })
    })).rejects.toMatchObject({ name: "AbortError" });
  });
});
