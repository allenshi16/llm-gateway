import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";
import { modelCatalog } from "@gateway/brand/models";

export const metadata: Metadata = {
  title: "Blog — LLM Pricing, Guides & Chinese AI Model Comparisons",
  description:
    "Developer guides, pricing breakdowns, and comparison articles for DeepSeek, Qwen, Kimi, GLM, MiniMax, and the broader LLM API ecosystem.",
  openGraph: {
    type: "website",
    title: "Blog — BestLLM",
    description: "LLM pricing guides, model comparisons, and API integration resources.",
  },
};

const articles = [
  {
    slug: "/blog/best-chinese-models-2026",
    title: "Best Chinese AI Models 2026: DeepSeek, Qwen, Kimi, GLM Comparison",
    description:
      "Comprehensive comparison of the top Chinese AI models with real pricing, benchmarks, use-case recommendations, and API compatibility analysis.",
    date: "2026-09-03",
    category: "Comparison",
    readTime: "10 min",
    tags: ["DeepSeek", "Qwen", "Kimi", "GLM", "Chinese AI"],
  },
  {
    slug: "/blog/deepseek-vs-qwen",
    title: "DeepSeek vs Qwen (2026): Which Chinese LLM Should You Use?",
    description:
      "Workload-based comparison of DeepSeek and Qwen: pricing, context windows, coding vs multilingual strengths, and routing advice through one OpenAI-compatible API.",
    date: "2026-09-06",
    category: "Model Comparison",
    readTime: "7 min",
    tags: ["DeepSeek", "Qwen", "Comparison"],
  },
  {
    slug: "/blog/gpt6-vs-chinese-llms",
    title: "GPT-6 vs Chinese LLMs: Building a Multi-Model API Mix",
    description:
      "A routing framework for mixing GPT-6 with DeepSeek, Qwen and Kimi: where frontier models earn their cost, and how escalation tiers cut API bills.",
    date: "2026-09-06",
    category: "Routing Strategy",
    readTime: "6 min",
    tags: ["GPT-6", "Multi-Model", "Routing"],
  },
  {
    slug: "/blog/minimax-h3",
    title: "MiniMax Models Tutorial: How to Choose & Integrate M3, H3, and H3 Max",
    description:
      "A decision framework plus copy-paste integration steps: M3 for text via BestLLM, H3 for 2K video via the MiniMax API, and H3 Max for fast prototyping via fal.ai — with cost controls and common pitfalls.",
    date: "2026-11-14",
    category: "Tutorial",
    readTime: "9 min",
    tags: ["MiniMax", "M3", "H3", "Integration"],
  },
  {
    slug: "/blog/what-is-jev-typesafe",
    title: "What Is Jev? TypeSafe AI's 'System One' Decision Model Explained",
    description:
      "Jev returns type-safe structured values with calibrated probabilities — not text. What it does, $0.042/MTok pricing, the api.typesafe.ai surface, and how it pairs with an LLM gateway for routing, guardrails and scoring.",
    date: "2026-09-25",
    category: "Model Guide",
    readTime: "6 min",
    tags: ["Jev", "TypeSafe AI", "Decision Model"],
  },
  {
    slug: "/blog/jev-vs-laya-alternatives",
    title: "Jev vs Laya vs AnyJev (2026): Open-Source Decision Model Alternatives",
    description:
      "Comparing TypeSafe AI's Jev against open-source decision models — Laya (Convai Innovations), Nokia's AnyJev and Contrastive-LM's CLM-8B — on latency, cost, accuracy and self-hosting, with honest caveats on vendor-reported benchmarks.",
    date: "2026-09-25",
    category: "Comparison",
    readTime: "7 min",
    tags: ["Jev", "Laya", "AnyJev", "Open Source"],
  },
];

export default function BlogIndex() {
  return (
    <main className="marketing-shell">
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

      <section className="content-hero">
        <span className="feature-number">BLOG / GUIDES &amp; COMPARISONS</span>
        <h1>Developer resources for the LLM API ecosystem</h1>
        <p style={{ maxWidth: "42rem" }}>
          Pricing breakdowns, model comparisons, and integration guides to help you choose
          the right LLM API for your workload.
        </p>
      </section>

      {/* Article list */}
      <section style={{ padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={a.slug}
              className="blog-index-card"
            >
              <div className="blog-index-meta">
                <span className="pill pill-blue">{a.category}</span>
                <span>{a.date}</span>
                <span>{a.readTime}</span>
              </div>
              <h2>{a.title}</h2>
              <p>{a.description}</p>
              <div className="blog-index-tags">
                {a.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Placeholder for future articles */}
        <div className="blog-index-empty">
          <p style={{ margin: 0 }}>More guides and comparisons coming soon.</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            Subscribe to get notified when we publish new content.
          </p>
        </div>
      </section>

      {/* Internal linking: featured models */}
      <section className="article-section">
        <h2>Explore Model Pages</h2>
        <p>Individual pricing, specs, and API examples for every model we cover:</p>
        <div className="blog-index-model-links">
          {modelCatalog
            .slice()
            .sort((a, b) => Number(b.supported) - Number(a.supported))
            .map((m) => (
              <Link
                key={m.slug}
                href={`/models/${m.slug}`}
                className="blog-index-model-link"
              >
                {m.name}
              </Link>
            ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <Logo />
        <span>Model access without operational noise.</span>
        <span>© 2026 BestLLM</span>
        <div className="footer-badges">
          <a href="https://thesaasdir.com" rel="dofollow">
            <img src="/badges/thesaasdir.svg" alt="Featured on TheSaaSDir" width="160" height="44" />
          </a>
          <a href="https://semilaunch.com" target="_blank" rel="noopener">
            <img src="/badges/semilaunch.png" alt="Featured on SemiLaunch" width="220" height="77" />
          </a>
        </div>
      </footer>
    </main>
  );
}
