import Link from "next/link";
import { Logo, Badge } from "@gateway/ui";
import { modelCatalog } from "@gateway/brand/models";

export const metadata = {
  title: { absolute: "Supported LLM Models — DeepSeek, Qwen, Kimi, GLM, MiniMax Pricing | BestLLM" },
  description:
    "Explore DeepSeek, Qwen, Kimi, GLM, and MiniMax models through one OpenAI-compatible API. Pricing per million tokens, context windows, benchmarks, and integration guides for every model.",
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
        <span className="feature-number">MODEL CATALOG / OPENAI-COMPATIBLE LLM API</span>
        <h1>Choose the model. Keep the interface.</h1>
        <p style={{ maxWidth: "42rem" }}>
          Route workloads across DeepSeek, Qwen, Kimi, GLM, and MiniMax through one
          OpenAI-compatible API. Change the <code>model</code> field — same endpoint, same SDK,
          same billing. Every model page includes per-token pricing, context window specs,
          benchmark data, and a working API example.
        </p>
      </section>

      {/* Supported models */}
      <section className="model-spotlight" style={{ borderTop: "none", paddingTop: "2rem" }}>
        <div className="model-spotlight-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>Available on BestLLM</h2>
            <Badge tone="positive">LIVE</Badge>
          </div>
          <p className="model-spotlight-head" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            These {supported.length} models are live and accessible through the OpenAI-compatible
            API at <code>api.bestllm.dev/v1</code>. Each route includes regional routing,
            workspace-level spend controls, and per-token billing. Click through for full
            pricing breakdowns and integration examples.{" "}
            <Link href="/alternatives/openrouter">Migrating from OpenRouter? See the comparison →</Link>
          </p>
          <div className="model-spotlight-grid">
            {supported.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="model-card">
                <div className="model-card-provider">{m.provider}</div>
                <h3>{m.name}</h3>
                <p className="model-card-tagline">{m.tagline}</p>
                <div className="model-card-meta">
                  <span>{m.contextWindow} context</span>
                  <span>·</span>
                  <span>{m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"}/M input</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial models — clearly separated */}
      <section className="model-spotlight" style={{ marginTop: "3rem" }}>
        <div className="model-spotlight-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>Model Reference Pages</h2>
            <Badge tone="signal">REFERENCE ONLY</Badge>
          </div>
          <p className="model-spotlight-head" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            Previous-generation and upcoming models we cover with pricing guides and
            integration references. <strong>These models are not yet available through the
            BestLLM API</strong> — they are editorial content to help you track the model
            landscape. For production workloads, use the live models above.
          </p>
          <div className="model-spotlight-grid">
            {editorial.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="model-card" style={{ opacity: 0.8 }}>
                <div className="model-card-provider">{m.provider}</div>
                <h3>{m.name}</h3>
                <p className="model-card-tagline">{m.tagline}</p>
                <div className="model-card-meta">
                  <span>{m.modalities.join(", ")}</span>
                  <span>·</span>
                  <span style={{ color: "#b45309", fontWeight: 500 }}>Not yet available</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Start Building with BestLLM</h2>
        <p>One API key. Every supported model. OpenAI-compatible format. Switch models by changing one field.</p>
        <div className="article-cta-actions">
          <Link href="/pricing" className="article-btn article-btn-primary">
            View Pricing →
          </Link>
          <Link href="/docs" className="article-btn" style={{ marginLeft: "0.75rem" }}>
            Read the Docs →
          </Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <Logo />
        <span>OpenAI-compatible access to DeepSeek, Qwen, Kimi, GLM, and MiniMax.</span>
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
