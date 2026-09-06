import { query } from "@gateway/database";
import { constantTimeApiKeyMatch } from "./api-key.js";
import type { KeyRateWindowSnapshot } from "./key-rate-limit.js";

export interface AuthenticatedKey {
  id: string;
  workspaceId: string;
  organizationId: string;
  createdById: string;
  allowedRegion: "US" | "EU" | "APAC";
  retentionMode: "ZERO" | "STANDARD";
  allowCrossRegionFallback: boolean;
  emailVerified: boolean;
  rpmLimit: number | null;
  tpmLimit: number | null;
}

export async function keyRateWindow(apiKeyId: string): Promise<KeyRateWindowSnapshot> {
  const result = await query<{ requests: string; tokens: string }>(
    `SELECT count(*)::text AS requests, coalesce(sum(input_token_estimate + maximum_output_tokens), 0)::text AS tokens
     FROM logical_requests WHERE api_key_id=$1 AND created_at > now() - interval '60 seconds'`,
    [apiKeyId]
  );
  const row = result.rows[0];
  return { requests: Number(row?.requests ?? 0), tokens: Number(row?.tokens ?? 0) };
}

export async function authenticateApiKey(value: string, pepper: string): Promise<AuthenticatedKey | null> {
  const prefix = value.split("_").slice(0, 3).join("_");
  if (!prefix) return null;
  const result = await query<{
    id: string; secret_hash: string; workspace_id: string; organization_id: string; created_by_id: string;
    allowed_region: "US" | "EU" | "APAC"; retention_mode: "ZERO" | "STANDARD"; allow_cross_region_fallback: boolean; email_verified_at: string | null;
    rpm_limit: number | null; tpm_limit: number | null;
  }>(`SELECT k.id, k.secret_hash, k.workspace_id, w.organization_id, k.created_by_id,
      w.allowed_region, w.retention_mode, w.allow_cross_region_fallback, a.email_verified_at, k.rpm_limit, k.tpm_limit
    FROM api_keys k JOIN workspaces w ON w.id=k.workspace_id JOIN accounts a ON a.id=k.created_by_id JOIN organizations o ON o.id=w.organization_id
    WHERE k.key_prefix=$1 AND k.status='ACTIVE' AND a.status='ACTIVE' AND o.status='ACTIVE' AND (k.expires_at IS NULL OR k.expires_at>now())`, [prefix]);
  const row = result.rows[0];
  if (!row || !constantTimeApiKeyMatch(value, row.secret_hash, pepper)) return null;
  await query(`UPDATE api_keys SET last_used_at=now() WHERE id=$1`, [row.id]);
  return { id: row.id, workspaceId: row.workspace_id, organizationId: row.organization_id, createdById: row.created_by_id, allowedRegion: row.allowed_region, retentionMode: row.retention_mode, allowCrossRegionFallback: row.allow_cross_region_fallback, emailVerified: row.email_verified_at !== null, rpmLimit: row.rpm_limit, tpmLimit: row.tpm_limit };
}
