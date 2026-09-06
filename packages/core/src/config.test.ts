import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const baseEnvironment = {
  DATABASE_URL: "postgresql://gateway:gateway@localhost:15432/gateway",
  API_KEY_PEPPER: "01234567890123456789012345678901",
  CONTROL_PLANE_ADMIN_TOKEN: "01234567890123456789012345678901",
  INTERNAL_ASSERTION_SECRET: "01234567890123456789012345678901",
  LITELLM_MASTER_KEY: "local-test-key"
};

describe("gateway configuration", () => {
  it("rejects production configuration with public registration enabled", () => {
    expect(() => loadConfig({ ...baseEnvironment, NODE_ENV: "production", INVITE_ONLY: "false" })).toThrow("INVITE_ONLY=true");
  });

  it("accepts production configuration when registration is invite-only", () => {
    expect(loadConfig({ ...baseEnvironment, NODE_ENV: "production", INVITE_ONLY: "true", RESEND_API_KEY: "re_test_key", MAIL_FROM: "no-reply@example.com", EDGE_ENABLE_DISPATCH: "true" }).INVITE_ONLY).toBe(true);
  });

  it("rejects production configuration without a configured mail provider", () => {
    expect(() => loadConfig({ ...baseEnvironment, NODE_ENV: "production", INVITE_ONLY: "true" })).toThrow("RESEND_API_KEY and MAIL_FROM");
  });

  it("rejects production configuration with Edge dispatch disabled", () => {
    expect(() => loadConfig({ ...baseEnvironment, NODE_ENV: "production", INVITE_ONLY: "true", RESEND_API_KEY: "re_test_key", MAIL_FROM: "no-reply@example.com", EDGE_ENABLE_DISPATCH: "false" })).toThrow("EDGE_ENABLE_DISPATCH=true");
  });

  it("keeps public registration available by default in development", () => {
    expect(loadConfig(baseEnvironment).INVITE_ONLY).toBe(false);
  });
});
