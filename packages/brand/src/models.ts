/**
 * Programmatic SEO model catalog.
 *
 * Each entry generates a static /models/[slug] page with metadata,
 * pricing table, API example, and JSON-LD structured data.
 *
 * `supported: true`  → available through BestLLM today
 * `supported: false` → editorial reference page (captures search traffic,
 *                       converts to supported models via internal links)
 *
 * Pricing/specs refreshed 2026-09-29 against the Qiniu AI supplier catalog
 * (qiniu.com/ai/models, RMB per 1K tokens), converted to USD per 1M tokens at
 * FX 6.72 (live mid-market USD/CNY on 2026-09-29) on a cost pass-through
 * basis — the same figures the commercial DB (price_versions) bills. See
 * infra/catalog/qiniu-models.json for the full machine-readable dataset.
 */

export interface ModelPage {
  slug: string;
  name: string;
  provider: string;
  providerSlug: string;
  tagline: string;
  description: string;
  supported: boolean;
  contextWindow: string;
  maxOutput: string;
  modalities: string[];
  pricing: { tier: string; inputPerM: string; outputPerM: string }[];
  apiExample: string;
  features: string[];
  bestFor: string;
  benchmarkHighlight?: string;
  releaseDate?: string;
  docsUrl?: string;
  sourceUrl?: string;
  rateLimits?: {
    summary: string;
    rows: { label: string; value: string }[];
    notes?: string[];
  };
  billing?: string[];
  codeExamples?: { label: string; code: string }[];
}

/* ------------------------------------------------------------------ */
/*  Supported models (BestLLM)                                */
/* ------------------------------------------------------------------ */

