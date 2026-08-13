import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { acceptInvite, authenticateAccount, createInvite, createPasswordReset, createSession, createEmailVerification, destroySession, devMailer, loadSession, recordAudit, registerAccount, requireMembership, resetPassword, revokeApiKey, verifyEmail } from "@gateway/core";
import { query, withTransaction } from "@gateway/database";

declare module "fastify" {
  interface FastifyRequest {
    sessionAccount?: { accountId: string; email: string; displayName: string | null };
  }
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE_NAME = "console_session";

const authAttempts = new Map<string, { count: number; windowStart: number }>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 20;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || now - current.windowStart > AUTH_WINDOW_MS) {
    authAttempts.set(key, { count: 1, windowStart: now });
    return false;
  }
  current.count += 1;
  if (current.count > AUTH_MAX_ATTEMPTS) return true;
  return false;
}

function sessionId(request: FastifyRequest): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  return header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(`${COOKIE_NAME}=`.length);
}

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), displayName: z.string().trim().max(120).optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const createOrgSchema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/), workspaceName: z.string().trim().min(2).max(120), workspaceSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/), homeRegion: z.enum(["US", "EU", "APAC"]).default("US"), workspaceRegion: z.enum(["US", "EU", "APAC"]).default("US") });
const inviteSchema = z.object({ email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "MEMBER"]), workspaceId: z.string().uuid().optional() });
const listQuerySchema = z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(25), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() });

type PageCursor = { createdAt: string; id: string };

