import Link from "next/link";
import type { Metadata } from "next";
import { MarketingPage } from "../marketing-page";
import { Card } from "@gateway/ui";
import { consoleLogInUrl } from "../../lib/console-url";

export const metadata: Metadata = {
  title: "BestLLM API Documentation — Chat Completions Quickstart",
  description: "Start with non-streaming OpenAI-compatible chat completions, check workspace access, and troubleshoot BestLLM API errors.",
  alternates: { canonical: "/docs" },
};

export default async function DocsPage() {
  const consoleUrl = await consoleLogInUrl();
  return <MarketingPage eyebrow="DOCS / CHAT COMPLETIONS" title="Make your first approved model request." intro="Use an OpenAI-compatible client for text chat completions. Start with a verified account, a US workspace key, an approved model route, and available wallet funds.">
    <Card><h2>Current API scope</h2><p>Reviewed November 24, 2026: the current gateway handles non-streaming POST requests to <code>/v1/chat/completions</code>. Use <code>stream: false</code>. Non-US keys are rejected. Route approval is a gateway policy check, not independent proof of a provider’s data residency.</p><p>OpenAI compatibility here describes the chat-completion request format. It does not promise the Responses API, public model-listing endpoint, streaming, or every provider feature.</p></Card>
    <Card><h2>1. Check access</h2><p><a href={consoleUrl}>Sign in to the Console</a>, select your workspace, check Models and Billing, then create a key under API keys. Verify your email before calling the API. A catalog listing alone does not grant access.</p><p>If a route or email-verification flow is unavailable, ask your workspace administrator to resolve it before sending requests.</p></Card>
    <Card><h2>2. Connect DeepSeek Chat</h2><p>Use the existing <code>deepseek-chat</code> alias with a small, non-streaming request. The guide explains prerequisites, endpoint selection, and pricing verification.</p><Link href="/docs/deepseek-chat-api">DeepSeek Chat API setup →</Link></Card>
    <Card><h2>3. Connect GLM-5</h2><p>Use the <code>glm-5</code> alias with non-streaming <code>curl</code> and Python OpenAI SDK examples, explicit GLM-5 family version boundaries, and workspace pricing checks.</p><Link href="/docs/glm-5-api">GLM-5 API setup →</Link></Card>
    <Card><h2>4. Diagnose the first response</h2><p>Follow the Python client tutorial for a bounded request, disabled automatic retries, and the gateway’s actual error codes.</p><Link href="/blog/openai-compatible-client-errors">OpenAI-compatible client tutorial →</Link></Card>
    <Card><h2>Prices and model availability</h2><p>The <Link href="/models">public catalog</Link> is informational. Confirm the current alias, approved route, and effective price for your workspace before use. No live price or availability check was performed for this guide.</p></Card>
  </MarketingPage>;
}
