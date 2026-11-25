# BestLLM integration content review — 2026-11-24

## Scope and selection

Added `/docs/deepseek-chat-api` and `/blog/openai-compatible-client-errors`, with links from Docs, Resources and the blog index, explicit canonical/Open Graph metadata, and sitemap entries. The homepage now links its primary actions to the guide/Console and no longer claims streaming or EU request support. The Docs hub was rewritten to remove unsupported streaming and public model-listing instructions.

Reused the authorized shared SEO evidence at `/home/allen/project/reports/seo-opportunities-2026-11-24/evidence.json`; no paid SEO calls were made. Candidate keyword summaries are research leads, not authoritative model documentation. No verified integration was established for hy4 flash, kimi k3.1 pro, or gpt 6.2 sol pricing. T3 Code's supplied US October volume of 33,100 and cached KD of 77.8 do not establish BestLLM compatibility. Modelflare's traffic sample does not prove SEO-driven growth. These claims were not turned into product copy.

## Implementation evidence

- `packages/brand/src/models.ts`: `deepseek-chat` catalog entry; pricing commentary references a September 29 supplier snapshot and USD/CNY 6.72. No new numeric price is published in the guides.
- `infra/litellm/config.yaml`: existing working-tree mapping for `deepseek-chat`. This is configuration evidence only; it does not establish deployed upstream version or availability.
- `packages/core/src/catalog-repository.ts`: entitlement, effective database price and approved route resolution.
- `packages/contracts/src/openai.ts`: message/request shape, boolean stream, positive integer token limits.
- `apps/edge/src/app.ts`: non-streaming only, US keys only, verified email, route checks, wallet reservation, dispatch gating, settlement and actual error codes.
- `apps/web/lib/chat-guide.ts`: shared curl and Python examples. They use environment variables, a 128-token output request and no streaming. Python disables automatic retries.

## Verification

- Workspace `bun run typecheck`: passed before the final homepage-only copy changes; production build also checks frontend types.
- Initial `bun run test`: 42 passed, 2 default-5-second timeouts, 21 skipped.
- `bun run test -- --maxWorkers=1 --testTimeout=30000`: 44 passed, 21 skipped (16 passed files, 6 skipped).
- Offline example checks: request parsed by the actual Zod contract; curl syntax checked by bash and arguments captured with a local function replacing curl; Python parsed and executed against a mock OpenAI client, with its request compared to the curl payload. Passed. No network or provider invocation.
- Canonical/Open Graph presence checks: passed for both new routes. New guide/Docs internal links resolve to existing routes or the DeepSeek catalog entry.
- `bun run build`: backend/package builds passed; both Next.js apps compiled, checked types and generated pages, then the aggregate process received SIGTERM during build-trace collection (exit 143). This aggregate run did not pass.
- `bun run --filter '@gateway/web' build`: passed on isolated retry (exit 0), including both new routes, type validation and build traces.
- `git diff --check`: passed.

## Limits and follow-up

No live model call, current database price lookup, provider approval validation, production residency audit, official Python SDK network integration, manual visual review, database integration test, or Cloudflare deployment was performed. Existing historical catalog/benchmark/pricing and other marketing pages were not comprehensively audited by this task. Do not interpret their claims as revalidated.

Before publishing, confirm the deployed alias, effective prices, verified-email onboarding and US route approval using an authorized test account, then run one small non-streaming request and reconcile its usage/charge. Runtime availability and product claims must be confirmed independently of local build success. Preserve all pre-existing Console, infrastructure and operational-script changes; no backend or database behavior was changed here.

## Follow-up runtime verification

Used the completed production build with a temporary loopback-only Next.js server on port 4390, then stopped it. No production state changed. Browser automation used the installed system Google Chrome via Playwright; no browser/dependency download was needed.

- `/docs`, `/docs/deepseek-chat-api`, and `/blog/openai-compatible-client-errors`: HTTP 200 at desktop 1440px and mobile 390px widths.
- All six page/viewport checks: no console errors, no document horizontal overflow, correct `https://bestllm.dev` canonical URLs and `https://app.bestllm.dev/login` Console links. Long code blocks scroll within their containers on mobile.
- Actual clicks passed: Docs → DeepSeek setup → Python tutorial → Docs, and homepage Start building → DeepSeek setup. Homepage Get your API key points to the Console login.
- Both new canonical URLs are present in the rendered sitemap.
- This was browser automation, not a manual screenshot review or a complete existing E2E-suite run.

Read-only public endpoint checks:

- `https://bestllm.dev/docs`: HTTP 200.
- `https://app.bestllm.dev/login`: HTTP 200.
- `https://api.bestllm.dev/health`: HTTP 502 with the descriptive `BestLLM-readonly-verification/1.0` User-Agent, reproduced once. Latest response: `server: cloudflare`, Ray ID `a5f891232f92fafc-SJC`, body `error code: 502`.
- A separate request using Python's default User-Agent returned HTTP 403 / Cloudflare 1010, Ray ID `a5f886a68b02d59a-SJC`. These requests used different User-Agents; the observations do not establish a time-based outage transition.

Cloudflare's official [1010 guidance](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/) identifies client/browser-signature blocking and recommends a descriptive application User-Agent for non-browser clients. That does not resolve the separate 502 observed here. Its [502/504 guidance](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-502-504/) requires distinguishing origin failures from Cloudflare failures. Current evidence does not establish the root cause or prove that all clients or model requests fail.

Next operational step: correlate the captured Ray ID with Cloudflare/origin/tunnel logs and confirm the public API health route reaches the intended Edge service. Do not assume that a successful login page proves model dispatch works. No API key, paid model call, security-rule change, deployment, or production database operation was performed.
