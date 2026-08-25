-- Operational prerequisites before running:
--   1) .env contains a real DEEPSEEK_API_KEY and the LiteLLM container is up.
--   2) Edit WORKSPACE_ID below to the tenant that should receive access.
--   3) docker exec -i infra-postgres-1 psql -U gateway -d gateway < infra/postgres/t3-deepseek-route.sql
-- The four *_approved flags are commercial/legal gates (resale, DPA, security,
-- residency); flipping them is an approval decision, not boilerplate.

INSERT INTO model_products (public_name, display_name, default_max_output_tokens)
VALUES ('deepseek-chat', 'DeepSeek Chat', 8192)
ON CONFLICT (public_name) DO NOTHING;

INSERT INTO provider_routes (
  model_product_id, provider, provider_model, region, endpoint,
  status, resale_approved, dpa_approved, security_approved, residency_approved,
  zero_retention, kill_switch, priority
)
SELECT
  mp.id, 'deepseek', 'deepseek-chat', 'US', 'http://127.0.0.1:4302/v1/chat/completions',
  'APPROVED', true, true, true, true,
  true, false, 100
FROM model_products mp
WHERE mp.public_name = 'deepseek-chat'
ON CONFLICT (model_product_id, provider, provider_model, region) DO NOTHING;

INSERT INTO price_versions (model_product_id, version, input_per_million, output_per_million, cache_read_per_million, cache_write_per_million, effective_from)
SELECT id, 1, 0.27000000, 1.10000000, 0.07000000, 0.27000000, now()
FROM model_products mp
WHERE mp.public_name = 'deepseek-chat'
  AND NOT EXISTS (SELECT 1 FROM price_versions pv WHERE pv.model_product_id = mp.id AND pv.effective_from <= now() AND (pv.effective_to IS NULL OR pv.effective_to > now()));

INSERT INTO model_entitlements (workspace_id, model_product_id, billing_mode, enabled)
SELECT '97209fe1-aeb2-4233-9462-e9b162d192d8', mp.id, 'PREPAID', true
FROM model_products mp
WHERE mp.public_name = 'deepseek-chat'
ON CONFLICT (workspace_id, model_product_id) DO NOTHING;

