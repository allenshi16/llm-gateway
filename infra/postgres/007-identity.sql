CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS email_verifications_account_idx ON email_verifications(account_id, status);

CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS password_resets_account_idx ON password_resets(account_id, status);

CREATE TABLE IF NOT EXISTS outbound_mails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  provider text NOT NULL DEFAULT 'dev',
  status text NOT NULL DEFAULT 'QUEUED',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

INSERT INTO billing_plans (id, name, currency, unit_amount, billing_interval, description, stripe_price_id)
VALUES ('dev', 'Developer', 'USD', 0, 'month', 'Free tier for local evaluation', NULL)
ON CONFLICT (id) DO NOTHING;