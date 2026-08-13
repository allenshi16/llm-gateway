import { randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@gateway/database";
import { hashPassword, verifyPassword } from "./password.js";

export interface AccountContext {
  accountId: string;
  email: string;
  displayName: string | null;
  memberships: Array<{ organizationId: string; workspaceId: string | null; role: string }>;
}

export interface SessionContext {
  sessionId: string;
  account: AccountContext;
}

export async function registerAccount(input: { email: string; password: string; displayName?: string }): Promise<{ accountId: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters");
  const passwordHash = hashPassword(input.password);
  const result = await query<{ id: string }>(
    `INSERT INTO accounts (email, display_name, password_hash) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, input.displayName?.trim() || null, passwordHash]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Account already exists");
  return { accountId: row.id, email };
}

export async function authenticateAccount(input: { email: string; password: string }): Promise<{ accountId: string; email: string } | null> {
  const email = input.email.trim().toLowerCase();
  const result = await query<{ id: string; password_hash: string | null }>(`SELECT id, password_hash FROM accounts WHERE email=$1`, [email]);
  const row = result.rows[0];
  if (!row || !verifyPassword(input.password, row.password_hash)) return null;
  return { accountId: row.id, email };
}

export async function createSession(input: { accountId: string; userAgent?: string; ip?: string; ttlMs: number }): Promise<string> {
  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + input.ttlMs);
  await query(
    `INSERT INTO auth_sessions (id, account_id, expires_at, user_agent, ip) VALUES ($1,$2,$3,$4,$5)`,
    [sessionId, input.accountId, expiresAt, input.userAgent?.slice(0, 300) ?? null, input.ip?.slice(0, 64) ?? null]
  );
  return sessionId;
}

export async function destroySession(sessionId: string): Promise<void> {
  await query(`DELETE FROM auth_sessions WHERE id=$1`, [sessionId]);
}

export async function loadSession(sessionId: string): Promise<SessionContext | null> {
  return withTransaction(async (client) => {
    const session = await client.query<{ account_id: string; expires_at: Date }>(
      `SELECT account_id, expires_at FROM auth_sessions WHERE id=$1 AND expires_at > now()`,
      [sessionId]
    );
    const row = session.rows[0];
    if (!row) return null;
    await client.query(`UPDATE auth_sessions SET last_used_at=now() WHERE id=$1`, [sessionId]);
    const account = await client.query<{ id: string; email: string; display_name: string | null }>(`SELECT id, email, display_name FROM accounts WHERE id=$1`, [row.account_id]);
    const accountRow = account.rows[0];
    if (!accountRow) return null;
    const memberships = await client.query<{ organization_id: string; workspace_id: string | null; role: string }>(
      `SELECT organization_id, workspace_id, role FROM memberships WHERE account_id=$1`,
      [accountRow.id]
    );
    return { sessionId, account: { accountId: accountRow.id, email: accountRow.email, displayName: accountRow.display_name, memberships: memberships.rows.map((row) => ({ organizationId: row.organization_id, workspaceId: row.workspace_id, role: row.role })) } };
  });
}

export async function requireMembership(client: PoolClient, accountId: string, organizationId: string, roles: readonly string[], workspaceId?: string): Promise<boolean> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM memberships WHERE account_id=$1 AND organization_id=$2 AND role = ANY($3::text[]) AND ($4::uuid IS NULL OR workspace_id=$4) LIMIT 1`,
    [accountId, organizationId, roles, workspaceId ?? null]
  );
  return result.rowCount === 1;
}

export async function createInvite(input: { organizationId: string; workspaceId: string | null; email: string; role: string; invitedBy: string; ttlMs: number }): Promise<{ id: string; token: string }> {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashPassword(token);
  const id = randomUUID();
  await query(
    `INSERT INTO org_invites (id, organization_id, workspace_id, email, role, token_hash, invited_by, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, input.organizationId, input.workspaceId, input.email.trim().toLowerCase(), input.role, tokenHash, input.invitedBy, new Date(Date.now() + input.ttlMs)]
  );
  return { id, token };
}

export async function acceptInvite(input: { token: string; accountId: string }): Promise<{ inviteId: string; organizationId: string; workspaceId: string | null; role: string } | null> {
  return withTransaction(async (client) => {
    const invites = await client.query<{ id: string; organization_id: string; workspace_id: string | null; email: string; role: string; token_hash: string; expires_at: Date; status: string }>(
      `SELECT * FROM org_invites WHERE status='PENDING' AND expires_at > now()`,
      []
    );
    const invite = invites.rows.find((candidate) => verifyPassword(input.token, candidate.token_hash));
    if (!invite) return null;
    const account = await client.query<{ id: string; email: string }>(`SELECT id, email FROM accounts WHERE id=$1`, [input.accountId]);
    const accountRow = account.rows[0];
    if (!accountRow || accountRow.email !== invite.email) throw new Error("Invite email does not match account");
    await client.query(
      `INSERT INTO memberships (organization_id, workspace_id, account_id, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (organization_id, workspace_id, account_id) DO UPDATE SET role=EXCLUDED.role`,
      [invite.organization_id, invite.workspace_id, input.accountId, invite.role]
    );
    await client.query(`UPDATE org_invites SET status='ACCEPTED', accepted_at=now() WHERE id=$1`, [invite.id]);
    return { inviteId: invite.id, organizationId: invite.organization_id, workspaceId: invite.workspace_id, role: invite.role };
  });
}
