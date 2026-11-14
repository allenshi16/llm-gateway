import Link from "next/link";
import type { Metadata } from "next";
import { brand, publicNavigation } from "@gateway/brand";
import { getSupportedModels, type ModelPage } from "@gateway/brand/models";
import { Logo } from "@gateway/ui";
import { consoleLogInUrl } from "../../../lib/console-url";
import { SectionNav, CodeTabs, FeeCalculator, type CodeTab } from "./interactive";

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

const PAGE_PATH = "/alternatives/openrouter";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestllm.dev";

export const metadata: Metadata = {
  title: "OpenRouter Alternative for Chinese Models (2026)",
  description:
    "Switch from OpenRouter to BestLLM for DeepSeek, Qwen, Kimi, GLM & MiniMax. Side-by-side pricing, no 5.5% credit fee, US/EU regional routing, an auditable ledger, and a two-field migration — just base_url and model.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: "article",
    title: "OpenRouter Alternative for Chinese Models (2026)",
    description:
      "Purpose-built OpenAI-compatible gateway for Chinese LLMs. No 5.5% credit top-up fee, real per-token prices for every model, US/EU regional policy, and a reversible two-field migration.",
    url: PAGE_PATH,
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const inputOf = (m: ModelPage) => m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—";
const outputOf = (m: ModelPage) => m.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—";

const NAV_ITEMS = [
  { id: "why", label: "Why switch" },
  { id: "compare", label: "Compare" },
  { id: "pricing", label: "Pricing" },
  { id: "migrate", label: "Migrate" },
  { id: "cost", label: "Cost & savings" },
  { id: "faq", label: "FAQ" },
];

/* ------------------------------------------------------------------ */
/*  Migration code (only base_url + model change from OpenRouter)      */
/* ------------------------------------------------------------------ */

const CODE_TABS: CodeTab[] = [
  {
    id: "curl",
    label: "cURL",
    highlight: [0, 4],
    caption:
      "From OpenRouter: swap the host to api.bestllm.dev/v1 and the model to deepseek-chat (drop the provider prefix). Send your BestLLM key as the bearer token.",
    code: `curl https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Explain quantum computing in one paragraph."}]
  }'`,
  },
  {
    id: "python",
    label: "Python",
    highlight: [3, 8],
    caption:
      "Two fields change from OpenRouter: base_url and model. The OpenAI SDK, message format, streaming, and tool calls stay identical — no new dependency.",
    code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-key",
)

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Explain quantum computing in one paragraph."}],
)
print(resp.choices[0].message.content)`,
  },
  {
    id: "node",
    label: "Node.js",
    highlight: [3, 8],
    caption:
      "Same OpenAI Node SDK. Change baseURL and model, point apiKey at your BestLLM key. OpenRouter used model: \"deepseek/deepseek-chat\" — BestLLM uses \"deepseek-chat\".",
    code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const resp = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Explain quantum computing in one paragraph." }],
});
console.log(resp.choices[0].message.content);`,
  },
];

/* ------------------------------------------------------------------ */
/*  Comparison rows (OpenRouter vs BestLLM)                            */
/* ------------------------------------------------------------------ */

type Verdict = "yes" | "no" | "partial";
interface CompareRow {
  dim: string;
  or: { v: Verdict; text: string; note?: string };
  best: { v: Verdict; text: string; note?: string };
}

