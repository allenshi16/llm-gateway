import Link from "next/link";
import { ContentCard, MarketingPage } from "../marketing-page";
import { getSupportedModels } from "@gateway/brand/models";

export const metadata = {
  title: "LLM API Platform — OpenAI-Compatible Gateway Architecture | BestLLM",
  description:
    "How the BestLLM OpenAI-compatible LLM API gateway works: one endpoint for DeepSeek, Qwen, Kimi, GLM, and MiniMax with regional routing, policy enforcement before dispatch, workspace isolation, and transparent per-token billing.",
};

export default function PlatformPage() {
  const supported = getSupportedModels();

  return (
    <MarketingPage
      eyebrow="PLATFORM / OPENAI-COMPATIBLE LLM API GATEWAY"
      title="The operating layer between your product and every LLM."
      intro="BestLLM is an OpenAI-compatible LLM API gateway that sits between your application and every model provider. Keep the developer experience simple — one endpoint, one SDK format, one bill — while your team owns provider approvals, regional policy, spend controls, and auditability."
    >
      <ContentCard title="One compatible API for every model">
        <p>
          Point existing OpenAI SDK integrations at one stable surface and change model routes
          without rewriting every application. Your code uses the same chat completions format,
          the same streaming protocol, the same response shapes — regardless of whether the
          upstream model is{" "}
          <Link href="/models/deepseek-chat">DeepSeek Chat</Link>,{" "}
          <Link href="/models/qwen3-8-max">Qwen3.8 Max</Link>,{" "}
          <Link href="/models/kimi-k3">Kimi K3</Link>,{" "}
          <Link href="/models/glm-5">GLM-5</Link>, or{" "}
          <Link href="/models/minimax-m3">MiniMax M3</Link>. Adding a new model to your
          workflow means changing one field in the request body, not onboarding a new provider
          contract, a new SDK, or a new billing relationship.
        </p>
      </ContentCard>

      <ContentCard title="Policy enforcement before dispatch">
        <p>
          Region, retention, provider, model, and fallback rules are evaluated before a request
          leaves your boundary. Every model route requires explicit approval — if a model is not
          on the approved list for a workspace, the request is rejected before it reaches the
          upstream provider. This is compliance-aware routing for US and EU deployments: you
          control which regions serve traffic, which models a team can access, and what happens
          when a provider is unavailable. No cross-region fallback fires unless your workspace
          policy explicitly allows it.
        </p>
      </ContentCard>

      <ContentCard title="Commercial truth: ledger you can reconcile">
        <p>
          Reservations, captures, releases, price snapshots, and append-only ledger entries
          turn usage into explainable charges. When a request arrives, the gateway reserves the
          estimated cost. As the response streams, the reservation captures actual token usage.
          When the response completes, the final charge is recorded with a versioned price
          snapshot from the moment of dispatch. Your invoices reconcile to individual requests —
          not monthly aggregates with unexplained variance. See our{" "}
          <Link href="/pricing">pricing page</Link> for plan details and the per-model cost
          breakdown.
        </p>
      </ContentCard>

      <ContentCard title="Workspace isolation and RBAC">
        <p>
          Every API key belongs to a workspace. Workspaces sit inside organizations. Roles
          control who can create keys, approve model routes, set spend limits, and view billing
          data. Audit trails record every configuration change. This means your engineering team
          can self-serve model access within approved boundaries, while your security and finance
          teams retain oversight. The gateway enforces boundaries at the edge — not in
          after-the-fact log reviews.
        </p>
      </ContentCard>

      <ContentCard title="How requests flow through BestLLM">
        <p>
          Your application sends a chat completion request to{" "}
          <code>https://api.bestllm.dev/v1/chat/completions</code> with a model ID and
          workspace API key. The edge service authenticates the key, checks workspace policy
          (approved models, regional constraints, spend limits), reserves the estimated cost
          from the wallet, and dispatches to the approved provider route. The provider response
          streams back through the edge, tokens are captured in real time, and the final ledger
          entry is written on completion. If anything fails — invalid key, unapproved model,
          region violation, insufficient balance — the request is rejected before it reaches the
          provider.
        </p>
      </ContentCard>

      {/* SEO: supported models quick links */}
      <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
        <h2>Supported model routes</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Every model below is live and accessible through one OpenAI-compatible endpoint.
          Click through for full pricing, context window specs, benchmark data, and API
          integration examples.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {supported.map((m) => (
            <Link
              key={m.slug}
              href={`/models/${m.slug}`}
              style={{
                padding: "0.5rem 1rem", border: "1px solid #d1d5db",
                borderRadius: "6px", textDecoration: "none",
                fontSize: "0.85rem", color: "#374151",
                display: "flex", flexDirection: "column", gap: "0.15rem",
              }}
            >
              <span style={{ fontWeight: 600 }}>{m.name}</span>
              <span style={{ fontSize: "0.75rem", color: "#888" }}>
                {m.contextWindow} · {m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"} input
              </span>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", lineHeight: 1.7, color: "#555" }}>
          Also see our{" "}
          <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026</Link>{" "}
          comparison for pricing and benchmark details across all providers, or read the{" "}
          <Link href="/docs">API documentation</Link> to get started in five minutes.
        </p>
      </div>
    </MarketingPage>
  );
}
