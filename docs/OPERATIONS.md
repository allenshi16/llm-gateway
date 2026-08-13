# Operations checklist

## Request accounting

1. A request must be journaled before LiteLLM dispatch.
2. A maximum charge must be reserved transactionally before dispatch.
3. Every provider attempt is recorded independently from the customer logical-request charge.
4. Usage events are replayable and deduplicated by `(source, source_event_id)`.
5. Corrections are compensating ledger entries; ledger rows are never updated or deleted.

## Dispatch and reconciliation

- Keep `EDGE_ENABLE_DISPATCH=false` until an approved route has a tested private endpoint and provider credentials.
- A provider HTTP failure releases the active reservation through a compensating ledger transaction.
- A provider success followed by settlement failure is `settlement_pending`, not a release case; preserve the request and reconcile from provider usage before any correction.
- Streaming and client-disconnect handling remain incomplete in this MVP and must not be enabled as if they were settled paths.
- Before enabling dispatch, run a private provider sandbox with a successful response, HTTP failure, timeout, missing usage, malformed usage, and duplicate callback case.

## Outbox worker

- Inspect `PENDING`, `RETRY`, `PROCESSING`, `PROCESSED`, and `DEAD` counts during incidents.
- `PROCESSING` rows locked by a dead worker require a lease-recovery procedure before replay; do not delete them.
- Retry handlers must be idempotent because a handler may complete immediately before the worker loses its acknowledgement.

## Incident response

- Disable an affected provider-model-region route immediately with its kill switch.
- Preserve raw request/usage events and provider attempt IDs.
- Treat missing callbacks, ambiguous timeouts, and client disconnects as reconciliation states, not automatic zero-cost outcomes.
- Check wallet and ledger transactions before accepting manual adjustments.
- Export Stripe usage only after the internal ledger period is closed and idempotency status is recorded.

## Authentication and sessions

- Sessions are stored in PostgreSQL `auth_sessions` and expire; revoke them by deleting the row.
- Scrypt-hash passwords; never store plaintext or reversible password material.
- Login/register endpoints are rate limited by IP+email to slow brute force.
- Console cookies are `HttpOnly` and `SameSite=Strict`; mutate only with the session cookie to mitigate CSRF.

## Billing and payment projection

- Wallet credits from Stripe are idempotent by Stripe event ID and always create append-only ledger entries.
- Never rebuild wallet balances from Stripe or Redis; reconcile from `ledger_entries`.
- `payment_projections` records the downstream projection; corrections are compensating ledger entries.
- The `billing/dev-credit` wallet path is development-only and must be disabled in production.

## Audit

- Review `audit_events` for organization, member, workspace, key, and payment actions.
- Audit rows are append-only; do not edit or delete historical events.

## Rate limiting and security headers

- The control plane and console apply a site-wide per-IP sliding-window limit; tune `CONTROL_PLANE_RATE_LIMIT` and `CONSOLE_RATE_LIMIT` behind a load balancer (which usually sees a single proxy IP, so prefer the proxy's forwarded header).
- All responses include CSP, `nosniff`, frame denial, and no-referrer headers. CSP `script-src 'unsafe-inline'` is present only because the console inlines its scripts; move them to external assets before production if a stricter policy is required.
- `429 too_many_requests` from the site limiter is intentional; check the limiter configuration before treating it as an incident.

## Plan configuration

- List and configure billing plans with the CLI:
  - `DATABASE_URL=... bun run plans:list`
  - `DATABASE_URL=... bun run plans:config -- command=set plan-id=starter price-id=price_...`
  - `STRIPE_SECRET_KEY=... DATABASE_URL=... bun run plans:config -- command=create-price plan-id=starter amount=4900 interval=month`
- Or use the platform-admin API `GET|PUT /v1/admin/billing/plans*` with `CONTROL_PLANE_ADMIN_TOKEN`.
- Only plans with a non-null `stripe_price_id` are usable through real Stripe Checkout.

## Data protection

- Do not log prompts or responses by default.
- Keep internal assertions short-lived and request-bound.
- Strip all inbound internal identity headers at the Edge.
- Enforce tenant region, provider, model, retention, and fallback policies before routing.
