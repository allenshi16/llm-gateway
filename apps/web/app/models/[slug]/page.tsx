import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { modelCatalog, getModelBySlug, type ModelPage } from "@gateway/brand/models";
import { Card, Logo } from "@gateway/ui";

/* ------------------------------------------------------------------ */
/*  Static params for build-time generation                            */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return modelCatalog.map((m) => ({ slug: m.slug }));
}

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return {};

  const title = model.supported
    ? `${model.name} API Pricing & Integration — Maridian Gateway`
    : `${model.name} API: Pricing, Features & Alternatives (2026)`;
  const description = model.supported
    ? `${model.name} by ${model.provider}: ${model.tagline} Access through Maridian Gateway with OpenAI-compatible API, regional routing, and usage controls.`
    : `${model.name} by ${model.provider}: ${model.tagline} Complete pricing breakdown, API integration guide, and comparison with alternatives.`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD structured data                                            */
/* ------------------------------------------------------------------ */

function JsonLd({ model }: { model: ModelPage }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.name,
    description: model.description,
    brand: { "@type": "Brand", name: model.provider },
    category: model.supported ? "LLM API Service" : "AI Model Reference",
    offers: model.pricing.length
      ? {
          "@type": "AggregateOffer",
          lowPrice: model.pricing[0]?.outputPerM ?? model.pricing[0]?.inputPerM,
          priceCurrency: "USD",
          offerCount: model.pricing.length,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Nav (matches existing marketing pages)                             */
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
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  return (
    <main className="marketing-shell">
      <JsonLd model={model} />
      <Nav />

      {/* Breadcrumbs */}
      <div className="article-breadcrumb">
        <Link href="/">Home</Link>
        {" / "}
        <Link href="/models">Models</Link>
        {" / "}
        <span>{model.name}</span>
      </div>

      {/* Hero */}
      <section className="content-hero">
        <span className="feature-number">
          {model.supported ? "AVAILABLE ON MARIDIAN" : "MODEL REFERENCE"}
        </span>
        <h1>{model.name}</h1>
        <p style={{ fontSize: "1.1rem", maxWidth: "42rem" }}>{model.description}</p>
        {model.supported && (
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/pricing" className="article-btn article-btn-primary">
              Start using {model.name} →
            </Link>
          </div>
        )}
      </section>

      {/* Key specs */}
      <section className="article-section">
        <h2>Key Specifications</h2>
        <div className="article-table-wrap">
          <table className="article-table">
            <tbody>
              <SpecRow label="Provider" value={model.provider} />
              <SpecRow label="Context Window" value={model.contextWindow} />
              <SpecRow label="Max Output" value={model.maxOutput} />
              <SpecRow label="Modalities" value={model.modalities.join(", ")} />
              {model.releaseDate && <SpecRow label="Release Date" value={model.releaseDate} />}
              {model.benchmarkHighlight && <SpecRow label="Benchmark" value={model.benchmarkHighlight} />}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="article-section">
        <h2>Pricing</h2>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th style={{ textAlign: "right" }}>Input (per 1M tokens)</th>
                <th style={{ textAlign: "right" }}>Output (per 1M tokens)</th>
              </tr>
            </thead>
            <tbody>
              {model.pricing.map((p) => (
                <tr key={p.tier}>
                  <td style={{ fontWeight: 500 }}>{p.tier}</td>
                  <td style={{ textAlign: "right" }}>{p.inputPerM}</td>
                  <td style={{ textAlign: "right" }}>{p.outputPerM}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features */}
      <section className="article-section">
        <h2>Features</h2>
        <ul>
          {model.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {/* API Example */}
      <section className="article-section">
        <h2>API Integration</h2>
        <p>
          {model.supported
            ? `Use the OpenAI-compatible API through Maridian Gateway:`
            : `Direct API access:`}
        </p>
        <pre className="article-code">
          <code>{model.apiExample}</code>
        </pre>
      </section>

      {/* Best For */}
      <section className="article-section">
        <h2>Best For</h2>
        <p>{model.bestFor}</p>
      </section>

      {/* CTA */}
      {!model.supported && (
        <section className="article-cta">
          <h2>Need Text Generation Instead?</h2>
          <p>
            Maridian Gateway offers DeepSeek, Qwen, Kimi, and GLM through one OpenAI-compatible API
            with regional routing, spend controls, and an immutable billing ledger.
          </p>
          <div className="article-cta-actions">
            <Link href="/models" className="article-btn article-btn-primary">
              View Supported Models →
            </Link>
            <Link href="/pricing" className="article-btn article-btn-ghost">
              See Pricing
            </Link>
          </div>
        </section>
      )}

      {/* Links */}
      {model.docsUrl && (
        <section className="article-section">
          <h2>Official Documentation</h2>
          <a href={model.docsUrl} target="_blank" rel="noopener noreferrer">
            {model.docsUrl}
          </a>
        </section>
      )}

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
      <td style={{ fontWeight: 500, width: "40%" }}>{label}</td>
      <td>{value}</td>
    </tr>
  );
}
