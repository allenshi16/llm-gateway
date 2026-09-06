/**
 * Programmatic SEO model catalog.
 *
 * Each entry generates a static /models/[slug] page with metadata,
 * pricing table, API example, and JSON-LD structured data.
 *
 * `supported: true`  → available through Maridian Gateway today
 * `supported: false` → editorial reference page (captures search traffic,
 *                       converts to supported models via internal links)
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
/*  Supported models (Maridian Gateway)                                */
/* ------------------------------------------------------------------ */

const supportedModels: ModelPage[] = [
  {
    slug: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    providerSlug: "deepseek",
    tagline: "Frontier reasoning at a fraction of the cost.",
    description:
      "DeepSeek Chat delivers frontier-level reasoning, coding, and multilingual performance through an OpenAI-compatible API. Available via Maridian Gateway with US and EU regional routing, workspace-level spend controls, and an immutable billing ledger.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.27", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.10" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
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
    benchmarkHighlight: "Top-tier reasoning benchmarks at ~1/10th the cost of comparable frontier models.",
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
      "DeepSeek Reasoner extends the DeepSeek family with extended chain-of-thought reasoning. Use it for multi-step analysis, mathematical proofs, and tasks requiring deliberative problem-solving — all through the same OpenAI-compatible interface.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "16K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.55", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$2.19" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-reasoner",
    "messages": [{"role": "user", "content": "Prove that the square root of 2 is irrational."}]
  }'`,
    features: [
      "Extended chain-of-thought reasoning",
      "128K context window",
      "16K max output tokens",
      "Mathematical and logical analysis",
      "OpenAI-compatible API format",
    ],
    bestFor: "Complex reasoning tasks, mathematical analysis, and multi-step problem solving.",
    benchmarkHighlight: "Excels on AIME, MATH, and GPQA benchmarks with transparent reasoning chains.",
    releaseDate: "2025-01",
    docsUrl: "https://api-docs.deepseek.com/",
  },
  {
    slug: "qwen-max",
    name: "Qwen Max",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Alibaba's most capable general-purpose model.",
    description:
      "Qwen Max is Alibaba Cloud's flagship large language model, offering strong general reasoning, coding, and multilingual capabilities. Access it through Maridian Gateway with predictable pricing, workspace isolation, and regional compliance.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text", "Image"],
    pricing: [
      { tier: "Input", inputPerM: "$1.60", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$6.40" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "Write a Python function to merge two sorted arrays."}]
  }'`,
    features: [
      "128K context window",
      "Strong multilingual performance (29 languages)",
      "Multimodal: text + image understanding",
      "Code generation and analysis",
      "Alibaba Cloud ecosystem integration",
    ],
    bestFor: "Enterprise workloads requiring strong multilingual support and multimodal understanding.",
    benchmarkHighlight: "Top Chinese model on multilingual benchmarks; competitive with GPT-4-class models.",
    releaseDate: "2024-09",
    docsUrl: "https://help.aliyun.com/zh/model-studio/",
  },
  {
    slug: "qwen-plus",
    name: "Qwen Plus",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Balanced performance and cost for production workloads.",
    description:
      "Qwen Plus offers a strong balance of capability and cost. It handles general-purpose chat, instruction following, and summarization at a lower price point than Qwen Max — ideal for high-volume production use.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.40", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.20" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen-plus",
    "messages": [{"role": "user", "content": "Summarize this article in 3 bullet points: ..."}]
  }'`,
    features: [
      "128K context window",
      "Cost-effective for high-volume use",
      "Strong instruction following",
      "Summarization and extraction",
      "OpenAI-compatible API format",
    ],
    bestFor: "High-volume production workloads where cost efficiency matters.",
  },
  {
    slug: "kimi-k2",
    name: "Kimi K2",
    provider: "Moonshot AI",
    providerSlug: "moonshot",
    tagline: "Long-context specialist with trillion-scale architecture.",
    description:
      "Kimi K2 from Moonshot AI is a Mixture-of-Experts model with 1 trillion total parameters and 32 billion active. It excels at long-context tasks, agentic workflows, and tool use — with a 128K context window at aggressive pricing.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$0.60", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$1.80" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "kimi-k2",
    "messages": [{"role": "user", "content": "Analyze this 50-page contract and identify key obligations."}]
  }'`,
    features: [
      "128K context window",
      "1T total / 32B active parameters (MoE)",
      "Strong agentic and tool-use performance",
      "Long-document analysis",
      "OpenAI-compatible API format",
    ],
    bestFor: "Long-context analysis, agentic workflows, and document-heavy tasks.",
    benchmarkHighlight: "Top open-weights MoE model; competitive with closed-source frontier models on agentic benchmarks.",
    releaseDate: "2025-07",
  },
  {
    slug: "glm-4-plus",
    name: "GLM-4 Plus",
    provider: "Zhipu AI",
    providerSlug: "zhipu",
    tagline: "Zhipu AI's flagship model for enterprise applications.",
    description:
      "GLM-4 Plus from Zhipu AI is a multimodal large language model with strong reasoning, code generation, and Chinese language understanding. It supports text and image inputs and offers competitive pricing for enterprise deployments.",
    supported: true,
    contextWindow: "128K",
    maxOutput: "4K",
    modalities: ["Text", "Image"],
    pricing: [
      { tier: "Input", inputPerM: "$0.70", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$2.10" },
    ],
    apiExample: `curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $MARIDIAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "glm-4-plus",
    "messages": [{"role": "user", "content": "Explain the differences between TCP and UDP."}]
  }'`,
    features: [
      "128K context window",
      "Multimodal: text + image input",
      "Strong Chinese language performance",
      "Code generation and analysis",
      "OpenAI-compatible API format",
    ],
    bestFor: "Chinese-language applications, enterprise deployments requiring multimodal understanding.",
    releaseDate: "2024-06",
    sourceUrl: "https://github.com/THUDM",
  },
];

