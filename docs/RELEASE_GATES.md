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

## Streaming gate

Streaming remains disabled until the sandbox proves client cancellation, provider cancellation or ambiguity, reservation handling, callback reconciliation, and no leaked internal assertion. Until then the API must return `501 streaming_not_implemented`.

## Stripe gate

- Verify a signed raw-body webhook in staging.
- Replay the same event and prove one stored event ID and one downstream effect.
- Confirm webhook processing never directly changes authoritative wallet balances.
