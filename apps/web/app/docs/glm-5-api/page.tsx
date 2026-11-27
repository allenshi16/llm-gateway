import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@gateway/ui";
import { MarketingPage } from "../../marketing-page";
import { consoleLogInUrl } from "../../../lib/console-url";
import { glm5CurlExample, glm5PythonExample } from "../../../lib/chat-guide";

export const metadata: Metadata = {
  title: "GLM-5 API Setup — Non-Streaming OpenAI Client",
  description: "Connect the glm-5 alias through BestLLM: workspace prerequisites, non-streaming curl and Python SDK examples, GLM-5 family routing scope, pricing checks, and US-only limits.",
  alternates: { canonical: "/docs/glm-5-api" },
  openGraph: {
    type: "article",
    title: "GLM-5 API setup with BestLLM",
    description: "Non-streaming curl and Python examples for glm-5, workspace access checks, GLM-5 family route boundaries, and honest Edge compatibility limits.",
  },
};

export default async function Glm5Guide() {
  const consoleUrl = await consoleLogInUrl();
  return <MarketingPage eyebrow="MODEL ACCESS / GLM-5" title="Connect GLM-5 with an OpenAI-compatible request." intro="Use the glm-5 alias for text chat through BestLLM. This guide documents the implemented non-streaming Edge contract and GLM-5 family route configuration, not a guarantee that a live route is enabled for your account.">
    <Card>
      <h2>Before your first call</h2>
      <ol>
        <li><a href={consoleUrl}>Sign in to the Console</a> and select a workspace.</li>
        <li>Verify your account email, then check that Models lists an approved <code>glm-5</code> route for your workspace.</li>
        <li>Confirm a US-scoped key and available wallet balance under API keys and Billing.</li>
        <li>Store your key in a server-side environment variable named <code>BESTLLM_API_KEY</code>. Never embed it in browser code or public issues.</li>
      </ol>
      <p>If access is missing or dispatch is disabled, ask your workspace administrator. Changing the <code>model</code> string does not bypass route approval (<code>403 model_route_not_approved</code>) or operator dispatch gating (<code>402 wallet_authorization_required</code>).</p>
    </Card>
    <Card>
      <h2>GLM-5 family scope &amp; version boundaries</h2>
      <p><code>glm-5</code> is listed in the public catalog and gateway route configuration. The current gateway route config also defines GLM-5 family entries for <code>glm-5-1</code>, <code>glm-5-2</code>, <code>glm-5-3</code>, and <code>glm-5-3-flash</code>. A config entry is not a promise that every alias is approved or enabled for your workspace — confirm your approved model versions directly in the Console.</p>
      <p><strong>No GLM-5.4 claim:</strong> BestLLM has not launched a <code>glm-5.4</code> route, and this guide publishes no GLM-5.4 benchmarks or third-party Artificial Analysis scores. To compare upstream GLM model generations and specifications, review the <a href="https://docs.z.ai/guides/overview/pricing" target="_blank" rel="noopener noreferrer">official Z.ai documentation</a> and verify your workspace’s active mapping in Console.</p>
    </Card>
    <Card>
      <h2>Edge limits &amp; price check</h2>
      <p>Current Edge scope: text chat via <code>POST /v1/chat/completions</code>, <code>stream: false</code>, and US-scoped keys only. Streaming requests return <code>501 streaming_not_implemented</code>; non-US keys return <code>403 region_not_served</code>. Tool calling, structured outputs, reasoning parameter tuning, and multimodal inputs are not validated by these examples.</p>
      <p>Reviewed November 27, 2026. The <Link href="/models/glm-5">GLM-5 catalog entry</Link> cites a September 29, 2026 supplier snapshot (USD/CNY 6.72) for historical reference only — it is not a verified live quote. Confirm the effective workspace price in Console before sending billable traffic; the gateway snapshots its database price on acceptance and records charges in Usage and Billing.</p>
    </Card>
    <Card className="integration-guide-wide">
      <h2>Send one small non-streaming curl request</h2>
      <p>Export <code>BESTLLM_API_KEY</code> in your shell environment first. This example targets the documented public endpoint; a successful live provider call has not been verified for this guide. For a configured local gateway, replace the URL with <code>http://127.0.0.1:4000/v1/chat/completions</code>.</p>
      <pre className="integration-guide-code"><code>{glm5CurlExample}</code></pre>
      <p>On HTTP 200, inspect <code>choices[0].message.content</code> and <code>usage</code>. The returned upstream model identifier may differ from the <code>glm-5</code> alias. No sample output or latency number is presented as a measured live result.</p>
    </Card>
    <Card className="integration-guide-wide">
      <h2>Non-streaming Python OpenAI SDK example</h2>
      <p>Install the official client with <code>python -m pip install openai</code>, keep <code>max_retries=0</code> while validating access and billing, and set <code>stream=False</code>. For a configured local gateway, use <code>base_url=&quot;http://127.0.0.1:4000/v1&quot;</code>.</p>
      <pre className="integration-guide-code"><code>{glm5PythonExample}</code></pre>
      <p>A connection timeout or <code>503</code> settlement response does not prove the upstream provider did no work — check Console Usage and Billing before resending. Gateway errors use flat <code>{'{"error": "code"}'}</code> JSON bodies, so inspect <code>exc.response.text</code> directly.</p>
    </Card>
    <Card>
      <h2>Troubleshoot &amp; next steps</h2>
      <p>Review every error code emitted by the current Edge service — including auth, region, route approval, rate limits, and settlement reconciliation — before scaling traffic.</p>
      <p><Link href="/blog/openai-compatible-client-errors">OpenAI-compatible client error checklist →</Link></p>
      <p><Link href="/models/glm-5">GLM-5 catalog overview &amp; specs →</Link></p>
      <p><Link href="/docs/deepseek-chat-api">DeepSeek Chat API setup →</Link></p>
      <p><a href="https://docs.z.ai/guides/overview/pricing" target="_blank" rel="noopener noreferrer">Official Z.ai GLM documentation →</a></p>
      <p><Link href="/docs">Back to API documentation</Link></p>
    </Card>
  </MarketingPage>;
}
