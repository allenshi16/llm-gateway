CREATE TABLE IF NOT EXISTS billing_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  unit_amount integer NOT NULL,
  billing_interval text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id text,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_org_idx ON subscriptions(organization_id, status);

CREATE TABLE IF NOT EXISTS payment_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_event_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  ledger_transaction_id uuid REFERENCES ledger_transactions(id),
  processed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_projections_org_idx ON payment_projections(organization_id, status);

INSERT INTO billing_plans (id, name, currency, unit_amount, billing_interval, description) VALUES
  ('dev', 'Developer', 'USD', 0, 'month', 'Free tier for local evaluation'),
  ('starter', 'Starter', 'USD', 4900, 'month', 'Includes monthly wallet credit'),
  ('scale', 'Scale', 'USD', 19900, 'month', 'Higher limits and priority routing')
ON CONFLICT (id) DO NOTHING;