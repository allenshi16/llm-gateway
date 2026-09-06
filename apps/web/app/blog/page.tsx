import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";

export const metadata: Metadata = {
  title: "Blog — LLM Pricing, Guides & Chinese AI Model Comparisons",
  description:
    "Developer guides, pricing breakdowns, and comparison articles for DeepSeek, Qwen, Kimi, GLM, MiniMax, and the broader LLM API ecosystem.",
  openGraph: {
    type: "website",
    title: "Blog — Maridian Gateway",
    description: "LLM pricing guides, model comparisons, and API integration resources.",
  },
};

const articles = [
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
    slug: "/blog/minimax-h3",
    title: "MiniMax H3 API: Complete Pricing & Integration Guide",
    description:
      "Full pricing breakdown ($0.13/sec 2K, $0.08/sec 768P), architecture deep-dive, API integration examples, open-weight details, and comparison with Kling, Seedance, and Wan.",
    date: "2026-09-03",
    category: "Model Guide",
    readTime: "8 min",
    tags: ["MiniMax", "Video Generation", "API Pricing"],
  },
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
          {[
            { slug: "deepseek-chat", name: "DeepSeek Chat" },
            { slug: "deepseek-reasoner", name: "DeepSeek Reasoner" },
            { slug: "qwen-max", name: "Qwen Max" },
            { slug: "qwen3-8-max", name: "Qwen3.8 Max" },
            { slug: "kimi-k2", name: "Kimi K2" },
            { slug: "kimi-k3", name: "Kimi K3" },
            { slug: "glm-4-plus", name: "GLM-4 Plus" },
            { slug: "minimax-h3", name: "MiniMax H3" },
          ].map((m) => (
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
        <span>© 2026 Maridian Gateway</span>
      </footer>
    </main>
  );
}
