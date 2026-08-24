# Testing guide

Verification commands for local development and pre-merge checks. Blocking production evidence lives in `docs/RELEASE_GATES.md`; deployment context lives in `docs/DEPLOYMENT.md`.

Run everything as a regular user (never root); root-created files break later builds with `EACCES`.

## Prerequisites

```bash
bun install --ignore-scripts --no-optional --network-concurrency=1 --no-progress
cp .env.example .env   # keep DATABASE_URL/REDIS_URL defaults for local testing
docker-compose -f infra/docker-compose.yml up -d postgres redis
bun run db:generate && bun run db:push
```

Port map: control plane 4100, legacy console 4200, web 4300, console-web 4301, LiteLLM 4302 (host mapping), PostgreSQL 15432, Redis 16379.

## Fast gates (~1 minute, no database needed)

```bash
bun run typecheck   # all workspaces, strict TypeScript
bun run test        # unit tests
bun run build       # packages + Next.js apps
```

Expected: typecheck exits clean across every workspace, unit suite green, build green.

## Integration tests

Requires PostgreSQL from the compose stack:

```bash
RUN_INTEGRATION_TESTS=true DATABASE_URL=postgresql://gateway:gateway@localhost:15432/gateway bun run test:integration
```

Covers account/session flows, cursor pagination boundaries, invite acceptance and revocation, worker settlement, Stripe webhook idempotency, and database integration paths against a real PostgreSQL instance.

## E2E tests

```bash
bunx playwright install chromium   # first run only
bun run test:e2e
```

17 specs across two isolated projects:

- `marketing` (base URL :4300): crawlable hero content, models page SEO metadata, landing pages render headings, robots.txt/sitemap.xml correctness.
- `console` (base URL :4301): login form renders without credential prefill, empty submit blocked client-side, seven protected routes redirect unauthenticated visitors to `/login`. Auth failures are simulated through route interception, so no backend is required.

`playwright.config.ts` starts both dev servers automatically and tears them down after the run. If teardown hangs in your environment, start the servers yourself (`bun run dev:web`, `bun run dev:console-web`) and run `bunx playwright test --reporter=list`; Playwright reuses servers that are already listening.

## Production CSP verification

```bash
bun run --filter '@gateway/web' build && bun run --filter '@gateway/console-web' build
cd apps/web && bunx next start -p 4300        # terminal 1
cd apps/console-web && bunx next start -p 4301 # terminal 2
```

Then:

```bash
curl -sI http://127.0.0.1:4300/ | grep -i content-security-policy
# expect per-request nonce in script-src, 'strict-dynamic', frame-ancestors 'none'
bunx playwright test --reporter=list   # full suite against the production servers
```

Pages are rendered dynamically so request-time nonces reach inline scripts; static prerendering plus strict CSP would block hydration scripts.

## Release gates

Before promotion, run the blocking checklist in `docs/RELEASE_GATES.md`, including `db:migrate:sql`, `release:check` with production secrets and the verified LiteLLM image digest, provider sandbox evidence, streaming gate, and Stripe webhook replay evidence.
