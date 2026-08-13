import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "@gateway/database";
import { buildControlPlane } from "./app.js";

const integrationEnabled = process.env["RUN_INTEGRATION_TESTS"] === "true" && Boolean(process.env["DATABASE_URL"]);
const previousPepper = process.env["API_KEY_PEPPER"];

describe.skipIf(!integrationEnabled)("account auth integration", () => {
  let app: ReturnType<typeof buildControlPlane>;
  let cookie: string | undefined;
  const email = `auth-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(() => {
    process.env["API_KEY_PEPPER"] = "01234567890123456789012345678901";
  });

  afterAll(async () => {
    if (previousPepper === undefined) delete process.env["API_KEY_PEPPER"];
    else process.env["API_KEY_PEPPER"] = previousPepper;
    await app?.close();
    await database.end();
  });

  it("registers, logs in, creates an organization, and issues a key", async () => {
    app = buildControlPlane();
    const register = await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email, password: "password123", displayName: "Auth Test" } });
    expect(register.statusCode).toBe(201);

    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password: "password123" } });
    expect(login.statusCode).toBe(200);
    const setCookieRaw = login.headers["set-cookie"];
    const setCookie = Array.isArray(setCookieRaw) ? setCookieRaw[0] : setCookieRaw;
    expect(setCookie).toContain("HttpOnly");
    cookie = setCookie?.split(";")[0];

    const me = await app.inject({ method: "GET", url: "/v1/auth/me", headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(email);

    const org = await app.inject({ method: "POST", url: "/v1/account/organizations", headers: { cookie }, payload: { name: "Auth Org", slug: `auth-${randomUUID().slice(0, 8)}`, workspaceName: "Default", workspaceSlug: "default" } });
    expect(org.statusCode).toBe(201);
    const orgBody = org.json();
    expect(orgBody.organizationId).toBeTruthy();
    expect(orgBody.workspaceId).toBeTruthy();

    const keyResponse = await app.inject({ method: "POST", url: `/v1/account/organizations/${orgBody.organizationId}/workspaces/${orgBody.workspaceId}/api-keys`, headers: { cookie }, payload: { name: "test", environment: "test" } });
    expect(keyResponse.statusCode).toBe(201);
    expect(keyResponse.json().secret).toMatch(/^sk_test_/);

    const unauth = await app.inject({ method: "GET", url: "/v1/auth/me" });
    expect(unauth.statusCode).toBe(401);
  });

  it("verifies email and resets a password", async () => {
    if (!app) app = buildControlPlane();
    const tokenEmail = `verify-${randomUUID().slice(0, 8)}@example.com`;
    await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: tokenEmail, password: "password123" } });
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: tokenEmail, password: "password123" } });
    const setCookieRaw = login.headers["set-cookie"];
    const setCookie = Array.isArray(setCookieRaw) ? setCookieRaw[0] : setCookieRaw;
    const verifyCookie = setCookie?.split(";")[0];

    const verifyReq = await app.inject({ method: "POST", url: "/v1/auth/request-email-verification", headers: { cookie: verifyCookie } });
    expect(verifyReq.statusCode).toBe(200);
    const devToken = verifyReq.json().devToken as string;
    expect(devToken).toBeTruthy();
    const verify = await app.inject({ method: "POST", url: "/v1/auth/verify-email", headers: { cookie: verifyCookie }, payload: { token: devToken } });
    expect(verify.statusCode).toBe(200);
    expect(verify.json().verified).toBe(true);

    const resetReq = await app.inject({ method: "POST", url: "/v1/auth/request-password-reset", payload: { email: tokenEmail } });
    expect(resetReq.statusCode).toBe(200);
    const resetToken = resetReq.json().devToken as string;
    expect(resetToken).toBeTruthy();
    const reset = await app.inject({ method: "POST", url: "/v1/auth/reset-password", payload: { token: resetToken, password: "newpassword123" } });
    expect(reset.statusCode).toBe(200);
    const relogin = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: tokenEmail, password: "newpassword123" } });
    expect(relogin.statusCode).toBe(200);
  });

  it("activates a dev subscription", async () => {
    if (!app) app = buildControlPlane();
    const subEmail = `sub-${randomUUID().slice(0, 8)}@example.com`;
    await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: subEmail, password: "password123" } });
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: subEmail, password: "password123" } });
    const setCookieRaw = login.headers["set-cookie"];
    const setCookie = Array.isArray(setCookieRaw) ? setCookieRaw[0] : setCookieRaw;
    const subCookie = setCookie?.split(";")[0];
    const org = await app.inject({ method: "POST", url: "/v1/account/organizations", headers: { cookie: subCookie }, payload: { name: "Sub Org", slug: `sub-${randomUUID().slice(0, 8)}`, workspaceName: "Default", workspaceSlug: "default" } });
    const orgId = org.json().organizationId as string;
    const checkout = await app.inject({ method: "POST", url: `/v1/account/organizations/${orgId}/billing/checkout`, headers: { cookie: subCookie }, payload: { planId: "starter" } });
    expect(checkout.statusCode).toBe(201);
    expect(checkout.json().mode).toBe("dev");
    const subscription = await app.inject({ method: "GET", url: `/v1/account/organizations/${orgId}/billing/subscription`, headers: { cookie: subCookie } });
    expect(subscription.statusCode).toBe(200);
    expect(subscription.json().subscription.status).toBe("ACTIVE");
  });

  it("enforces pagination boundaries and invite revocation", async () => {
    if (!app) app = buildControlPlane();
    const ownerEmail = `owner-${randomUUID().slice(0, 8)}@example.com`;
    const inviteeEmail = `invitee-${randomUUID().slice(0, 8)}@example.com`;
    await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: ownerEmail, password: "password123" } });
    await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: inviteeEmail, password: "password123" } });
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: ownerEmail, password: "password123" } });
    const setCookieRaw = login.headers["set-cookie"];
    const ownerCookie = (Array.isArray(setCookieRaw) ? setCookieRaw[0] : setCookieRaw)?.split(";")[0];
    const org = await app.inject({ method: "POST", url: "/v1/account/organizations", headers: { cookie: ownerCookie }, payload: { name: "Invite Org", slug: `invite-${randomUUID().slice(0, 8)}`, workspaceName: "Default", workspaceSlug: "default" } });
    const orgBody = org.json() as { organizationId: string; workspaceId: string };

    const invalidPage = await app.inject({ method: "GET", url: `/v1/account/organizations/${orgBody.organizationId}/usage/details?limit=101`, headers: { cookie: ownerCookie } });
    expect(invalidPage.statusCode).toBe(400);
    const invite = await app.inject({ method: "POST", url: `/v1/account/organizations/${orgBody.organizationId}/invites`, headers: { cookie: ownerCookie }, payload: { email: inviteeEmail, role: "MEMBER", workspaceId: orgBody.workspaceId } });
    expect(invite.statusCode).toBe(201);
    const inviteBody = invite.json() as { inviteId: string; token: string };
    const list = await app.inject({ method: "GET", url: `/v1/account/organizations/${orgBody.organizationId}/invites?limit=1`, headers: { cookie: ownerCookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().invites[0].status).toBe("PENDING");
    const revoked = await app.inject({ method: "POST", url: `/v1/account/organizations/${orgBody.organizationId}/invites/${inviteBody.inviteId}/revoke`, headers: { cookie: ownerCookie } });
    expect(revoked.statusCode).toBe(204);

    const inviteeLogin = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: inviteeEmail, password: "password123" } });
    const inviteeCookieRaw = inviteeLogin.headers["set-cookie"];
    const inviteeCookie = (Array.isArray(inviteeCookieRaw) ? inviteeCookieRaw[0] : inviteeCookieRaw)?.split(";")[0];
    const accepted = await app.inject({ method: "POST", url: "/v1/account/invites/accept", headers: { cookie: inviteeCookie }, payload: { token: inviteBody.token } });
    expect(accepted.statusCode).toBe(400);
  });
});
