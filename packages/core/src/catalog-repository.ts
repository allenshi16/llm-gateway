import { query } from "@gateway/database";
import { selectApprovedRoute, type ApprovedRoute } from "./route-policy.js";
import type { Region } from "@gateway/contracts";

export interface ModelAccess {
  modelProductId: string;
  alias: string;
  priceVersionId: string;
  price: { inputPerMillion: string; outputPerMillion: string; cacheReadPerMillion: string; cacheWritePerMillion: string; reasoningPerMillion: string; requestFee: string };
  route: ApprovedRoute;
  maximumOutputTokens: number;
  providerModel: string;
  endpoint: string;
}

export async function resolveModelAccess(workspaceId: string, alias: string, region: Region, retentionMode: "ZERO" | "STANDARD"): Promise<ModelAccess> {
  const result = await query<{
    model_product_id: string; public_name: string; price_version_id: string; input_per_million: string; output_per_million: string;
    cache_read_per_million: string; cache_write_per_million: string; reasoning_per_million: string; request_fee: string;
    default_max_output_tokens: number; provider: string; provider_model: string; route_region: Region; status: "APPROVED";
    resale_approved: boolean; dpa_approved: boolean; security_approved: boolean; residency_approved: boolean; kill_switch: boolean; zero_retention: boolean; endpoint: string;
  }>(`SELECT mp.id model_product_id, mp.public_name, mp.default_max_output_tokens,
      pv.id price_version_id, pv.input_per_million, pv.output_per_million, pv.cache_read_per_million, pv.cache_write_per_million, pv.reasoning_per_million, pv.request_fee,
      pr.provider, pr.provider_model, pr.region route_region, pr.status, pr.resale_approved, pr.dpa_approved, pr.security_approved, pr.residency_approved, pr.kill_switch, pr.zero_retention, pr.endpoint
    FROM model_entitlements me JOIN model_products mp ON mp.id=me.model_product_id
    JOIN LATERAL (SELECT * FROM price_versions p WHERE p.model_product_id=mp.id AND p.effective_from<=now() AND (p.effective_to IS NULL OR p.effective_to>now()) ORDER BY p.version DESC LIMIT 1) pv ON true
    JOIN provider_routes pr ON pr.model_product_id=mp.id
     WHERE me.workspace_id=$1 AND me.enabled AND mp.public_name=$2 AND pr.region=$3 AND mp.active
       AND pr.status='APPROVED' AND pr.resale_approved AND pr.dpa_approved
       AND pr.security_approved AND pr.residency_approved AND NOT pr.kill_switch
       AND ($4='STANDARD' OR pr.zero_retention)
       ORDER BY pr.priority ASC`, [workspaceId, alias, region, retentionMode]);
  if (result.rows.length === 0) throw new Error("Model is not entitled for this workspace and region");
  const first = result.rows[0];
  if (!first) throw new Error("Model access row missing");
  const routes = result.rows.map((candidate) => ({ provider: candidate.provider, providerModel: candidate.provider_model, endpoint: candidate.endpoint, region: candidate.route_region, status: candidate.status, resaleApproved: candidate.resale_approved, dpaApproved: candidate.dpa_approved, securityApproved: candidate.security_approved, residencyApproved: candidate.residency_approved, killSwitch: candidate.kill_switch, zeroRetention: candidate.zero_retention }));
  const route = selectApprovedRoute(routes, region, retentionMode);
  const selected = result.rows.find((candidate) => candidate.provider === route.provider && candidate.provider_model === route.providerModel && candidate.endpoint === route.endpoint);
  if (!selected) throw new Error("Approved route row missing");
  return { modelProductId: selected.model_product_id, alias: selected.public_name, priceVersionId: selected.price_version_id, maximumOutputTokens: selected.default_max_output_tokens, providerModel: selected.provider_model, endpoint: selected.endpoint, price: { inputPerMillion: selected.input_per_million, outputPerMillion: selected.output_per_million, cacheReadPerMillion: selected.cache_read_per_million, cacheWritePerMillion: selected.cache_write_per_million, reasoningPerMillion: selected.reasoning_per_million, requestFee: selected.request_fee }, route };
}
