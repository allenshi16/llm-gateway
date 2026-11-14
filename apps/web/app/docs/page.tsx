import Link from "next/link";
import { ContentCard, MarketingPage } from "../marketing-page";
import { getSupportedModels } from "@gateway/brand/models";

export const metadata = {
  title: { absolute: "LLM API Documentation — Quickstart & Reference | BestLLM" },
  description:
    "BestLLM API documentation: quickstart guide, OpenAI-compatible chat completions endpoint, authentication, request and response examples, error codes, rate limits, and SDK setup for DeepSeek, Qwen, Kimi, GLM.",
};

export default function DocsPage() {
  const supported = getSupportedModels();

  return (
    <MarketingPage
      eyebrow="DOCS / OPENAI-COMPATIBLE API"
      title="Connect once. Route to any supported model."
      intro="BestLLM uses the OpenAI Chat Completions API format. If your code already calls OpenAI, you can switch to BestLLM by changing two lines: the base URL and the API key. This guide walks through setup, authentication, request format, and common patterns."
    >
      <ContentCard title="Base URL">
        <p>
          All API requests go through a single endpoint:
        </p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`https://api.bestllm.dev/v1`}
        </pre>
        <p>
          This base URL serves all supported models — DeepSeek Chat, DeepSeek Reasoner, Qwen3.8
          Max, Qwen Plus, Kimi K3, GLM-5, and MiniMax M3. The model is selected per-request via
          the <code>model</code> field in the request body. There are no separate endpoints per
          model.
        </p>
      </ContentCard>

      <ContentCard title="Authentication">
        <p>
          Create a live API key in the <Link href="/pricing">BestLLM Console</Link>. Store it
          server-side and send it as a Bearer token in the <code>Authorization</code> header.
          Never expose your API key in browser code or client-side JavaScript.
        </p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`Authorization: Bearer $BESTLLM_API_KEY`}
        </pre>
        <p>
          Each API key is scoped to a workspace. Workspace-level spend controls, approved model
          routes, and regional policy all apply to requests made with that key.
        </p>
      </ContentCard>

      <ContentCard title="Quickstart: Chat Completions">
        <p>
          The chat completions endpoint accepts the same request format as OpenAI. Here is a
          complete example using <code>curl</code>:
        </p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in one paragraph."}
    ],
    "temperature": 0.7,
    "stream": false
  }'`}
        </pre>
        <p>The response follows the OpenAI format:</p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`{
  "id": "chatcmpl-bestllm-...",
  "object": "chat.completion",
  "created": 1728000000,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses qubits..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 22,
    "completion_tokens": 45,
    "total_tokens": 67
  }
}`}
        </pre>
      </ContentCard>

      <ContentCard title="SDK Setup: OpenAI Python SDK">
        <p>
          The official OpenAI Python SDK works with BestLLM out of the box. Set the base URL
          and API key:
        </p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.bestllm.dev/v1",
    api_key="your-bestllm-api-key"
)

