import Link from "next/link";
import type { Metadata } from "next";
import { brand, publicNavigation } from "@gateway/brand";
import { Badge, Button, Card, Logo } from "@gateway/ui";
import { consoleLogInUrl } from "../lib/console-url";
import { modelCatalog } from "@gateway/brand/models";

export const metadata: Metadata = {
  title: "OpenAI-Compatible LLM API Gateway | DeepSeek, Qwen, Kimi",
  description:
    "Maridian Gateway is a multi-tenant LLM API gateway with OpenAI-compatible access to DeepSeek, Qwen, Kimi, and GLM — with regional routing, spend controls, and an immutable billing ledger.",
};

export default async function HomePage() {
  const signInUrl = await consoleLogInUrl();
  const supported = modelCatalog.filter((m) => m.supported);

  return (
    <main className="marketing-shell">
      <nav className="marketing-nav">
        <Logo />
        <div className="marketing-links">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
        <div className="marketing-actions">
          <Link href={signInUrl}>Sign in</Link>
          <Button>Start building</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <Badge tone="signal">OpenAI-compatible gateway</Badge>
          <h1>{brand.tagline}</h1>
          <p>
            {brand.description} Ship with predictable spend, region-aware routing, and a single
            OpenAI-compatible LLM API across DeepSeek, Qwen, Kimi, GLM, and more — built as a
            secure, multi-tenant gateway for teams of any size.
          </p>
          <div className="hero-actions">
            <Button>Get your API key</Button>
            <Link className="text-link" href="/platform">Explore the platform →</Link>
          </div>
          <div className="hero-proof">
            <span>Private by default</span>
            <span>EU + US regions</span>
            <span>Immutable billing</span>
          </div>
        </div>
        <Card className="signal-panel">
          <div className="panel-kicker">ROUTE / HEALTH</div>
          <div className="route-row">
            <span className="route-dot" />
            <strong>deepseek-chat</strong>
            <Badge tone="positive">healthy</Badge>
          </div>
          <div className="route-chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="panel-stats">
            <span><small>p95 latency</small><b>642ms</b></span>
            <span><small>region</small><b>eu-west</b></span>
          </div>
        </Card>
      </section>

      {/* Features */}
      <section className="feature-grid">
        <Card>
          <span className="feature-number">01</span>
          <h2>One endpoint, approved routes.</h2>
          <p>
            Give developers a familiar OpenAI-compatible API while your team controls models,
            regions, fallbacks, and provider approvals.
          </p>
        </Card>
        <Card>
          <span className="feature-number">02</span>
          <h2>Spend you can explain.</h2>
          <p>
            Reservations, captures, releases, price snapshots, and append-only ledger entries
            keep usage and invoices aligned.
          </p>
        </Card>
        <Card>
          <span className="feature-number">03</span>
          <h2>Built for serious teams.</h2>
          <p>
            Organizations, workspaces, RBAC, audit trails, and short-lived private dispatch
            assertions are part of the control plane.
          </p>
        </Card>
      </section>

      {/* SEO: Featured models section */}
      <section className="model-spotlight">
        <div className="model-spotlight-inner">
          <div className="model-spotlight-head">
            <h2>Available models</h2>
            <p>
              One API key. Every supported model. OpenAI-compatible format. Switch models
              by changing the <code>model</code> field — no SDK changes required.
            </p>
          </div>
          <div className="model-spotlight-grid">
            {supported.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="model-card">
                <span className="model-card-provider">{m.provider}</span>
                <h3>{m.name}</h3>
                <p className="model-card-tagline">{m.tagline}</p>
                <div className="model-card-meta">
                  <span>{m.contextWindow} context</span>
                  <span>·</span>
                  <span>{m.pricing[0]?.inputPerM} input</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="model-spotlight-more">
            <Link href="/models" className="text-link">View all models →</Link>
          </p>
        </div>
      </section>

      {/* SEO: Blog teaser */}
      <section className="blog-teaser">
        <div className="blog-teaser-inner">
          <div className="blog-teaser-head">
            <h2>From the blog</h2>
            <Link href="/blog" className="text-link">All articles →</Link>
          </div>
          <div className="blog-teaser-grid">
            <Link href="/blog/best-chinese-models-2026" className="blog-card">
              <span className="blog-card-kicker">Model Comparison</span>
              <h3>Best Chinese AI Models 2026</h3>
              <p>DeepSeek, Qwen, Kimi, GLM — pricing, benchmarks, and use-case recommendations.</p>
              <span className="blog-card-read">Read guide</span>
            </Link>
            <Link href="/blog/minimax-h3" className="blog-card">
              <span className="blog-card-kicker">Video</span>
              <h3>MiniMax H3 API Guide</h3>
              <p>Complete pricing, architecture, and integration guide for the hottest video model.</p>
              <span className="blog-card-read">Read guide</span>
            </Link>
          </div>
        </div>
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
