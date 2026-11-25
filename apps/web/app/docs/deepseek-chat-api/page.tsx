import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@gateway/ui";
import { MarketingPage } from "../../marketing-page";
import { consoleLogInUrl } from "../../../lib/console-url";
import { curlExample } from "../../../lib/chat-guide";

export const metadata: Metadata = {
  title: "DeepSeek Chat API Setup — Non-Streaming OpenAI Client",
  description: "Connect the deepseek-chat alias through BestLLM: workspace prerequisites, a curl request, pricing checks, and current US-only, non-streaming limits.",
  alternates: { canonical: "/docs/deepseek-chat-api" },
  openGraph: { type: "article", title: "DeepSeek Chat API setup with BestLLM", description: "A small non-streaming request, access checks, and honest compatibility limits." },
};

export default async function DeepSeekGuide() {
  const consoleUrl = await consoleLogInUrl();
  return <MarketingPage eyebrow="MODEL ACCESS / DEEPSEEK CHAT" title="Connect DeepSeek Chat with an OpenAI-compatible request." intro="Use the deepseek-chat alias for text chat through BestLLM. This guide covers the implemented non-streaming request path, not a guarantee that a route is enabled for your account.">
    <Card><h2>Before your first call</h2><ol><li><a href={consoleUrl}>Sign in to the Console</a> and select a workspace.</li><li>Verify your account email, then check that Models lists an approved DeepSeek Chat route for your workspace.</li><li>Confirm a US-scoped key and available wallet funds under API keys and Billing.</li><li>Keep your key in a server-side environment variable named <code>BESTLLM_API_KEY</code>. Never paste it into frontend code or a public issue.</li></ol><p>If access is missing, contact your workspace administrator. Changing a model string does not bypass approval.</p></Card>
    <Card><h2>What the alias means</h2><p><code>deepseek-chat</code> exists in the public catalog and gateway route configuration. It is a gateway alias, not a promise of a fixed upstream version. Confirm the current model mapping with your administrator when reproducibility matters.</p><p>Current scope: text chat, <code>stream: false</code>, US-scoped keys. Streaming returns <code>501 streaming_not_implemented</code>; non-US keys return <code>403 region_not_served</code>. Tool calling, structured outputs and multimodal behavior are not validated by this example.</p></Card>
    <Card><h2>Price check before use</h2><p>Reviewed November 24, 2026. The public catalog’s price notes cite a September 29, 2026 supplier snapshot and USD/CNY conversion of 6.72. That historical snapshot is not a verified current quote.</p><p>This guide intentionally gives no numeric price: confirm the effective workspace price before calling. The gateway snapshots its database price when accepting a request; the resulting customer charge appears in usage and billing. See the <Link href="/models/deepseek-chat">catalog entry and its source references</Link> for background.</p></Card>
    <Card className="integration-guide-wide"><h2>Send one small request</h2><p>Set <code>BESTLLM_API_KEY</code> securely in your shell environment first. This command uses the documented public endpoint; a successful live provider call has not been verified for this guide. For a configured local gateway, replace the URL with <code>http://127.0.0.1:4000/v1/chat/completions</code>.</p><pre className="integration-guide-code"><code>{curlExample}</code></pre><p>On success, inspect <code>choices[0].message.content</code> and <code>usage</code>. The upstream model name in the response may differ from your alias. No sample output or latency claim is presented as a measured result.</p></Card>
    <Card><h2>Continue with a client</h2><p>Use a server-side Python client with automatic retries disabled while validating access and billing. A timeout or settlement error can mean the provider already processed the request.</p><Link href="/blog/openai-compatible-client-errors">Python tutorial and error checklist →</Link><p><Link href="/docs">Back to API documentation</Link></p></Card>
  </MarketingPage>;
}
