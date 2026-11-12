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
    slug: "qwen-max",
    name: "Qwen Max (2024)",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Previous-generation Alibaba flagship — superseded by Qwen3.8 Max.",
    description:
      "Qwen Max was Alibaba Cloud's flagship large language model of the 2024–2025 generation. It has been superseded by Qwen3.8 Max (1M context, 2.4T-parameter MoE). This page is kept as a reference; for current workloads use Qwen3.8 Max or Qwen Plus through BestLLM.",
    supported: false,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text", "Image"],
    pricing: [
      { tier: "Input", inputPerM: "$1.60", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$6.40" },
    ],
    apiExample: `# Previous generation — see Qwen3.8 Max for the current flagship
curl -X POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \\
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
    features: [
      "128K context window",
      "Multilingual (29 languages)",
      "Multimodal: text + image understanding",
      "Superseded by Qwen3.8 Max",
    ],
    bestFor: "Legacy integrations; new projects should use Qwen3.8 Max.",
    releaseDate: "2024-09",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/",
  },
  {
    slug: "kimi-k2",
    name: "Kimi K2 (2025)",
    provider: "Moonshot AI",
    providerSlug: "moonshot",
    tagline: "Previous-gen long-context MoE — superseded by Kimi K3.",
    description:
      "Kimi K2 was Moonshot AI's 1-trillion-parameter (32B active) Mixture-of-Experts model released in mid-2025. It has been superseded by Kimi K3, which adds a 1M-token context and frontier reasoning. This page is kept as a reference; use Kimi K3 through BestLLM for current workloads.",
    supported: false,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.60", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.80" },
    ],
    apiExample: `# Previous generation — see Kimi K3 for the current flagship
curl -X POST https://api.moonshot.cn/v1/chat/completions \\
  -H "Authorization: Bearer $MOONSHOT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "kimi-k2",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
    features: [
      "128K context window",
      "1T total / 32B active parameters (MoE)",
      "Strong agentic and tool-use performance",
      "Superseded by Kimi K3",
    ],
    bestFor: "Legacy integrations; new projects should use Kimi K3.",
    releaseDate: "2025-07",
    docsUrl: "https://platform.kimi.com/docs/pricing/chat",
  },
  {
    slug: "glm-4-plus",
    name: "GLM-4 Plus (2024)",
    provider: "Zhipu AI",
    providerSlug: "zhipu",
    tagline: "Previous-gen Zhipu flagship — superseded by GLM-5.",
    description:
      "GLM-4 Plus was Zhipu AI's flagship multimodal model of the 2024 generation. It has been superseded by the GLM-5 line (GLM-5 / GLM-5.3) with stronger coding, agentic tool use, and larger context. This page is kept as a reference; use GLM-5 through BestLLM for current workloads.",
    supported: false,
    contextWindow: "128K",
    maxOutput: "4K",
    modalities: ["Text", "Image"],
    pricing: [
      { tier: "Input", inputPerM: "$0.70", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$2.10" },
    ],
    apiExample: `# Previous generation — see GLM-5 for the current flagship
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \\
  -H "Authorization: Bearer $ZHIPU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "glm-4-plus",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
    features: [
      "128K context window",
      "Multimodal: text + image input",
      "Strong Chinese-language performance",
      "Superseded by GLM-5",
    ],
    bestFor: "Legacy integrations; new projects should use GLM-5.",
    releaseDate: "2024-06",
    sourceUrl: "https://github.com/THUDM",
  },
  {
    slug: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    providerSlug: "deepseek",
    tagline: "The open-source model that changed the cost equation.",
    description:
      "DeepSeek V3 is the open-weight foundation that proved frontier performance doesn't require frontier pricing. With MoE architecture and 128K context, it remains the reference point for cost-effective open-source LLMs and the basis for the current DeepSeek Chat / Reasoner API models.",
    supported: false,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Self-hosted", inputPerM: "Free", outputPerM: "Free" },
      { tier: "DeepSeek API", inputPerM: "$0.30", outputPerM: "$1.19" },
    ],
    apiExample: `# Via DeepSeek API
curl -X POST https://api.deepseek.com/chat/completions \\
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
    features: [
      "128K context window",
      "MoE architecture (efficient inference)",
      "Open weights on Hugging Face",
      "Competitive with GPT-4 class models",
      "Aggressive pricing via DeepSeek API",
    ],
    bestFor: "Self-hosted deployments and cost-sensitive production use.",
    releaseDate: "2024-12",
    sourceUrl: "https://huggingface.co/deepseek-ai",
  },
  {
    slug: "minimax-h3",
    name: "MiniMax H3",
    provider: "MiniMax",
    providerSlug: "minimax",
    tagline: "Open-source omni-modal video generation with native audio.",
    description:
      "MiniMax H3 is a general-purpose omni-modal generative system that creates 2K video with native stereo audio from text, image, video, and audio inputs. It features 33B dense architecture, open weights, and industry-leading price-performance for AI video generation. For text LLM workloads, see MiniMax M3.",
    supported: false,
    contextWindow: "N/A (video model)",
    maxOutput: "15 seconds video",
    modalities: ["Text", "Image", "Video", "Audio"],
    pricing: [
      { tier: "2K Video", inputPerM: "—", outputPerM: "$0.13/sec" },
      { tier: "768P Video", inputPerM: "—", outputPerM: "$0.08/sec" },
      { tier: "768P→2K Regen", inputPerM: "—", outputPerM: "$0.05/sec" },
      { tier: "Context-IR", inputPerM: "$0.90", outputPerM: "$3.60" },
    ],
    apiExample: `curl -X POST https://api.minimax.io/v2/video_generation \\
  -H "Authorization: Bearer $MINIMAX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3",
    "prompt": "A sunrise over the Pacific Ocean, cinematic wide shot",
    "resolution": "2K",
    "duration": 10
  }'`,
    features: [
      "2K video with native stereo audio",
      "4–15 second clips at 24 FPS",
      "Multimodal input: text, image, video, audio",
      "Open weights (BF16) under Community License",
      "Supports 11 dialogue languages",
      "First-and-last-frame and reference-to-video modes",
    ],
    bestFor: "AI video generation, creative content, marketing materials, and multimodal production pipelines.",
    benchmarkHighlight: "Price per second is less than 1/3 of comparable models at 2K resolution.",
    releaseDate: "2025-07",
    docsUrl: "https://platform.minimax.io/docs/guides/pricing-paygo",
    sourceUrl: "https://huggingface.co/MiniMaxAI/MiniMax-H3",
  },
  {
    slug: "minimax-h3-max",
    name: "MiniMax H3 Max",
    provider: "MiniMax (via fal.ai)",
    providerSlug: "fal",
    tagline: "Post-trained H3 variant optimized for speed and prompt adherence.",
    description:
      "MiniMax H3 Max is fal.ai's post-trained variant of MiniMax H3, optimized for stronger prompt adherence, better aesthetics, and faster inference. It generates 768P video with sub-3-second render times for 5-second clips. Currently available exclusively on fal.ai.",
    supported: false,
    contextWindow: "N/A (video model)",
    maxOutput: "15 seconds video",
    modalities: ["Text", "Image"],
    pricing: [
      { tier: "480P Video", inputPerM: "—", outputPerM: "$0.05/sec" },
      { tier: "768P Video", inputPerM: "—", outputPerM: "$0.08/sec" },
    ],
    apiExample: `curl -X POST https://fal.ai/minimax-h3/max \\
  -H "Authorization: Bearer $FAL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax/h3-max",
    "prompt": "A cat astronaut floating in space, 16:9",
    "duration": 5,
    "resolution": "768p"
  }'`,
    features: [
      "768P output optimized for speed",
      "Sub-3-second render for 5-second clips",
      "Stronger prompt adherence than base H3",
      "5 free generations per day for signed-in users",
      "Open weights planned by fal.ai",
    ],
    bestFor: "Rapid prototyping, high-volume video generation, and speed-critical creative workflows.",
    releaseDate: "2025-08",
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
