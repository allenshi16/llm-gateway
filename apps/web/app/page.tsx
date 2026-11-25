import Link from "next/link";
import type { Metadata } from "next";
import { brand, publicNavigation } from "@gateway/brand";
import { Badge, Card, Logo } from "@gateway/ui";
import { consoleLogInUrl } from "../lib/console-url";
import { modelCatalog } from "@gateway/brand/models";

export const metadata: Metadata = {
  title: "OpenAI-Compatible LLM API Gateway | DeepSeek, Qwen, Kimi, GLM",
  description:
    "BestLLM is an OpenAI-compatible LLM API gateway with access to DeepSeek, Qwen, Kimi, GLM, and MiniMax through one endpoint — with regional routing, spend controls, and transparent per-token pricing.",
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
          <Link className="ui-button ui-button-solid" href="/docs/deepseek-chat-api">Start building</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <Badge tone="signal">OpenAI-compatible LLM API gateway</Badge>
          <h1>One OpenAI-compatible API for every LLM route.</h1>
          <p>
            BestLLM is a multi-tenant LLM API gateway that gives you OpenAI-compatible access to
            DeepSeek, Qwen, Kimi, GLM, and MiniMax through a single endpoint. Switch models by
            changing the <code>model</code> field — no SDK changes, no new dependencies, no
            provider accounts to manage. Ship with predictable per-token pricing, region-aware
            routing for approved US-scoped requests, workspace-level spend controls, and an immutable billing
            ledger that finance can reconcile.
          </p>
          <div className="hero-actions">
            <Link className="ui-button ui-button-solid" href={signInUrl}>Get your API key</Link>
            <Link className="text-link" href="/platform">Explore the platform →</Link>
          </div>
          <div className="hero-proof">
            <span>Private by default</span>
            <span>EU + US regions</span>
            <span>Transparent per-token pricing</span>
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
          <h2>One endpoint, every approved model route.</h2>
          <p>
            Give developers a familiar OpenAI-compatible API while your team controls which models
            are approved, which regions serve traffic, how fallbacks behave, and when providers
            can be rotated. Point your existing OpenAI SDK at one base URL and access DeepSeek
            Chat, Qwen3.8 Max, Kimi K3, GLM-5, MiniMax M3, and every model we add next — without
            rewriting a single line of application code.
          </p>
        </Card>
        <Card>
          <span className="feature-number">02</span>
          <h2>Spend you can explain to finance.</h2>
          <p>
            Every request carries a transparent per-token charge. Reservations, captures, and
            releases track charges for non-streaming requests. Price snapshots record
            exactly what each request cost at dispatch time. Append-only ledger entries mean your
            invoices reconcile to the token — no black-box markup, no surprise overages.
          </p>
        </Card>
        <Card>
          <span className="feature-number">03</span>
          <h2>Built for teams that ship to production.</h2>
          <p>
            Organizations, workspaces, role-based access, audit trails, and short-lived private
            dispatch assertions are part of the gateway — not an afterthought. Regional policy
            ensures requests stay within approved boundaries. Every model route requires explicit
            approval before it can serve production traffic, and every kill switch is immediate.
          </p>
        </Card>
      </section>

      {/* How it works: one-line model switch */}
      <section className="model-spotlight">
        <div className="model-spotlight-inner">
          <div className="model-spotlight-head">
            <h2>Switch models by changing one field.</h2>
            <p>
              Your integration uses the OpenAI SDK format. To switch from DeepSeek Chat to Qwen3.8
              Max, change the <code>model</code> parameter. That is the entire migration. No new
              libraries, no provider accounts, no separate billing relationships. Every model behind
              the BestLLM gateway uses the non-streaming chat completions endpoint. Check
              workspace access and model-specific capabilities before switching.
            </p>
          </div>
          <pre style={{
            background: "#0d1b2d",
            color: "#e2e8f0",
            padding: "1.25rem",
            borderRadius: "8px",
            overflow: "auto",
            fontSize: "0.85rem",
            lineHeight: 1.6,
            margin: "1.5rem 0",
          }}>
{`# Works with the official OpenAI SDK — just change the base URL
from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-key"
)

# DeepSeek Chat — frontier reasoning at $0.30/M input
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)

# Switch to Qwen3.8 Max — 2.4T-param MoE, 1M context — same code
response = client.chat.completions.create(
    model="qwen3-8-max",
    messages=[{"role": "user", "content": "Analyze this 500-page document"}]
)

# Switch to Kimi K3 — frontier reasoning, 1M context — same code
response = client.chat.completions.create(
    model="kimi-k3",
    messages=[{"role": "user", "content": "Review this codebase for vulnerabilities"}]
)`}
          </pre>
        </div>
      </section>

      {/* SEO: Supported models section */}
      <section className="model-spotlight">
        <div className="model-spotlight-inner">
          <div className="model-spotlight-head">
            <h2>Available LLM models through one API</h2>
            <p>
              One API key. Every supported model. OpenAI-compatible format. BestLLM routes
              production traffic to approved models with regional compliance, workspace isolation,
              and per-token billing. Browse individual model pages for full pricing breakdowns,
              context window specs, benchmark data, and integration examples.
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
            <Link href="/models" className="text-link">View all models and pricing →</Link>
          </p>
        </div>
      </section>

      {/* Why BestLLM vs calling providers directly */}
      <section className="feature-grid">
        <Card>
          <span className="feature-number">vs</span>
          <h2>BestLLM vs calling DeepSeek, Qwen, or OpenRouter directly.</h2>
          <p>
            One OpenAI-compatible surface instead of per-provider SDKs, accounts, and bills:
            unified billing, workspace spend controls, and per-team model approval. Against
            OpenRouter specifically, BestLLM applies route approval policies, an append-only
            per-request ledger, and no 5.5% credit top-up fee.
          </p>
          <p>
            <Link className="text-link" href="/alternatives/openrouter">
              OpenRouter alternative: full comparison, pricing & two-field migration →
            </Link>
          </p>
        </Card>
        <Card>
          <span className="feature-number">04</span>
          <h2>Transparent per-token pricing. No markup mystery.</h2>
          <p>
            BestLLM operates on a cost pass-through model for every supported route. You see
            exactly what each model costs per million input and output tokens — the same figures
            the ledger bills. DeepSeek Chat from $0.30/M input, Qwen Plus from $0.30/M, MiniMax M3
            from $0.31/M, GLM-5 from $0.60/M. No hidden fees, no per-request surcharges, no
            minimum commitments. Pick a plan, get an API key, pay for what you use. See the{" "}
            <Link href="/pricing">pricing page</Link> for the full model-by-model breakdown.
          </p>
        </Card>
        <Card>
          <span className="feature-number">05</span>
          <h2>Explicit route approval and region checks.</h2>
          <p>
            The current gateway accepts US-scoped keys only; non-US keys are rejected.
            Every model route carries explicit approval requirements. Requests are
            dispatched to approved regions only — no cross-region fallback unless your workspace
            policy allows it. These checks do not independently establish a provider’s physical data
            residency or satisfy a particular compliance framework. Regional policy is configured at the workspace level and enforced before a
            request leaves your boundary.
          </p>
        </Card>
      </section>

      {/* FAQ */}
      <section className="model-spotlight">
        <div className="model-spotlight-inner" style={{ maxWidth: "48rem" }}>
          <h2>Frequently asked questions</h2>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              What does OpenAI-compatible mean?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              BestLLM implements the same request and response format as the OpenAI Chat
              Completions API. You can use the official OpenAI SDK (Python, Node.js, TypeScript)
              for non-streaming text chat with an approved model alias. Streaming is not
              implemented; other features require model-specific validation. See the
              quickstart for the current request scope.
            </p>
          </details>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              Which models are available today?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              The public catalog describes seven model aliases: DeepSeek Chat, DeepSeek
              Reasoner, Qwen3.8 Max, Qwen Plus, Kimi K3, GLM-5, and MiniMax M3. Each model has
              its own pricing page with full specs, context window details, and API examples. We
              enable routes per workspace after approval — check your Console and the{" "}
              <Link href="/models">models page</Link> for the current list.
            </p>
          </details>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              How does pricing work?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              BestLLM uses transparent per-token pricing on a cost pass-through basis. You pay
              per million input and output tokens at the rates listed on each model page. There
              are no hidden markups, per-request fees, or minimum commitments. Choose a plan
              (Starter, Team, or Enterprise) based on the workspace features you need — the
              model pricing is the same across all plans. See the{" "}
              <Link href="/pricing">pricing page</Link> for plan details and the full
              model-by-model cost table.
            </p>
          </details>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              Can I use my existing OpenAI SDK code?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              Yes. BestLLM speaks the OpenAI API format. In the official OpenAI Python or
              Node.js SDK, set the base URL to <code>https://api.bestllm.dev/v1</code> and use
              your BestLLM API key. Use non-streaming chat completions, select an approved
              model, and handle gateway-specific error codes. This is not a claim of full
              OpenAI API compatibility.
            </p>
          </details>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              What is the difference between BestLLM and OpenRouter?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              Both provide multi-model API access through a single endpoint. BestLLM focuses on
              the Chinese and Asian model ecosystem (DeepSeek, Qwen, Kimi, GLM, MiniMax) with
              US-scoped request routing, workspace-level spend controls, RBAC, and an immutable
              billing ledger. OpenRouter covers a broader global model catalog. If your workload
              is primarily DeepSeek, Qwen, Kimi, or GLM and you need compliance-aware routing
              and team-level budget controls, BestLLM is purpose-built for that use case.{" "}
              <Link href="/alternatives/openrouter">See the full OpenRouter vs BestLLM comparison →</Link>
            </p>
          </details>

          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "0.5rem 0" }}>
              How do I get started?
            </summary>
            <p style={{ padding: "0.5rem 0", color: "#555" }}>
              Sign up, create a workspace, generate an API key from the Console, and make your
              first call to <code>https://api.bestllm.dev/v1/chat/completions</code>. The{" "}
              <Link href="/docs">quickstart guide</Link> walks through the full setup including
              SDK configuration, model access checks, and non-streaming requests.
              Availability depends on your workspace and approved routes.
            </p>
          </details>
        </div>
      </section>

      {/* SEO: Blog teaser */}
      <section className="blog-teaser">
        <div className="blog-teaser-inner">
          <div className="blog-teaser-head">
            <h2>LLM API guides and model comparisons</h2>
            <Link href="/blog" className="text-link">All articles →</Link>
          </div>
          <div className="blog-teaser-grid">
            <Link href="/blog/best-chinese-models-2026" className="blog-card">
              <span className="blog-card-kicker">Model Comparison</span>
              <h3>Best Chinese AI Models 2026</h3>
              <p>DeepSeek, Qwen, Kimi, GLM — pricing, benchmarks, and use-case recommendations for choosing the right Chinese LLM for your workload.</p>
              <span className="blog-card-read">Read guide</span>
            </Link>
            <Link href="/blog/deepseek-vs-qwen" className="blog-card">
              <span className="blog-card-kicker">Head to Head</span>
              <h3>DeepSeek vs Qwen (2026)</h3>
              <p>Workload-based comparison: pricing, context windows, coding vs multilingual strengths, and routing advice through one OpenAI-compatible API.</p>
              <span className="blog-card-read">Read comparison</span>
            </Link>
          </div>
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
