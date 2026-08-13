import { query } from "@gateway/database";

export interface AuditInput {
  organizationId?: string | null;
  workspaceId?: string | null;
  accountId?: string | null;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  await query(
    `INSERT INTO audit_events (organization_id, workspace_id, account_id, actor_id, action, resource_type, resource_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [input.organizationId ?? null, input.workspaceId ?? null, input.accountId ?? null, input.actorId ?? null, input.action, input.resourceType, input.resourceId ?? null, JSON.stringify(input.metadata ?? {})]
  );
}

export async function listAudit(input: { organizationId: string; limit: number }): Promise<AuditEventRow[]> {
  const result = await query<AuditEventRow>(
    `SELECT id, action, resource_type, resource_id, actor_id, metadata, created_at FROM audit_events WHERE organization_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [input.organizationId, input.limit]
  );
  return result.rows;
}

export interface AuditEventRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  actor_id: string | null;
  metadata: unknown;
  created_at: string;
}