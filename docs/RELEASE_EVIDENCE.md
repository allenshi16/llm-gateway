# Release evidence — invite-only US trial

Date: 2026-09-02. All evidence below was produced on the local full stack running the current working tree (tsx watch services: control-plane 4100, edge 4000, worker; LiteLLM container on 4302; PostgreSQL 15432; Redis 16379).

## Gate commands (current tree)

| Gate | Result |
|---|---|
| `bun run typecheck` (13 workspaces) | PASS |
| `bun run test` | 44 passed / 0 failed |
| `bun run test:integration` (real PostgreSQL, 5 files) | 18 passed / 0 failed |
| `bun run build` | PASS (all workspaces incl. both Next apps) |
| `bun run release:check` (production-shaped env) | `release-config-ok` |
| `bun run test:e2e` (Playwright, live dev servers) | **17 passed / 0 failed** (console auth boundary 9, marketing SEO surface 8) |

## Critical fixes included in this tree

1. **Pricing formatter (P0, fixed)** — `formatMicros` understated the fractional USD portion of every customer charge by 100x. Fixed and pinned by exact-value unit tests. Charge for the probe below is `0.00074026` USD (mathematically exact for 8 input @ $0.27/M + 671 output @ $1.10/M); the pre-fix code would have recorded `0.0000074`. Historical amounts in `RELEASE_GATES.md` evidence tables are therefore understated; re-run sandbox scenarios against this build before promotion.
2. **API key prefix (P0, fixed)** — key prefixes derived from base64url could contain `_`, making ~12% of issued keys un-authenticatable at the Edge. Prefixes now use hex; a 200-iteration invariant test pins the parseable format.
3. Late usage-event reconciliation sweep in the worker (settles late successes, releases on failure, terminal-errors otherwise) and per-key RPM/TPM enforcement (`429 key_rate_limited`, journal-window based) are covered by integration tests.

## Full-chain probe (2026-09-02, real DeepSeek)

Script: register → login → email verification (dev token) → organization/workspace → admin entitlement grant (`deepseek-chat`, PREPAID) → admin promotional credit (1.00 USD, idempotent ledger) → live API key → `scripts/provider-sandbox.sh` through Edge → LiteLLM → DeepSeek.

| Step | Evidence |
|---|---|
| Register/login/verify | 201 / 200 / `{"verified":true}` |
| Org + workspace | `8e80222a-44d9-4ac5-a969-080fe39792e9` / `97edb1e9-418b-4b3a-b1a7-b0b260859e65` |
| Entitlement grant | 201, `deepseek-chat` PREPAID enabled, audited |
| Promotional credit | `credited:true`, ledger `PROMOTIONAL_CREDIT` +1.00000000 |
| Live key | `sk_live_3169bcbd…` (secret shown once) |
| Real call | HTTP 200, `model=deepseek-chat`, usage `{inputTokens: 8, outputTokens: 671}` |
| Request state | `logical_requests.status=SETTLED`, region US |
| Provider attempt | `SUCCEEDED`, response_delivered=true |
| Customer charge | **0.00074026 USD** with usage snapshot (post-fix pricing, exact) |
| Ledger | `PROMOTIONAL_CREDIT` CREDIT 1.00; `RESERVATION_CAPTURE` DEBIT 0.00074026 |
| Wallet conservation | `0.99925974 = 1.00 − 0.00074026`; reserved 0 |
| Audit trail | organization.create, model_entitlement.grant, billing.promotional_credit, api_key.create |

## Database hygiene

Removed 21 non-production model products with their routes/prices/entitlements and 10 historical sandbox-fixture requests (`trial-model-*`, `mock-echo`, `mock-nousage`, `chaos-unreachable`). Remaining catalog: `deepseek-chat` only — 1 approved US route, 1 enabled entitlement. Production must keep this catalog minimal; fixture routes with fully-approved flags must never be promoted.

## LiteLLM image verification (2026-09-02)

- cosign v2.4.1 installed on the build host.
- Pinned publisher public key: `https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub` (the immutable commit that introduced BerriAI's signing key; recommended by LiteLLM's Docker Image Security Guide).
- Verified image: `ghcr.io/berriai/litellm@sha256:a67d759776704f6e270b43f04e219ac7f758c9a9e6cf06bf7133d81694b37360` (registry digest of tag `v1.95.1`, resolved anonymously via the GHCR token API).
- `scripts/release-image-verify.sh` output: claims validated, Rekor transparency-log entry verified, signature verified against the pinned public key.
- `bun run release:check` with this digest and production-shaped env: `release-config-ok`.
- For production, set `LITELLM_IMAGE` to this digest (or the verified digest of the chosen release) and `LITELLM_COSIGN_KEY` to the pinned public-key URL; both are public values and safe to record in deployment configuration.

## Staging sandbox scenarios (2026-09-03, local staging harness)

Harness: deterministic mock providers (`mock-echo` :4599, `mock-nousage` :4598, `mock-slow` :4597, `chaos-unreachable` :9) registered as fully-approved US routes; a sandbox tenant (`K1`, entitled to all fixtures + deepseek-chat, credited 5.00 USD via ledger) and an isolation tenant (`K2`, no entitlements). Requests ran against the live Edge (4000); the timeout scenario used a second Edge instance (4001, `EDGE_PROVIDER_TIMEOUT_MS=3000`).

| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1a | Success, deterministic usage (mock-echo) | PASS | HTTP 200, usage 25/16, request SETTLED |
| 1b | Success, real provider (deepseek-chat) | PASS | HTTP 200 with completion; settled |
| 2 | Provider HTTP failure → full release | PASS | 502 `provider_request_failed`; attempt FAILED, reservation RELEASED |
| 3 | Timeout → AMBIGUOUS, no instant refund | PASS | 503 `provider_reconciliation_required`; attempt `AMBIGUOUS/provider_timeout`, reservation ACTIVE; worker expiry sweep later released it (request FAILED) — documented compensation loop |
| 4 | Missing usage → settlement_pending | PASS | 503 `settlement_pending`; attempt `AMBIGUOUS/provider_usage_missing`, reservation held |
| 5 | Duplicate usage callback idempotency | PASS | callback #1 `accepted:true,settled:true`; #2 `accepted:false,settled:true`; exactly 1 raw event and 1 charge of 0.00003600 (12/24 tokens @ 1/1 per-million, exact) |
| 6 | Cross-tenant rejection | PASS | K2 → 403 `model_route_not_approved`; zero logical_requests journaled for K2 |

Conservation across the whole sandbox tenant: 5.00000000 credit − 0.00065886 total charges = 4.99934114 available, 0 ACTIVE reservations, 2 AMBIGUOUS attempts preserved for audit. Note: the unverified-owner fixture initially received `403 email_verification_required` on every scenario — the verification gate proved itself during harness setup before owners were marked verified.

Harness fixtures (mock/chaos models, routes, staging tenants/requests) were removed after recording; catalog returns to `deepseek-chat` only.

## Pre-promotion checklist (external inputs still required)

1. Staging sandbox evidence — either point `EDGE_BASE_URL`/`GATEWAY_API_KEY` at a staging deployment and re-run the six scenarios against this build (original amounts in `RELEASE_GATES.md` are pre-pricing-fix), or approve a local staging harness that rebuilds the deterministic mock/chaos fixtures and executes all six scenarios on this stack.
2. Production secrets: `INVITE_ONLY=true`, `RESEND_API_KEY`, `MAIL_FROM`, plus KMS-managed pepper/assertion/admin-token (config fails closed without them).
3. Stripe keys remain unset for the trial (prepaid promotional credits only); `billing/dev-credit` is disabled in production by code.
