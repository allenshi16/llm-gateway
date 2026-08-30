import { headers } from "next/headers";

/**
 * Resolve the console login URL for the current request.
 *
 * Production deployments should set NEXT_PUBLIC_CONSOLE_URL explicitly.
 * Locally we derive the host from the incoming request so the link works
 * from localhost and LAN addresses alike, instead of hardcoding localhost.
 */
export async function consoleLogInUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_CONSOLE_URL;
  if (configured) return configured;
  const host = (await headers()).get("host") ?? "localhost";
  const hostname = host.split(":")[0];
  return `http://${hostname}:4301/login`;
}