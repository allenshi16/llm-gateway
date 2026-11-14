import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";

/* ------------------------------------------------------------------ */
/*  SEO metadata — tutorial intent (distinct from the model page)      */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "MiniMax Models Tutorial: How to Choose & Integrate M3, H3, and H3 Max (2026)",
  description:
    "Step-by-step tutorial for choosing the right MiniMax model — M3 for text, H3 for 2K video, H3 Max for fast prototyping — and wiring each into your app with working code, async polling, and cost controls.",
  openGraph: {
    type: "article",
    title: "MiniMax Models Tutorial: How to Choose & Integrate M3, H3, and H3 Max (2026)",
    description:
      "A decision framework plus copy-paste integration steps for MiniMax M3 (text), H3 (2K video), and H3 Max (fast video) — with cost controls and common pitfalls.",
  },
};

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "MiniMax Models Tutorial: How to Choose & Integrate M3, H3, and H3 Max",
  description:
    "Tutorial for selecting the right MiniMax model for your workload and integrating it: M3 text via an OpenAI-compatible gateway, H3 2K video via the MiniMax API, and H3 Max fast video via fal.ai.",
  datePublished: "2026-09-03",
  dateModified: "2026-11-14",
  author: { "@type": "Organization", name: "BestLLM" },
  publisher: { "@type": "Organization", name: "BestLLM" },
};

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MiniMaxTutorial() {
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
        <span>MiniMax Tutorial</span>
      </div>

      {/* Hero */}
      <section className="content-hero">
        <span className="feature-number">TUTORIAL / MINIMAX · UPDATED NOVEMBER 2026</span>
        <h1>How to choose and integrate MiniMax models</h1>
        <p>
          MiniMax ships three different tools under one brand: <strong>M3</strong> (a text LLM),{" "}
          <strong>H3</strong> (a 2K video generator), and <strong>H3 Max</strong> (a speed-tuned
          video variant). This tutorial walks through picking the right one for your job and
          connecting it, with copy-paste code for each path. For full specs and per-tier pricing,
          use the model reference pages linked below.
        </p>
      </section>

      {/* Quick answer */}
      <section className="article-callout">
        <h2>Quick answer</h2>
        <ul>
          <li><strong>Chat, reasoning, code, agents, long documents →</strong> MiniMax M3 (text), called through BestLLM&apos;s OpenAI-compatible API.</li>
          <li><strong>Final-quality 2K video with native audio, references or editing →</strong> MiniMax H3, called through the MiniMax hosted API.</li>
          <li><strong>Fast drafts and high-volume prototyping →</strong> H3 Max on fal.ai (480P/768P, sub-3-second renders).</li>
          <li><strong>One key for text + routing →</strong> BestLLM. Video models stay on their provider APIs — H3 and H3 Max are not text models and are not routed by BestLLM.</li>
        </ul>
      </section>

      {/* Step 1 — decision */}
      <section className="article-section">
        <h2>Step 1 — Choose by the job, not the brand</h2>
        <p>
          The most common mistake is treating &quot;MiniMax&quot; as a single model. M3 and H3 solve
          completely different problems, and H3 Max is a hosting/speed variant of H3. Match the
          modality and the quality/speed trade-off to your workload first:
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Model</th>
                <th>Modality</th>
                <th>Call it via</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Chat, agents, code, long docs</strong></td>
                <td><Link href="/models/minimax-m3">MiniMax M3</Link></td>
                <td>Text</td>
                <td>BestLLM API</td>
                <td>1M context, OpenAI-compatible, per-token billing</td>
              </tr>
              <tr>
                <td><strong>Final 2K video + native audio</strong></td>
                <td><Link href="/models/minimax-h3">MiniMax H3</Link></td>
                <td>Video</td>
                <td>MiniMax API</td>
                <td>2K output, reference/editing modes, open weights</td>
              </tr>
              <tr>
                <td><strong>Fast drafts & prototyping</strong></td>
                <td><Link href="/models/minimax-h3">H3 Max</Link></td>
                <td>Video</td>
                <td>fal.ai</td>
                <td>Sub-3s renders, 480P/768P, 5 free generations/day</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="article-footer-note">
          H3 and H3 Max are video generation models — they do not produce text. Never send them to
          a chat completions endpoint. Full specs and every pricing tier (including H3 Max) live on
          the <Link href="/models/minimax-h3">MiniMax H3 model page</Link>; text specs are on the{" "}
          <Link href="/models/minimax-m3">MiniMax M3 model page</Link>.
        </p>
      </section>

      {/* Step 2 — M3 text */}
      <section className="article-section">
        <h2>Step 2 — Wire up MiniMax M3 (text) through BestLLM</h2>
        <p>
          M3 is a text LLM, so it uses the OpenAI Chat Completions format. Create a workspace and
          API key in the <Link href="/pricing">BestLLM Console</Link>, then point the official OpenAI
          SDK at the BestLLM base URL. Only two fields change from any OpenAI call: the base URL and
          the model ID.
        </p>
        <h3>Python</h3>
        <pre className="article-code">
          <code>{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-api-key",
)

resp = client.chat.completions.create(
    model="minimax-m3",
    messages=[{"role": "user", "content": "Summarize this contract in 5 bullets."}],
)
print(resp.choices[0].message.content)`}</code>
        </pre>
        <h3>Node.js</h3>
        <pre className="article-code">
          <code>{`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const resp = await client.chat.completions.create({
  model: "minimax-m3",
  messages: [{ role: "user", content: "Draft a release note." }],
});
console.log(resp.choices[0].message.content);`}</code>
        </pre>
        <p className="article-footer-note">
          Switching to DeepSeek, Qwen, Kimi, or GLM later is a one-field change — same endpoint, same
          key, same SDK. See the <Link href="/docs">API documentation</Link> for streaming and error
          handling.
        </p>
      </section>

      {/* Step 3 — H3 video */}
      <section className="article-section">
        <h2>Step 3 — Wire up MiniMax H3 (2K video) via the MiniMax API</h2>
        <p>
          H3 is asynchronous: you submit a generation task, get a task ID, then poll for completion
          or register a callback. Use a MiniMax API key (not a BestLLM key) and the exact model ID{" "}
          <code>MiniMax-H3</code> — capitalization and the hyphen matter.
        </p>
        <pre className="article-code">
          <code>{`curl -X POST https://api.minimax.io/v2/video_generation \\
  -H "Authorization: Bearer $MINIMAX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3",
    "prompt": "A cinematic aerial shot of a futuristic city at sunset",
    "resolution": "2K",
    "duration": 10,
    "aspect_ratio": "16:9"
  }'`}</code>
        </pre>
        <p>
          The response returns a task ID. Poll the query endpoint until the task succeeds, or supply
          a callback URL (it must answer the challenge within 3 seconds). Billing is per generated
          second, so a 10-second 2K clip costs $1.30 at $0.13/sec.
        </p>
        <p className="article-footer-note">
          Cost control: draft at 768P ($0.08/sec), then run the 768P→2K regeneration pass
          ($0.05/sec) only on the takes you keep. See the{" "}
          <Link href="/models/minimax-h3">H3 model page</Link> for the full tier table and input
          constraints.
        </p>
      </section>

      {/* Step 4 — H3 Max */}
      <section className="article-section">
        <h2>Step 4 — Wire up H3 Max (fast video) via fal.ai</h2>
        <p>
          H3 Max is fal.ai&apos;s post-trained variant, optimized for speed and prompt adherence. It
          renders 768P (or cheaper 480P) clips in under three seconds, which makes it ideal for
          prototyping and high-volume iteration rather than final 2K delivery. Use a fal.ai key.
        </p>
        <pre className="article-code">
          <code>{`curl -X POST https://fal.ai/minimax-h3/max \\
  -H "Authorization: Bearer $FAL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax/h3-max",
    "prompt": "A cat astronaut floating in space, 16:9",
    "duration": 5,
    "resolution": "768p"
  }'`}</code>
        </pre>
        <p className="article-footer-note">
          Signed-in fal.ai users get 5 free generations per day. H3 Max pricing (480P $0.05/sec,
          768P $0.08/sec) is consolidated in the tier table on the{" "}
          <Link href="/models/minimax-h3">H3 model page</Link>.
        </p>
      </section>

      {/* Step 5 — cost & pitfalls */}
      <section className="article-section">
        <h2>Step 5 — Control cost and avoid the common pitfalls</h2>
        <ul>
          <li><strong>Video ≠ text.</strong> H3/H3 Max go to video endpoints; only M3 belongs in a chat completions call.</li>
          <li><strong>Model ID exactness.</strong> <code>MiniMax-H3</code> (MiniMax) vs <code>minimax/h3-max</code> (fal.ai) vs <code>minimax-m3</code> (BestLLM) are different strings on different hosts.</li>
          <li><strong>Billing units differ.</strong> M3 is per token; H3/H3 Max are per generated second. Budget them separately.</li>
          <li><strong>Resolution drives price.</strong> Draft at 480P/768P, upgrade keepers to 2K. Self-hosted H3 weights cap out at 768P — 2K needs the hosted regeneration pass.</li>
          <li><strong>Reference inputs are billed.</strong> Extra reference images and reference video add cost on H3; check the tier table before batching.</li>
          <li><strong>Async handling.</strong> Video tasks need polling or a callback that answers within 3 seconds — don&apos;t block a request thread waiting on render.</li>
        </ul>
        <p className="article-footer-note">
          For text workloads, BestLLM workspace spend controls and the immutable billing ledger keep
          M3 (and every other supported model) predictable. Compare the wider field in our{" "}
          <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026</Link> guide.
        </p>
      </section>

      {/* FAQ */}
      <section className="article-section">
        <h2>Frequently asked questions</h2>

        <h3>Which MiniMax model should I use for a chatbot or agent?</h3>
        <p>
          MiniMax M3 — it is the text LLM. Call it through BestLLM&apos;s OpenAI-compatible API. H3
          and H3 Max are video generation models and cannot answer chat prompts.
        </p>

        <h3>Can I call H3 through BestLLM&apos;s chat completions endpoint?</h3>
        <p>
          No. H3 and H3 Max are video models served by the MiniMax and fal.ai APIs. BestLLM routes
          text models such as M3 through the OpenAI-compatible surface; video generation stays on
          the provider&apos;s own endpoint.
        </p>

        <h3>How do I switch between M3 and other text models?</h3>
        <p>
          Change the <code>model</code> field in your request. The base URL, API key, and SDK stay
          the same across DeepSeek, Qwen, Kimi, GLM, and MiniMax M3. See the{" "}
          <Link href="/docs">API documentation</Link> for examples.
        </p>

        <h3>Is H3 Max cheaper than H3?</h3>
        <p>
          At the low end, yes: H3 Max 480P is $0.05/sec and 768P is $0.08/sec, versus H3 at $0.08/sec
          (768P) and $0.13/sec (2K). Max trades top resolution and quality for speed, so use it for
          drafts and H3 for final 2K delivery. Full tiers are on the{" "}
          <Link href="/models/minimax-h3">H3 model page</Link>.
        </p>

        <h3>Can I mix MiniMax with other providers and roll back?</h3>
        <p>
          Yes. Text through BestLLM is OpenAI-compatible, so you can switch model or provider by
          changing one field and roll back just as easily. Video keys are separate per provider
          (MiniMax, fal.ai), so keep them in distinct environment variables.
        </p>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Start with text on BestLLM</h2>
        <p>
          M3 and the other supported Chinese LLMs run through one OpenAI-compatible API with regional
          routing, workspace spend controls, and an immutable billing ledger. Video models stay on
          their provider APIs.
        </p>
        <div className="article-cta-actions">
          <Link href="/pricing" className="article-btn article-btn-primary">
            Get API Key →
          </Link>
          <Link href="/docs" className="article-btn article-btn-ghost">
            Read the Docs
          </Link>
        </div>
      </section>

      {/* Footer */}
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