const supportedModels: ModelPage[] = [
  {
    slug: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    providerSlug: "deepseek",
    tagline: "Frontier reasoning at a fraction of the cost.",
    description:
      "DeepSeek Chat is DeepSeek's flagship general model (V3.2 / V4 generation), delivering frontier-level reasoning, coding, and multilingual performance through an OpenAI-compatible API. Available via BestLLM with US and EU regional routing, workspace-level spend controls, and an immutable billing ledger.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.30", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.19" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Explain quantum computing in one paragraph."}],
    "temperature": 0.7
  }'`,
    features: [
      "128K context window",
      "Strong reasoning and coding benchmarks",
      "Multilingual (English, Chinese, and more)",
      "OpenAI-compatible API format",
      "US and EU regional routing",
    ],
    bestFor: "Reasoning-heavy workloads, code generation, and cost-sensitive production use.",
    benchmarkHighlight: "Top-tier reasoning and coding at roughly 1/10th the cost of comparable frontier models.",
    releaseDate: "2025-01",
    docsUrl: "https://api-docs.deepseek.com/",
    sourceUrl: "https://github.com/deepseek-ai",
    rateLimits: {
      summary:
        "BestLLM enforces workspace- and key-level limits by plan tier. DeepSeek itself limits by account-level concurrency — not RPM/TPM — so throughput depends on how long requests stay in flight.",
      rows: [
        { label: "BestLLM (routed)", value: "Per workspace + per API key, plan-tier defaults; HTTP 429 with Retry-After on exceed" },
        { label: "DeepSeek direct · general route", value: "2,500 concurrent requests per account (deepseek-chat rides the v4.1-flash route)" },
        { label: "Concurrency scope", value: "Account-level; every API key on the account shares one pool" },
        { label: "What counts as concurrent", value: "From send until the response completes; streaming holds the slot for the whole stream" },
        { label: "Over the limit", value: "HTTP 429; higher concurrency via support ticket at no extra fee" },
      ],
      notes: [
        "DeepSeek publishes no RPM/TPM table: short requests yield far higher effective requests-per-second than long ones at the same concurrency cap.",
        "Pass user_id to isolate content-safety, KV-cache and scheduling per end-user. Ordinary accounts pool all user_ids; upgraded accounts get per-user_id caps.",
      ],
    },
    billing: [
      "Per-token: $0.30 / M input, $1.19 / M output — cost pass-through with no markup.",
      "Streaming and non-streaming bill identically: you pay for tokens generated, not connection time.",
      "DeepSeek discounts cache-hit input on repeated prefixes; see the official pricing page for the current cache rate.",
      "Every accepted request stores a versioned price snapshot; the immutable ledger is the billing source of truth.",
      "Workspace spend controls and budgets cap exposure before dispatch; no per-request surcharge and no monthly minimum.",
    ],
    codeExamples: [
      {
        label: "Python (OpenAI SDK)",
        code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-api-key",
)

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Refactor this function for readability."}],
    temperature=0.7,
)
print(resp.choices[0].message.content)`,
      },
      {
        label: "Node.js (OpenAI SDK)",
        code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const resp = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Write unit tests for this module." }],
});
console.log(resp.choices[0].message.content);`,
      },
      {
        label: "Python streaming",
        code: `stream = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Explain TCP backpressure."}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
      },
    ],
  },
  {
    slug: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "DeepSeek",
    providerSlug: "deepseek",
    tagline: "Extended chain-of-thought for complex problems.",
    description:
      "DeepSeek Reasoner is the deliberative-reasoning route through BestLLM, served by DeepSeek's V4 Pro tier — the same V4 generation as DeepSeek Chat, tuned for extended chain-of-thought. Use it for multi-step analysis, mathematical proofs, and tasks requiring deliberate problem-solving, all through the same OpenAI-compatible interface. It is a real, routable model: call it with model \"deepseek-reasoner\" and pay cost pass-through pricing.",
    supported: true,
    contextWindow: "1M",
    maxOutput: "32K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$1.79", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$3.57" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-reasoner",
    "messages": [{"role": "user", "content": "Prove that the square root of 2 is irrational."}]
  }'`,
    features: [
      "Extended chain-of-thought reasoning",
      "1M context window",
      "32K max output tokens",
      "Mathematical and logical analysis",
      "OpenAI-compatible API format",
    ],
    bestFor: "Complex reasoning tasks, mathematical analysis, and multi-step problem solving.",
    benchmarkHighlight: "DeepSeek's V4 Pro reasoning tier — excels on AIME, MATH, and GPQA-style tasks with transparent reasoning chains.",
    releaseDate: "2025-01",
    docsUrl: "https://api-docs.deepseek.com/",
    rateLimits: {
      summary:
        "BestLLM enforces workspace- and key-level limits by plan tier. DeepSeek Reasoner rides the v4-pro reasoning route, which has a lower account-level concurrency cap than the general route.",
      rows: [
        { label: "BestLLM (routed)", value: "Per workspace + per API key, plan-tier defaults; HTTP 429 with Retry-After on exceed" },
        { label: "DeepSeek direct · reasoning route", value: "500 concurrent requests per account (deepseek-reasoner rides v4-pro)" },
        { label: "Concurrency scope", value: "Account-level; every API key on the account shares one pool" },
        { label: "Reasoning holds slots longer", value: "Extended chain-of-thought keeps a request in flight longer, so effective throughput is lower than the general route at the same cap" },
        { label: "Over the limit", value: "HTTP 429; higher concurrency via support ticket at no extra fee" },
      ],
      notes: [
        "No RPM/TPM table: plan capacity around in-flight reasoning requests, not requests-per-minute.",
        "Pass user_id for per-end-user content-safety, KV-cache and scheduling isolation.",
      ],
    },
    billing: [
      "Per-token: $1.79 / M input, $3.57 / M output — cost pass-through with no markup.",
      "Reasoning (chain-of-thought) tokens are billed as output tokens; deep deliberation costs more than a short answer.",
      "1M context / 32K max output: long prompts dominate cost — trim context before escalating to Reasoner.",
      "Every accepted request stores a versioned price snapshot; the immutable ledger is the billing source of truth.",
      "Workspace spend controls and budgets cap exposure before dispatch; no per-request surcharge.",
    ],
    codeExamples: [
      {
        label: "Python (OpenAI SDK)",
        code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-api-key",
)

resp = client.chat.completions.create(
    model="deepseek-reasoner",
    messages=[{"role": "user", "content": "Prove that the square root of 2 is irrational."}],
)
print(resp.choices[0].message.content)`,
      },
      {
        label: "Node.js (OpenAI SDK)",
        code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const resp = await client.chat.completions.create({
  model: "deepseek-reasoner",
  messages: [{ role: "user", content: "Solve this system of equations step by step." }],
});
console.log(resp.choices[0].message.content);`,
      },
      {
        label: "Python streaming (reasoning + answer)",
        code: `stream = client.chat.completions.create(
    model="deepseek-reasoner",
    messages=[{"role": "user", "content": "Prove sqrt(2) is irrational."}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    # reasoning_content carries the chain-of-thought; content the final answer
    print(getattr(delta, "reasoning_content", None) or delta.content or "", end="")`,
      },
    ],
  },
  {
    slug: "qwen3-8-max",
    name: "Qwen3.8 Max",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Alibaba's 2.4T-parameter flagship, now with 1M context.",
    description:
      "Qwen3.8 Max is Alibaba Cloud's current flagship large language model — a 2.4-trillion-parameter Mixture-of-Experts model with a 1M-token context window, strong agentic tool use, and a built-in thinking mode. Access it through BestLLM with predictable per-token pricing, workspace isolation, and regional compliance.",
    supported: true,
    contextWindow: "1M",
    maxOutput: "32K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$1.79", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$5.36" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen3-8-max",
    "messages": [{"role": "user", "content": "Write a Python function to merge two sorted arrays."}]
  }'`,
    features: [
      "1M-token context window",
      "2.4T-parameter Mixture-of-Experts architecture",
      "Built-in thinking / reasoning mode",
      "Strong multilingual and agentic tool use",
      "OpenAI-compatible API format",
    ],
    bestFor: "Enterprise workloads, long-document analysis, and agentic pipelines needing top general capability.",
    benchmarkHighlight: "Alibaba's highest-scoring flagship; leading Chinese model on multilingual and agentic benchmarks.",
    releaseDate: "2026-09",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/",
    sourceUrl: "https://qwen.ai/blog",
  },
  {
    slug: "qwen-plus",
    name: "Qwen Plus",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Balanced performance and cost for production workloads.",
    description:
      "Qwen Plus is the balanced mid-tier of Alibaba's Qwen line, served through BestLLM by Qwen3.7 Plus. It offers a strong balance of capability and cost for general-purpose chat, instruction following, and summarization at a much lower price point than Qwen3.8 Max — ideal for high-volume production use with a 256K-token context window. It is a real, routable model: call it with model \"qwen-plus\" and pay cost pass-through pricing.",
    supported: true,
    contextWindow: "256K",
    maxOutput: "16K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.30", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.19" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen-plus",
    "messages": [{"role": "user", "content": "Summarize this article in 3 bullet points: ..."}]
  }'`,
    features: [
      "256K-token context window",
      "Cost-effective for high-volume use",
      "Strong instruction following",
      "Summarization and extraction",
      "OpenAI-compatible API format",
    ],
    bestFor: "High-volume production workloads where cost efficiency matters.",
    releaseDate: "2026-05",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/",
  },
  {
    slug: "kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    providerSlug: "moonshot",
    tagline: "Open frontier reasoning with a 1M-token context.",
    description:
      "Kimi K3 from Moonshot AI is the latest frontier reasoning model in the Kimi line. It pairs a 1M-token context window with strong agentic and coding performance, and ranks #3 on the Artificial Analysis Intelligence Index — comparable to Claude Opus 4.8 and GPT-5.5 — while remaining open-weight.",
    supported: true,
    contextWindow: "1M",
    maxOutput: "32K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$2.98", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$14.88" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "kimi-k3",
    "messages": [{"role": "user", "content": "Analyze this 1M-token codebase for security vulnerabilities."}]
  }'`,
    features: [
      "1M-token context window",
      "#3 on the Artificial Analysis Intelligence Index",
      "Open-weight frontier reasoning",
      "Strong agentic and coding performance",
      "Transparent reasoning chains",
    ],
    bestFor: "Long-context analysis, deep-reasoning agents, and cost-sensitive frontier workloads.",
    benchmarkHighlight: "#3 on the Artificial Analysis Intelligence Index (score 44) — comparable to Claude Opus 4.8 and GPT-5.5.",
    releaseDate: "2026-07",
    docsUrl: "https://platform.kimi.com/docs/pricing/chat",
    rateLimits: {
      summary:
        "BestLLM enforces workspace- and key-level limits by plan tier. Moonshot tiers Kimi limits by cumulative account top-up across concurrency, RPM, TPM and TPD — shared across models at user level.",
      rows: [
        { label: "BestLLM (routed)", value: "Per workspace + per API key, plan-tier defaults; HTTP 429 with Retry-After on exceed" },
        { label: "Tier 0 (¥0 top-up)", value: "1 concurrent · 3 RPM · 500K TPM · 1.5M TPD" },
        { label: "Tier 1 (¥50)", value: "15 concurrent · 100 RPM · 2M TPM · unlimited TPD" },
        { label: "Tier 2 (¥100)", value: "40 concurrent · 100 RPM · 3M TPM · unlimited TPD" },
        { label: "Tier 3 (¥500)", value: "50 concurrent · 200 RPM · 3M TPM · unlimited TPD" },
        { label: "Tier 4 (¥5,000)", value: "60 concurrent · 200 RPM · 4M TPM · unlimited TPD" },
        { label: "Tier 5 (¥20,000)", value: "100 concurrent · 300 RPM · 5M TPM · unlimited TPD" },
      ],
      notes: [
        "Limits are user-level (not per key) and shared across all Kimi models; whichever of concurrency / RPM / TPM / TPD hits first triggers 429.",
        "Rate limiting reserves request tokens + max_completion_tokens, while billing charges request tokens + actually generated tokens. Set max_completion_tokens tightly so you don't reserve unused quota.",
        "Responses expose X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset headers.",
      ],
    },
    billing: [
      "Per-token via BestLLM: $2.98 / M input, $14.88 / M output — cost pass-through with no markup.",
      "Moonshot direct reference: $3.00 / M input, $15.00 / M output, $0.30 / M cache-hit input.",
      "Billing uses actually generated tokens; rate-limit reservation uses max_completion_tokens (see limits above).",
      "Every accepted request stores a versioned price snapshot; the immutable ledger is the billing source of truth.",
      "Workspace spend controls and budgets cap exposure before dispatch; no per-request surcharge.",
    ],
    codeExamples: [
      {
        label: "Python (OpenAI SDK)",
        code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-api-key",
)

resp = client.chat.completions.create(
    model="kimi-k3",
    messages=[{"role": "user", "content": "Analyze this codebase for security vulnerabilities."}],
    max_completion_tokens=4096,
)
print(resp.choices[0].message.content)`,
      },
      {
        label: "Node.js (OpenAI SDK)",
        code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const resp = await client.chat.completions.create({
  model: "kimi-k3",
  messages: [{ role: "user", content: "Summarize this 1M-token document set." }],
  max_completion_tokens: 4096,
});
console.log(resp.choices[0].message.content);`,
      },
      {
        label: "Python streaming",
        code: `stream = client.chat.completions.create(
    model="kimi-k3",
    messages=[{"role": "user", "content": "Draft an agentic tool-use plan."}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
      },
    ],
  },
  {
    slug: "glm-5",
    name: "GLM-5",
    provider: "Zhipu AI (Z.ai)",
    providerSlug: "zhipu",
    tagline: "Zhipu's current flagship for coding and agents.",
    description:
      "GLM-5 from Zhipu AI (Z.ai) is the current generation of the GLM line, with strong coding, agentic tool use, and Chinese-language understanding. It offers a 200K context window, 128K max output, and competitive pricing for enterprise deployments — with an always-on thinking mode for harder reasoning.",
    supported: true,
    contextWindow: "200K",
    maxOutput: "128K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.60", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$2.68" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "glm-5",
    "messages": [{"role": "user", "content": "Explain the differences between TCP and UDP."}]
  }'`,
    features: [
      "200K context window",
      "128K max output tokens",
      "Strong coding and agentic tool use",
      "Excellent Chinese-language performance",
      "OpenAI-compatible API format",
    ],
    bestFor: "Coding assistants, agentic workflows, and Chinese-language enterprise applications.",
    benchmarkHighlight: "Top-5 Chinese model on 2026 leaderboards; GLM-5.3 extends context to 1M.",
    releaseDate: "2026",
    docsUrl: "https://docs.z.ai/guides/overview/pricing",
    sourceUrl: "https://github.com/THUDM",
  },
  {
    slug: "minimax-m3",
    name: "MiniMax M3",
    provider: "MiniMax",
    providerSlug: "minimax",
    tagline: "Ultra-cheap 1M-context model built for agents.",
    description:
      "MiniMax M3 is MiniMax's current text flagship: a 1M-token-context model priced aggressively for high-volume agentic and long-context workloads. It is one of the cheapest million-token-context models available, making whole-document and whole-repository prompts economically practical.",
    supported: true,
    contextWindow: "1M",
    maxOutput: "32K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input (≤512K)", inputPerM: "$0.31", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.25" },
    ],
    apiExample: `curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax-m3",
    "messages": [{"role": "user", "content": "Summarize the key obligations across this 300-page document set."}]
  }'`,
    features: [
      "1M-token context window",
      "Among the cheapest 1M-context models",
      "Strong agentic and tool-use performance",
      "Long-document analysis",
      "OpenAI-compatible API format",
    ],
    bestFor: "Cost-sensitive long-context analysis and high-volume agent loops.",
    benchmarkHighlight: "1M context at roughly $0.31/$1.25 per M tokens — among the lowest in class.",
    releaseDate: "2026-06",
    docsUrl: "https://platform.minimax.io/docs",
  },
];

