import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@gateway/ui";

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "MiniMax H3 API: Complete Pricing & Integration Guide (2026)",
  description:
    "MiniMax H3 API pricing breakdown: $0.13/sec at 2K, $0.08/sec at 768P. Architecture guide, API integration examples, open-weight details, and comparison with Kling, Seedance, and Wan.",
  openGraph: {
    type: "article",
    title: "MiniMax H3 API: Complete Pricing & Integration Guide (2026)",
    description:
      "Full pricing breakdown, API integration guide, architecture deep-dive, and comparison for MiniMax H3 video generation model.",
  },
};

/* ------------------------------------------------------------------ */
/*  JSON-LD                                                            */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "MiniMax H3 API: Complete Pricing & Integration Guide (2026)",
  description:
    "Comprehensive guide to MiniMax H3 API pricing, features, architecture, and integration for developers.",
  datePublished: "2026-09-03",
  dateModified: "2026-09-03",
  author: { "@type": "Organization", name: "Maridian Gateway" },
  publisher: { "@type": "Organization", name: "Maridian Gateway" },
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

export default function MiniMaxH3Guide() {
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
        <span>MiniMax H3 Guide</span>
      </div>

      {/* Hero */}
      <section className="content-hero">
        <span className="feature-number">MODEL GUIDE / September 2026</span>
        <h1>MiniMax H3 API: Complete Pricing &amp; Integration Guide</h1>
        <p style={{ fontSize: "1.05rem", maxWidth: "44rem", lineHeight: 1.6 }}>
          Everything developers need to know about MiniMax H3 — the open-source omni-modal video
          generation model that creates 2K video with native stereo audio. Pricing breakdown,
          API integration, architecture deep-dive, and head-to-head comparisons.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.5rem" }}>
          Last verified: August 31, 2026
        </p>
      </section>

      {/* TL;DR */}
      <section className="article-callout">
        <h2>TL;DR</h2>
        <ul>
          <li><strong>2K video:</strong> $0.13 per generated second — 10-second clip = $1.30</li>
          <li><strong>768P video:</strong> $0.08 per generated second — 10-second clip = $0.80</li>
          <li><strong>Open weights:</strong> H3-Base FL2VA and Ref2VA available under Community License</li>
          <li><strong>Multimodal input:</strong> text, images (≤9), video (≤3 clips), audio (≤3 clips)</li>
          <li><strong>Output:</strong> 4–15 seconds, 24 FPS, 32 kHz stereo audio</li>
          <li><strong>Languages:</strong> 11 stable dialogue languages (AR, ZH, EN, FR, DE, IT, JA, KO, PT, RU, ES)</li>
        </ul>
      </section>

      {/* Key Specs */}
      <section className="article-section">
        <h2>Key Specifications</h2>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Specification</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow label="Release Date" value="July 31, 2026" />
              <SpecRow label="Developer" value="MiniMax" />
              <SpecRow label="Architecture" value="33B dense Omni Transformer + Qwen3-VL-32B encoder" />
              <SpecRow label="Output Resolution" value="768P (default), 2K (via H3-Regenerate-2K)" />
              <SpecRow label="Frame Rate" value="24 FPS" />
              <SpecRow label="Duration" value="4–15 seconds, whole-second values" />
              <SpecRow label="Audio" value="32 kHz stereo, native generation" />
              <SpecRow label="Output Aspect Ratios" value="21:9, 16:9, 4:3, 1:1, 3:4, 9:16" />
              <SpecRow label="Dialogue Languages" value="11 stable (AR, ZH, EN, FR, DE, IT, JA, KO, PT, RU, ES)" />
              <SpecRow label="Precision" value="BF16 (CFG-distilled checkpoints)" />
              <SpecRow label="Inference Frameworks" value="SGLang, vLLM, Diffusers, ComfyUI" />
              <SpecRow label="License" value="MiniMax H3 Community License" />
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="article-section">
        <h2>API Pricing Breakdown</h2>
        <p>MiniMax H3 uses per-second billing for video output. The Context-IR preprocessing step is billed per token.</p>

        <h3>Video Generation</h3>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Model / API</th>
                <th>Resolution</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow label="MiniMax-H3" value="768P — $0.08/sec" />
              <SpecRow label="MiniMax-H3" value="2K — $0.13/sec" />
              <SpecRow label="MiniMax-H3-Regeneration" value="768P → 2K — $0.05/sec" />
              <SpecRow label="MiniMax-H3-Max" value="480P — $0.05/sec" />
              <SpecRow label="MiniMax-H3-Max" value="768P — $0.08/sec" />
            </tbody>
          </table>
        </div>

        <h3>Reference Inputs</h3>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Input Type</th>
                <th>Billing Rule</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow label="Reference Audio" value="Free" />
              <SpecRow label="Reference Images" value="First 5 free, $0.04 each additional" />
              <SpecRow label="Reference Video" value="Billed at output tier rate × input duration" />
              <SpecRow label="H3-Context-IR" value="$0.90 / M input tokens, $3.60 / M output tokens" />
            </tbody>
          </table>
        </div>

        <h3>Price Per Clip</h3>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Duration</th>
                <th>2K Output</th>
                <th>768P Output</th>
              </tr>
            </thead>
            <tbody>
              <PriceRow duration="5 seconds" k2="$0.65" p768="$0.40" />
              <PriceRow duration="10 seconds" k2="$1.30" p768="$0.80" />
              <PriceRow duration="15 seconds" k2="$1.95" p768="$1.20" />
            </tbody>
          </table>
        </div>

        <p className="article-footer-note">
          Note: 768P → 2K regeneration at $0.05/sec means drafting at 768P then upgrading costs
          exactly the same as shooting 2K directly ($0.08 + $0.05 = $0.13). The cheaper path
          only saves money on takes you discard.
        </p>
      </section>

      {/* Architecture */}
      <section className="article-section">
        <h2>Architecture Pipeline</h2>
        <p>MiniMax H3 uses a three-stage pipeline for 2K output:</p>
        <div className="article-grid">
          <Card title="1. H3-Context-IR">
            Interprets multimodal inputs (text, images, video, audio), understands relationships,
            and converts them into a structured representation. Hosted API — not open-sourced.
          </Card>
          <Card title="2. H3-Base">
            Generates synchronized audio and video at 768P resolution from the Context-IR output.
            Open-weight checkpoints available (FL2VA for frame modes, Ref2VA for reference mode).
          </Card>
          <Card title="3. H3-Regenerate-2K">
            Re-processes the 768P output with original context to produce 2K resolution.
            Hosted API — not open-sourced. Leverages the base model&apos;s generative capability
            plus original multimodal context for accurate detail recovery.
          </Card>
        </div>
        <p style={{ marginTop: "1rem" }}>
          The <strong>H3-Context-IR</strong> step is critical to output quality. MiniMax strongly
          recommends incorporating it into your generation pipeline rather than building a custom
          preprocessing system.
        </p>
      </section>

      {/* API Example */}
      <section className="article-section">
        <h2>API Integration</h2>
        <p>Generate video via the Video Generation V2 endpoint:</p>
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
        <p className="article-footer-note">
          Model ID must be <code>MiniMax-H3</code> exactly (capitalization and hyphen matter).
          The endpoint returns a task ID; poll for completion or use the callback URL.
        </p>
      </section>

      {/* Open Weights */}
      <section className="article-section">
        <h2>Open Weights</h2>
        <p>
          MiniMax released H3-Base checkpoints under the Community License on August 2, 2026:
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Checkpoint</th>
                <th>Tasks</th>
                <th>Open?</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow label="H3-Base-FL2VA" value="Text-to-video, first/last frame → video" />
              <SpecRow label="H3-Base-Ref2VA" value="Reference-to-video (omni-reference mode)" />
              <SpecRow label="H3-Context-IR" value="No — hosted API only" />
              <SpecRow label="H3-Regenerate-2K" value="No — hosted API only" />
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: "1rem" }}>
          Self-hosted output is limited to 768P. For 2K, you must use the hosted API&apos;s
          H3-Regenerate-2K pass or build your own super-resolution pipeline.
        </p>
        <p className="article-footer-note">
          Download:{" "}
          <a href="https://huggingface.co/MiniMaxAI/MiniMax-H3" target="_blank" rel="noopener noreferrer">
            Hugging Face — MiniMaxAI/MiniMax-H3
          </a>{" "}
          |{" "}
          <a href="https://github.com/MiniMax-H3/MiniMax-H3" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </section>

      {/* H3 Max */}
      <section className="article-section">
        <h2>MiniMax H3 Max (fal.ai Variant)</h2>
        <p>
          <strong>H3 Max</strong> is fal.ai&apos;s post-trained variant of MiniMax H3, optimized for
          speed and prompt adherence. Key differences from base H3:
        </p>
        <ul>
          <li>768P output (not 2K)</li>
          <li>Sub-3-second render time for 5-second clips</li>
          <li>Stronger prompt adherence and aesthetics</li>
          <li>5 free generations per day for signed-in users</li>
          <li>Currently available exclusively on fal.ai</li>
          <li>Open weights planned by fal.ai</li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          Use H3 for 2K output or reference/editing workflows; use H3 Max for rapid prototyping
          and high-volume generation at speed.
        </p>
      </section>

      {/* Comparison */}
      <section className="article-section">
        <h2>Comparison: MiniMax H3 vs Competitors</h2>
        <div className="article-table-wrap">
          <table className="article-table" style={{ minWidth: "600px" }}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Price/Sec</th>
                <th>Max Resolution</th>
                <th>Native Audio</th>
                <th>Open Source</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow label="MiniMax H3" value="$0.13 (2K) — 2K — Yes — Yes" />
              <SpecRow label="Kling 3.0" value="$0.14 — 1080P — No — No" />
              <SpecRow label="Seedance 2.0 Mini" value="~$0.056 — 720P — No — No" />
              <SpecRow label="Wan 2.7" value="$0.10 — 1080P — No — Partial" />
              <SpecRow label="Runway Gen-4" value="$0.15 — 1080P — No — No" />
            </tbody>
          </table>
        </div>
        <p className="article-footer-note">
          MiniMax H3 is the only model in this class that offers native stereo audio, 2K output,
          and open weights — at a lower per-second price than most competitors at lower resolutions.
        </p>
      </section>

      {/* Rate Limits */}
      <section className="article-section">
        <h2>Rate Limits &amp; Constraints</h2>
        <div className="article-table-wrap">
          <table className="article-table">
            <tbody>
              <SpecRow label="Concurrency" value="2 (free) / 15 (paid) / 30 (enterprise)" />
              <SpecRow label="Max Request Body" value="64MB total; images ≤30MB, video ≤50MB, audio ≤15MB" />
              <SpecRow label="Reference Images" value="Max 9 per request" />
              <SpecRow label="Reference Videos" value="Max 3, each 2–15 seconds, total ≤15 seconds" />
              <SpecRow label="Reference Audio" value="Max 3, each 2–15 seconds (must pair with image/video)" />
              <SpecRow label="Image Constraints" value="JPG/PNG/WEBP/HEIC/HEIF, 256–5760px, ratio 0.4–2.5" />
              <SpecRow label="Callback Window" value="3 seconds challenge response" />
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="article-section">
        <h2>Frequently Asked Questions</h2>

        <h3>How much does 10 seconds of MiniMax H3 video cost?</h3>
        <p>
          $1.30 at 2K ($0.13/sec) or $0.80 at 768P ($0.08/sec). Reference images past the fifth
          add $0.04 each. Reference video input is billed at the output resolution rate.
        </p>

        <h3>Is MiniMax H3 cheaper than Kling or Runway?</h3>
        <p>
          Yes, significantly. MiniMax H3 at 2K ($0.13/sec) is cheaper than Kling at 1080P ($0.14/sec)
          and Runway Gen-4 ($0.15/sec), while offering higher resolution and native audio.
        </p>

        <h3>Can I self-host MiniMax H3?</h3>
        <p>
          The base model weights are open under the Community License, but self-hosting is limited
          to 768P output. The Context-IR preprocessing and 2K regeneration steps require the hosted
          API. The transformer alone is 61.7 GB in BF16.
        </p>

        <h3>Does MiniMax H3 support text generation?</h3>
        <p>
          No — MiniMax H3 is a video generation model. For text LLM APIs (chat, reasoning, code
          generation), consider DeepSeek, Qwen, Kimi, or GLM through{" "}
          <Link href="/models">Maridian Gateway</Link>.
        </p>
      </section>

      {/* CTA */}
      <section className="article-cta">
        <h2>Need Text Generation Instead?</h2>
        <p>
          Maridian Gateway offers DeepSeek, Qwen, Kimi, and GLM through one OpenAI-compatible API
          with regional routing, workspace-level spend controls, and an immutable billing ledger.
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
      <td style={{ fontWeight: 500 }}>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

function PriceRow({ duration, k2, p768 }: { duration: string; k2: string; p768: string }) {
  return (
    <tr>
      <td>{duration}</td>
      <td>{k2}</td>
      <td>{p768}</td>
    </tr>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="article-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
