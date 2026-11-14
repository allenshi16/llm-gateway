import Link from "next/link";
import { ContentCard, MarketingPage } from "../marketing-page";
import { getSupportedModels } from "@gateway/brand/models";

export const metadata = {
  title: "LLM API Pricing — DeepSeek, Qwen, Kimi, GLM, MiniMax | BestLLM",
  description:
    "Transparent per-token LLM API pricing. DeepSeek Chat from $0.30/M input, Qwen Plus from $0.30/M, MiniMax M3 from $0.31/M, GLM-5 from $0.60/M. No hidden fees. Choose Starter, Team, or Enterprise.",
};

export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="PRICING / TRANSPARENT BY DESIGN"
      title="Per-token pricing you can read. Plans that scale with your team."
      intro="Every model has a clear input and output price per million tokens. No hidden markups, no per-request surcharges, no minimum commitments. Pick the plan that matches your workspace needs — model pricing stays the same across all tiers."
    >
      <ContentCard title="Starter — $29/mo">
        <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>$29<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#666" }}>/month</span></p>
        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0", color: "#555", lineHeight: 1.8 }}>
          <li>1 workspace, 3 API keys</li>
          <li>All supported models (DeepSeek, Qwen, Kimi, GLM, MiniMax)</li>
          <li>Community support</li>
          <li>Usage dashboard and spend alerts</li>
          <li>Cost pass-through model pricing — pay only for tokens used</li>
        </ul>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
          For prototypes and early production workloads that need a clean OpenAI-compatible entry
          point with transparent billing.
        </p>
      </ContentCard>

      <ContentCard title="Team — $99/mo">
        <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>$99<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#666" }}>/month</span></p>
        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0", color: "#555", lineHeight: 1.8 }}>
          <li>Everything in Starter, plus:</li>
          <li>Up to 5 workspaces, 20 API keys</li>
          <li>Role-based access control (RBAC)</li>
          <li>Approved model routes per workspace</li>
          <li>Shared budgets and spend limits</li>
          <li>Priority email support</li>
        </ul>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
          For organizations with multiple workspaces, role-based access, approved routes, and
          shared budgets that need governance without enterprise overhead.
        </p>
      </ContentCard>

      <ContentCard title="Enterprise — Custom">
        <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>Custom<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#666" }}> / contact sales</span></p>
        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0", color: "#555", lineHeight: 1.8 }}>
          <li>Everything in Team, plus:</li>
          <li>Unlimited workspaces and API keys</li>
          <li>Regional policy enforcement (US, EU)</li>
          <li>Security review and SOC 2 alignment</li>
          <li>Residency requirements and data controls</li>
          <li>Negotiated commercial terms and volume pricing</li>
          <li>Dedicated support and SLA</li>
        </ul>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
          For regional policy, security review, residency requirements, and negotiated commercial
          controls that need enterprise-grade governance.
        </p>
      </ContentCard>

      {/* SEO-rich pricing comparison section */}
      <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
        <h2>Which plan fits your workload?</h2>
        <p style={{ marginBottom: "1rem", color: "#555", lineHeight: 1.7 }}>
          Model pricing is the same across all plans — you choose your tier based on the workspace
          features and governance controls you need. Here is a practical guide:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px", marginBottom: "1.5rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.75rem" }}></th>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Starter ($29/mo)</th>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Team ($99/mo)</th>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Enterprise (Custom)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: 500 }}>Workspaces</td>
                <td style={{ padding: "0.75rem" }}>1</td>
                <td style={{ padding: "0.75rem" }}>Up to 5</td>
                <td style={{ padding: "0.75rem" }}>Unlimited</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: 500 }}>API keys</td>
                <td style={{ padding: "0.75rem" }}>3</td>
                <td style={{ padding: "0.75rem" }}>20</td>
                <td style={{ padding: "0.75rem" }}>Unlimited</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: 500 }}>RBAC &amp; approved routes</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>Included</td>
                <td style={{ padding: "0.75rem" }}>Included</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: 500 }}>Regional policy (US/EU)</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>Included</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.75rem", fontWeight: 500 }}>Best for</td>
                <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>Solo devs, prototypes, early production</td>
                <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>Teams with multiple projects and budget controls</td>
                <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>Orgs needing compliance, residency, SLA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Model pricing at a glance</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Pay only for the tokens you use. All prices per million tokens. Model pricing is the
          same across Starter, Team, and Enterprise plans — you choose your plan based on
          workspace features, not model access.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Model</th>
                <th style={{ textAlign: "right", padding: "0.75rem" }}>Input /M tokens</th>
                <th style={{ textAlign: "right", padding: "0.75rem" }}>Output /M tokens</th>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {getSupportedModels()
                .map((m) => ({
                  slug: m.slug,
                  name: m.name,
                  input: m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—",
                  output: m.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—",
                }))
                .sort((a, b) => priceValue(a.input) - priceValue(b.input))
                .map((row) => (
                  <PricingRow
                    key={row.slug}
                    model={row.name}
                    input={row.input}
                    output={row.output}
                    link={`/models/${row.slug}`}
                  />
                ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          All model prices are cost pass-through. See individual model pages for full pricing
          details, context windows, and API examples. For a comprehensive model comparison, read
          our <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026 guide</Link>.
          Comparing providers? <Link href="/alternatives/openrouter">OpenRouter vs BestLLM →</Link>
        </p>

        <h2 style={{ marginTop: "2rem" }}>How billing works</h2>
        <p style={{ marginBottom: "0.75rem", color: "#555", lineHeight: 1.7 }}>
          BestLLM uses a reservation-based billing system. When your request arrives, the gateway
          reserves the estimated cost based on input tokens and the model price. As the response
          streams, the reservation is captured for the actual token count. When the response
          completes, the reservation is released and the final charge is recorded in the ledger.
        </p>
        <p style={{ marginBottom: "0.75rem", color: "#555", lineHeight: 1.7 }}>
          This means you are billed for exactly the tokens that flow through the gateway — not
          estimates, not rounded-up aggregates. Every ledger entry is append-only and includes a
          versioned price snapshot from the moment of dispatch, so your invoices are always
          reconcilable to individual requests.
        </p>
        <p style={{ color: "#555", lineHeight: 1.7 }}>
          Provider cost and customer charges remain separate by design. The price you see is the
          price the gateway bills. There is no hidden markup layer between what providers charge
          and what you pay.
        </p>
        <p>
          Comparing against OpenRouter? BestLLM adds no credit top-up fee on top of token prices —
          see the{" "}
          <Link className="text-link" href="/alternatives/openrouter">OpenRouter vs BestLLM cost comparison</Link>.
        </p>
      </div>
    </MarketingPage>
  );
}

function priceValue(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function PricingRow({ model, input, output, link }: {
  model: string; input: string; output: string; link: string;
}) {
  return (
    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
      <td style={{ padding: "0.75rem" }}>
        <Link href={link} style={{ fontWeight: 500, textDecoration: "none" }}>{model}</Link>
      </td>
      <td style={{ padding: "0.75rem", textAlign: "right" }}>{input}</td>
      <td style={{ padding: "0.75rem", textAlign: "right" }}>{output}</td>
      <td style={{ padding: "0.75rem" }}>
        <Link href={link} style={{ fontSize: "0.85rem", color: "#2563eb" }}>View details →</Link>
      </td>
    </tr>
  );
}
