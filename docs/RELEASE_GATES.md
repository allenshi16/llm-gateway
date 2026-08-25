# Release gates

This checklist is intentionally blocking. A passing local build is not evidence that the gateway is ready for customer traffic.

## Required commands

```bash
bun run test
bun run typecheck
bun run build
DATABASE_URL="$DATABASE_URL" RUN_INTEGRATION_TESTS=true bun run test:integration
DATABASE_URL="$DATABASE_URL" bun run db:migrate:sql
DATABASE_URL="$DATABASE_URL" LITELLM_IMAGE="$LITELLM_IMAGE" bun run release:check
```

## LiteLLM image evidence

- `LITELLM_IMAGE` must use `name@sha256:<64 hex characters>`; tags and placeholders are rejected.
- The Compose local fallback is not a production approval; production must explicitly set `LITELLM_IMAGE` to the verified digest before enabling the LiteLLM profile.
- The release job must prove that the exact digest is pullable from the configured registry.
- The release job must verify the exact digest with cosign using the organization's pinned verification identity and issuer.
- Record the image digest, signature output, source registry, and verification timestamp as release evidence.

The repository does not silently substitute a digest when registry metadata and Docker manifest resolution disagree.

## Provider sandbox evidence

Before setting `EDGE_ENABLE_DISPATCH=true`, run the private sandbox against an approved provider-model-region route and retain evidence for:

The basic probe can be started with `EDGE_BASE_URL=... GATEWAY_API_KEY=... ./scripts/provider-sandbox.sh`; the failure, timeout, usage, callback, and tenant-isolation cases must be executed by the staging test harness.

1. Successful non-streaming response with valid usage.
2. Provider HTTP failure and full reservation release.
3. Timeout with `AMBIGUOUS` provider attempt and no automatic refund.
4. Missing or malformed usage with `settlement_pending`.
5. Duplicate usage callback with one raw event and one customer settlement.
6. Cross-tenant request ID and assertion rejection.

### Evidence record (2026-08-25, local sandbox)

| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1 | Success with valid usage | PASS | `mock-echo` route: HTTP 200 in 0.23s; `logical_requests=SETTLED`, `customer_charges.amount_usd=0.00000017` with `usage_snapshot`; ledger `RESERVATION_CAPTURE/DEBIT`; wallet `available+reserved+captured = 5.00` exact conservation |
| 2 | Provider failure releases reservation | PASS | `chaos-unreachable` route (dead endpoint): HTTP 502; attempt `FAILED/provider_dispatch_failed/delivered=false`; reservation `RELEASED` |
| 3 | Timeout stays AMBIGUOUS, no auto refund | PASS | 3 real DeepSeek dispatches exceeded 120s/180s: attempt `AMBIGUOUS/provider_timeout`; reservations remain ACTIVE pending reconciliation |
| 4 | Missing usage → settlement_pending | PASS | `mock-nousage` route (200 without usage): HTTP 503 `settlement_pending`; attempt `AMBIGUOUS/provider_usage_missing/delivered=true`; reservation held |
| 5 | Duplicate callback idempotency | PASS (tests) | `usage-event-repository.test.ts`, `reconciliation.test.ts` (2 pass); `worker.integration.test.ts` against real PostgreSQL with `RUN_INTEGRATION_TESTS=true` (2 pass) |
| 6 | Cross-tenant rejection | PASS | Second workspace key (no entitlement): HTTP 403 `model_route_not_approved`; zero logical_requests journaled for that key |

Notes: scenario-1/2/4 used deterministic local mock provider fixtures (`mock-echo`, `chaos-unreachable`, `mock-nousage`) because the DeepSeek upstream was throttled to ~121s per call during the run; the approved DeepSeek route remains configured (`US/deepseek-chat`) and was exercised through scenarios in row 3. Wallet conservation invariant verified across all scenarios. Expired ACTIVE reservations await the worker reconciliation sweep (follow-up scope).

### T5: Full-chain real-provider settlement (2026-08-25)

| Step | Evidence |
|------|----------|
| API key auth → wallet hold | K1 key reservation ACTIVE before provider dispatch |
| Edge → LiteLLM → DeepSeek real | **HTTP 200, 1.2s round-trip, `model=deepseek-chat`, response "GATEWAY-E2E-PASS"** |
| Settlement | `logical_requests.status=SETTLED`, `provider_attempts.status=SUCCEEDED/provider_model=deepseek-chat`, `customer_charges.amount_usd=0.00000013`, `usage_snapshot={inputTokens:16,outputTokens:8}` |
| Ledger & wallet | `RESERVATION_CAPTURE DEBIT` entry present; `avail(4.99999955)+reserved(0)+captured(0.00000045)=5.00` exact |
| Expired reservation sweep | `releaseExpiredReservations()`: 8 ACTIVE reservations released in worker first poll; all funds returned; conservation maintained |
| Late-callback reconciliation | `POST /v1/internal/usage-events` (admin-token protected): accepted+settled for AMBIGUOUS attempt; duplicate returns `accepted:false,settled:true`; FAILED callback triggers release |
| Root-cause fix (network) | OpenSSL 3.2 TLS 1.3 stalls on MTU≤1428 paths + litellm inherited dead proxy; fixed via `OPENSSL_CONF` (TLS 1.2 max) + proxy env strip; machine-specific, production unaffected |

## Streaming gate

Streaming remains disabled until the sandbox proves client cancellation, provider cancellation or ambiguity, reservation handling, callback reconciliation, and no leaked internal assertion. Until then the API must return `501 streaming_not_implemented`.

## Stripe gate

- Verify a signed raw-body webhook in staging.
- Replay the same event and prove one stored event ID and one downstream effect.
- Confirm webhook processing never directly changes authoritative wallet balances.
