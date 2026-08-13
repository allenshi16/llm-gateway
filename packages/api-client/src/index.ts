export type ApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export class GatewayApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "GatewayApiError";
    this.status = status;
    this.code = code;
  }
}

export function createGatewayApi(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? "/api";
  const fetcher = options.fetcher ?? fetch;

  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, {
        credentials: "include",
        ...init,
        headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "request_failed";
        throw new GatewayApiError(response.status, code);
      }
      return data as T;
    },
  };
}
