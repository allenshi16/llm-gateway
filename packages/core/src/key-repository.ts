import { query } from "@gateway/database";
import { constantTimeApiKeyMatch } from "./api-key.js";

export interface AuthenticatedKey {
  id: string;
  workspaceId: string;
  organizationId: string;
  createdById: string;
  allowedRegion: "US" | "EU" | "APAC";
  retentionMode: "ZERO" | "STANDARD";
  allowCrossRegionFallback: boolean;
}

export async function authenticateApiKey(value: string, pepper: string): Promise<AuthenticatedKey | null> {
  const prefix = value.split("_").slice(0, 3).join("_");
  if (!prefix) return null;
  const result = await query<{
    id: string; secret_hash: string; workspace_id: string; organization_id: string; created_by_id: string;
    allowed_region: "US" | "EU" | "APAC"; retention_mode: "ZERO" | "STANDARD"; allow_cross_region_fallback: boolean;
  }>(`SELECT k.id, k.secret_hash, k.workspace_id, w.organization_id, k.created_by_id,
      w.allowed_region, w.retention_mode, w.allow_cross_region_fallback
    FROM api_keys k JOIN workspaces w ON w.id=k.workspace_id
    WHERE k.key_prefix=$1 AND k.status='ACTIVE' AND (k.expires_at IS NULL OR k.expires_at>now())`, [prefix]);
  const row = result.rows[0];
  if (!row || !constantTimeApiKeyMatch(value, row.secret_hash, pepper)) return null;
  await query(`UPDATE api_keys SET last_used_at=now() WHERE id=$1`, [row.id]);
  return { id: row.id, workspaceId: row.workspace_id, organizationId: row.organization_id, createdById: row.created_by_id, allowedRegion: row.allowed_region, retentionMode: row.retention_mode, allowCrossRegionFallback: row.allow_cross_region_fallback };
}
