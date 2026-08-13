export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
}

export function parseProviderUsage(body: unknown): ProviderUsage | null {
  if (!body || typeof body !== "object") return null;
  const usage = (body as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return null;
  const record = usage as { prompt_tokens?: unknown; completion_tokens?: unknown };
  if (typeof record.prompt_tokens !== "number" || !Number.isInteger(record.prompt_tokens) || record.prompt_tokens < 0) return null;
  if (typeof record.completion_tokens !== "number" || !Number.isInteger(record.completion_tokens) || record.completion_tokens < 0) return null;
  return { inputTokens: record.prompt_tokens, outputTokens: record.completion_tokens };
}
