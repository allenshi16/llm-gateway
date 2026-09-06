import Link from "next/link";
import { Logo } from "@gateway/ui";
import { modelCatalog } from "@gateway/brand/models";

export const metadata = {
  title: "Supported LLM Models — DeepSeek, Qwen, Kimi, GLM",
  description:
    "Explore approved DeepSeek, Qwen, Kimi, and GLM model routes through one OpenAI-compatible API. Pricing, context windows, and integration guides for every model.",
};

export default function ModelsPage() {
  const supported = modelCatalog.filter((m) => m.supported);
  const editorial = modelCatalog.filter((m) => !m.supported);

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
        <span className="feature-number">MODEL CATALOG / APPROVED ROUTES</span>
        <h1>Choose the model. Keep the interface.</h1>
        <p style={{ maxWidth: "42rem" }}>
          Route workloads across leading Chinese and global model families while preserving
          one integration surface for your developers.
        </p>
      </section>

      {/* Supported models */}
      <section className="model-spotlight" style={{ borderTop: "none", paddingTop: "2rem" }}>
        <div className="model-spotlight-inner">
          <h2>Available on Maridian Gateway</h2>
          <p className="model-spotlight-head" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            These models are live and accessible through our OpenAI-compatible API with
            regional routing, spend controls, and usage tracking.
          </p>
          <div className="model-spotlight-grid">
            {supported.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="model-card">
                <div className="model-card-provider">{m.provider}</div>
                <h3>{m.name}</h3>
                <p className="model-card-tagline">{m.tagline}</p>
                <div className="model-card-meta">
                  <span>{m.contextWindow} context</span>
                  <span>{m.modalities.join(", ")}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial models */}
      <section className="model-spotlight">
        <div className="model-spotlight-inner">
          <h2>Model Reference Pages</h2>
          <p className="model-spotlight-head" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            Additional models we cover with pricing and integration guides. Not yet available
            through Maridian Gateway — but useful reference material.
          </p>
          <div className="model-spotlight-grid">
            {editorial.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="model-card">
                <div className="model-card-provider">{m.provider}</div>
                <h3>{m.name}</h3>
                <p className="model-card-tagline">{m.tagline}</p>
                <div className="model-card-meta">
                  <span>{m.modalities.join(", ")}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Start Building</h2>
        <p>One API key. Every supported model. OpenAI-compatible format.</p>
        <div className="article-cta-actions">
          <Link href="/pricing" className="article-btn article-btn-primary">
            View Pricing →
          </Link>
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