# Non-streaming
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model="qwen3-8-max",
    messages=[{"role": "user", "content": "Write a haiku"}],
    stream=True
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`}
        </pre>
      </ContentCard>

      <ContentCard title="SDK Setup: OpenAI Node.js SDK">
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.bestllm.dev/v1",
  apiKey: process.env.BESTLLM_API_KEY,
});

const response = await client.chat.completions.create({
  model: "kimi-k3",
  messages: [{ role: "user", content: "Analyze this codebase" }],
});

console.log(response.choices[0].message.content);`}
        </pre>
      </ContentCard>

      <ContentCard title="Migrating from OpenRouter">
        Already on OpenRouter? Point <code>base_url</code> at <code>https://api.bestllm.dev/v1</code>{" "}
        and drop the provider prefix from <code>model</code> (e.g. <code>deepseek/deepseek-chat</code>{" "}
        → <code>deepseek-chat</code>); everything else stays the same.{" "}
        <Link className="text-link" href="/alternatives/openrouter">
          OpenRouter alternative: comparison, pricing & migration →
        </Link>
      </ContentCard>

      <ContentCard title="Available Models">
        <p>
          The following models are live and accessible through the BestLLM API. Use the model
          ID in the <code>model</code> field of your request. Each model page has full pricing,
          specs, and integration examples.
        </p>
        <table style={{
          width: "100%", borderCollapse: "collapse", marginTop: "0.75rem",
          fontSize: "0.85rem",
        }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Model ID</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Provider</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Context</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Input /M</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Output /M</th>
            </tr>
          </thead>
          <tbody>
            {supported.map((m) => (
              <tr key={m.slug} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.5rem" }}>
                  <Link href={`/models/${m.slug}`} style={{ fontWeight: 500 }}>
                    {m.slug}
                  </Link>
                </td>
                <td style={{ padding: "0.5rem" }}>{m.provider}</td>
                <td style={{ padding: "0.5rem" }}>{m.contextWindow}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  {m.pricing.find((p) => p.inputPerM !== "—")?.inputPerM ?? "—"}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  {m.pricing.find((p) => p.outputPerM !== "—")?.outputPerM ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ContentCard>

      <ContentCard title="Streaming">
        <p>
          Set <code>"stream": true</code> in the request body to receive server-sent events
          (SSE). The response format matches OpenAI streaming: each chunk contains a{" "}
          <code>delta</code> object with partial content. BestLLM streams tokens as they arrive
          from the upstream provider with no additional buffering.
        </p>
        <pre style={{
          background: "#f8f9fa", padding: "0.75rem", borderRadius: "6px",
          fontSize: "0.85rem", margin: "0.75rem 0", overflow: "auto",
        }}>
{`curl -X POST https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer $BESTLLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Count to 10"}],
    "stream": true
  }'`}
        </pre>
      </ContentCard>

      <ContentCard title="Error Codes">
        <p>BestLLM returns standard HTTP status codes with JSON error bodies:</p>
        <table style={{
          width: "100%", borderCollapse: "collapse", marginTop: "0.75rem",
          fontSize: "0.85rem",
        }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Code</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>401</code></td>
              <td style={{ padding: "0.5rem" }}>Invalid or missing API key</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>403</code></td>
              <td style={{ padding: "0.5rem" }}>Model route not approved for this workspace</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>404</code></td>
              <td style={{ padding: "0.5rem" }}>Unknown model or endpoint</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>429</code></td>
              <td style={{ padding: "0.5rem" }}>Rate limit exceeded — check workspace limits</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>502</code></td>
              <td style={{ padding: "0.5rem" }}>Upstream provider error — retry or switch model</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.5rem" }}><code>503</code></td>
              <td style={{ padding: "0.5rem" }}>Model route temporarily unavailable</td>
            </tr>
          </tbody>
        </table>
      </ContentCard>

      <ContentCard title="Rate Limits">
        <p>
          Rate limits are configured per workspace and per API key. Default limits depend on your
          plan tier. If you receive a <code>429</code> response, the <code>Retry-After</code>{" "}
          header indicates how many seconds to wait before the next request. Contact support to
          raise limits for your workspace.
        </p>
      </ContentCard>

      {/* Full API reference note */}
      <div style={{ gridColumn: "1 / -1", marginTop: "2rem", padding: "1.5rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <h2>Full API reference</h2>
        <p style={{ color: "#555", lineHeight: 1.7 }}>
          The public API reference is being expanded alongside the production Edge contract.
          The core surface — chat completions, streaming, model listing — is stable and
          production-ready. For questions about specific endpoints, request formats, or
          integration patterns, reach out through the Console support channel.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <Link href="/models" style={{ color: "#2563eb" }}>Browse all model pages →</Link>
          {" · "}
          <Link href="/pricing" style={{ color: "#2563eb" }}>View pricing →</Link>
          {" · "}
          <Link href="/platform" style={{ color: "#2563eb" }}>Explore the platform →</Link>
        </p>
      </div>
    </MarketingPage>
  );
}