/* ------------------------------------------------------------------ */
/*  Editorial / reference models (not yet on Maridian)                 */
/* ------------------------------------------------------------------ */

const editorialModels: ModelPage[] = [
  {
    slug: "minimax-h3",
    name: "MiniMax H3",
    provider: "MiniMax",
    providerSlug: "minimax",
    tagline: "Open-source omni-modal video generation with native audio.",
    description:
      "MiniMax H3 is a general-purpose omni-modal generative system that creates 2K video with native stereo audio from text, image, video, and audio inputs. Released July 31, 2026, it features 33B dense architecture, open weights, and industry-leading price-performance for AI video generation.",
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
  {
    slug: "kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    providerSlug: "moonshot",
    tagline: "Frontier reasoning at 96% of top scores with 70% lower output cost.",
    description:
      "Kimi K3 from Moonshot AI is the latest frontier reasoning model, scoring 80.02 on the BenchAlign leaderboard. It offers 96% of the top model's performance at an output price 70% lower — making it one of the best value frontier models available.",
    supported: false,
    contextWindow: "1.05M",
    maxOutput: "N/A",
    modalities: ["Text"],
    pricing: [
      { tier: "Input", inputPerM: "$3.00", outputPerM: "—" },
      { tier: "Output", inputPerM: "—", outputPerM: "$15.00" },
    ],
    apiExample: `curl -X POST https://api.moonshot.cn/v1/chat/completions \\
  -H "Authorization: Bearer $MOONSHOT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "kimi-k3",
    "messages": [{"role": "user", "content": "Analyze this 1M-token codebase for security vulnerabilities."}]
  }'`,
    features: [
      "1.05M context window — largest in class",
      "80.02 BenchAlign score (#5 globally)",
      "96% of #1 score at 70% lower output price",
      "Strong agentic and coding performance",
      "Reasoning model with transparent chains",
    ],
    bestFor: "Long-context analysis, cost-sensitive frontier reasoning, and agentic workflows.",
    benchmarkHighlight: "#5 on BenchAlign leaderboard (80.02) with best value-to-performance ratio among frontier models.",
    releaseDate: "2025-08",
    docsUrl: "https://platform.moonshot.cn/docs",
  },
  {
    slug: "qwen3-8-max",
    name: "Qwen3.8 Max",
    provider: "Alibaba Cloud",
    providerSlug: "alibaba",
    tagline: "Best open-weight model on BenchAlign at 78.66.",
    description:
      "Qwen3.8 Max is Alibaba's latest open-weight reasoning model, scoring 78.66 on BenchAlign — the highest among all open-weight models. It features 1M context, strong reasoning (96 on reasoning benchmarks), and is fully self-hostable.",
    supported: false,
    contextWindow: "1M",
    maxOutput: "N/A",
    modalities: ["Text"],
    pricing: [
      { tier: "Self-hosted", inputPerM: "Free", outputPerM: "Free" },
    ],
    apiExample: `# Self-hosted via vLLM or SGLang
python -m vllm.entrypoints.openai.api_server \\
  --model Qwen/Qwen3.8-Max \\
  --host 0.0.0.0 --port 8000`,
    features: [
      "1M context window",
      "#1 open-weight model on BenchAlign (78.66)",
      "96 on reasoning benchmarks",
      "94 on math benchmarks",
      "Fully self-hostable (BF16)",
      "Apache 2.0 compatible license",
    ],
    bestFor: "Self-hosted deployments requiring top open-weight performance without API costs.",
    benchmarkHighlight: "#1 open-weight model (78.66); 96 reasoning score; 94 math score.",
    releaseDate: "2025-08",
    sourceUrl: "https://qwen.ai/blog",
  },
  {
    slug: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    providerSlug: "deepseek",
    tagline: "The open-source model that changed the cost equation.",
    description:
      "DeepSeek V3 is the open-weight foundation that proved frontier performance doesn't require frontier pricing. With MoE architecture and 128K context, it remains the reference point for cost-effective open-source LLMs.",
    supported: false,
    contextWindow: "128K",
    maxOutput: "8K",
    modalities: ["Text"],
    pricing: [
      { tier: "Self-hosted", inputPerM: "Free", outputPerM: "Free" },
      { tier: "DeepSeek API", inputPerM: "$0.27", outputPerM: "$1.10" },
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
