import { describe, expect, it } from "vitest";
import { chatCompletionRequestSchema } from "../packages/contracts/src/openai.js";
import {
  curlExample,
  firstChatRequest,
  glm5ChatRequest,
  glm5CurlExample,
  glm5PythonExample,
  pythonExample,
} from "../apps/web/lib/chat-guide.js";
import sitemap from "../apps/web/app/sitemap.js";

function extractCurlJsonPayload(curlCommand: string): unknown {
  const match = curlCommand.match(/--data '([\s\S]*)'$/);
  expect(match?.[1]).toBeTruthy();
  return JSON.parse(match![1]!);
}

describe("web integration guide examples", () => {
  it("validates DeepSeek and GLM-5 payloads against the Edge Zod contract", () => {
    for (const payload of [firstChatRequest, glm5ChatRequest]) {
      const parsed = chatCompletionRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.stream).toBe(false);
        expect(parsed.data.max_tokens).toBeGreaterThan(0);
        expect(parsed.data.messages.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps curl examples non-streaming, secret-safe, and aligned with the Zod contract", () => {
    const cases = [
      { command: curlExample, expected: firstChatRequest },
      { command: glm5CurlExample, expected: glm5ChatRequest },
    ];

    for (const { command, expected } of cases) {
      expect(command).toContain("https://api.bestllm.dev/v1/chat/completions");
      expect(command).toContain("BESTLLM_API_KEY");
      const embedded = extractCurlJsonPayload(command);
      expect(embedded).toEqual(expected);
      expect(chatCompletionRequestSchema.safeParse(embedded).success).toBe(true);
    }
  });

  it("keeps Python examples non-streaming, retry-disabled, and aligned with their model aliases", () => {
    const cases = [
      { script: pythonExample, request: firstChatRequest },
      { script: glm5PythonExample, request: glm5ChatRequest },
    ];

    for (const { script, request } of cases) {
      expect(script).toContain('os.environ["BESTLLM_API_KEY"]');
      expect(script).toContain('base_url="https://api.bestllm.dev/v1"');
      expect(script).toContain("max_retries=0");
      expect(script).toContain("stream=False");
      expect(script).toContain(`model=${JSON.stringify(request.model)}`);
      expect(script).toContain(`max_tokens=${request.max_tokens}`);
    }
  });

  it("publishes /docs/glm-5-api and /docs/deepseek-chat-api in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((u) => u.endsWith("/docs/glm-5-api"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/docs/deepseek-chat-api"))).toBe(true);
  });
});
