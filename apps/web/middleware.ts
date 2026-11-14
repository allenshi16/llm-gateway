import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

// Consolidated / pruned model pages → their current canonical page (301).
const MODEL_REDIRECTS: Record<string, string> = {
  "/models/minimax-h3-max": "/models/minimax-h3",
  "/models/qwen-max": "/models/qwen3-8-max",
  "/models/kimi-k2": "/models/kimi-k3",
  "/models/glm-4-plus": "/models/glm-5",
  "/models/deepseek-v3": "/models/deepseek-chat",
};

export function middleware(request: Request) {
  const url = new URL(request.url);
  const target = MODEL_REDIRECTS[url.pathname.replace(/\/+$/, "")];
  if (target) {
    url.pathname = target;
    return NextResponse.redirect(url, 301);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:${isProduction ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'nonce-${nonce}'${isProduction ? "" : " 'unsafe-inline'"}`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isProduction ? "" : " ws:"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce from the request CSP header to stamp its own scripts/styles.
  requestHeaders.set("Content-Security-Policy", directives);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", directives);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