const COMPARE_ROWS: CompareRow[] = [
  {
    dim: "Catalog focus",
    or: { v: "partial", text: "Broad global catalog", note: "300+ models across many providers" },
    best: { v: "yes", text: "Chinese & Asian frontier models", note: "Curated, production-approved routes" },
  },
  {
    dim: "Chinese-model coverage",
    or: { v: "partial", text: "DeepSeek, Qwen, some Kimi/GLM", note: "Availability varies by upstream provider" },
    best: { v: "yes", text: "DeepSeek, Qwen, Kimi, GLM, MiniMax", note: "First-class, all live today" },
  },
  {
    dim: "DeepSeek Chat input price",
    or: { v: "yes", text: "$0.30 / M tokens", note: "Provider pass-through" },
    best: { v: "yes", text: "$0.30 / M tokens", note: "Same pass-through rate" },
  },
  {
    dim: "Token-price markup",
    or: { v: "yes", text: "None on tokens" },
    best: { v: "yes", text: "None — cost pass-through" },
  },
  {
    dim: "Credit / top-up fee",
    or: { v: "no", text: "5.5% on credit purchases", note: "Min $0.80; +5% for crypto top-ups" },
    best: { v: "yes", text: "No top-up fee", note: "You pay the token cost, full stop" },
  },
  {
    dim: "Regional routing (US / EU)",
    or: { v: "partial", text: "Provider-dependent", note: "No workspace-level region pinning" },
    best: { v: "yes", text: "Workspace US/EU policy", note: "Enforced before dispatch" },
  },
  {
    dim: "Failover / fallback",
    or: { v: "yes", text: "Automatic provider fallback", note: "Mature multi-provider routing" },
    best: { v: "yes", text: "Policy-controlled fallback", note: "Stays within approved regions" },
  },
  {
    dim: "Billing transparency",
    or: { v: "partial", text: "Per-request cost shown", note: "Credit fee billed separately" },
    best: { v: "yes", text: "Append-only ledger", note: "Price snapshot recorded per request" },
  },
  {
    dim: "Spend controls",
    or: { v: "partial", text: "Key-level credit limits" },
    best: { v: "yes", text: "Workspace budgets + reservations", note: "Real-time cost during streaming" },
  },
  {
    dim: "Prompt data handling",
    or: { v: "partial", text: "Varies by route", note: "Discounted routing may log prompts" },
    best: { v: "yes", text: "Private by default" },
  },
  {
    dim: "Production SLA",
    or: { v: "no", text: "No public uptime SLA", note: "Standard tier" },
    best: { v: "partial", text: "Enterprise terms on request", note: "Workspace isolation included" },
  },
];

function Mark({ v }: { v: Verdict }) {
  const cls = v === "yes" ? "alt-yes" : v === "no" ? "alt-no" : "alt-partial";
  const glyph = v === "yes" ? "✓ " : v === "no" ? "✕ " : "~ ";
  return <span className={cls}>{glyph}</span>;
}

/* ------------------------------------------------------------------ */
/*  FAQ (also emitted as FAQPage JSON-LD)                              */
/* ------------------------------------------------------------------ */

interface Faq {
  q: string;
  a: string;
  cta?: { href: string; label: string };
}

