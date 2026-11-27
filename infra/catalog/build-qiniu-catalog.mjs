// Builds the Qiniu (qnaigc.com) supplier catalog artifacts.
//
// Source of truth for prices: https://www.qiniu.com/ai/models (RMB per 1K tokens).
// Source of truth for callable model IDs: GET https://api.qnaigc.com/v1/models
//   (Qiniu AI inference is OpenAI-compatible at base https://api.qnaigc.com/v1;
//    model IDs use the "provider/model" convention.)
//
// This script joins the two, converts RMB/1K -> USD/1M at FX, and emits:
//   1. infra/catalog/qiniu-models.json        (normalized dataset)
//   2. infra/postgres/t4-qiniu-catalog.sql    (idempotent commercial-DB upsert)
//   3. infra/litellm/qiniu-models.yaml        (LiteLLM model_list fragment)
//
// Pricing policy: cost pass-through (no markup). Where a model has tiered
// peak/idle pricing (DeepSeek flash/pro), the PEAK tier is used as the standard
// customer price; idle is recorded in `note` only.
//
// Image/video GENERATION models (Kling, Vidu, Seedream, MiniMax-H3) are NOT in
// /v1/models: they live on Qiniu's separate async 音视频 API and are priced per
// second / per image, which the token-metered ledger cannot represent. They are
// intentionally excluded here (marketing-catalog display only).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
// RMB per USD. Locked to the live mid-market rate on 2026-09-29
// (cross-checked: open.er-api.com 6.7216, Frankfurter/ECB 6.7105,
//  fawazahmed0 currency-api 6.7135). Pure cost pass-through, no FX buffer.
const FX = 6.72;

