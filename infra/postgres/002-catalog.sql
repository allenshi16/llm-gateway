CREATE TABLE IF NOT EXISTS model_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_name text NOT NULL UNIQUE,
  display_name text NOT NULL, default_max_output_tokens integer NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS price_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), model_product_id uuid NOT NULL REFERENCES model_products(id) ON DELETE RESTRICT,
  version integer NOT NULL, currency text NOT NULL DEFAULT 'USD', input_per_million numeric(20,8) NOT NULL,
  output_per_million numeric(20,8) NOT NULL, cache_read_per_million numeric(20,8) NOT NULL DEFAULT 0,
  cache_write_per_million numeric(20,8) NOT NULL DEFAULT 0, reasoning_per_million numeric(20,8) NOT NULL DEFAULT 0,
  request_fee numeric(20,8) NOT NULL DEFAULT 0, effective_from timestamptz NOT NULL, effective_to timestamptz,
  UNIQUE(model_product_id, version)
);
CREATE TABLE IF NOT EXISTS model_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  model_product_id uuid NOT NULL REFERENCES model_products(id) ON DELETE CASCADE, billing_mode text NOT NULL DEFAULT 'PREPAID',
  enabled boolean NOT NULL DEFAULT true, UNIQUE(workspace_id, model_product_id)
);
CREATE TABLE IF NOT EXISTS provider_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), model_product_id uuid NOT NULL REFERENCES model_products(id) ON DELETE CASCADE,
  provider text NOT NULL, provider_model text NOT NULL, region text NOT NULL, endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', resale_approved boolean NOT NULL DEFAULT false, dpa_approved boolean NOT NULL DEFAULT false,
  security_approved boolean NOT NULL DEFAULT false, residency_approved boolean NOT NULL DEFAULT false,
  zero_retention boolean NOT NULL DEFAULT false, kill_switch boolean NOT NULL DEFAULT false, priority integer NOT NULL DEFAULT 100,
  UNIQUE(model_product_id, provider, provider_model, region)
);
CREATE INDEX IF NOT EXISTS provider_routes_policy_idx ON provider_routes(model_product_id, region, status, kill_switch);
