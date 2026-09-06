import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database, query } from "@gateway/database";
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

  it("requires and consumes a matching invitation when invite-only mode is enabled", async () => {
    if (!app) app = buildControlPlane();
    const previousInviteOnly = process.env["INVITE_ONLY"];
    try {
      const ownerEmail = `invite-owner-${randomUUID().slice(0, 8)}@example.com`;
      const inviteeEmail = `invite-user-${randomUUID().slice(0, 8)}@example.com`;
      await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: ownerEmail, password: "password123" } });
      const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: ownerEmail, password: "password123" } });
      const setCookieRaw = login.headers["set-cookie"];
      const ownerCookie = (Array.isArray(setCookieRaw) ? setCookieRaw[0] : setCookieRaw)?.split(";")[0];
      const org = await app.inject({ method: "POST", url: "/v1/account/organizations", headers: { cookie: ownerCookie }, payload: { name: "Invite Only Org", slug: `invite-only-${randomUUID().slice(0, 8)}`, workspaceName: "Default", workspaceSlug: "default" } });
      const orgBody = org.json() as { organizationId: string; workspaceId: string };
      const invite = await app.inject({ method: "POST", url: `/v1/account/organizations/${orgBody.organizationId}/invites`, headers: { cookie: ownerCookie }, payload: { email: inviteeEmail, role: "MEMBER", workspaceId: orgBody.workspaceId } });
      const inviteToken = invite.json().token as string;
      process.env["INVITE_ONLY"] = "true";

      const blockedEmail = `blocked-${randomUUID().slice(0, 8)}@example.com`;
      const blocked = await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: blockedEmail, password: "password123" } });
      expect(blocked.statusCode).toBe(403);
      expect(blocked.json()).toEqual({ error: "invitation_required" });

      const mismatch = await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: `other-${randomUUID().slice(0, 8)}@example.com`, password: "password123", inviteToken } });
      expect(mismatch.statusCode).toBe(400);
      expect(mismatch.json()).toEqual({ error: "invite_email_mismatch" });

      const registered = await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: inviteeEmail, password: "password123", inviteToken } });
      expect(registered.statusCode).toBe(201);
      const contextLogin = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: inviteeEmail, password: "password123" } });
      const contextCookieRaw = contextLogin.headers["set-cookie"];
      const contextCookie = (Array.isArray(contextCookieRaw) ? contextCookieRaw[0] : contextCookieRaw)?.split(";")[0];
      const context = await app.inject({ method: "GET", url: "/v1/account/context", headers: { cookie: contextCookie } });
      expect(context.statusCode).toBe(200);
      expect(context.json().memberships).toEqual([expect.objectContaining({ organization_id: orgBody.organizationId, workspace_id: orgBody.workspaceId, role: "MEMBER" })]);

      const reused = await app.inject({ method: "POST", url: "/v1/auth/register", payload: { email: `reuse-${randomUUID().slice(0, 8)}@example.com`, password: "password123", inviteToken } });
      expect(reused.statusCode).toBe(400);
      expect(reused.json()).toEqual({ error: "invalid_invitation" });
    } finally {
      if (previousInviteOnly === undefined) delete process.env["INVITE_ONLY"];
      else process.env["INVITE_ONLY"] = previousInviteOnly;
    }
  });

  it("grants promotional credit once for the same source event", async () => {
    if (!app) app = buildControlPlane();
    const previousToken = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
    process.env["CONTROL_PLANE_ADMIN_TOKEN"] = "integration-admin-token";
    try {
      const organization = await app.inject({ method: "POST", url: "/v1/organizations", headers: { authorization: "Bearer integration-admin-token" }, payload: { name: "Trial Credit Org", slug: `trial-credit-${randomUUID().slice(0, 8)}`, ownerEmail: `trial-credit-${randomUUID().slice(0, 8)}@example.com`, workspaceName: "Default", workspaceSlug: "default" } });
      const organizationId = (organization.json() as { organizationId: string }).organizationId;
      const first = await app.inject({ method: "POST", url: `/v1/admin/organizations/${organizationId}/promotional-credit`, headers: { authorization: "Bearer integration-admin-token" }, payload: { amountUsd: "5.00", sourceEventId: `trial-${randomUUID()}` } });
      expect(first.statusCode).toBe(201);
      expect(first.json().credited).toBe(true);
      const sourceEventId = `trial-replay-${randomUUID()}`;
      const grant = { amountUsd: "2.50", sourceEventId };
      const credited = await app.inject({ method: "POST", url: `/v1/admin/organizations/${organizationId}/promotional-credit`, headers: { authorization: "Bearer integration-admin-token" }, payload: grant });
      const replay = await app.inject({ method: "POST", url: `/v1/admin/organizations/${organizationId}/promotional-credit`, headers: { authorization: "Bearer integration-admin-token" }, payload: grant });
      expect(credited.statusCode).toBe(201);
      expect(replay.statusCode).toBe(200);
      expect(replay.json()).toEqual({ credited: false, ledgerTransactionId: credited.json().ledgerTransactionId });
      const wallet = await app.inject({ method: "GET", url: `/v1/organizations/${organizationId}/billing`, headers: { authorization: "Bearer integration-admin-token" } });
      expect(Number(wallet.json().wallets[0].available_balance)).toBe(7.5);
      const creditAudit = await query<{ action: string }>(`SELECT action FROM audit_events WHERE organization_id=$1 AND action='billing.promotional_credit'`, [organizationId]);
      expect(creditAudit.rows).toHaveLength(3);
      const secondOrganization = await app.inject({ method: "POST", url: "/v1/organizations", headers: { authorization: "Bearer integration-admin-token" }, payload: { name: "Second Trial Org", slug: `second-trial-${randomUUID().slice(0, 8)}`, ownerEmail: `second-trial-${randomUUID().slice(0, 8)}@example.com`, workspaceName: "Default", workspaceSlug: "default" } });
      const secondOrganizationId = (secondOrganization.json() as { organizationId: string }).organizationId;
      const crossOrganizationReplay = await app.inject({ method: "POST", url: `/v1/admin/organizations/${secondOrganizationId}/promotional-credit`, headers: { authorization: "Bearer integration-admin-token" }, payload: grant });
      expect(crossOrganizationReplay.statusCode).toBe(409);
      expect(crossOrganizationReplay.json()).toEqual({ error: "promotional_credit_source_conflict" });
      const ledger = await app.inject({ method: "GET", url: `/v1/account/organizations/${organizationId}/billing/ledger`, headers: { cookie: "invalid" } });
      expect(ledger.statusCode).toBe(401);
    } finally {
      if (previousToken === undefined) delete process.env["CONTROL_PLANE_ADMIN_TOKEN"];
      else process.env["CONTROL_PLANE_ADMIN_TOKEN"] = previousToken;
    }
  });

  it("grants and revokes only an approved model entitlement", async () => {
    if (!app) app = buildControlPlane();
    const previousToken = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
    process.env["CONTROL_PLANE_ADMIN_TOKEN"] = "integration-admin-token";
    try {
      const organization = await app.inject({ method: "POST", url: "/v1/organizations", headers: { authorization: "Bearer integration-admin-token" }, payload: { name: "Model Trial Org", slug: `model-trial-${randomUUID().slice(0, 8)}`, ownerEmail: `model-trial-${randomUUID().slice(0, 8)}@example.com`, workspaceName: "Default", workspaceSlug: "default" } });
      const { organizationId, workspaceId } = organization.json() as { organizationId: string; workspaceId: string };
      const model = await query<{ id: string }>(`INSERT INTO model_products (public_name, display_name, default_max_output_tokens) VALUES ($1,$2,$3) RETURNING id`, [`trial-model-${randomUUID().slice(0, 8)}`, "Trial Model", 4096]);
      const modelId = model.rows[0]?.id;
      if (!modelId) throw new Error("model fixture creation failed");
      await query(`INSERT INTO provider_routes (model_product_id, provider, provider_model, region, endpoint, status, resale_approved, dpa_approved, security_approved, residency_approved, zero_retention, kill_switch) VALUES ($1,'test-provider','trial-model','US','http://127.0.0.1:4302/v1/chat/completions','APPROVED',true,true,true,true,true,false)`, [modelId]);
      await query(`INSERT INTO price_versions (model_product_id, version, input_per_million, output_per_million, effective_from) VALUES ($1,1,1,1,now())`, [modelId]);

      const granted = await app.inject({ method: "POST", url: `/v1/admin/workspaces/${workspaceId}/model-entitlements`, headers: { authorization: "Bearer integration-admin-token" }, payload: { modelPublicName: (await query<{ public_name: string }>(`SELECT public_name FROM model_products WHERE id=$1`, [modelId])).rows[0]?.public_name, billingMode: "PROMOTIONAL" } });
      expect(granted.statusCode).toBe(201);
      expect(granted.json()).toMatchObject({ workspaceId, modelProductId: modelId, billingMode: "PROMOTIONAL", enabled: true });
      const replay = await app.inject({ method: "POST", url: `/v1/admin/workspaces/${workspaceId}/model-entitlements`, headers: { authorization: "Bearer integration-admin-token" }, payload: { modelPublicName: granted.json().publicName, billingMode: "PROMOTIONAL" } });
      expect(replay.statusCode).toBe(200);
      const revoked = await app.inject({ method: "DELETE", url: `/v1/admin/workspaces/${workspaceId}/model-entitlements/${modelId}`, headers: { authorization: "Bearer integration-admin-token" } });
      expect(revoked.statusCode).toBe(204);
      const models = await app.inject({ method: "GET", url: `/v1/workspaces/${workspaceId}/models`, headers: { authorization: "Bearer integration-admin-token" } });
      expect(models.json().models).toEqual([]);
      const modelAudit = await query<{ action: string }>(`SELECT action FROM audit_events WHERE organization_id=$1 AND resource_type='model_entitlement' ORDER BY created_at`, [organizationId]);
      expect(modelAudit.rows.map((row) => row.action)).toEqual(["model_entitlement.grant", "model_entitlement.enable", "model_entitlement.revoke"]);
      expect(organizationId).toBeTruthy();
    } finally {
      if (previousToken === undefined) delete process.env["CONTROL_PLANE_ADMIN_TOKEN"];
      else process.env["CONTROL_PLANE_ADMIN_TOKEN"] = previousToken;
    }
  });

  it("allows trial operators to suspend and restore an organization", async () => {
    if (!app) app = buildControlPlane();
    const previousToken = process.env["CONTROL_PLANE_ADMIN_TOKEN"];
    process.env["CONTROL_PLANE_ADMIN_TOKEN"] = "integration-admin-token";
    try {
      const organization = await app.inject({ method: "POST", url: "/v1/organizations", headers: { authorization: "Bearer integration-admin-token" }, payload: { name: "Status Trial Org", slug: `status-trial-${randomUUID().slice(0, 8)}`, ownerEmail: `status-trial-${randomUUID().slice(0, 8)}@example.com`, workspaceName: "Default", workspaceSlug: "default" } });
      const organizationId = (organization.json() as { organizationId: string }).organizationId;
      const suspended = await app.inject({ method: "PATCH", url: `/v1/admin/organizations/${organizationId}/status`, headers: { authorization: "Bearer integration-admin-token" }, payload: { status: "SUSPENDED" } });
      expect(suspended.statusCode).toBe(200);
      expect(suspended.json()).toEqual({ organizationId, status: "SUSPENDED" });
      const restored = await app.inject({ method: "PATCH", url: `/v1/admin/organizations/${organizationId}/status`, headers: { authorization: "Bearer integration-admin-token" }, payload: { status: "ACTIVE" } });
      expect(restored.statusCode).toBe(200);
      expect(restored.json()).toEqual({ organizationId, status: "ACTIVE" });
      const audit = await query<{ action: string }>(`SELECT action FROM audit_events WHERE organization_id=$1 AND resource_type='organization' ORDER BY created_at DESC LIMIT 2`, [organizationId]);
      expect(audit.rows.map((row) => row.action).sort()).toEqual(["organization.status_active", "organization.status_suspended"].sort());
    } finally {
      if (previousToken === undefined) delete process.env["CONTROL_PLANE_ADMIN_TOKEN"];
      else process.env["CONTROL_PLANE_ADMIN_TOKEN"] = previousToken;
    }
  });
});
