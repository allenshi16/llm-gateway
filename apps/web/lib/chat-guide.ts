// Shared by the rendered guides so examples have one reviewable request payload.
export const firstChatRequest = {
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Explain an API gateway in one sentence." }],
  max_tokens: 128,
  stream: false,
} as const;

export const curlExample = `curl --silent --show-error --fail-with-body --max-time 70 \\
  https://api.bestllm.dev/v1/chat/completions \\
  -H "Authorization: Bearer \${BESTLLM_API_KEY:?Set BESTLLM_API_KEY securely first}" \\
  -H "Content-Type: application/json" \\
  --data '${JSON.stringify(firstChatRequest, null, 2)}'`;

export const pythonExample = `import os
from openai import OpenAI, APIStatusError, APIConnectionError

client = OpenAI(
    api_key=os.environ["BESTLLM_API_KEY"],
    base_url="https://api.bestllm.dev/v1",
    max_retries=0,
    timeout=70.0,
)

try:
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": "Explain an API gateway in one sentence."}],
        max_tokens=128,
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