/* ------------------------------------------------------------------ */
/*  Editorial / reference models (previous-gen or not on BestLLM)     */
/* ------------------------------------------------------------------ */

const editorialModels: ModelPage[] = [
  {
    slug: "minimax-h3",
    name: "MiniMax H3",
    provider: "MiniMax",
    providerSlug: "minimax",
    tagline: "Open-source omni-modal video generation with native audio.",
    description:
      "MiniMax H3 is a general-purpose omni-modal generative system that creates 2K video with native stereo audio from text, image, video, and audio inputs. It features 33B dense architecture, open weights, and industry-leading price-performance for AI video generation. The fast H3 Max variant (MiniMax-H3-Max, 480P/768P, developed with fal.ai) runs on the same API and is consolidated on this page — see its tiers below. For text LLM workloads, see MiniMax M3.",
    supported: false,
    contextWindow: "N/A (video model)",
    maxOutput: "15 seconds video",
    modalities: ["Text", "Image", "Video", "Audio"],
    pricing: [
      { tier: "H3 · 2K Video", inputPerM: "—", outputPerM: "$0.13/sec" },
      { tier: "H3 · 768P Video", inputPerM: "—", outputPerM: "$0.08/sec" },
      { tier: "H3 Max · 768P", inputPerM: "—", outputPerM: "$0.08/sec" },
      { tier: "H3 Max · 480P", inputPerM: "—", outputPerM: "$0.05/sec" },
      { tier: "768P→2K Regen", inputPerM: "—", outputPerM: "$0.05/sec" },
      { tier: "Context-IR", inputPerM: "$0.90", outputPerM: "$3.60" },
    ],
    apiExample: `curl -X POST https://api.minimax.io/v2/video_generation \\
  -H "Authorization: Bearer $MINIMAX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3",
    "content": [{ "type": "text", "text": "A sunrise over the Pacific Ocean, cinematic wide shot" }],
    "resolution": "2K",
    "duration": 10,
    "ratio": "16:9"
  }'`,
    features: [
      "2K video with native stereo audio",
      "4–15 second clips at 24 FPS",
      "Multimodal input: text, image, video, audio",
      "Open weights (BF16) under Community License",
      "Supports 11 dialogue languages",
      "First-and-last-frame and reference-to-video modes",
      "H3 Max variant (MiniMax-H3-Max): fast 480P/768P generation with image/video/audio references, same endpoint as H3",
      "H3 Max prompt expansion modes: disabled / balanced / quality",
    ],
    bestFor: "AI video generation, creative content, marketing materials, and multimodal production pipelines.",
    benchmarkHighlight: "Price per second is less than 1/3 of comparable models at 2K resolution.",
    releaseDate: "2025-07",
    rateLimits: {
      summary:
        "H3 is a provider-direct async video API (not routed by BestLLM). Submit a task, then poll or receive a callback; MiniMax enforces account-level rate limits and request payload caps.",
      rows: [
        { label: "Task model", value: "Async: POST /v2/video_generation → task_id → GET /v2/query/video_generation/{task_id}" },
        { label: "Rate limit / balance", value: "HTTP 429 rate_limit_error (code 1002) on exceed; 402 insufficient_balance_error when balance runs out" },
        { label: "Max request body", value: "64 MB total — use public URLs for large media (Base64 inflates size ~33%)" },
        { label: "Image input", value: "≤30 MB each; reference images ≤9, first/last frame ≤1 each; 256–5760 px, aspect 0.4–2.5" },
        { label: "Video input", value: "≤50 MB each; ≤3 clips, 2–15 s per clip, total ≤15 s (reference scenario only)" },
        { label: "Audio input", value: "≤15 MB each; ≤3 clips, 2–15 s per clip, total ≤15 s (reference scenario only)" },
        { label: "Prompt / callback", value: "Text prompt ≤7000 chars; callback_url challenge must be returned unchanged within 3 s" },
      ],
      notes: [
        "Concurrency is account-tier based; exceeding it returns 429 — retry with backoff. Image-to-video and reference-to-video roles are mutually exclusive.",
        "Task status values: queued, running, succeeded, failed, cancelled. Only tasks from the last 7 days are queryable; output URLs are time-limited, so download promptly.",
        "H3 Max (MiniMax-H3-Max) supports 480P/768P only (no 2K) and 5–15 s duration; H3 supports 768P/2K and 4–15 s.",
      ],
    },
    billing: [
      "Per generated second (MiniMax pay-as-you-go, USD): H3 2K $0.13/s, H3 768P $0.08/s; H3 Max 768P $0.08/s, 480P $0.05/s; 768P→2K regeneration $0.05/s.",
      "Input media is billed separately from output: reference video charged by duration at the selected output resolution (H3 2K $0.13/s, 768P $0.08/s; H3 Max 768P $0.143/s, 480P $0.0553/s).",
      "Reference images: first 5 per task free on H3 (then $0.04 each); first 2 per task free on H3 Max (then $0.074 each). Audio input is free.",
      "768P→2K regeneration is charged separately and re-bills the original task's input media (first 5 images free, video by original duration).",
      "Context-IR prompt enhancement (MiniMax-H3-Context-IR): $0.90 / M input, $3.60 / M output tokens.",
      "Provider-direct: charges deduct from your MiniMax account balance in USD; H3 video is not routed or billed by BestLLM.",
    ],
    codeExamples: [
      {
        label: "Python (submit + poll)",
        code: `import os, time, requests

BASE = "https://api.minimax.io/v2"
HEADERS = {"Authorization": f"Bearer {os.environ['MINIMAX_API_KEY']}"}

# 1. Submit an async text-to-video task (prompt goes in the content array)
submit = requests.post(f"{BASE}/video_generation", headers=HEADERS, json={
    "model": "MiniMax-H3",
    "content": [{"type": "text", "text": "A sunrise over the Pacific, cinematic wide shot"}],
    "resolution": "2K",
    "duration": 10,
    "ratio": "16:9",
})
task_id = submit.json()["task_id"]

# 2. Poll until finished: queued / running / succeeded / failed / cancelled
while True:
    task = requests.get(f"{BASE}/query/video_generation/{task_id}", headers=HEADERS).json()["task"]
    if task["status"] in ("succeeded", "failed", "cancelled"):
        break
    time.sleep(5)

# Output URL is time-limited — download or store it promptly
print(task["content"]["url"] if task["status"] == "succeeded" else task.get("error"))`,
      },
      {
        label: "Node.js (H3 Max, fetch)",
        code: `const BASE = "https://api.minimax.io/v2";
const headers = {
  Authorization: \`Bearer \${process.env.MINIMAX_API_KEY}\`,
  "Content-Type": "application/json",
};

// H3 Max: fast 480P/768P variant — same endpoint, switch the model field
const submit = await fetch(\`\${BASE}/video_generation\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "MiniMax-H3-Max",
    content: [{ type: "text", text: "A neon-lit Tokyo street in the rain" }],
    resolution: "768P",
    duration: 5,
    ratio: "16:9",
  }),
}).then((r) => r.json());

let task;
do {
  await new Promise((r) => setTimeout(r, 5000));
  task = await fetch(\`\${BASE}/query/video_generation/\${submit.task_id}\`, { headers })
    .then((r) => r.json())
    .then((j) => j.task);
} while (task.status === "queued" || task.status === "running");

console.log(task.status === "succeeded" ? task.content.url : task.error);`,
      },
    ],
    docsUrl: "https://platform.minimax.io/docs/guides/pricing-paygo",
    sourceUrl: "https://huggingface.co/MiniMaxAI/MiniMax-H3",
  },
];

/* ------------------------------------------------------------------ */
/*  Combined catalog                                                   */
/* ------------------------------------------------------------------ */

export const modelCatalog: ModelPage[] = [...supportedModels, ...editorialModels];

export function getModelBySlug(slug: string): ModelPage | undefined {
  return modelCatalog.find((m) => m.slug === slug);
}

export function getAllModelSlugs(): string[] {
  return modelCatalog.map((m) => m.slug);
}

export function getSupportedModels(): ModelPage[] {
  return modelCatalog.filter((m) => m.supported);
}

export function getEditorialModels(): ModelPage[] {
  return modelCatalog.filter((m) => !m.supported);
}
