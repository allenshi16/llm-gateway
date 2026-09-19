# Tunnel runbook — bestllm.dev (marketing site)

## Symptom

`https://bestllm.dev` returns **Cloudflare error 1033** ("Cloudflare Tunnel error").
Ray IDs from 2026-09-18 confirm this state; the site has been down since at least then.

## Diagnosis

- `bestllm.dev` resolves to Cloudflare anycast IPs with Cloudflare NS
  (`nikon`/`gemma.ns.cloudflare.com`) — the hostname is proxied to a **Cloudflare Tunnel**.
- Error 1033 means Cloudflare has **no connected `cloudflared` connector** for the tunnel.
- The origin machine is **not** this workstation (no cloudflared, no Docker here).
  The tunnel was started ad hoc on some other machine; no deployment doc records it.

## Immediate fix (on the origin machine)

```bash
# 1. Get the tunnel token: Cloudflare dashboard -> Zero Trust -> Networks -> Tunnels
#    -> the tunnel serving bestllm.dev -> "Install and run a connector" -> copy token.
# 2. Put it in .env next to infra/docker-compose.yml:
echo 'CLOUDFLARE_TUNNEL_TOKEN=eyJ...' >> .env
# 3. Start the connector (now defined in infra/docker-compose.yml):
docker-compose -f infra/docker-compose.yml up -d cloudflared
# 4. Verify:
curl -sI https://bestllm.dev | head -3
```

If the original origin machine is lost, create a new tunnel in the dashboard, point its
public hostname `bestllm.dev` -> `http://<marketing-site-host>:<port>`, and run the same
compose service with the new token.

## Recommended long-term fix (removes the tunnel dependency)

The marketing site (`apps/web`) is content-only; it does not need a persistent origin.
Freeze it as a static export and host it on Cloudflare Pages / Vercel, then switch the
DNS record from "proxied -> tunnel" to the Pages/Vercel hostname:

1. In `apps/web`: remove `export const dynamic = "force-dynamic"` (or add
   `export const dynamicParams = false` + static export via `output: "export"`).
2. Deploy the build output to Cloudflare Pages with `bestllm.dev` as custom domain.
3. Delete the tunnel. 1033-class outages can no longer happen.

While the product is frozen, option 2 is strongly preferred: it is free, and the tunnel
was a single point of failure nobody monitored. Add `bestllm.dev` to an uptime monitor
(UptimeRobot/Better Stack -> Telegram) regardless of which path is chosen.