function decodeCursor(value: string | undefined): PageCursor | undefined {
  if (!value) return undefined;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const parsed = z.object({ createdAt: z.string().datetime({ offset: true }), id: z.string().uuid() }).safeParse(decoded);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function encodeCursor(row: { created_at: string; id: string }): string {
  return Buffer.from(JSON.stringify({ createdAt: new Date(row.created_at).toISOString(), id: row.id })).toString("base64url");
}

function parseListQuery(query: unknown): { limit: number; cursor?: PageCursor; from?: string; to?: string } | null {
  const parsed = listQuerySchema.safeParse(query);
  if (!parsed.success) return null;
  const cursor = decodeCursor(parsed.data.cursor);
  if (parsed.data.cursor && !cursor) return null;
  return { limit: parsed.data.limit, ...(cursor ? { cursor } : {}), ...(parsed.data.from ? { from: parsed.data.from } : {}), ...(parsed.data.to ? { to: parsed.data.to } : {}) };
}

export async function registerAccountRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/auth/register", async (request, reply) => {
    const key = `${request.ip ?? "unknown"}:${String(request.body && typeof request.body === "object" ? ((request.body as { email?: string }).email ?? "") : "")}`;
    if (rateLimited(key)) return reply.code(429).send({ error: "too_many_attempts" });
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const account = await registerAccount({ email: parsed.data.email, password: parsed.data.password, ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}) });
    return reply.code(201).send({ accountId: account.accountId, email: account.email });
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const key = `${request.ip ?? "unknown"}:${String(request.body && typeof request.body === "object" ? ((request.body as { email?: string }).email ?? "") : "")}`;
    if (rateLimited(key)) return reply.code(429).send({ error: "too_many_attempts" });
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const account = await authenticateAccount({ email: parsed.data.email, password: parsed.data.password });
    if (!account) return reply.code(401).send({ error: "invalid_credentials" });
    const sid = await createSession({ accountId: account.accountId, ttlMs: SESSION_TTL_MS });
    return reply.code(200).header("set-cookie", `${COOKIE_NAME}=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`).send({ authenticated: true });
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    const sid = sessionId(request);
    if (sid) await destroySession(sid);
    return reply.code(204).header("set-cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`).send();
  });

  app.get("/v1/auth/me", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const verified = await query<{ email_verified_at: string | null }>(`SELECT email_verified_at FROM accounts WHERE id=$1`, [session.account.accountId]);
    return reply.send({ accountId: session.account.accountId, email: session.account.email, displayName: session.account.displayName, emailVerified: Boolean(verified.rows[0]?.email_verified_at), memberships: session.account.memberships });
  });

  app.post("/v1/auth/request-email-verification", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const token = await createEmailVerification({ accountId: session.account.accountId, email: session.account.email, mailer: devMailer() });
    return reply.send({ sent: true, devToken: process.env["NODE_ENV"] === "production" ? undefined : token });
  });

  app.post("/v1/auth/verify-email", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = z.object({ token: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const ok = await verifyEmail(parsed.data.token, session.account.accountId);
    if (!ok) return reply.code(400).send({ error: "invalid_verification_token" });
    return reply.send({ verified: true });
  });

  app.post("/v1/auth/request-password-reset", async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const resetToken = await createPasswordReset({ email: parsed.data.email, mailer: devMailer() });
    return reply.send({ sent: true, devToken: process.env["NODE_ENV"] === "production" ? undefined : resetToken ?? "" });
  });

  app.post("/v1/auth/reset-password", async (request, reply) => {
    const parsed = z.object({ token: z.string().min(1), password: z.string().min(8) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const ok = await resetPassword(parsed.data.token, parsed.data.password);
    if (!ok) return reply.code(400).send({ error: "invalid_reset_token" });
    return reply.send({ reset: true });
  });

  app.post("/v1/account/organizations", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = createOrgSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const created = await withTransaction(async (client) => {
      const account = await client.query<{ id: string }>(`SELECT id FROM accounts WHERE id=$1`, [session.account.accountId]);
      if (!account.rows[0]) throw new Error("Account not found");
      const organization = await client.query<{ id: string }>(`INSERT INTO organizations (name, slug, home_region) VALUES ($1,$2,$3) RETURNING id`, [parsed.data.name, parsed.data.slug, parsed.data.homeRegion]);
      const orgId = organization.rows[0]?.id;
      if (!orgId) throw new Error("Organization creation failed");
      const workspace = await client.query<{ id: string }>(`INSERT INTO workspaces (organization_id, name, slug, allowed_region) VALUES ($1,$2,$3,$4) RETURNING id`, [orgId, parsed.data.workspaceName, parsed.data.workspaceSlug, parsed.data.workspaceRegion]);
      const workspaceId = workspace.rows[0]?.id;
      if (!workspaceId) throw new Error("Workspace creation failed");
      await client.query(`INSERT INTO memberships (organization_id, workspace_id, account_id, role) VALUES ($1,$2,$3,'OWNER')`, [orgId, workspaceId, session.account.accountId]);
      await client.query(`INSERT INTO wallets (organization_id, currency) VALUES ($1,'USD') ON CONFLICT DO NOTHING`, [orgId]);
      return { organizationId: orgId, workspaceId };
    });
    await recordAudit({ organizationId: created.organizationId, workspaceId: created.workspaceId, accountId: session.account.accountId, actorId: session.account.accountId, action: "organization.create", resourceType: "organization", resourceId: created.organizationId });
    return reply.code(201).send(created);
  });

  app.get("/v1/account/context", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const result = await query<{ organization_id: string; organization_name: string; workspace_id: string | null; workspace_name: string | null; role: string }>(
      `SELECT m.organization_id, o.name organization_name, m.workspace_id, w.name workspace_name, m.role
       FROM memberships m
       JOIN organizations o ON o.id=m.organization_id
       LEFT JOIN workspaces w ON w.id=m.workspace_id
       WHERE m.account_id=$1 ORDER BY o.created_at, w.created_at`,
      [session.account.accountId]
    );
    return reply.send({ memberships: result.rows });
  });

  app.post<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/invites", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = inviteSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const invite = await createInvite({ organizationId: request.params.orgId, workspaceId: parsed.data.workspaceId ?? null, email: parsed.data.email, role: parsed.data.role, invitedBy: session.account.accountId, ttlMs: 7 * 24 * 60 * 60 * 1000 });
    await recordAudit({ organizationId: request.params.orgId, workspaceId: parsed.data.workspaceId ?? null, accountId: session.account.accountId, actorId: session.account.accountId, action: "member.invite", resourceType: "invite", resourceId: invite.id, metadata: { email: parsed.data.email, role: parsed.data.role } });
    return reply.code(201).send({ inviteId: invite.id, token: invite.token });
  });

  app.post<{ Params: { orgId: string; inviteId: string } }>("/v1/account/organizations/:orgId/invites/:inviteId/revoke", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const result = await query(`UPDATE org_invites SET status='REVOKED' WHERE id=$1 AND organization_id=$2 AND status='PENDING' RETURNING id`, [request.params.inviteId, request.params.orgId]);
    if (!result.rows[0]) return reply.code(404).send({ error: "pending_invite_not_found" });
    await recordAudit({ organizationId: request.params.orgId, accountId: session.account.accountId, actorId: session.account.accountId, action: "member.invite_revoke", resourceType: "invite", resourceId: request.params.inviteId });
    return reply.code(204).send();
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/members", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const result = await query<{ account_id: string; email: string; role: string; workspace_id: string | null }>(
      `SELECT m.account_id, a.email, m.role, m.workspace_id FROM memberships m JOIN accounts a ON a.id=m.account_id WHERE m.organization_id=$1 ORDER BY a.email`,
      [request.params.orgId]
    );
    return reply.send({ members: result.rows });
  });

  app.post("/v1/account/invites/accept", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = z.object({ token: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const accepted = await acceptInvite({ token: parsed.data.token, accountId: session.account.accountId });
    if (!accepted) return reply.code(400).send({ error: "invalid_invite" });
    await recordAudit({ organizationId: accepted.organizationId, workspaceId: accepted.workspaceId, accountId: session.account.accountId, actorId: session.account.accountId, action: "member.invite_accept", resourceType: "invite", resourceId: accepted.inviteId, metadata: { role: accepted.role } });
    return reply.send(accepted);
  });

  app.post<{ Params: { orgId: string; workspaceId: string } }>("/v1/account/organizations/:orgId/workspaces/:workspaceId/api-keys", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = z.object({ name: z.string().trim().min(1).max(120), environment: z.enum(["live", "test"]).default("test") }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"], request.params.workspaceId));
    if (!allowed) return reply.code(403).send({ error: "workspace_access_required" });
    const pepper = process.env["API_KEY_PEPPER"];
    if (!pepper || pepper.length < 32) return reply.code(503).send({ error: "key_service_unconfigured" });
    const { generateApiKey } = await import("@gateway/core");
    const generated = generateApiKey(pepper, parsed.data.environment);
    const inserted = await withTransaction(async (client) => {
      const account = await client.query<{ id: string }>(`SELECT id FROM accounts WHERE id=$1`, [session.account.accountId]);
      if (!account.rows[0]) throw new Error("Account not found");
      const key = await client.query<{ id: string }>(
        `INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5) RETURNING id`,
        [request.params.workspaceId, session.account.accountId, parsed.data.name, generated.prefix, generated.hash]
      );
      return key.rows[0]?.id;
    });
    if (!inserted) return reply.code(500).send({ error: "key_creation_failed" });
    await recordAudit({ organizationId: request.params.orgId, workspaceId: request.params.workspaceId, accountId: session.account.accountId, actorId: session.account.accountId, action: "api_key.create", resourceType: "api_key", resourceId: inserted, metadata: { environment: parsed.data.environment } });
    return reply.code(201).send({ id: inserted, secret: generated.secret, prefix: generated.prefix });
  });

  app.get<{ Params: { orgId: string; workspaceId: string } }>("/v1/account/organizations/:orgId/workspaces/:workspaceId/api-keys", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"], request.params.workspaceId));
    if (!allowed) return reply.code(403).send({ error: "workspace_access_required" });
    const result = await query(`SELECT id, name, key_prefix, status, expires_at, last_used_at, created_at FROM api_keys WHERE workspace_id=$1 ORDER BY created_at DESC`, [request.params.workspaceId]);
    return reply.send({ keys: result.rows });
  });

  app.post<{ Params: { orgId: string; workspaceId: string; keyId: string } }>("/v1/account/organizations/:orgId/workspaces/:workspaceId/api-keys/:keyId/revoke", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"], request.params.workspaceId));
    if (!allowed) return reply.code(403).send({ error: "workspace_admin_required" });
    const revoked = await revokeApiKey(request.params.workspaceId, request.params.keyId);
    if (!revoked) return reply.code(404).send({ error: "api_key_not_found" });
    await recordAudit({ organizationId: request.params.orgId, workspaceId: request.params.workspaceId, accountId: session.account.accountId, actorId: session.account.accountId, action: "api_key.revoke", resourceType: "api_key", resourceId: request.params.keyId });
    return reply.code(204).send();
  });

  app.get<{ Params: { orgId: string; workspaceId: string } }>("/v1/account/organizations/:orgId/workspaces/:workspaceId/models", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"], request.params.workspaceId));
    if (!allowed) return reply.code(403).send({ error: "workspace_access_required" });
    const result = await query(`SELECT mp.public_name, mp.display_name, mp.default_max_output_tokens, me.billing_mode, pr.region route_region, pr.provider, pr.provider_model FROM model_entitlements me JOIN model_products mp ON mp.id=me.model_product_id JOIN provider_routes pr ON pr.model_product_id=mp.id WHERE me.workspace_id=$1 AND me.enabled AND mp.active AND pr.status='APPROVED' AND pr.resale_approved AND pr.dpa_approved AND pr.security_approved AND pr.residency_approved AND NOT pr.kill_switch ORDER BY mp.public_name, pr.priority`, [request.params.workspaceId]);
    return reply.send({ models: result.rows });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/usage", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const result = await query(`SELECT count(DISTINCT lr.id)::text request_count, count(DISTINCT lr.id) FILTER (WHERE lr.status='SETTLED')::text settled_count, coalesce(sum(cc.amount_usd),0)::text charged_usd FROM logical_requests lr LEFT JOIN customer_charges cc ON cc.request_id=lr.id WHERE lr.organization_id=$1`, [request.params.orgId]);
    return reply.send({ usage: result.rows[0] ?? { request_count: "0", settled_count: "0", charged_usd: "0" } });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/billing/wallet", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const result = await query(`SELECT currency, available_balance::text, reserved_balance::text, status FROM wallets WHERE organization_id=$1 ORDER BY currency`, [request.params.orgId]);
    return reply.send({ wallets: result.rows });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const result = await query(`SELECT id, name, slug, status, billing_email, home_region, stripe_customer_id, created_at FROM organizations WHERE id=$1`, [request.params.orgId]);
    if (!result.rows[0]) return reply.code(404).send({ error: "organization_not_found" });
    return reply.send({ organization: result.rows[0] });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/workspaces", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const result = await query(`SELECT id, name, slug, environment, allowed_region, retention_mode, created_at FROM workspaces WHERE organization_id=$1 ORDER BY created_at`, [request.params.orgId]);
    return reply.send({ workspaces: result.rows });
  });

  app.post<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/workspaces", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const parsed = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/), region: z.enum(["US", "EU", "APAC"]).default("US") }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const created = await withTransaction(async (client) => {
      const workspace = await client.query<{ id: string }>(`INSERT INTO workspaces (organization_id, name, slug, allowed_region) VALUES ($1,$2,$3,$4) RETURNING id`, [request.params.orgId, parsed.data.name, parsed.data.slug, parsed.data.region]);
      const workspaceId = workspace.rows[0]?.id;
      if (!workspaceId) throw new Error("Workspace creation failed");
      await client.query(`INSERT INTO memberships (organization_id, workspace_id, account_id, role) VALUES ($1,$2,$3,'OWNER')`, [request.params.orgId, workspaceId, session.account.accountId]);
      return { workspaceId };
    });
    await recordAudit({ organizationId: request.params.orgId, workspaceId: created.workspaceId, accountId: session.account.accountId, actorId: session.account.accountId, action: "workspace.create", resourceType: "workspace", resourceId: created.workspaceId });
    return reply.code(201).send(created);
  });

  app.get<{ Params: { orgId: string }; Querystring: { cursor?: string; limit?: string; from?: string; to?: string } }>("/v1/account/organizations/:orgId/invites", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const list = parseListQuery(request.query);
    if (!list) return reply.code(400).send({ error: "invalid_pagination" });
    const values: unknown[] = [request.params.orgId]; const filters = ["organization_id=$1"];
    if (list.from) { values.push(list.from); filters.push(`created_at >= $${values.length}`); }
    if (list.to) { values.push(list.to); filters.push(`created_at < $${values.length}`); }
    if (list.cursor) { values.push(list.cursor.createdAt, list.cursor.id); filters.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`); }
    values.push(list.limit + 1);
    const result = await query(`SELECT id, email, role, workspace_id, CASE WHEN status='PENDING' AND expires_at <= now() THEN 'EXPIRED' ELSE status END status, expires_at, created_at FROM org_invites WHERE ${filters.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT $${values.length}`, values);
    const rows = result.rows as Array<{ created_at: string; id: string }>;
    const hasMore = rows.length > list.limit; const invites = hasMore ? rows.slice(0, list.limit) : rows;
    return reply.send({ invites, nextCursor: hasMore ? encodeCursor(invites[invites.length - 1]!) : null });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/audit", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const { listAudit } = await import("@gateway/core");
    const events = await listAudit({ organizationId: request.params.orgId, limit: 200 });
    return reply.send({ events });
  });

  app.get<{ Params: { orgId: string }; Querystring: { cursor?: string; limit?: string; from?: string; to?: string; status?: string; region?: string } }>("/v1/account/organizations/:orgId/usage/details", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const list = parseListQuery(request.query);
    if (!list) return reply.code(400).send({ error: "invalid_pagination" });
    const values: unknown[] = [request.params.orgId]; const filters = ["lr.organization_id=$1"];
    const queryInput = request.query;
    if (queryInput.from) { values.push(queryInput.from); filters.push(`lr.created_at >= $${values.length}`); }
    if (queryInput.to) { values.push(queryInput.to); filters.push(`lr.created_at < $${values.length}`); }
    if (queryInput.status) { values.push(queryInput.status); filters.push(`lr.status = $${values.length}`); }
    if (queryInput.region) { values.push(queryInput.region); filters.push(`lr.region = $${values.length}`); }
    if (list.cursor) { values.push(list.cursor.createdAt, list.cursor.id); filters.push(`(lr.created_at, lr.id) < ($${values.length - 1}, $${values.length})`); }
    values.push(list.limit + 1);
    const result = await query(`SELECT lr.id, lr.status, lr.billing_mode, lr.region, lr.created_at, lr.completed_at, coalesce(cc.amount_usd,0)::text amount_usd FROM logical_requests lr LEFT JOIN customer_charges cc ON cc.request_id=lr.id WHERE ${filters.join(" AND ")} ORDER BY lr.created_at DESC, lr.id DESC LIMIT $${values.length}`, values);
    const rows = result.rows as Array<{ created_at: string; id: string }>; const hasMore = rows.length > list.limit; const requests = hasMore ? rows.slice(0, list.limit) : rows;
    return reply.send({ requests, nextCursor: hasMore ? encodeCursor(requests[requests.length - 1]!) : null });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/billing/plans", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const result = await query(`SELECT id, name, currency, unit_amount, billing_interval, description FROM billing_plans WHERE active ORDER BY unit_amount`, []);
    return reply.send({ plans: result.rows });
  });

  app.get<{ Params: { orgId: string }; Querystring: { cursor?: string; limit?: string; from?: string; to?: string } }>("/v1/account/organizations/:orgId/billing/payments", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const list = parseListQuery(request.query);
    if (!list) return reply.code(400).send({ error: "invalid_pagination" });
    const values: unknown[] = [request.params.orgId]; const filters = ["organization_id=$1"];
    if (list.from) { values.push(list.from); filters.push(`received_at >= $${values.length}`); }
    if (list.to) { values.push(list.to); filters.push(`received_at < $${values.length}`); }
    if (list.cursor) { values.push(list.cursor.createdAt, list.cursor.id); filters.push(`(received_at, id) < ($${values.length - 1}, $${values.length})`); }
    values.push(list.limit + 1);
    const result = await query(`SELECT id, amount_cents, currency, status, received_at FROM payment_projections WHERE ${filters.join(" AND ")} ORDER BY received_at DESC, id DESC LIMIT $${values.length}`, values);
    const rows = result.rows as Array<{ received_at: string; id: string }>; const hasMore = rows.length > list.limit; const payments = hasMore ? rows.slice(0, list.limit) : rows;
    return reply.send({ payments, nextCursor: hasMore ? encodeCursor({ created_at: payments[payments.length - 1]!.received_at, id: payments[payments.length - 1]!.id }) : null });
  });

  app.get<{ Params: { orgId: string }; Querystring: { cursor?: string; limit?: string; from?: string; to?: string } }>("/v1/account/organizations/:orgId/billing/ledger", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const list = parseListQuery(request.query);
    if (!list) return reply.code(400).send({ error: "invalid_pagination" });
    const values: unknown[] = [request.params.orgId]; const filters = ["lt.organization_id=$1"];
    if (list.from) { values.push(list.from); filters.push(`le.created_at >= $${values.length}`); }
    if (list.to) { values.push(list.to); filters.push(`le.created_at < $${values.length}`); }
    if (list.cursor) { values.push(list.cursor.createdAt, list.cursor.id); filters.push(`(le.created_at, le.id) < ($${values.length - 1}, $${values.length})`); }
    values.push(list.limit + 1);
    const entries = await query(
      `SELECT le.id, lt.type, lt.idempotency_key, lt.reference_type, lt.reference_id, lt.description, le.direction, le.amount, le.currency, le.created_at
       FROM ledger_transactions lt JOIN ledger_entries le ON le.transaction_id=lt.id
       WHERE ${filters.join(" AND ")} ORDER BY le.created_at DESC, le.id DESC LIMIT $${values.length}`,
      values
    );
    const rows = entries.rows as Array<{ created_at: string; id: string }>; const hasMore = rows.length > list.limit; const page = hasMore ? rows.slice(0, list.limit) : rows;
    return reply.send({ entries: page, nextCursor: hasMore ? encodeCursor(page[page.length - 1]!) : null });
  });

  app.post<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/billing/dev-credit", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    if (process.env["NODE_ENV"] === "production") return reply.code(403).send({ error: "dev_credit_disabled_in_production" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const parsed = z.object({ amountUsd: z.string().regex(/^\d+(\.\d{1,8})?$/) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const { creditWalletFromPayment } = await import("@gateway/core");
    const devCreditResult = await creditWalletFromPayment({ organizationId: request.params.orgId, amountUsd: parsed.data.amountUsd, currency: "USD", source: "dev_credit", sourceEventId: `dev:${randomUUID()}` });
    return reply.code(201).send({ credited: devCreditResult.credited, ledgerTransactionId: devCreditResult.ledgerTransactionId });
  });

  app.post<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/billing/checkout", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN"]));
    if (!allowed) return reply.code(403).send({ error: "organization_admin_required" });
    const parsed = z.object({ planId: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const plan = await query<{ id: string; stripe_price_id: string | null; unit_amount: number }>(`SELECT id, stripe_price_id, unit_amount FROM billing_plans WHERE id=$1 AND active`, [parsed.data.planId]);
    const planRow = plan.rows[0];
    if (!planRow) return reply.code(404).send({ error: "plan_not_found" });
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) {
      const sub = await query<{ id: string }>(`INSERT INTO subscriptions (organization_id, plan_id, status, current_period_end) VALUES ($1,$2,'ACTIVE', now() + interval '1 month') RETURNING id`, [request.params.orgId, planRow.id]);
      await recordAudit({ organizationId: request.params.orgId, accountId: session.account.accountId, actorId: session.account.accountId, action: "subscription.dev_subscribe", resourceType: "subscription", resourceId: sub.rows[0]?.id ?? null, metadata: { planId: planRow.id } });
      return reply.code(201).send({ mode: "dev", subscriptionId: sub.rows[0]?.id, planId: planRow.id });
    }
    const { createStripeClient } = await import("@gateway/core");
    const stripe = createStripeClient({ secretKey });
    const priceId = planRow.stripe_price_id;
    if (!priceId) return reply.code(409).send({ error: "plan_not_configured_for_stripe" });
    const origin = process.env["CONSOLE_BASE_URL"] ?? "http://127.0.0.1:4200";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
      metadata: { organization_id: request.params.orgId, plan_id: planRow.id }
    });
    return reply.send({ mode: "stripe", url: checkoutSession.url });
  });

  app.get<{ Params: { orgId: string } }>("/v1/account/organizations/:orgId/billing/subscription", async (request, reply) => {
    const sid = sessionId(request);
    const session = sid ? await loadSession(sid) : null;
    if (!session) return reply.code(401).send({ error: "console_authentication_required" });
    const allowed = await withTransaction((client) => requireMembership(client, session.account.accountId, request.params.orgId, ["OWNER", "ADMIN", "MEMBER"]));
    if (!allowed) return reply.code(403).send({ error: "organization_access_required" });
    const sub = await query(`SELECT id, plan_id, stripe_subscription_id, status, current_period_end, created_at FROM subscriptions WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 1`, [request.params.orgId]);
    return reply.send({ subscription: sub.rows[0] ?? null });
  });
}
