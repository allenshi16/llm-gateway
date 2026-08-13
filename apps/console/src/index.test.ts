import { createServer, request } from "node:http";
import { describe, expect, it } from "vitest";
import { createConsoleServer } from "./index.js";

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method: "GET" }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end();
  });
}

describe("console", () => {
  it("serves the console page", async () => {
    const server = createConsoleServer({ controlPlaneUrl: "http://127.0.0.1:9" });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");
    try {
      const home = await get(address.port, "/");
      expect(home.status).toBe(200);
      expect(home.body).toContain("LLM Gateway");
      const script = home.body.match(/<script>([\s\S]*?)<\/script>/);
      expect(script).toBeTruthy();
      expect(() => new Function(script?.[1] ?? "")).not.toThrow();
      const blocked = await get(address.port, "/api/not-allowed");
      expect(blocked.status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("forwards allowed paths upstream", async () => {
    const upstream = createServer((_req, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", () => resolve()));
    const upAddress = upstream.address();
    if (!upAddress || typeof upAddress === "string") throw new Error("upstream did not bind");
    const server = createConsoleServer({ controlPlaneUrl: `http://127.0.0.1:${upAddress.port}` });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");
    try {
      const allowed = await get(address.port, "/api/v1/auth/me");
      expect(allowed.status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()));
    }
  });
});