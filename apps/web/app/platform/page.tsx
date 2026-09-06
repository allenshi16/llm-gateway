import Link from "next/link";
import { ContentCard, MarketingPage } from "../marketing-page";

export const metadata = {
  title: "LLM API platform — OpenAI-compatible gateway",
  description:
    "A regional, OpenAI-compatible LLM gateway for teams that need provider choice, policy enforcement, and accountable spend. DeepSeek, Qwen, Kimi, GLM in one API.",
};

export default function PlatformPage() {
  return (
    <MarketingPage
      eyebrow="PLATFORM / CONTROL PLANE"
      title="The operating layer between your product and every model."
      intro="Keep the developer experience simple while your team owns provider approvals, regional policy, spend controls, and auditability."
    >
      <ContentCard title="One compatible API">
        Point existing OpenAI SDK integrations at one stable surface and change model routes
        without rewriting every application. Works with{" "}
        <Link href="/models/deepseek-chat">DeepSeek</Link>,{" "}
        <Link href="/models/qwen-max">Qwen</Link>,{" "}
        <Link href="/models/kimi-k2">Kimi</Link>,{" "}
        <Link href="/models/glm-4-plus">GLM</Link>, and more.
      </ContentCard>
      <ContentCard title="Policy before dispatch">
        Region, retention, provider, model, and fallback rules are evaluated before a request
        leaves your boundary. Compliance-aware routing for US and EU deployments.
      </ContentCard>
      <ContentCard title="Commercial truth">
        Reservations, captures, releases, price snapshots, and append-only ledger entries
        turn usage into explainable charges. See our{" "}
        <Link href="/pricing">pricing page</Link> for plan details.
      </ContentCard>

      {/* SEO: supported models quick links */}
      <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
        <h2>Supported models</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Access approved model routes through one OpenAI-compatible endpoint:
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { slug: "deepseek-chat", name: "DeepSeek Chat" },
            { slug: "deepseek-reasoner", name: "DeepSeek Reasoner" },
            { slug: "qwen-max", name: "Qwen Max" },
            { slug: "qwen-plus", name: "Qwen Plus" },
            { slug: "kimi-k2", name: "Kimi K2" },
            { slug: "glm-4-plus", name: "GLM-4 Plus" },
          ].map((m) => (
            <Link
              key={m.slug}
              href={`/models/${m.slug}`}
              style={{
                padding: "0.4rem 0.8rem", border: "1px solid #d1d5db",
                borderRadius: "6px", textDecoration: "none",
                fontSize: "0.85rem", color: "#374151",
              }}
            >
              {m.name}
            </Link>
          ))}
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Also see our{" "}
          <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026</Link>{" "}
          comparison for pricing and benchmark details across all providers.
        </p>
      </div>
    </MarketingPage>
  );
}
