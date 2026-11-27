import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { modelCatalog, getModelBySlug, getSupportedModels, type ModelPage } from "@gateway/brand/models";
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
    ? `${model.name} API Pricing & Integration`
    : `${model.name} API: Pricing, Features & Alternatives (2026)`;
  const description = model.supported
    ? `${model.name} by ${model.provider}: ${model.tagline} Per-token pricing, cost calculator, comparison with other models, and OpenAI-compatible API integration through BestLLM.`
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
  const parsePrice = (v: string | undefined): number | null => {
    if (!v || v === "Free" || v === "—" || v === "N/A") return null;
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const numericPrices = model.pricing
    .flatMap((p) => [parsePrice(p.inputPerM), parsePrice(p.outputPerM)])
    .filter((v): v is number => v !== null);

  const lowPrice = numericPrices.length ? Math.min(...numericPrices) : null;
  const highPrice = numericPrices.length ? Math.max(...numericPrices) : null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.name,
    description: model.description,
    brand: { "@type": "Brand", name: model.provider },
    category: model.supported ? "LLM API Service" : "AI Model Reference",
  };

  if (lowPrice !== null) {
    const offers: Record<string, unknown> = {
      "@type": "AggregateOffer",
      lowPrice,
      priceCurrency: "USD",
      offerCount: model.pricing.length,
    };
    if (highPrice !== null && highPrice > lowPrice) {
      offers.highPrice = highPrice;
    }
    jsonLd.offers = offers;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parsePriceNum(v: string): number {
  if (!v || v === "—" || v === "N/A" || v === "Free") return 0;
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatUsd(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

function getInputPrice(m: ModelPage): number {
  return parsePriceNum(m.pricing.find((p) => p.inputPerM !== "—" && p.inputPerM !== "N/A" && p.inputPerM !== "Free")?.inputPerM ?? "0");
}

function getOutputPrice(m: ModelPage): number {
  return parsePriceNum(m.pricing.find((p) => p.outputPerM !== "—" && p.outputPerM !== "N/A" && p.outputPerM !== "Free")?.outputPerM ?? "0");
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="spec-label">{label}</td>
      <td>{value}</td>
    </tr>
  );
}

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
/*  Cost calculator section                                            */
/* ------------------------------------------------------------------ */

function CostCalculator({ model }: { model: ModelPage }) {
  const inputPrice = getInputPrice(model);
  const outputPrice = getOutputPrice(model);

  const scenarios = [
    { label: "10K requests", requests: 10_000, inputTokens: 500, outputTokens: 200 },
    { label: "100K requests", requests: 100_000, inputTokens: 500, outputTokens: 200 },
    { label: "1M requests", requests: 1_000_000, inputTokens: 500, outputTokens: 200 },
  ];

  return (
    <section className="article-section">
      <h2>Cost calculator: what you actually spend</h2>
      <p>
        Estimated cost for {model.name} at BestLLM's per-token pricing. Assumes an average of
        500 input tokens and 200 output tokens per request — adjust for your actual workload.
        All prices are cost pass-through with no hidden markup.
      </p>
      <div className="article-table-wrap">
        <table className="article-table">
          <thead>
            <tr>
              <th>Volume</th>
              <th align="right">Input tokens</th>
              <th align="right">Output tokens</th>
              <th align="right">Total cost</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => {
              const totalInput = s.requests * s.inputTokens;
              const totalOutput = s.requests * s.outputTokens;
              const cost = (totalInput / 1_000_000) * inputPrice + (totalOutput / 1_000_000) * outputPrice;
              return (
                <tr key={s.label}>
                  <td className="t-label">{s.label}</td>
                  <td align="right">{(totalInput / 1_000_000).toFixed(1)}M</td>
                  <td align="right">{(totalOutput / 1_000_000).toFixed(1)}M</td>
                  <td align="right" className="t-strong">{formatUsd(cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="article-note">
        Input: {formatUsd(inputPrice)}/M tokens · Output: {formatUsd(outputPrice)}/M tokens.
        See the <Link href="/pricing">full pricing table</Link> for all models.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Model comparison table                                             */
/* ------------------------------------------------------------------ */

function ComparisonTable({ model }: { model: ModelPage }) {
  const supported = getSupportedModels();
  const others = supported.filter((m) => m.slug !== model.slug);

  return (
    <section className="article-section">
      <h2>How {model.name} compares to other models</h2>
      <p>
        Side-by-side pricing and specs for all models available through BestLLM.{" "}
        {model.name} is highlighted. Switch models by changing the <code>model</code> field —
        same endpoint, same SDK, same API key.
      </p>
      <div className="article-table-wrap">
        <table className="article-table t-wide">
          <thead>
            <tr>
              <th>Model</th>
              <th align="right">Input /M</th>
              <th align="right">Output /M</th>
              <th align="right">Context</th>
              <th>Best for</th>
            </tr>
          </thead>
          <tbody>
            {/* Current model row — highlighted */}
            <tr className="t-current">
              <td className="t-bold">{model.name} ←</td>
              <td align="right" className="t-strong">
                {model.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"}
              </td>
              <td align="right" className="t-strong">
                {model.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—"}
              </td>
              <td align="right">{model.contextWindow}</td>
              <td className="t-small">{model.bestFor.slice(0, 60)}…</td>
            </tr>
            {/* Other models */}
            {others.map((m) => (
              <tr key={m.slug}>
                <td>
                  <Link href={`/models/${m.slug}`} className="t-label">
                    {m.name}
                  </Link>
                </td>
                <td align="right">
                  {m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"}
                </td>
                <td align="right">
                  {m.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—"}
                </td>
                <td align="right">{m.contextWindow}</td>
                <td className="t-small">{m.bestFor.slice(0, 60)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="article-note">
        Read our <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026</Link>{" "}
        guide for a full comparison with benchmarks and use-case recommendations.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  When to switch section                                             */
/* ------------------------------------------------------------------ */

function SwitchingGuide({ model }: { model: ModelPage }) {
  const supported = getSupportedModels();
  const inputPrice = getInputPrice(model);
  const cheaper = supported.filter((m) => m.slug !== model.slug && getInputPrice(m) < inputPrice);
  const biggerContext = supported.filter((m) => m.slug !== model.slug && parseInt(m.contextWindow) > parseInt(model.contextWindow));

  return (
    <section className="article-section">
      <h2>When to consider switching from {model.name}</h2>
      <p>
        {model.name} is a strong choice for {model.bestFor.toLowerCase()} But depending on your
        workload, another model might fit better:
      </p>
      <ul>
        {cheaper.length > 0 && (
          <li>
            <strong>Need lower cost?</strong>{" "}
            {cheaper.map((m, i) => (
              <span key={m.slug}>
                {i > 0 && ", "}
                <Link href={`/models/${m.slug}`}>{m.name}</Link>
              </span>
            ))}{" "}
            {cheaper.length === 1 ? "has" : "have"} a lower input price at{" "}
            {cheaper.map((m) => m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—").join(" / ")}/M tokens.
          </li>
        )}
        {biggerContext.length > 0 && (
          <li>
            <strong>Need more context?</strong>{" "}
            {biggerContext.map((m, i) => (
              <span key={m.slug}>
                {i > 0 && ", "}
                <Link href={`/models/${m.slug}`}>{m.name}</Link>
              </span>
            ))}{" "}
            {biggerContext.length === 1 ? "offers" : "offer"} up to{" "}
            {biggerContext.reduce((max, m) => parseInt(m.contextWindow) > parseInt(max.contextWindow) ? m : max, model).contextWindow} context.
          </li>
        )}
        <li>
          <strong>Switching is instant.</strong> Change the <code>model</code> field in your
          API call — same endpoint, same SDK, same API key. No code changes beyond that one
          field. See the <Link href="/docs">API documentation</Link> for examples.
        </li>
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ section                                                        */
/* ------------------------------------------------------------------ */

function ModelFaq({ model }: { model: ModelPage }) {
  const faqs = model.supported ? [
    {
      q: `What is the pricing for ${model.name} through BestLLM?`,
      a: `${model.name} costs ${model.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"} per million input tokens and ${model.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—"} per million output tokens through BestLLM. Pricing is cost pass-through with no hidden markup. You pay only for the tokens you use — no minimum commitments, no per-request surcharges.`,
    },
    {
      q: `What is the context window for ${model.name}?`,
      a: `${model.name} has a ${model.contextWindow}-token context window with a maximum output of ${model.maxOutput} tokens. This means you can fit ${model.contextWindow === "1M" ? "up to 1 million tokens" : `up to ${model.contextWindow} tokens`} of input — roughly ${model.contextWindow === "1M" ? "a full codebase or book-length document" : model.contextWindow === "256K" ? "a long document or moderate codebase" : "a medium-length document"} in a single request.`,
    },
    {
      q: `Can I use ${model.name} with the OpenAI SDK?`,
      a: `Yes. ${model.name} is accessible through BestLLM's OpenAI-compatible API. Set the base URL to https://api.bestllm.dev/v1 and use your BestLLM API key. The official OpenAI Python, Node.js, and TypeScript SDKs all work without modification beyond the base URL and key.`,
    },
    {
      q: `How does ${model.name} compare to other models on BestLLM?`,
      a: `${model.name} is best suited for ${model.bestFor.toLowerCase()} Other models on BestLLM include ${getSupportedModels().filter((m) => m.slug !== model.slug).slice(0, 3).map((m) => m.name).join(", ")} — each optimized for different workloads. See the comparison table above or read our Best Chinese AI Models 2026 guide for benchmarks.`,
    },
    {
      q: `Is ${model.name} available for production use?`,
      a: `Yes — ${model.name} is live and routable through BestLLM with regional routing (US and EU), workspace-level spend controls, and an immutable billing ledger. Create a workspace, generate an API key, and start making requests immediately.`,
    },
  ] : [
    {
      q: `Is ${model.name} available through BestLLM?`,
      a: `${model.name} is not currently available through the BestLLM API. This page is kept as a reference with pricing and specs. For production workloads, check our supported models — ${getSupportedModels().slice(0, 3).map((m) => m.name).join(", ")} — which are live and accessible through the same OpenAI-compatible API.`,
    },
    {
      q: `What is the pricing for ${model.name}?`,
      a: `${model.name} pricing is ${model.pricing.map((p) => `${p.tier}: ${p.inputPerM !== "—" ? p.inputPerM + " input" : ""}${p.outputPerM !== "—" ? " / " + p.outputPerM + " output" : ""}`).filter(Boolean).join(", ")}. This reflects direct provider pricing; availability through BestLLM may differ.`,
    },
    {
      q: `What should I use instead of ${model.name}?`,
      a: `If you were using ${model.name}, the closest supported alternative on BestLLM is ${getSupportedModels().find((m) => m.provider === model.provider)?.name ?? getSupportedModels()[0].name}. It offers a ${getSupportedModels().find((m) => m.provider === model.provider)?.contextWindow ?? getSupportedModels()[0].contextWindow} context window and is accessible through the same OpenAI-compatible API.`,
    },
  ];

  return (
    <section className="article-section article-faq">
      <h2>Frequently asked questions</h2>
      {faqs.map((faq) => (
        <details key={faq.q}>
          <summary>
            {faq.q}
          </summary>
          <p>
            {faq.a}
          </p>
        </details>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Dedicated integration guides by model slug                         */
/* ------------------------------------------------------------------ */

const guideBySlug: Record<string, { href: string; buttonLabel: string; inlineLabel: string }> = {
  "deepseek-chat": {
    href: "/docs/deepseek-chat-api",
    buttonLabel: "DeepSeek Setup Guide →",
    inlineLabel: "DeepSeek Chat API setup guide",
  },
  "glm-5": {
    href: "/docs/glm-5-api",
    buttonLabel: "GLM-5 Setup Guide →",
    inlineLabel: "GLM-5 API setup guide",
  },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();
  const guide = guideBySlug[model.slug];

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
          {model.supported ? "AVAILABLE ON BESTLLM" : "MODEL REFERENCE"}
        </span>
        <h1>{model.name}{model.supported ? ` API Pricing & Integration` : ` API: Pricing, Features & Alternatives`}</h1>
        <p>{model.description}</p>
        {model.supported && (
          <div className="content-hero-actions">
            <Link href="/pricing" className="article-btn article-btn-primary">
              Get API Key →
            </Link>
            {guide && (
              <Link href={guide.href} className="article-btn">
                {guide.buttonLabel}
              </Link>
            )}
            <Link href="/docs" className="article-btn">
              Read the Docs →
            </Link>
          </div>
        )}
      </section>

      {/* Key specs */}
      <section className="article-section">
        <h2>Key specifications</h2>
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
        <h2>{model.name} pricing</h2>
        <p>
          {model.supported
            ? `Per-token pricing through BestLLM. Cost pass-through with no hidden markup — the price you see is what the ledger bills.`
            : `Reference pricing for ${model.name}. Not currently available through BestLLM.`}
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th align="right">Input (per 1M tokens)</th>
                <th align="right">Output (per 1M tokens)</th>
              </tr>
            </thead>
            <tbody>
              {model.pricing.map((p) => (
                <tr key={p.tier}>
                  <td className="t-label">{p.tier}</td>
                  <td align="right">
                    {p.inputPerM === "—" || p.inputPerM === "N/A" || p.inputPerM === "Free" ? (
                      <span className="t-dash">
                        {p.inputPerM === "Free" ? "Free" : "—"}
                      </span>
                    ) : (
                      p.inputPerM
                    )}
                  </td>
                  <td align="right">
                    {p.outputPerM === "—" || p.outputPerM === "N/A" || p.outputPerM === "Free" ? (
                      <span className="t-dash">
                        {p.outputPerM === "Free" ? "Free" : "—"}
                      </span>
                    ) : (
                      p.outputPerM
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cost calculator — supported models only */}
      {model.supported && <CostCalculator model={model} />}

      {/* Features */}
      <section className="article-section">
        <h2>Features and capabilities</h2>
        <p>
          {model.supported
            ? `${model.name} through BestLLM includes all standard features of the OpenAI-compatible API:`
            : `Key capabilities of ${model.name}:`}`
        </p>
        <ul>
          {model.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {/* API Example */}
      <section className="article-section">
        <h2>API integration example</h2>
        <p>
          {model.supported
            ? `Call ${model.name} through the BestLLM OpenAI-compatible API. Works with the official OpenAI SDK — just set the base URL to https://api.bestllm.dev/v1 and use your BestLLM API key.`
            : `Direct API access for ${model.name}:`}
        </p>
        <pre className="article-code">
          <code>{model.apiExample}</code>
        </pre>
        {model.supported && (
          <p className="article-note">
            {guide ? (
              <>
                Follow the <Link href={guide.href}>{guide.inlineLabel}</Link> for non-streaming{" "}
                <code>curl</code> and Python SDK setup, or see the{" "}
              </>
            ) : (
              "See the "
            )}
            <Link href="/docs">full API documentation</Link> for workspace prerequisites and error
            handling.
          </p>
        )}
      </section>

      {/* Code examples — when provided */}
      {model.codeExamples && model.codeExamples.length > 0 && (
        <section className="article-section">
          <h2>Code examples</h2>
          <p>
            {model.supported
              ? `Ready-to-run ${model.name} snippets through the BestLLM OpenAI-compatible API. Export your API key and copy any block below.`
              : `Ready-to-run ${model.name} snippets for the provider API shown above.`}
          </p>
          {model.codeExamples.map((ex) => (
            <div key={ex.label}>
              <h3>{ex.label}</h3>
              <pre className="article-code">
                <code>{ex.code}</code>
              </pre>
            </div>
          ))}
        </section>
      )}

      {/* Rate limits — when provided */}
      {model.rateLimits && (
        <section className="article-section">
          <h2>Rate limits and concurrency</h2>
          <p>{model.rateLimits.summary}</p>
          <div className="article-table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>Limit</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {model.rateLimits.rows.map((r) => (
                  <tr key={r.label}>
                    <td><strong>{r.label}</strong></td>
                    <td>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {model.rateLimits.notes && model.rateLimits.notes.length > 0 && (
            <ul>
              {model.rateLimits.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Billing & cost controls — when provided */}
      {model.billing && model.billing.length > 0 && (
        <section className="article-section">
          <h2>Billing and cost controls</h2>
          <ul>
            {model.billing.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Comparison table — supported models only */}
      {model.supported && <ComparisonTable model={model} />}

      {/* Switching guide — supported models only */}
      {model.supported && <SwitchingGuide model={model} />}

      {/* Best For */}
      <section className="article-section">
        <h2>Best for</h2>
        <p>{model.bestFor}</p>
      </section>

      {/* FAQ */}
      <ModelFaq model={model} />

      {/* CTA for editorial models */}
      {!model.supported && (
        <section className="article-cta">
          <h2>Need a live model instead?</h2>
          <p>
            BestLLM offers DeepSeek, Qwen, Kimi, GLM, and MiniMax through one OpenAI-compatible
            API with regional routing, spend controls, and transparent per-token billing.
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

      {/* CTA for supported models */}
      {model.supported && (
        <section className="article-cta">
          <h2>Start using {model.name} today</h2>
          <p>
            One API key. Every supported model. OpenAI-compatible format. Switch to {model.name}{" "}
            by changing the <code>model</code> field — no SDK changes required.
          </p>
          <div className="article-cta-actions">
            <Link href="/pricing" className="article-btn article-btn-primary">
              Get Your API Key →
            </Link>
            <Link href="/docs" className="article-btn article-btn-ghost">
              Read the Docs
            </Link>
          </div>
        </section>
      )}

      {/* Links */}
      {model.docsUrl && (
        <section className="article-section">
          <h2>Official documentation</h2>
          <a href={model.docsUrl} target="_blank" rel="noopener noreferrer">
            {model.docsUrl}
          </a>
        </section>
      )}

      {/* Footer */}
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
