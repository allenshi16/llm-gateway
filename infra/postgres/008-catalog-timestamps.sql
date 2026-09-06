ALTER TABLE model_products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE model_entitlements ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE provider_routes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
