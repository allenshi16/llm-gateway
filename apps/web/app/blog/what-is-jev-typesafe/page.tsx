import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "What Is Jev? TypeSafe AI's Decision Model + How It Pairs with an LLM Gateway (2026)",
  description:
    "Jev by TypeSafe AI is a 'System One' decision model that returns type-safe structured values with calibrated probabilities. How it works, $0.042/MTok pricing, and the architecture pattern: decision model in front of an LLM gateway for routing, guardrails and scoring.",
  openGraph: {
    type: "article",
    title: "What Is Jev? TypeSafe AI's System One Decision Model",
    description:
      "A developer's explanation of Jev: classify, route, score, extract and branch with calibrated probabilities — and how it complements a generative LLM gateway.",
  },
};

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is Jev? TypeSafe AI's 'System One' Decision Model Explained",
  description:
    "Jev is a decision model from TypeSafe AI that outputs type-safe structured values with calibrated probabilities for classify, route, score, extract and branch tasks.",
  datePublished: "2026-09-25",
  dateModified: "2026-09-25",
  author: { "@type": "Organization", name: "BestLLM" },
  publisher: { "@type": "Organization", name: "BestLLM" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
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

export default function WhatIsJev() {
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
        <span>What Is Jev</span>
      </div>

      {/* Hero */}
      <section className="content-hero">
        <span className="feature-number">MODEL GUIDE / September 2026</span>
        <h1>What Is Jev? TypeSafe AI&apos;s &apos;System One&apos; Decision Model</h1>
        <p style={{ fontSize: "1.05rem", maxWidth: "46rem", lineHeight: 1.6 }}>
          Jev is the model that broke the mold in September 2026 — not because it writes better
          prose, but because it doesn&apos;t write prose at all. It&apos;s a <em>decision</em> model:
          you give it a situation, it returns a type-safe structured value with a calibrated
          probability. Here&apos;s what that actually means, what it costs, and where it fits next
          to the generative LLMs you already run.
        </p>
      </section>

      {/* Editor's note — gateway connection */}
      <section style={{ maxWidth: "46rem", margin: "0 auto", padding: "1rem 1.5rem", background: "#f0f7ff", borderRadius: "8px", borderLeft: "4px solid #2563eb" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "#374151" }}>
          <strong>Why this matters for LLM gateway users:</strong> Jev is a <em>decision</em> model
          — it classifies, routes, and scores. It does not generate text. The production pattern
          is to put a decision model like Jev <em>in front of</em> an LLM gateway (like BestLLM)
          to route each request to the cheapest model that can handle it, guard inputs/outputs,
          and let the gateway handle generation, keys, metering, and fallback. Read the{" "}
          <Link href="/platform">platform overview</Link> for how the gateway layer works.
        </p>
      </section>

      {/* What it is */}
      <section className="article-section">
        <h2>Jev is a decision model, not a chat model</h2>
        <p>
          TypeSafe AI positions Jev as a <strong>&apos;System One&apos;</strong> model — a nod to the
          fast, instinctive mode of human judgment. Where a generative LLM produces open-ended text
          token by token, Jev is built to answer a bounded question and return a{" "}
          <strong>type-safe structured value with a calibrated probability</strong> attached.
        </p>
        <p>
          In practice that means Jev is used to <strong>classify, route, score, extract, or branch</strong>.
          Instead of prompting a chat model with &quot;reply with only JSON and please be consistent&quot;
          and then parsing whatever string comes back, you ask Jev for a decision and get a typed
          result whose confidence you can actually threshold on — because the probability is
          calibrated, not a made-up number in a text blob.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th></th><th>Generative LLM (chat)</th><th>Jev (System One decision model)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Output</strong></td><td>Free-form text / tokens</td><td>Type-safe structured value + calibrated probability</td></tr>
              <tr><td><strong>Job</strong></td><td>Write, reason, converse, generate</td><td>Classify, route, score, extract, branch</td></tr>
              <tr><td><strong>Latency profile</strong></td><td>Scales with output length</td><td>Short, bounded decision</td></tr>
              <tr><td><strong>Best for</strong></td><td>Content, code, conversation</td><td>High-volume judgment calls in a pipeline</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Facts */}
      <section className="article-section">
        <h2>Jev by the numbers (at launch, September 2026)</h2>
        <div className="content-grid">
          <div className="feature-card">
            <span className="feature-number">01 / PRICING</span>
            <h3>$0.042 / MTok</h3>
            <p>
              Jev is priced at roughly $0.042 per million input tokens — deliberately cheap, because
              the value is in making millions of small decisions, not in writing long answers.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-number">02 / ACCESS</span>
            <h3>api.typesafe.ai</h3>
            <p>
              Jev is served over a hosted API at <code>api.typesafe.ai</code>, with Python and
              JavaScript SDKs. It is a distinct surface from the OpenAI chat-completions shape, so it
              is not a drop-in &quot;model&quot; in an OpenAI-compatible router.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-number">03 / OUTPUT</span>
            <h3>Typed + calibrated</h3>
            <p>
              The headline feature is calibration: the probability Jev returns is meant to reflect
              real-world correctness, so you can set a confidence threshold and route the uncertain
              cases elsewhere.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-number">04 / USE CASES</span>
            <h3>Route · guard · score</h3>
            <p>
              Documented uses include request routing, guardrails, re-ranking, scoring and CI-style
              linting — all places where you need a fast, consistent yes/no/which-one, not a paragraph.
            </p>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Figures are as published by TypeSafe AI at launch and may change; see the official
          announcement and docs at typesafe.ai for the current request/response schema and SDK
          signatures.
        </p>
      </section>

      {/* The bridge to a gateway */}
      <section className="article-section">
        <h2>Where Jev fits in a real LLM stack</h2>
        <p>
          The interesting thing about Jev&apos;s use cases — routing, guardrails, scoring — is that
          they&apos;re the same jobs an <strong>LLM gateway</strong> performs. A decision model and a
          gateway are complementary, not competing:
        </p>
        <ul>
          <li><strong>Jev decides.</strong> Which model should handle this request? Is this input safe? Does this output pass the bar? Jev gives a calibrated answer cheaply.</li>
          <li><strong>The gateway serves.</strong> Once the decision is made, you still need one OpenAI-compatible endpoint to actually run DeepSeek, Qwen, Kimi, GLM or GPT-class models — with failover, spend controls and per-request model selection.</li>
        </ul>
        <p>
          A clean pattern: put a decision model in front of the gateway to <em>route</em> each request
          to the cheapest model that can handle it, and to <em>guard</em> inputs/outputs, while the
          gateway handles the generation, keys, metering and fallback. You get the cost savings of
          &quot;System One&quot; triage without giving up the flexibility of a multi-model backend.
        </p>
        <Link className="article-button" href="/platform">See how the gateway routes models ↗</Link>
      </section>

      {/* FAQ */}
      <section className="article-section">
        <h2>Frequently asked questions</h2>
        <details open><summary>What is Jev?</summary><p>Jev is a &apos;System One&apos; decision model from TypeSafe AI. Instead of generating text, it returns type-safe structured values with calibrated probabilities, for tasks like classification, routing, scoring, extraction and branching.</p></details>
        <details><summary>Is Jev a replacement for ChatGPT or DeepSeek?</summary><p>No. Jev is not a chat or generation model — it doesn&apos;t write prose or code. It complements generative LLMs by making the fast, bounded decisions around them (which model to call, whether an input is safe, whether an output passes a threshold).</p></details>
        <details><summary>How much does Jev cost?</summary><p>At launch TypeSafe AI priced Jev at about $0.042 per million input tokens. Confirm current pricing at typesafe.ai, as launch figures for a new model can change.</p></details>
        <details><summary>How do I call the Jev API?</summary><p>Jev is served at <code>api.typesafe.ai</code> with Python and JavaScript SDKs. Note that its request/response shape is its own — it is not OpenAI chat-completions compatible — so consult the official docs for the exact schema before integrating.</p></details>
        <details><summary>Can I use Jev through an OpenAI-compatible gateway?</summary><p>Not as a drop-in chat model, because Jev returns typed decisions rather than text. The practical pattern is to use Jev (or a similar decision model) as the routing/guardrail brain <em>in front of</em> a gateway, while the gateway serves your generative models through one OpenAI-compatible endpoint.</p></details>
        <details><summary>What does &apos;System One&apos; mean?</summary><p>It references the fast, automatic mode of human judgment (as opposed to slow, deliberate &apos;System Two&apos; reasoning). Jev is designed for high-volume, low-latency decisions rather than long chain-of-thought generation.</p></details>
      </section>

      {/* CTA + related */}
      <section className="article-section">
        <h2>Pair fast decisions with a flexible model backend</h2>
        <p>
          BestLLM exposes DeepSeek, Qwen, Kimi and GLM through one OpenAI-compatible API
          with routing policy, spend controls and per-request model selection — the generation layer
          that sits behind your decision logic. Swap a model ID, not an SDK.
        </p>
        <Link className="article-button" href="/models">Browse the model catalog ↗</Link>
        <p style={{ marginTop: "1rem" }}>
          Read next: <Link href="/blog/jev-vs-laya-alternatives">Jev vs Laya vs AnyJev — open-source decision model alternatives</Link> · <Link href="/blog/gpt6-vs-chinese-llms">GPT-6 vs Chinese LLMs routing framework</Link>
        </p>
      </section>

      <footer className="marketing-footer"><Logo /><span>Model access without operational noise.</span><span>© 2026 BestLLM</span><div className="footer-badges"><a href="https://thesaasdir.com" rel="dofollow"><img src="/badges/thesaasdir.svg" alt="Featured on TheSaaSDir" width="160" height="44" /></a><a href="https://semilaunch.com" target="_blank" rel="noopener"><img src="/badges/semilaunch.png" alt="Featured on SemiLaunch" width="220" height="77" /></a></div></footer>
    </main>
  );
}
