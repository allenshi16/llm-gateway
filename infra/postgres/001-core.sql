CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE',
  billing_email text,
  home_region text NOT NULL DEFAULT 'US',
  stripe_customer_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  environment text NOT NULL DEFAULT 'DEVELOPMENT',
  allowed_region text NOT NULL,
  retention_mode text NOT NULL DEFAULT 'ZERO',
  allow_cross_region_fallback boolean NOT NULL DEFAULT false,
  litellm_team_id text,
  projection_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, workspace_id, account_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_id uuid NOT NULL REFERENCES accounts(id),
  name text NOT NULL,
  key_prefix text NOT NULL UNIQUE,
  secret_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  rpm_limit integer,
  tpm_limit integer,
  concurrency_limit integer,
  ip_allowlist text[] NOT NULL DEFAULT '{}',
  allowed_routes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  currency text NOT NULL DEFAULT 'USD',
  available_balance numeric(20,8) NOT NULL DEFAULT 0,
  reserved_balance numeric(20,8) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, currency),
  CHECK (available_balance >= 0),
  CHECK (reserved_balance >= 0)
);

CREATE INDEX IF NOT EXISTS memberships_account_idx ON memberships(account_id, organization_id);
CREATE INDEX IF NOT EXISTS api_keys_workspace_status_idx ON api_keys(workspace_id, status);