const FAQS: Faq[] = [
  {
    q: "Is BestLLM a real OpenRouter alternative for Chinese models?",
    a: "Yes. BestLLM is an OpenAI-compatible gateway focused on the Chinese and Asian model ecosystem — DeepSeek, Qwen, Kimi, GLM, and MiniMax — with US/EU regional routing, workspace spend controls, and an immutable billing ledger. OpenRouter covers a broader global catalog; BestLLM is purpose-built for teams whose production workload runs on Chinese models and who need compliance-aware routing and an auditable per-token bill.",
    cta: { href: "/models", label: "Browse all models" },
  },
  {
    q: "What actually changes when I migrate from OpenRouter?",
    a: "Two fields in your code: base_url and model. Point the OpenAI SDK at https://api.bestllm.dev/v1 and drop the provider prefix from the model string (OpenRouter's deepseek/deepseek-chat becomes deepseek-chat). You also swap in your BestLLM API key. The SDK, message format, streaming, function calling, and response shapes are unchanged — no new dependency and no adapter layer.",
    cta: { href: "/docs", label: "Read the quickstart" },
  },
  {
    q: "Can I roll back to OpenRouter?",
    a: "Yes, instantly. The migration is two configuration values, so rolling back means reverting base_url and model to their OpenRouter values and using your OpenRouter key again. There is no data migration, no schema change, and no lock-in — the API is stateless. Many teams keep both keys configured and route a canary percentage to BestLLM before a full cutover, so a rollback is a single config flip.",
  },
  {
    q: "Is it pay-as-you-go or prepaid?",
    a: "Pay-as-you-go. BestLLM bills per million input and output tokens at the rates listed on each model page, on a cost pass-through basis with no top-up fee, no per-request surcharge, and no minimum commitment. You are charged for the tokens you actually use. This differs from OpenRouter's prepaid-credit model, where buying credits adds a 5.5% fee (minimum $0.80). Optional plan tiers (Starter, Team, Enterprise) add workspace features but do not change the per-token model prices.",
    cta: { href: "/pricing", label: "See plans and pricing" },
  },
  {
    q: "How does pricing compare to OpenRouter?",
    a: "The per-token model prices are the same pass-through rates — DeepSeek Chat is $0.30/M input on both. The difference is the credit top-up fee: OpenRouter adds 5.5% (min $0.80) when you purchase credits, while BestLLM adds no top-up fee. On $2,000 of monthly token usage that is roughly $110/month, or about $1,320/year, kept rather than paid in fees. Use the calculator above to model your own spend.",
  },
  {
    q: "Which Chinese models are available right now?",
    a: "Seven models are live and routable: DeepSeek Chat, DeepSeek Reasoner, Qwen3.8 Max, Qwen Plus, Kimi K3, GLM-5, and MiniMax M3. Each has its own page with full per-token pricing, context-window specs, and integration examples. New models are added as they reach production stability.",
    cta: { href: "/models", label: "View the model catalog" },
  },
  {
    q: "Do you support US/EU regional routing and failover?",
    a: "Yes. Every route carries explicit regional policy configured at the workspace level and enforced before a request leaves your boundary — no cross-region fallback unless your policy allows it. Fallback between approved providers is policy-controlled, so failover stays inside the regions you have authorized. This matters for EU data residency, US export controls, and internal compliance frameworks.",
    cta: { href: "/platform", label: "How the platform works" },
  },
  {
    q: "Will my existing OpenAI SDK code, streaming, and tool calls work?",
    a: "Yes. BestLLM implements the OpenAI Chat Completions request and response format. The official OpenAI Python, Node.js, and TypeScript SDKs work with only the base URL and key changed. Streaming, function calling, tool use, and error codes follow the OpenAI convention, so existing code keeps working beyond the two configuration values.",
    cta: { href: "/docs", label: "API documentation" },
  },
];

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

