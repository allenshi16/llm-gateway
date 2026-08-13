# Local and production deployment

Use `docs/RELEASE_GATES.md` as the blocking pre-production checklist.

## Local

```bash
cp .env.example .env
# Replace every placeholder secret and the LiteLLM image digest in .env.
# Development commands load this root .env automatically.
docker-compose -f infra/docker-compose.yml up -d postgres redis
# The SQL files under infra/postgres are applied automatically only on first initialization of the named volume.
# For an existing volume, apply new SQL migrations through the planned migration process instead of assuming init scripts rerun.
bun run typecheck
bun run test
bun run build
bun run db:migrate:sql
bun run release:check
bun run dev:control-plane
bun run dev:edge
```

LiteLLM is intentionally disabled by default because no provider route is approved in the empty configuration. The Compose file has local-only fallback values so `postgres` and `redis` can start without LiteLLM secrets. Enable LiteLLM only after adding a reviewed route, provider credentials, an immutable image digest, and passing the release gates:

```bash
docker-compose -f infra/docker-compose.yml --profile litellm up -d litellm
```

## Production gates

- The local example intentionally uses a placeholder digest because registry metadata and local manifest resolution must agree before a digest is accepted. Replace it only with a registry-verified digest and verify that exact image with cosign in CI before promotion.
- Run `bun run release:check` with production secrets and the verified `LITELLM_IMAGE`; this rejects tags and placeholder digests. Verify the same image with cosign in CI before promotion.
- Keep LiteLLM, its dashboard, master key, management APIs, and provider credentials on a private network.
- Local PostgreSQL and Redis ports are bound to loopback only; production deployments must keep both services on private networks without public listener ports.
- Configure load balancers to route only to instances whose `/ready` endpoint returns `200`; `/health` is liveness only.
- Set a random API-key pepper and internal assertion secret through a KMS-backed secret manager.
- Set a separate random `CONTROL_PLANE_ADMIN_TOKEN` through the same secret manager; never expose control-plane mutation endpoints without this gate.
- Use separate US/EU PostgreSQL, Redis, queues, secrets, and LiteLLM deployments when residency isolation is required.
- Run `bun run test`, strict workspace builds, contract tests, failure injection, provider sandbox tests, and a canary before promotion.
- Apply provider-model-region approval records only after commercial resale, DPA, retention, security, and residency reviews.

## Current MVP limitations

- The Edge dispatch path is explicitly disabled by default. Enable it only after a private LiteLLM sandbox has verified assertion, usage, timeout, and reconciliation behavior.
- `apps/worker` provides PostgreSQL outbox polling, locking, retry, and dead-letter primitives; usage settlement and Stripe projection handlers still need production-specific handlers and operational ownership.
- Stripe webhook ingestion verifies signatures and records event IDs idempotently, but payment-to-wallet projection is intentionally not automatic yet.
- `infra/postgres` is now applied through the checksum-tracked `bun run db:migrate:sql` runner. Docker init scripts remain useful for an empty local volume, but production schema changes must go through the runner.

## Recovery

- Restore PostgreSQL first; the request journal, wallet reservations, and ledger are authoritative.
- Re-run pending outbox events after restoring service; source event and ledger idempotency constraints make replay safe.
- Never rebuild wallet balances from Redis or Stripe. Reconcile from append-only ledger entries.
- Put a provider route kill switch on before investigating provider or residency incidents.
