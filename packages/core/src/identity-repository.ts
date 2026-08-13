import { randomBytes, randomUUID } from "node:crypto";
import { query, withTransaction } from "@gateway/database";
import { hashPassword, verifyPassword } from "./password.js";

export interface MailMessage {
  toEmail: string;
  subject: string;
  body: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export async function queueMail(message: MailMessage): Promise<void> {
  await query(`INSERT INTO outbound_mails (to_email, subject, body, provider) VALUES ($1,$2,$3,'dev')`, [message.toEmail, message.subject, message.body]);
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerification(input: { accountId: string; email: string; mailer: Mailer; ttlMs?: number }): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashPassword(token);
  const ttl = input.ttlMs ?? TOKEN_TTL_MS;
  await query(`INSERT INTO email_verifications (id, account_id, token_hash, expires_at) VALUES (gen_random_uuid(),$1,$2,$3)`, [input.accountId, tokenHash, new Date(Date.now() + ttl)]);
  await input.mailer.send({ toEmail: input.email, subject: "Verify your email", body: `Your verification code: ${token}\nVerify at /verify-email?token=${token}` });
  return token;
}

export async function verifyEmail(token: string, accountId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const rows = await client.query<{ id: string; account_id: string; token_hash: string; expires_at: Date; status: string }>(`SELECT id, account_id, token_hash, expires_at, status FROM email_verifications WHERE status='PENDING' AND expires_at > now()`, []);
    const match = rows.rows.find((row) => row.account_id === accountId && verifyPassword(token, row.token_hash));
    if (!match) return false;
    await client.query(`UPDATE email_verifications SET status='CONSUMED', consumed_at=now() WHERE id=$1`, [match.id]);
    await client.query(`UPDATE accounts SET email_verified_at=now() WHERE id=$1`, [accountId]);
    return true;
  });
}

export async function createPasswordReset(input: { email: string; mailer: Mailer; ttlMs?: number }): Promise<string | null> {
  const account = await query<{ id: string }>(`SELECT id FROM accounts WHERE email=$1`, [input.email.trim().toLowerCase()]);
  const accountId = account.rows[0]?.id;
  if (!accountId) return null;
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashPassword(token);
  const ttl = input.ttlMs ?? TOKEN_TTL_MS;
  await query(`INSERT INTO password_resets (id, account_id, token_hash, expires_at) VALUES (gen_random_uuid(),$1,$2,$3)`, [accountId, tokenHash, new Date(Date.now() + ttl)]);
  await input.mailer.send({ toEmail: input.email.trim().toLowerCase(), subject: "Reset your password", body: `Your reset code: ${token}\nReset at /reset-password?token=${token}` });
  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
  return withTransaction(async (client) => {
    const rows = await client.query<{ id: string; account_id: string; token_hash: string; expires_at: Date; status: string }>(`SELECT id, account_id, token_hash, expires_at, status FROM password_resets WHERE status='PENDING' AND expires_at > now()`, []);
    const match = rows.rows.find((row) => verifyPassword(token, row.token_hash));
    if (!match) return false;
    const newHash = hashPassword(newPassword);
    await client.query(`UPDATE password_resets SET status='CONSUMED', consumed_at=now() WHERE id=$1`, [match.id]);
    await client.query(`UPDATE accounts SET password_hash=$1 WHERE id=$2`, [newHash, match.account_id]);
    return true;
  });
}

export function devMailer(): Mailer {
  return {
    async send(message: MailMessage): Promise<void> {
      await queueMail(message);
    }
  };
}

export async function listOutboundMails(limit: number): Promise<{ id: string; to_email: string; subject: string; body: string; status: string; created_at: string }[]> {
  const result = await query(`SELECT id, to_email, subject, body, status, created_at FROM outbound_mails ORDER BY created_at DESC LIMIT $1`, [limit]);
  return result.rows as { id: string; to_email: string; subject: string; body: string; status: string; created_at: string }[];
}