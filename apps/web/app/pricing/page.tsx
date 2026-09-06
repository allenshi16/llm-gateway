import Link from "next/link";
import { ContentCard, MarketingPage } from "../marketing-page";

export const metadata = {
  title: "LLM API pricing — DeepSeek, Qwen, Kimi, GLM",
  description:
    "Transparent LLM API pricing with plan controls, regional routing, and usage accounting. DeepSeek from $0.27/M input, Qwen from $0.40/M, Kimi from $0.60/M.",
};

export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="PRICING / TRANSPARENT BY DESIGN"
      title="Spend controls that scale with your workload."
      intro="Start with a plan, keep usage visible, and give finance a ledger they can reconcile. Provider cost and customer charges remain separate by design."
    >
      <ContentCard title="Starter">
        For prototypes and early production workloads that need a clean OpenAI-compatible entry point.
      </ContentCard>
      <ContentCard title="Team">
        For organizations with multiple workspaces, role-based access, approved routes, and shared budgets.
      </ContentCard>
      <ContentCard title="Enterprise">
        For regional policy, security review, residency requirements, and negotiated commercial controls.
      </ContentCard>

      {/* SEO-rich pricing comparison section */}
      <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
        <h2>Model pricing at a glance</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Pay only for the models you use. All prices per million tokens unless noted.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Model</th>
                <th style={{ textAlign: "right", padding: "0.75rem" }}>Input</th>
                <th style={{ textAlign: "right", padding: "0.75rem" }}>Output</th>
                <th style={{ textAlign: "left", padding: "0.75rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              <PricingRow model="DeepSeek Chat" input="$0.27" output="$1.10" link="/models/deepseek-chat" />
              <PricingRow model="DeepSeek Reasoner" input="$0.55" output="$2.19" link="/models/deepseek-reasoner" />
              <PricingRow model="Qwen Plus" input="$0.40" output="$1.20" link="/models/qwen-plus" />
              <PricingRow model="Kimi K2" input="$0.60" output="$1.80" link="/models/kimi-k2" />
              <PricingRow model="GLM-4 Plus" input="$0.70" output="$2.10" link="/models/glm-4-plus" />
              <PricingRow model="Qwen Max" input="$1.60" output="$6.40" link="/models/qwen-max" />
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          See individual model pages for full pricing details, context windows, and API examples.
          For a comprehensive comparison, read our{" "}
          <Link href="/blog/best-chinese-models-2026">Best Chinese AI Models 2026 guide</Link>.
        </p>
      </div>
    </MarketingPage>
  );
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
