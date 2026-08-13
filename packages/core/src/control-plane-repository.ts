import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@gateway/database";
import { generateApiKey } from "./api-key.js";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  billingEmail?: string;
  homeRegion: "US" | "EU" | "APAC";
  ownerEmail: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceRegion: "US" | "EU" | "APAC";
}

export interface CreatedOrganization {
  organizationId: string;
  workspaceId: string;
  ownerAccountId: string;
}

export interface CreateKeyInput {
  workspaceId: string;
  createdById: string;
  name: string;
  pepper: string;
  environment: "live" | "test";
  expiresAt?: Date;
}

export interface CreatedKey {
  id: string;
  secret: string;
  prefix: string;
}

function optionalDateValue(value: Date | undefined): Date | null {
  return value ?? null;
}

async function insertOrganization(client: PoolClient, input: CreateOrganizationInput): Promise<CreatedOrganization> {
  const owner = await client.query<{ id: string }>(
    `INSERT INTO accounts (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET updated_at = now()
     RETURNING id`,
    [input.ownerEmail]
  );
  const organization = await client.query<{ id: string }>(
    `INSERT INTO organizations (name, slug, billing_email, home_region)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [input.name, input.slug, input.billingEmail ?? null, input.homeRegion]
  );
  const workspace = await client.query<{ id: string }>(
    `INSERT INTO workspaces (organization_id, name, slug, allowed_region)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [organization.rows[0]?.id, input.workspaceName, input.workspaceSlug, input.workspaceRegion]
  );
  await client.query(
    `INSERT INTO memberships (organization_id, workspace_id, account_id, role)
     VALUES ($1, $2, $3, 'OWNER')`,
    [organization.rows[0]?.id, workspace.rows[0]?.id, owner.rows[0]?.id]
  );
  await client.query(
    `INSERT INTO wallets (organization_id, currency) VALUES ($1, 'USD')
     ON CONFLICT (organization_id, currency) DO NOTHING`,
    [organization.rows[0]?.id]
  );
  const organizationId = organization.rows[0]?.id;
  const workspaceId = workspace.rows[0]?.id;
  const ownerAccountId = owner.rows[0]?.id;
  if (!organizationId || !workspaceId || !ownerAccountId) throw new Error("Organization creation returned no IDs");
  return { organizationId, workspaceId, ownerAccountId };
}

export async function createOrganization(input: CreateOrganizationInput): Promise<CreatedOrganization> {
  return withTransaction((client) => insertOrganization(client, input));
}

export async function createApiKey(input: CreateKeyInput): Promise<CreatedKey> {
  const generated = generateApiKey(input.pepper, input.environment);
  const id = randomUUID();
  await query(
    `INSERT INTO api_keys (id, workspace_id, created_by_id, name, key_prefix, secret_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.workspaceId, input.createdById, input.name, generated.prefix, generated.hash, optionalDateValue(input.expiresAt)]
  );
  return { id, secret: generated.secret, prefix: generated.prefix };
}

export async function revokeApiKey(workspaceId: string, keyId: string): Promise<boolean> {
  const result = await query(
    `UPDATE api_keys SET status = 'REVOKED', revoked_at = now()
     WHERE id = $1 AND workspace_id = $2 AND status = 'ACTIVE'`,
    [keyId, workspaceId]
  );
  return result.rowCount === 1;
}
