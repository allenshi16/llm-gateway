export interface ProviderTransportInput {
  endpoint: string;
  masterKey: string;
  assertion: string;
  body: unknown;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export interface ProviderTransportResult {
  response: Response;
  elapsedMs: number;
}

export async function dispatchProvider(input: ProviderTransportInput): Promise<ProviderTransportResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const response = await fetchImpl(input.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.masterKey}`,
        "x-gateway-assertion": input.assertion
      },
      body: JSON.stringify(input.body),
      signal: controller.signal
    });
    return { response, elapsedMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}
