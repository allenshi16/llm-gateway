import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

export function middleware(request: Request) {
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
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

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
