CREATE TABLE IF NOT EXISTS logical_requests (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), workspace_id uuid NOT NULL REFERENCES workspaces(id), api_key_id uuid NOT NULL REFERENCES api_keys(id),
  model_product_id uuid NOT NULL REFERENCES model_products(id), price_version_id uuid NOT NULL REFERENCES price_versions(id), billing_mode text NOT NULL, region text NOT NULL,
  request_body_digest text NOT NULL, input_token_estimate integer NOT NULL, maximum_output_tokens integer NOT NULL, maximum_charge_usd numeric(20,8) NOT NULL,
  customer_price_snapshot jsonb NOT NULL, status text NOT NULL DEFAULT 'ACCEPTED', client_disconnected_at timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wallet_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id uuid NOT NULL REFERENCES wallets(id), request_id uuid NOT NULL UNIQUE REFERENCES logical_requests(id),
  amount numeric(20,8) NOT NULL CHECK (amount >= 0), captured_amount numeric(20,8) NOT NULL DEFAULT 0 CHECK (captured_amount >= 0), status text NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id), type text NOT NULL, idempotency_key text NOT NULL UNIQUE,
  reference_type text NOT NULL, reference_id text NOT NULL, description text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transaction_id uuid NOT NULL REFERENCES ledger_transactions(id), wallet_id uuid NOT NULL REFERENCES wallets(id),
  account_code text NOT NULL, direction text NOT NULL, amount numeric(20,8) NOT NULL CHECK (amount > 0), currency text NOT NULL DEFAULT 'USD', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS provider_attempts (
  id uuid PRIMARY KEY, request_id uuid NOT NULL REFERENCES logical_requests(id), sequence integer NOT NULL, provider text NOT NULL, provider_model text NOT NULL, region text NOT NULL,
  status text NOT NULL DEFAULT 'STARTED', input_tokens integer NOT NULL DEFAULT 0, output_tokens integer NOT NULL DEFAULT 0, cache_read_tokens integer NOT NULL DEFAULT 0,
  cache_write_tokens integer NOT NULL DEFAULT 0, reasoning_tokens integer NOT NULL DEFAULT 0, provider_cost_usd numeric(20,8) NOT NULL DEFAULT 0, response_delivered boolean NOT NULL DEFAULT false,
  error_code text, started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, UNIQUE(request_id, sequence)
);
CREATE TABLE IF NOT EXISTS raw_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text NOT NULL, source_event_id text NOT NULL, request_id uuid NOT NULL REFERENCES logical_requests(id), attempt_id uuid NOT NULL REFERENCES provider_attempts(id),
  payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, processing_error text, UNIQUE(source, source_event_id)
);
CREATE TABLE IF NOT EXISTS customer_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES logical_requests(id), component text NOT NULL, amount_usd numeric(20,8) NOT NULL,
  billing_mode text NOT NULL, price_version_id uuid NOT NULL REFERENCES price_versions(id), usage_snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(request_id, component)
);
CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), topic text NOT NULL, aggregate_type text NOT NULL, aggregate_id text NOT NULL, payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), locked_at timestamptz, locked_by text, processed_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_status_created_idx ON logical_requests(status, created_at);
CREATE INDEX IF NOT EXISTS outbox_pending_idx ON outbox_events(status, available_at, created_at);