// rmbIn / rmbOut / rmbCache are RMB per 1K tokens.
// id must match a callable ID from GET /v1/models exactly.
const TEXT_MODELS = [
  // ---- DeepSeek ----
  { id: "deepseek/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", family: "DeepSeek", providerSlug: "deepseek", ctx: "1M", maxOut: 32768, status: "new", rmbIn: 0.002, rmbOut: 0.008, rmbCache: 0.00004, bestFor: "High-TPS general text, image/file input", note: "peak tier; idle in 0.001 / out 0.004" },
  { id: "deepseek/deepseek-v4-flash-20260731", name: "DeepSeek V4 Flash (2026-07-31)", family: "DeepSeek", providerSlug: "deepseek", ctx: "1M", maxOut: 32768, status: "popular", rmbIn: 0.002, rmbOut: 0.008, rmbCache: 0.00004, bestFor: "Agents, Codex-style code tasks", note: "peak tier" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", family: "DeepSeek", providerSlug: "deepseek", ctx: "1M", maxOut: 16384, status: "retiring", rmbIn: 0.001, rmbOut: 0.002, bestFor: "Cheap high-TPS text" },
  { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro", family: "DeepSeek", providerSlug: "deepseek", ctx: "1M", maxOut: 32768, status: "retiring", rmbIn: 0.012, rmbOut: 0.024, bestFor: "Complex reasoning" },
  { id: "deepseek/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro (0813)", family: "DeepSeek", providerSlug: "deepseek", ctx: "1M", maxOut: 32768, status: "popular", rmbIn: 0.009, rmbOut: 0.027, rmbCache: 0.0003, bestFor: "Agents and code", note: "peak tier; idle in 0.0045 / out 0.0135" },
  { id: "deepseek/deepseek-v4-flash-vision-exp", name: "DeepSeek V4 Flash Vision (exp)", family: "DeepSeek", providerSlug: "deepseek", ctx: "128K", maxOut: 16384, status: "retiring", rmbIn: 0.003, rmbOut: 0.009, rmbCache: 0.0001, bestFor: "Image + text vision (experimental)", note: "peak tier" },
  { id: "deepseek/deepseek-v3.2-251201", name: "DeepSeek V3.2", family: "DeepSeek", providerSlug: "deepseek", ctx: "128K", maxOut: 16384, status: "retiring", rmbIn: 0.002, rmbOut: 0.003, rmbCache: 0.0002, bestFor: "Reasoning" },
  { id: "deepseek-v3", name: "DeepSeek V3", family: "DeepSeek", providerSlug: "deepseek", ctx: "128K", maxOut: 8192, status: "retiring", rmbIn: 0.002, rmbOut: 0.008, bestFor: "General reasoning (legacy)" },

  // ---- Zhipu / GLM (z-ai) ----
  { id: "z-ai/glm-5", name: "GLM-5", family: "Zhipu AI (Z.ai)", providerSlug: "zhipu", ctx: "200K", maxOut: 32768, status: "standard", rmbIn: 0.004, rmbOut: 0.018, bestFor: "Coding and agentic engineering" },
  { id: "z-ai/glm-5.1", name: "GLM-5.1", family: "Zhipu AI (Z.ai)", providerSlug: "zhipu", ctx: "200K", maxOut: 32768, status: "standard", rmbIn: 0.006, rmbOut: 0.024, bestFor: "Long-cycle coding" },
  { id: "z-ai/glm-5.2", name: "GLM-5.2", family: "Zhipu AI (Z.ai)", providerSlug: "zhipu", ctx: "1M", maxOut: 32768, status: "popular", rmbIn: 0.008, rmbOut: 0.028, rmbCache: 0.002, bestFor: "Long-task agents" },
  { id: "z-ai/glm-5.3", name: "GLM-5.3", family: "Zhipu AI (Z.ai)", providerSlug: "zhipu", ctx: "1M", maxOut: 32768, status: "popular", rmbIn: 0.008, rmbOut: 0.028, rmbCache: 0.002, bestFor: "Coding and security" },
  { id: "z-ai/glm-5.3-flash", name: "GLM-5.3 Flash", family: "Zhipu AI (Z.ai)", providerSlug: "zhipu", ctx: "1M", maxOut: 16384, status: "standard", rmbIn: 0.0008, rmbOut: 0.0028, rmbCache: 0.00023, bestFor: "Cheap long-context text/image/video/file input" },

  // ---- Moonshot / Kimi ----
  { id: "moonshotai/kimi-k3", name: "Kimi K3", family: "Moonshot AI", providerSlug: "moonshot", ctx: "1M", maxOut: 32768, status: "standard", rmbIn: 0.02, rmbOut: 0.1, rmbCache: 0.002, bestFor: "Frontier reasoning, open 3T params" },
  { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", family: "Moonshot AI", providerSlug: "moonshot", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0065, rmbOut: 0.027, bestFor: "Text/image/video input" },
  { id: "moonshotai/kimi-k2.7-code", name: "Kimi K2.7 Code", family: "Moonshot AI", providerSlug: "moonshot", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0065, rmbOut: 0.027, rmbCache: 0.0013, bestFor: "Code (MoE)" },

  // ---- MiniMax ----
  { id: "minimax/minimax-m3", name: "MiniMax M3", family: "MiniMax", providerSlug: "minimax", ctx: "1M", maxOut: 32768, status: "standard", rmbIn: 0.0021, rmbOut: 0.0084, rmbCache: 0.00042, bestFor: "Cheap long-context agents" },
  { id: "minimax/minimax-m2.7", name: "MiniMax M2.7", family: "MiniMax", providerSlug: "minimax", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0021, rmbOut: 0.0084, bestFor: "Agent evolution" },
  { id: "minimax/minimax-m2.5", name: "MiniMax M2.5", family: "MiniMax", providerSlug: "minimax", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0021, rmbOut: 0.0084, bestFor: "Agents" },
  { id: "minimax/minimax-m2.5-highspeed", name: "MiniMax M2.5 Highspeed", family: "MiniMax", providerSlug: "minimax", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0042, rmbOut: 0.0168, bestFor: "High-TPS agents" },
  { id: "MiniMax-M1", name: "MiniMax M1", family: "MiniMax", providerSlug: "minimax", ctx: "1M", maxOut: 16384, status: "standard", rmbIn: 0.004, rmbOut: 0.016, bestFor: "Open-source MoE, 80K reasoning output" },

  // ---- Alibaba / Qwen ----
  { id: "qwen/qwen3.8-max", name: "Qwen3.8 Max", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "1M", maxOut: 32768, status: "standard", rmbIn: 0.012, rmbOut: 0.036, rmbCache: 0.0015, bestFor: "Flagship agents and vision" },
  { id: "qwen/qwen3.8-flash-next", name: "Qwen3.8 Flash", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "262144 (YaRN to 1M)", maxOut: 16384, status: "standard", rmbIn: 0.001, rmbOut: 0.003, rmbCache: 0.0001, bestFor: "Cheap open-source text/image/video" },
  { id: "qwen/qwen3.7-max", name: "Qwen3.7 Max", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 32768, status: "standard", rmbIn: 0.012, rmbOut: 0.036, rmbCache: 0.0024, bestFor: "Agents" },
  { id: "qwen/qwen3.7-plus", name: "Qwen3.7 Plus", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.002, rmbOut: 0.008, rmbCache: 0.0004, bestFor: "Text/image/video GUI agent" },
  { id: "qwen/qwen3.7-flash", name: "Qwen3.7 Flash", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0002, rmbOut: 0.0008, rmbCache: 0.00004, bestFor: "Ultra-cheap agent volume" },
  { id: "qwen/qwen3.6-plus", name: "Qwen3.6 Plus", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.002, rmbOut: 0.012, rmbCache: 0.0004, bestFor: "Agent coding" },
  { id: "qwen/qwen3.6-27b", name: "Qwen3.6 27B", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "262144", maxOut: 16384, status: "standard", rmbIn: 0.002304, rmbOut: 0.02304, bestFor: "Multimodal" },
  { id: "qwen/qwen3.5-plus", name: "Qwen3.5 Plus", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "popular", rmbIn: 0.0008, rmbOut: 0.0048, rmbCache: 0.00016, bestFor: "Text/image vision value" },
  { id: "qwen3.5-397b-a17b", name: "Qwen3.5 397B-A17B", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0012, rmbOut: 0.0072, bestFor: "Text/image/video/GUI MoE" },
  { id: "qwen3-next-80b-a3b-thinking", name: "Qwen3-Next 80B-A3B Thinking", family: "Alibaba Cloud", providerSlug: "alibaba", ctx: "256K", maxOut: 16384, status: "retiring", rmbIn: 0.001, rmbOut: 0.01, bestFor: "Reasoning" },

  // ---- ByteDance / Doubao ----
  { id: "bytedance/doubao-seed-2-1-pro", name: "Doubao Seed 2.1 Pro", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.006, rmbOut: 0.03, rmbCache: 0.0012, bestFor: "Multimodal agents" },
  { id: "bytedance/doubao-seed-2-1-turbo", name: "Doubao Seed 2.1 Turbo", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.003, rmbOut: 0.015, rmbCache: 0.0006, bestFor: "Multimodal agents (value)" },
  { id: "doubao-seed-2.0-pro", name: "Doubao Seed 2.0 Pro", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0032, rmbOut: 0.016, rmbCache: 0.00064, bestFor: "Multimodal agents" },
  { id: "doubao-seed-2.0-code", name: "Doubao Seed 2.0 Code", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0032, rmbOut: 0.016, rmbCache: 0.00064, bestFor: "Code and frontend" },
  { id: "doubao-seed-2.0-lite", name: "Doubao Seed 2.0 Lite", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0006, rmbOut: 0.0036, rmbCache: 0.00012, bestFor: "Long-context multimodal value" },
  { id: "doubao-seed-2.0-mini", name: "Doubao Seed 2.0 Mini", family: "ByteDance", providerSlug: "bytedance", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.0002, rmbOut: 0.002, rmbCache: 0.00004, bestFor: "Cheapest multimodal volume" },

  // ---- Tencent / Hunyuan ----
  { id: "tencent/hy4-preview", name: "Hunyuan Hy4 Preview", family: "Tencent Hunyuan", providerSlug: "tencent", ctx: "1M", maxOut: 32768, status: "new", rmbIn: 0.006, rmbOut: 0.018, rmbCache: 0.0003, bestFor: "Text/code/agent" },

  // ---- StepFun ----
  { id: "stepfun/step-3.7-flash", name: "Step 3.7 Flash", family: "StepFun", providerSlug: "stepfun", ctx: "256K", maxOut: 16384, status: "standard", rmbIn: 0.00135, rmbOut: 0.0081, rmbCache: 0.00027, bestFor: "Image + text MoE agent" },
];

// ---- Marketing aliases --------------------------------------------
// SEO-friendly public names that are NOT literal qiniuIds but must resolve to a
// real upstream model so the gateway can route them and bill real cost. Each
// alias inherits its upstream's price (cost pass-through) and max-output.
//   createInDb   : emit product/route/price/entitlement in t4 (false if the
//                  product already exists from an earlier seed, e.g. the MVP
//                  deepseek-chat row — we then only reprice it via t5).
//   addToLitellm : emit a model_name entry in the LiteLLM fragment (false if
//                  config.yaml already hand-lists it, e.g. deepseek-chat).
const ALIASES = [
  { alias: "deepseek-chat", name: "DeepSeek Chat", upstream: "deepseek/deepseek-v4.1-flash", createInDb: false, addToLitellm: false },
  { alias: "deepseek-reasoner", name: "DeepSeek Reasoner", upstream: "deepseek/deepseek-v4-pro", createInDb: true, addToLitellm: true },
  { alias: "qwen-plus", name: "Qwen Plus", upstream: "qwen/qwen3.7-plus", createInDb: true, addToLitellm: true },
];

// ---- helpers -------------------------------------------------------
const slugify = (id) => {
  const part = id.includes("/") ? id.slice(id.lastIndexOf("/") + 1) : id;
  return part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};
const usd = (rmbPerK) => (rmbPerK == null ? null : (rmbPerK * 1000) / FX);
const round = (n, p = 6) => (n == null ? null : Number(n.toFixed(p)));

// de-dup slugs (defensive)
const seen = new Map();
const rows = TEXT_MODELS.map((m) => {
  let slug = slugify(m.id);
  if (seen.has(slug)) {
    let i = 2;
    while (seen.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }
  seen.set(slug, true);
  return {
    slug,
    name: m.name,
    family: m.family,
    providerSlug: m.providerSlug,
    qiniuId: m.id,
    contextWindow: m.ctx,
    maxOutputTokens: m.maxOut,
    status: m.status,
    modality: "text",
    rmb: { inputPerK: m.rmbIn, outputPerK: m.rmbOut, cacheInputPerK: m.rmbCache ?? null },
    usdPerMillion: {
      input: round(usd(m.rmbIn)),
      output: round(usd(m.rmbOut)),
      cacheRead: round(usd(m.rmbCache ?? 0)),
    },
    bestFor: m.bestFor,
    note: m.note ?? null,
  };
});

// Alias rows inherit price + max-output from their real upstream model.
const byId = new Map(rows.map((r) => [r.qiniuId, r]));
const aliasRows = ALIASES.map((a) => {
  const up = byId.get(a.upstream);
  if (!up) throw new Error(`alias ${a.alias}: upstream ${a.upstream} not found in TEXT_MODELS`);
  return {
    slug: a.alias,
    name: a.name,
    family: up.family,
    providerSlug: up.providerSlug,
    qiniuId: a.upstream, // LiteLLM maps model_name=alias -> openai/<upstream>
    contextWindow: up.contextWindow,
    maxOutputTokens: up.maxOutputTokens,
    status: "alias",
    modality: "text",
    rmb: up.rmb,
    usdPerMillion: up.usdPerMillion, // cost pass-through of the upstream
    bestFor: up.bestFor,
    note: `marketing alias -> ${a.upstream}`,
    createInDb: a.createInDb,
    addToLitellm: a.addToLitellm,
  };
});

// Row sets for each artifact:
//  - bootstrap (t4): real models + aliases that need a product created.
//  - reprice   (t5): real models + ALL aliases (keeps legacy deepseek-chat FX-tracked).
//  - litellm   (yaml): real models + aliases not already hand-listed in config.yaml.
const bootstrapRows = [...rows, ...aliasRows.filter((a) => a.createInDb)];
const repriceRows = [...rows, ...aliasRows];
const yamlRows = [...rows, ...aliasRows.filter((a) => a.addToLitellm)];

// ---- 1. JSON dataset ----------------------------------------------
const dataset = {
  supplier: "Qiniu AI (qnaigc.com)",
  baseUrl: "https://api.qnaigc.com/v1",
  fxRmbPerUsd: FX,
  pricingPolicy: "cost pass-through (no markup); USD per 1M tokens; DeepSeek tiered uses PEAK",
  generatedAt: new Date().toISOString().slice(0, 10),
  textModelCount: rows.length,
  excludedGenerationModels:
    "Kling / Vidu / Doubao-Seedream / MiniMax-H3 image+video generation are on Qiniu's separate async 音视频 API (per-second / per-image pricing), not OpenAI chat/completions, and are not metered by the token ledger. Marketing-catalog display only.",
  models: rows,
  aliases: aliasRows.map((a) => ({
    publicName: a.slug,
    displayName: a.name,
    upstreamQiniuId: a.qiniuId,
    usdPerMillion: a.usdPerMillion,
    note: a.note,
  })),
};
writeFileSync(join(HERE, "qiniu-models.json"), JSON.stringify(dataset, null, 2) + "\n");

// ---- 2. SQL seed (idempotent) -------------------------------------
const DEMO_WORKSPACE = "beb879b5-c64c-4740-b2c2-2a29958576e1";
const sql = [];
sql.push(`-- t4-qiniu-catalog.sql — GENERATED by infra/catalog/build-qiniu-catalog.mjs. DO NOT EDIT BY HAND.`);
sql.push(`-- Onboards Qiniu (qnaigc.com) supplier text models into the commercial catalog.`);
sql.push(`-- Pricing: cost pass-through, USD per 1M tokens, FX ${FX} RMB/USD. Source: qiniu.com/ai/models (RMB/1K).`);
sql.push(`-- Routes point at the local LiteLLM data plane (:4302); LiteLLM maps each alias to openai/<qiniuId>.`);
sql.push(`-- Idempotent: safe to re-run. Apply:`);
sql.push(`--   docker exec -i <pg-container> psql -U <user> -d <db> < infra/postgres/t4-qiniu-catalog.sql`);
sql.push(``);
for (const r of bootstrapRows) {
  const inp = r.usdPerMillion.input.toFixed(8);
  const outp = r.usdPerMillion.output.toFixed(8);
  const cache = r.usdPerMillion.cacheRead.toFixed(8);
  sql.push(`-- ${r.name}  (${r.qiniuId})  [${r.status}]`);
  sql.push(`INSERT INTO model_products (public_name, display_name, default_max_output_tokens)
VALUES ('${r.slug}', '${r.name.replace(/'/g, "''")}', ${r.maxOutputTokens})
ON CONFLICT (public_name) DO NOTHING;`);
  sql.push(`INSERT INTO provider_routes (model_product_id, provider, provider_model, region, endpoint, status, resale_approved, dpa_approved, security_approved, residency_approved, zero_retention, kill_switch, priority)
SELECT mp.id, 'qiniu', '${r.slug}', 'US', 'http://127.0.0.1:4302/v1/chat/completions', 'APPROVED', true, true, true, true, true, false, 100
FROM model_products mp WHERE mp.public_name = '${r.slug}'
ON CONFLICT (model_product_id, provider, provider_model, region) DO NOTHING;`);
  sql.push(`INSERT INTO price_versions (model_product_id, version, currency, input_per_million, output_per_million, cache_read_per_million, effective_from)
SELECT id, 1, 'USD', ${inp}, ${outp}, ${cache}, now()
FROM model_products mp WHERE mp.public_name = '${r.slug}'
  AND NOT EXISTS (SELECT 1 FROM price_versions pv WHERE pv.model_product_id = mp.id AND pv.effective_from <= now() AND (pv.effective_to IS NULL OR pv.effective_to > now()));`);
  sql.push(`INSERT INTO model_entitlements (workspace_id, model_product_id, billing_mode, enabled)
SELECT '${DEMO_WORKSPACE}', mp.id, 'PREPAID', true
FROM model_products mp WHERE mp.public_name = '${r.slug}'
ON CONFLICT (workspace_id, model_product_id) DO NOTHING;`);
  sql.push(``);
}
writeFileSync(join(ROOT, "infra/postgres/t4-qiniu-catalog.sql"), sql.join("\n") + "\n");

// ---- 2b. Reprice migration (versioned, idempotent) ------------------
// t4 seeds version 1 once and never updates it (append-only ledger). When the
// FX changes we must NOT rewrite version 1 — that would silently re-price
// already-captured ledger rows. Instead: close out any currently-effective
// version whose price differs from the target, then insert a NEW version
// (max+1) effective now(). Guards make it idempotent: re-running when the
// effective price already equals the target is a no-op.
const reprice = [];
reprice.push(`-- t5-qiniu-reprice.sql — GENERATED by infra/catalog/build-qiniu-catalog.mjs. DO NOT EDIT BY HAND.`);
reprice.push(`-- Versioned re-price of Qiniu (qnaigc.com) text models to FX ${FX} RMB/USD (cost pass-through).`);
reprice.push(`-- Append-only: closes the prior effective price_version and inserts a new one (version = max+1).`);
reprice.push(`-- Idempotent: safe to re-run; no-op once every product sits at the target price.`);
reprice.push(`-- Apply:`);
reprice.push(`--   docker exec -i <pg-container> psql -U <user> -d <db> < infra/postgres/t5-qiniu-reprice.sql`);
reprice.push(``);
reprice.push(`BEGIN;`);
for (const r of repriceRows) {
  const inp = r.usdPerMillion.input.toFixed(8);
  const outp = r.usdPerMillion.output.toFixed(8);
  const cache = r.usdPerMillion.cacheRead.toFixed(8);
  reprice.push(`-- ${r.name}  (${r.qiniuId})  ->  $${inp}/$${outp} per M`);
  reprice.push(`UPDATE price_versions pv
SET effective_to = now()
FROM model_products mp
WHERE mp.public_name = '${r.slug}'
  AND pv.model_product_id = mp.id
  AND pv.effective_to IS NULL
  AND (pv.input_per_million <> ${inp} OR pv.output_per_million <> ${outp} OR pv.cache_read_per_million <> ${cache});`);
  reprice.push(`INSERT INTO price_versions (model_product_id, version, currency, input_per_million, output_per_million, cache_read_per_million, effective_from)
SELECT mp.id,
       (SELECT COALESCE(MAX(version), 0) + 1 FROM price_versions WHERE model_product_id = mp.id),
       'USD', ${inp}, ${outp}, ${cache}, now()
FROM model_products mp
WHERE mp.public_name = '${r.slug}'
  AND NOT EXISTS (
    SELECT 1 FROM price_versions cur
    WHERE cur.model_product_id = mp.id
      AND cur.effective_to IS NULL
      AND cur.input_per_million = ${inp}
      AND cur.output_per_million = ${outp}
      AND cur.cache_read_per_million = ${cache});`);
  reprice.push(``);
}
reprice.push(`COMMIT;`);
writeFileSync(join(ROOT, "infra/postgres/t5-qiniu-reprice.sql"), reprice.join("\n") + "\n");

// ---- 3. LiteLLM model_list fragment -------------------------------
const yml = [];
yml.push(`# GENERATED by infra/catalog/build-qiniu-catalog.mjs. DO NOT EDIT BY HAND.`);
yml.push(`# Qiniu (qnaigc.com) text models. Paste under model_list: in infra/litellm/config.yaml.`);
yml.push(`# api_base/api_key come from env (QNAIGC_BASE_URL / QNAIGC_API_KEY). NEVER pass DATABASE_URL to LiteLLM.`);
for (const r of yamlRows) {
  yml.push(`  - model_name: ${r.slug}`);
  yml.push(`    litellm_params:`);
  yml.push(`      model: openai/${r.qiniuId}`);
  yml.push(`      api_base: os.environ/QNAIGC_BASE_URL`);
  yml.push(`      api_key: os.environ/QNAIGC_API_KEY`);
}
writeFileSync(join(ROOT, "infra/litellm/qiniu-models.yaml"), yml.join("\n") + "\n");

console.log(`FX=${FX} RMB/USD  text models=${rows.length}  aliases=${aliasRows.length} (bootstrap ${bootstrapRows.length}, reprice ${repriceRows.length}, litellm ${yamlRows.length})`);
console.log(`wrote: infra/catalog/qiniu-models.json`);
console.log(`wrote: infra/postgres/t4-qiniu-catalog.sql`);
console.log(`wrote: infra/postgres/t5-qiniu-reprice.sql`);
console.log(`wrote: infra/litellm/qiniu-models.yaml`);
console.log("\nslug -> qiniuId -> USD in/out per M:");
for (const r of repriceRows) console.log(`  ${r.slug.padEnd(28)} ${r.qiniuId.padEnd(38)} $${r.usdPerMillion.input} / $${r.usdPerMillion.output}${r.status === "alias" ? "  [alias]" : ""}`);
