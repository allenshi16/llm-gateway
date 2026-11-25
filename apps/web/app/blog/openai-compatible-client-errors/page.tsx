import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@gateway/ui";
import { MarketingPage } from "../../marketing-page";
import { pythonExample } from "../../../lib/chat-guide";
import { consoleLogInUrl } from "../../../lib/console-url";

export const metadata: Metadata = {
  title: "OpenAI-Compatible Python Client: BestLLM Setup & API Errors",
  description: "Send a non-streaming DeepSeek Chat request with the Python OpenAI client. Diagnose authentication, region, rate-limit and settlement errors without blind retries.",
  alternates: { canonical: "/blog/openai-compatible-client-errors" },
  openGraph: { type: "article", title: "OpenAI-compatible Python client: setup and errors", description: "A practical BestLLM text-chat tutorial with explicit compatibility limits." },
};

const errors = [
  ["401", "missing_api_key / invalid_api_key", "Check the Bearer header and workspace key. Replace a revoked key; do not log it."],
  ["400", "invalid_request", "Check model, non-empty messages, positive integer token limit, and boolean stream. The response may contain validation details."],
  ["403", "email_verification_required", "Complete account email verification before retrying. Ask your administrator if that flow is unavailable."],
  ["403", "region_not_served", "The current gateway accepts US-scoped keys only. Do not relabel a workload to bypass residency requirements."],
  ["403", "model_route_not_approved", "Ask the workspace administrator to check entitlement, route approval, retention policy and kill switch. A catalog entry is not authorization."],
  ["402", "wallet_authorization_required", "In the current implementation, dispatch is disabled. Contact the operator; adding funds alone does not enable dispatch."],
  ["429", "key_rate_limited / too_many_requests", "Reduce concurrency and token limits. Honor Retry-After when present; the site-level limiter may omit it. Use bounded backoff."],
  ["501", "streaming_not_implemented", "Use stream=False. This gateway does not currently return streaming chunks."],
  ["502", "provider_request_failed", "The upstream request failed. Check service status and usage before deciding whether to retry."],
  ["503", "settlement_pending / provider_reconciliation_required", "The provider may already have processed the request. Check Usage and Billing and contact the operator before resending; do not automatically retry."],
  ["503", "key_service_unconfigured / dispatch_service_unconfigured", "Operator configuration is missing. A client-side model or SDK change will not fix this."],
] as const;

export default async function ClientTutorial() {
  const consoleUrl = await consoleLogInUrl();
  return <MarketingPage eyebrow="TUTORIAL / UPDATED NOVEMBER 24, 2026" title="Connect an OpenAI-compatible Python client, then diagnose the first response." intro="Start with a single text prompt and a small output budget. This walkthrough uses the implemented non-streaming BestLLM endpoint; it does not claim full OpenAI API parity or a measured live provider result.">
    <Card><h2>1. Check the prerequisites</h2><p>Follow the <Link href="/docs/deepseek-chat-api">DeepSeek Chat setup guide</Link> first: verified email, US-scoped workspace key, approved model access, available wallet funds, and an enabled gateway. Confirm the effective workspace price before sending a billable request.</p><p>This tutorial publishes no price quote or benchmark. Its source is the current gateway request contract, reviewed November 24, 2026.</p></Card>
    <Card><h2>2. Prepare a server-side client</h2><p>In your own Python environment, install the official client with <code>python -m pip install openai</code>. Set <code>BESTLLM_API_KEY</code> securely in the environment. Save the following as <code>first_chat.py</code> and run <code>python first_chat.py</code>.</p><p>The base URL ends in <code>/v1</code>; the client adds <code>/chat/completions</code>. Do not append that path twice. For a configured local gateway, use <code>http://127.0.0.1:4000/v1</code>.</p></Card>
    <Card><h2>Why disable retries?</h2><p><code>max_retries=0</code> lets you inspect one attempt at a time. A connection timeout does not prove the provider did no work. This guide does not assume that resending a request is idempotent.</p><p><code>max_tokens=128</code> limits requested output, not total dollar spend. Input tokens also count. Check the approved route’s output ceiling and effective price before increasing it.</p></Card>
    <Card className="integration-guide-wide"><h2>3. Run a non-streaming request</h2><pre className="integration-guide-code"><code>{pythonExample}</code></pre><p>On HTTP success, read the message and usage, then verify the corresponding request in Console Usage and the charge in Billing. The example deliberately uses no tools, image inputs, structured-output mode or streaming.</p><p>The SDK can raise an HTTP exception for the gateway’s flat error body. Inspect <code>exc.response.text</code> rather than assuming an OpenAI-style nested error object. Redact account data before sharing logs.</p></Card>
    <Card className="integration-guide-wide"><h2>4. Match the error to the next action</h2><div className="integration-guide-table"><table><caption>Errors emitted by the current gateway</caption><thead><tr><th scope="col">HTTP</th><th scope="col">Error code</th><th scope="col">Next action</th></tr></thead><tbody>{errors.map(([status, code, action]) => <tr key={code}><td>{status}</td><td><code>{code}</code></td><td>{action}</td></tr>)}</tbody></table></div><p>A generic 500 can also indicate a server-side failure, including an unhandled wallet reservation error. Do not interpret every failure as insufficient credit; retain the status and timestamp for the operator.</p></Card>
    <Card><h2>5. Verify before expanding</h2><p><a href={consoleUrl}>Open Console</a> to confirm usage and billing. Keep one request at a time until the approved route works. Then increase workload gradually within your key’s limits.</p><p>This recipe covers the Python client only. It does not establish T3 Code, MCP, Responses API, streaming, or arbitrary OpenAI client compatibility.</p><Link href="/docs">API documentation →</Link></Card>
  </MarketingPage>;
}
