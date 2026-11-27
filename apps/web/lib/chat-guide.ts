// Shared by the rendered guides so examples have one reviewable request payload.
interface ChatGuideRequest {
  readonly model: string;
  readonly messages: readonly [{ readonly role: "user"; readonly content: string }];
  readonly max_tokens: number;
  readonly stream: false;
}

function buildCurlExample(request: ChatGuideRequest): string {
  return `curl --silent --show-error --fail-with-body --max-time 70 \\
  https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer \${BESTLLM_API_KEY:?Set BESTLLM_API_KEY securely first}" \\
  -H "Content-Type: application/json" \\
  --data '${JSON.stringify(request, null, 2)}'`;
}

function buildPythonExample(request: ChatGuideRequest): string {
  const prompt = JSON.stringify(request.messages[0].content);
  const model = JSON.stringify(request.model);
  return `import os
from openai import OpenAI, APIStatusError, APIConnectionError

client = OpenAI(
    api_key=os.environ["BESTLLM_API_KEY"],
    base_url="https://api.bestllm.dev/v1",
    max_retries=0,
    timeout=70.0,
)

try:
    response = client.chat.completions.create(
        model=${model},
        messages=[{"role": "user", "content": ${prompt}}],
        max_tokens=${request.max_tokens},
        stream=False,
    )
    print(response.choices[0].message.content)
    print(response.usage)
except APIStatusError as exc:
    # Gateway errors use {"error": "code"}; inspect the HTTP body directly.
    print("HTTP", exc.status_code)
    print(exc.response.text)
except APIConnectionError:
    print("Connection or timeout error. Check usage before retrying.")`;
}

export const firstChatRequest = {
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Explain an API gateway in one sentence." }],
  max_tokens: 128,
  stream: false,
} as const satisfies ChatGuideRequest;

export const curlExample = buildCurlExample(firstChatRequest);

export const pythonExample = buildPythonExample(firstChatRequest);

export const glm5ChatRequest = {
  model: "glm-5",
  messages: [{ role: "user", content: "Explain the difference between TCP and UDP in two sentences." }],
  max_tokens: 128,
  stream: false,
} as const satisfies ChatGuideRequest;

export const glm5CurlExample = buildCurlExample(glm5ChatRequest);

export const glm5PythonExample = buildPythonExample(glm5ChatRequest);
