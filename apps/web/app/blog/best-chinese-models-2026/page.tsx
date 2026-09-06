import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Best Chinese AI Models 2026: DeepSeek, Qwen, Kimi, GLM Comparison",
  description:
    "Compare the best Chinese AI models in 2026: DeepSeek Chat/Reasoner, Qwen Max/3.8 Max, Kimi K2/K3, GLM-4 Plus, and MiniMax H3. Pricing, benchmarks, features, and API access.",
  openGraph: {
    type: "article",
    title: "Best Chinese AI Models 2026: Complete Comparison Guide",
    description:
      "In-depth comparison of leading Chinese AI models including pricing, context windows, benchmarks, and API compatibility.",
  },
};

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Chinese AI Models 2026: Complete Comparison Guide",
  description:
    "Comprehensive comparison of leading Chinese AI models — DeepSeek, Qwen, Kimi, GLM, and MiniMax — with pricing, benchmarks, and integration guides.",
  datePublished: "2026-09-03",
  dateModified: "2026-09-03",
  author: { "@type": "Organization", name: "Maridian Gateway" },
  publisher: { "@type": "Organization", name: "Maridian Gateway" },
};

/* ------------------------------------------------------------------ */
/*  Model data                                                         */
/* ------------------------------------------------------------------ */

const models = [
  {
    rank: 1, name: "DeepSeek Chat", provider: "DeepSeek", type: "Text",
    context: "128K", input: "$0.27", output: "$1.10", bestFor: "Reasoning & Code",
    supported: true, slug: "deepseek-chat",
    highlight: "Best cost-to-performance ratio among frontier-class models",
  },
  {
    rank: 2, name: "DeepSeek Reasoner", provider: "DeepSeek", type: "Text",
    context: "128K", input: "$0.55", output: "$2.19", bestFor: "Extended Reasoning",
    supported: true, slug: "deepseek-reasoner",
    highlight: "Chain-of-thought reasoning with transparent analysis",
  },
  {
    rank: 3, name: "Qwen Max", provider: "Alibaba Cloud", type: "Text",
    context: "128K", input: "$1.60", output: "$6.40", bestFor: "Enterprise & Multilingual",
    supported: true, slug: "qwen-max",
    highlight: "Top multilingual performance across 29 languages",
  },
  {
    rank: 4, name: "Qwen3.8 Max", provider: "Alibaba Cloud", type: "Text",
    context: "1M", input: "Self-host", output: "Free", bestFor: "Self-Hosted Deployments",
    supported: false, slug: "qwen3-8-max",
    highlight: "#1 open-weight model on BenchAlign (78.66)",
  },
  {
    rank: 5, name: "Kimi K2", provider: "Moonshot AI", type: "Text",
    context: "128K", input: "$0.60", output: "$1.80", bestFor: "Long Context & Agentic",
    supported: true, slug: "kimi-k2",
    highlight: "1T total / 32B active MoE architecture",
  },
  {
    rank: 6, name: "Kimi K3", provider: "Moonshot AI", type: "Text",
    context: "1.05M", input: "$3.00", output: "$15.00", bestFor: "Frontier Reasoning",
    supported: false, slug: "kimi-k3",
    highlight: "#5 on BenchAlign (80.02) — 96% of #1 at 70% lower cost",
  },
  {
    rank: 7, name: "GLM-4 Plus", provider: "Zhipu AI", type: "Text",
    context: "128K", input: "$0.70", output: "$2.10", bestFor: "Chinese-Language Apps",
    supported: true, slug: "glm-4-plus",
    highlight: "Strong Chinese NLP with multimodal understanding",
  },
  {
    rank: 8, name: "MiniMax H3", provider: "MiniMax", type: "Video",
    context: "N/A", input: "—", output: "$0.13/sec", bestFor: "Video Generation",
    supported: false, slug: "minimax-h3",
    highlight: "2K video + native audio at 1/3 competitor pricing",
  },
  {
    rank: 9, name: "MiniMax H3 Max", provider: "MiniMax (fal.ai)", type: "Video",
    context: "N/A", input: "—", output: "$0.08/sec", bestFor: "Rapid Video Prototyping",
    supported: false, slug: "minimax-h3-max",
    highlight: "Post-trained for speed: sub-3s renders at 768P",
  },
];

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <nav className="marketing-nav">
      <Logo />
      <div className="marketing-links">
        <Link href="/platform">Platform</Link>
        <Link href="/models">Models</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/resources">Resources</Link>
      </div>
      <Link className="text-link" href="/pricing">
        Get API Key →
      </Link>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BestChineseModels2026() {
  return (
    <main className="marketing-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      {/* Breadcrumbs */}
      <div className="article-breadcrumb">
        <Link href="/">Home</Link>
        {" / "}
        <Link href="/blog">Blog</Link>
        {" / "}
        <span>Best Chinese Models 2026</span>
      </div>

      {/* Hero */}
      <section className="content-hero">
        <span className="feature-number">MODEL COMPARISON / September 2026</span>
        <h1>Best Chinese AI Models 2026</h1>
        <p style={{ fontSize: "1.05rem", maxWidth: "44rem", lineHeight: 1.6 }}>
          The Chinese AI ecosystem has produced some of the most cost-effective and capable models
          in the world. Here&apos;s a complete comparison of DeepSeek, Qwen, Kimi, GLM, and MiniMax —
          with real pricing, benchmarks, and API integration details.
        </p>
      </section>

      {/* Rankings Table */}
      <section className="article-section">
        <h2>Model Rankings</h2>
        <div className="article-table-wrap">
          <table className="article-table" style={{ minWidth: "700px" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Model</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Context</th>
                <th>Input</th>
                <th>Output</th>
                <th>Best For</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{m.rank}</td>
                  <td>
                    <Link href={`/models/${m.slug}`} style={{ textDecoration: "none", fontWeight: 500 }}>
                      {m.name}
                    </Link>
                    {m.supported && (
                      <span className="pill pill-green" style={{ marginLeft: "0.5rem" }}>
                        on Maridian
                      </span>
                    )}
                  </td>
                  <td>{m.provider}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={m.type === "Video" ? "pill pill-gold" : "pill pill-blue"}>
                      {m.type}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>{m.context}</td>
                  <td style={{ textAlign: "right" }}>{m.input}</td>
                  <td style={{ textAlign: "right" }}>{m.output}</td>
                  <td>{m.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Best for Use Case */}
      <section className="article-section">
        <h2>Best Models by Use Case</h2>
        <div className="article-grid">
          <UseCaseCard
            title="Best for Reasoning"
            model="DeepSeek Reasoner"
            reason="Extended chain-of-thought with transparent reasoning at $0.55/$2.19 per M tokens."
            slug="deepseek-reasoner"
          />
          <UseCaseCard
            title="Best Value Frontier"
            model="Kimi K3"
            reason="BenchAlign #5 (80.02) — 96% of top score at 70% lower output cost."
            slug="kimi-k3"
          />
          <UseCaseCard
            title="Best Open-Weight"
            model="Qwen3.8 Max"
            reason="#1 open-weight model on BenchAlign (78.66). Fully self-hostable."
            slug="qwen3-8-max"
          />
          <UseCaseCard
            title="Best for Coding"
            model="DeepSeek Chat"
            reason="Top coding benchmarks at ~1/10th the cost of comparable frontier models."
            slug="deepseek-chat"
          />
          <UseCaseCard
            title="Best for Video"
            model="MiniMax H3"
            reason="2K video with native audio at $0.13/sec — less than 1/3 competitor pricing."
            slug="minimax-h3"
          />
          <UseCaseCard
            title="Best for Enterprise"
            model="Qwen Max"
            reason="Strong multilingual (29 languages), multimodal, and enterprise ecosystem."
            slug="qwen-max"
          />
          <UseCaseCard
            title="Best for Long Context"
            model="Kimi K2"
            reason="1T-parameter MoE with strong agentic and tool-use performance."
            slug="kimi-k2"
          />
          <UseCaseCard
            title="Best Chinese NLP"
            model="GLM-4 Plus"
            reason="Purpose-built for Chinese language with multimodal understanding."
            slug="glm-4-plus"
          />
        </div>
      </section>

      {/* Provider Comparison */}
      <section className="article-section">
        <h2>Provider Comparison</h2>
        <div className="article-table-wrap">
          <table className="article-table" style={{ minWidth: "600px" }}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Flagship Model</th>
                <th>Strengths</th>
                <th>API Format</th>
              </tr>
            </thead>
            <tbody>
              <ProviderRow
                provider="DeepSeek"
                flagship="DeepSeek Chat"
                strengths="Cost-effective reasoning, coding, open weights"
                format="OpenAI ✓"
              />
              <ProviderRow
                provider="Alibaba Cloud"
                flagship="Qwen Max"
                strengths="Multilingual (29 langs), multimodal, enterprise"
                format="OpenAI ✓"
              />
              <ProviderRow
                provider="Moonshot AI"
                flagship="Kimi K3"
                strengths="1M+ context, agentic, frontier reasoning"
                format="OpenAI ✓"
              />
              <ProviderRow
                provider="Zhipu AI"
                flagship="GLM-4 Plus"
                strengths="Chinese NLP, multimodal, enterprise"
                format="OpenAI ✓"
              />
              <ProviderRow
                provider="MiniMax"
                flagship="MiniMax H3"
                strengths="Video generation, native audio, open weights"
                format="Custom"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Deep Dive */}
      <section className="article-section">
        <h2>Pricing Comparison (Text LLMs)</h2>
        <p>Cost per million tokens for text-based models:</p>
        <div className="article-table-wrap">
          <table className="article-table" style={{ minWidth: "500px" }}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Input</th>
                <th>Output</th>
                <th>100K in + 10K out</th>
              </tr>
            </thead>
            <tbody>
              <PriceRow model="DeepSeek Chat" input="$0.27" output="$1.10" request="$0.038" />
              <PriceRow model="DeepSeek Reasoner" input="$0.55" output="$2.19" request="$0.077" />
              <PriceRow model="Kimi K2" input="$0.60" output="$1.80" request="$0.078" />
              <PriceRow model="GLM-4 Plus" input="$0.70" output="$2.10" request="$0.091" />
              <PriceRow model="Qwen Max" input="$1.60" output="$6.40" request="$0.224" />
              <PriceRow model="Kimi K3" input="$3.00" output="$15.00" request="$0.450" />
              <PriceRow model="Qwen Plus" input="$0.40" output="$1.20" request="$0.052" />
            </tbody>
          </table>
        </div>
        <p className="article-footer-note">
          DeepSeek Chat at $0.038 per 100K-in/10K-out request is approximately 12× cheaper than
          Kimi K3 and 6× cheaper than Qwen Max for comparable workloads.
        </p>
      </section>

      {/* API Compatibility */}
      <section className="article-section">
        <h2>API Compatibility</h2>
        <p>All text-based Chinese models support the OpenAI-compatible chat completions format:</p>
        <pre className="article-code">
          <code>{`# Works with DeepSeek, Qwen, Kimi, and GLM
curl -X POST https://api.maridian.dev/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",  # or qwen-max, kimi-k2, glm-4-plus
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7
  }'`}</code>
        </pre>
        <p style={{ marginTop: "1rem" }}>
          Through Maridian Gateway, all models use the same endpoint, the same auth format,
          and the same request/response schema. Switch models by changing the{" "}
          <code>model</code> field — no SDK changes required.
        </p>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Access All Chinese Models Through One API</h2>
        <p>
          Maridian Gateway provides OpenAI-compatible access to DeepSeek, Qwen, Kimi, and GLM
          with regional routing, workspace-level spend controls, role-based access, and an
          immutable billing ledger. One integration, every model.
        </p>
        <div className="article-cta-actions">
          <Link href="/models" className="article-btn article-btn-primary">
            Explore Supported Models →
          </Link>
          <Link href="/pricing" className="article-btn article-btn-ghost">
            View Pricing Plans
          </Link>
        </div>
      </section>

      <p style={{ maxWidth: "44rem" }}>Read next: <Link href="/blog/deepseek-vs-qwen">DeepSeek vs Qwen comparison</Link> · <Link href="/blog/gpt6-vs-chinese-llms">GPT-6 vs Chinese LLMs routing guide</Link>.</p>

      {/* FAQ */}
      <section className="article-section">
        <h2>Frequently Asked Questions</h2>

        <h3>Which Chinese model is cheapest?</h3>
        <p>
          For text generation, <Link href="/models/deepseek-chat">DeepSeek Chat</Link> is the
          most cost-effective at $0.27 input / $1.10 output per M tokens. For self-hosted
          deployments, Qwen3.8 Max is free to run on your own infrastructure.
        </p>

        <h3>Do Chinese models support OpenAI-compatible APIs?</h3>
        <p>
          Yes — DeepSeek, Qwen, Kimi, and GLM all support the OpenAI chat completions format.
          Through Maridian Gateway, all models share one consistent API surface.
        </p>

        <h3>Which model has the longest context window?</h3>
        <p>
          Kimi K3 has a 1.05M token context window — the largest among evidence-qualified models.
          Kimi K2 and most others offer 128K tokens. Qwen3.8 Max supports 1M tokens.
        </p>

        <h3>What about MiniMax H3 — is it a text model?</h3>
        <p>
          No — MiniMax H3 is a video generation model that creates 2K video with native stereo audio.
          For text LLM APIs, use DeepSeek, Qwen, Kimi, or GLM. See the{" "}
          <Link href="/blog/minimax-h3">MiniMax H3 guide</Link> for the full breakdown.
        </p>

        <h3>Can I use these models in the EU?</h3>
        <p>
          Maridian Gateway supports US and EU regional routing with compliance-aware provider
          selection. Region, retention, and data residency policies are enforced before dispatch.
        </p>
      </section>

      {/* Footer */}
      <footer className="marketing-footer">
        <Logo />
        <span>Model access without operational noise.</span>
        <span>© 2026 Maridian Gateway</span>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

function PriceRow({ model, input, output, request }: { model: string; input: string; output: string; request: string }) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{model}</td>
      <td style={{ textAlign: "right" }}>{input}</td>
      <td style={{ textAlign: "right" }}>{output}</td>
      <td style={{ textAlign: "right" }}>{request}</td>
    </tr>
  );
}

function ProviderRow({ provider, flagship, strengths, format }: {
  provider: string; flagship: string; strengths: string; format: string;
}) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{provider}</td>
      <td>{flagship}</td>
      <td>{strengths}</td>
      <td style={{ textAlign: "center" }}>{format}</td>
    </tr>
  );
}

function UseCaseCard({ title, model, reason, slug }: {
  title: string; model: string; reason: string; slug: string;
}) {
  return (
    <div className="article-card">
      <h3>{title}</h3>
      <b>
        <Link href={`/models/${slug}`}>{model}</Link>
      </b>
      <p>{reason}</p>
    </div>
  );
}