function JsonLd() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "OpenRouter Alternative", item: `${SITE_URL}${PAGE_PATH}` },
    ],
  };
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "BestLLM LLM API Gateway",
    serviceType: "OpenAI-compatible LLM API gateway",
    provider: { "@type": "Organization", name: brand.name, url: SITE_URL },
    areaServed: ["US", "EU"],
    description: brand.description,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function OpenRouterAlternativePage() {
  const consoleUrl = await consoleLogInUrl();
  const supported = getSupportedModels();

  return (
    <main className="marketing-shell">
      <JsonLd />

      {/* Top navigation */}
      <nav className="marketing-nav">
        <Logo />
        <div className="marketing-links">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
        <div className="marketing-actions">
          <Link href={consoleUrl}>Sign in</Link>
          <Link className="text-link" href={consoleUrl}>Get API Key →</Link>
        </div>
      </nav>

      <SectionNav items={NAV_ITEMS} ctaHref={consoleUrl} />

      {/* Hero — answers "why switch", not a company intro */}
      <header className="alt-wrap alt-hero alt-anchor" id="top">
        <span className="feature-number">OPENROUTER ALTERNATIVE · 2026</span>
        <h1>
          Switch from OpenRouter when <em>Chinese models</em> are your production workload.
        </h1>
        <p className="alt-hero-lead">
          Same OpenAI-compatible API, same SDK — but <strong>no 5.5% credit top-up fee</strong>,
          first-class DeepSeek, Qwen, Kimi, GLM, and MiniMax with real per-token prices, US/EU
          regional policy enforced before dispatch, and an append-only ledger finance can reconcile.
          Migration is two fields: <code>base_url</code> and <code>model</code>. Rolling back is the
          same two fields in reverse.
        </p>
        <div className="alt-hero-actions">
          <Link href={consoleUrl} className="article-btn article-btn-primary">Get your API key →</Link>
          <Link href="/pricing" className="article-btn article-btn-ghost">See pricing</Link>
          <Link href="#compare" className="text-link">Jump to the comparison ↓</Link>
        </div>
        <div className="alt-stats">
          <div className="alt-stat"><b>5.5%</b><span>OpenRouter credit fee you stop paying</span></div>
          <div className="alt-stat"><b>{supported.length}</b><span>Chinese models live today</span></div>
          <div className="alt-stat"><b>2</b><span>fields to migrate: base_url + model</span></div>
          <div className="alt-stat"><b>US · EU</b><span>region-pinned routing</span></div>
        </div>
      </header>

      {/* Why switch */}
      <section className="article-section alt-anchor" id="why">
        <h2>Why teams move off OpenRouter for Chinese models</h2>
        <p>
          OpenRouter is a capable broad-catalog router. The reasons to switch are specific: the fee
          you pay to load credits, the depth of Chinese-model coverage, where inference runs, and how
          cleanly the bill reconciles.
        </p>
        <div className="alt-reasons">
          <div className="alt-reason">
            <span className="alt-reason-kicker">All-in cost</span>
            <h3>Stop paying 5.5% to buy credits.</h3>
            <p>
              OpenRouter passes through token prices but adds a 5.5% fee (min $0.80) on credit
              purchases, plus 5% for crypto. BestLLM bills the token cost with no top-up fee — the
              price on the model page is the price the ledger charges.
            </p>
          </div>
          <div className="alt-reason">
            <span className="alt-reason-kicker">Model depth</span>
            <h3>Chinese models as first-class routes.</h3>
            <p>
              DeepSeek, Qwen, Kimi, GLM, and MiniMax are curated and production-approved, each with a
              dedicated pricing page, context specs, and examples — not an afterthought in a global
              list whose availability shifts with upstream providers.
            </p>
          </div>
          <div className="alt-reason">
            <span className="alt-reason-kicker">Compliance</span>
            <h3>US/EU routing pinned by policy.</h3>
            <p>
              Regional policy is set at the workspace and enforced before a request leaves your
              boundary. No cross-region fallback unless you allow it — built for EU data residency
              and US export-control requirements.
            </p>
          </div>
          <div className="alt-reason">
            <span className="alt-reason-kicker">Accountability</span>
            <h3>A ledger that reconciles to the token.</h3>
            <p>
              Reservations, captures, and releases keep cost accurate during streaming, and a price
              snapshot is recorded per request. Append-only entries map every call to a line-item
              charge — not a monthly aggregate you have to trust.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="article-section alt-anchor" id="compare">
        <h2>OpenRouter vs BestLLM, item by item</h2>
        <p>
          The dimensions that decide a production migration: per-token price, model coverage,
          regional routing, failover, and billing transparency. BestLLM is the highlighted column.
        </p>
        <div className="alt-compare-wrap">
          <table className="alt-compare">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>OpenRouter</th>
                <th className="alt-col-best">BestLLM</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.dim}>
                  <td className="alt-dim">{row.dim}</td>
                  <td>
                    <Mark v={row.or.v} />{row.or.text}
                    {row.or.note && <span className="alt-cell-note">{row.or.note}</span>}
                  </td>
                  <td className="alt-col-best">
                    <Mark v={row.best.v} />{row.best.text}
                    {row.best.note && <span className="alt-cell-note">{row.best.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="alt-note">
          ✓ strength · ~ partial / varies · ✕ gap. OpenRouter figures reflect its public pricing as of
          2026 (credit fee, BYOK, and routing policies); confirm current terms at{" "}
          <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">openrouter.ai</a>.
          Most &ldquo;OpenRouter alternative&rdquo; pages skip the part that matters for Chinese models
          — the actual per-token price of each model. That table is next.
        </p>
      </section>

      {/* Chinese-model pricing */}
      <section className="article-section alt-anchor" id="pricing">
        <h2>Every supported Chinese model, with real per-token prices</h2>
        <p>
          Cost pass-through, USD per million tokens — the same figures the ledger bills. No top-up
          fee on any of them. Open a model page for context specs, benchmarks, and integration code.
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Provider</th>
                <th align="right">Input / M</th>
                <th align="right">Output / M</th>
                <th align="right">Context</th>
              </tr>
            </thead>
            <tbody>
              {supported.map((m) => (
                <tr key={m.slug}>
                  <td>
                    <Link href={`/models/${m.slug}`} className="alt-model-link">{m.name}</Link>
                  </td>
                  <td>{m.provider}</td>
                  <td align="right" className="alt-price-best">{inputOf(m)}</td>
                  <td align="right" className="alt-price-best">{outputOf(m)}</td>
                  <td align="right">{m.contextWindow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="alt-note">
          Prices refreshed against the supplier catalog on a cost pass-through basis. See the{" "}
          <Link href="/pricing">full pricing page</Link> for plan tiers and the complete table, or the{" "}
          <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026</Link> guide for
          benchmarks and use-case picks.
        </p>
      </section>

      {/* Migration code */}
      <section className="article-section alt-anchor" id="migrate">
        <h2>Copy-ready migration: change two fields</h2>
        <p>
          Highlighted lines are the only code changes from OpenRouter — <code>base_url</code> and{" "}
          <code>model</code>. Swap in your BestLLM key, keep everything else. Pick your language and
          copy.
        </p>
        <CodeTabs tabs={CODE_TABS} />
      </section>

      {/* Migration cost + savings calculator */}
      <section className="article-section alt-anchor" id="cost">
        <h2>Migration cost: near zero, and reversible</h2>
        <p>
          Because the API is OpenAI-compatible and stateless, there is no SDK rewrite, no new
          dependency, no provider account to open, and no data to migrate. Most teams are live in
          under an hour.
        </p>
        <div className="alt-steps">
          <div className="alt-step">
            <h3>Point at the new base URL</h3>
            <p>
              Change <code>base_url</code> to <code>https://api.bestllm.dev/v1</code> and set your
              BestLLM key in one config object or env var. About five minutes.
            </p>
          </div>
          <div className="alt-step">
            <h3>Drop the provider prefix</h3>
            <p>
              Map model strings once: <code>deepseek/deepseek-chat</code> → <code>deepseek-chat</code>.
              No other call-shape changes — messages, streaming, and tools are identical.
            </p>
          </div>
          <div className="alt-step">
            <h3>Canary, then cut over</h3>
            <p>
              Keep your OpenRouter key as a fallback, route a small percentage to BestLLM, compare
              output and cost, then flip. Roll back by reverting the same two fields.
            </p>
          </div>
        </div>
        <div className="article-callout">
          <h2>What you do not have to do</h2>
          <ul>
            <li>No SDK rewrite — the official OpenAI SDK works unchanged.</li>
            <li>No new dependencies or adapter layer.</li>
            <li>No separate provider accounts or billing relationships.</li>
            <li>No data migration — the API is stateless.</li>
            <li>No lock-in — keep both keys; rollback is a config flip.</li>
          </ul>
        </div>

        <h3>What the 5.5% credit fee costs you</h3>
        <p>
          Drag your monthly token spend to see the all-in difference. OpenRouter adds 5.5% when you
          buy credits; BestLLM bills the token cost with no top-up fee.
        </p>
        <FeeCalculator />
      </section>

      {/* FAQ */}
      <section className="article-section alt-anchor" id="faq">
        <h2>Frequently asked questions</h2>
        <div className="alt-faq">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <div className="alt-faq-a">
                {f.a}
                {f.cta && (
                  <>
                    {" "}
                    <Link href={f.cta.href}>{f.cta.label} →</Link>
                  </>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Ready to switch from OpenRouter?</h2>
        <p>
          One OpenAI-compatible endpoint for DeepSeek, Qwen, Kimi, GLM, and MiniMax — no credit
          top-up fee, US/EU regional routing, and a ledger that reconciles to the token. Change two
          fields and ship.
        </p>
        <div className="article-cta-actions">
          <Link href={consoleUrl} className="article-btn article-btn-primary">Get your API key →</Link>
          <Link href="/docs" className="article-btn article-btn-ghost">Read the docs</Link>
          <Link href="/pricing" className="article-btn article-btn-ghost">See pricing</Link>
        </div>
      </section>

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