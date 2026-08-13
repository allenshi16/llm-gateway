# Initial API contract

## Control plane

- `GET /health`
- `GET /ready` verifies configuration and PostgreSQL connectivity; it returns `503` when the service must not receive traffic.

### Customer identity and sessions

- `POST /v1/auth/register` — creates an account with an scrypt password hash.
- `POST /v1/auth/login` — issues an HttpOnly DB-backed session cookie.
- `POST /v1/auth/logout` — destroys the session.
- `GET /v1/auth/me` — returns the current account, email-verification state, and its memberships.
- `POST /v1/auth/request-email-verification` — issues a verification token and queues mail (dev token returned locally).
- `POST /v1/auth/verify-email` — consumes the token and marks the account verified.
- `POST /v1/auth/request-password-reset` — issues a reset token and queues mail (does not reveal whether the account exists).
- `POST /v1/auth/reset-password` — consumes the token and sets a new scrypt password hash.
- Login/register are rate limited per IP+email to slow brute force.

### Self-serve organization and RBAC

- `POST /v1/account/organizations` — creates an organization, first workspace, USD wallet, and OWNER membership in one transaction.
- `GET /v1/account/context` — lists organizations/workspaces the account can access.
- `GET /v1/account/organizations/:orgId` — organization detail (RBAC).
- `GET|POST /v1/account/organizations/:orgId/workspaces` — list/create workspaces (RBAC).
- `POST /v1/account/organizations/:orgId/invites` — invite a member (OWNER/ADMIN).
- `GET /v1/account/organizations/:orgId/invites` — list invites (OWNER/ADMIN).
- `POST /v1/account/organizations/:orgId/members` — list members (OWNER/ADMIN).
- `POST /v1/account/invites/accept` — accept an invite token.
- `POST /v1/account/organizations/:orgId/workspaces/:workspaceId/api-keys` — create an API key scoped to the workspace (RBAC); secret shown once.
- `GET /v1/account/organizations/:orgId/audit` — audit log (OWNER/ADMIN).
- `GET /v1/account/organizations/:orgId/usage/details` — per-request usage details.

### Billing projection

- `GET /v1/account/organizations/:orgId/billing/plans` — active plans.
- `POST /v1/account/organizations/:orgId/billing/checkout` — creates a Stripe Checkout subscription session; without Stripe keys it activates a dev subscription.
- `GET /v1/account/organizations/:orgId/billing/subscription` — the current subscription.
- `GET /v1/account/organizations/:orgId/billing/payments` — captured payment projections.
- `GET /v1/account/organizations/:orgId/billing/ledger` — append-only ledger entries.
- `POST /v1/account/organizations/:orgId/billing/dev-credit` — local dev-only wallet credit; disabled in production.

### Platform bootstrap (requires `CONTROL_PLANE_ADMIN_TOKEN`)

- `POST /v1/organizations`
- `POST /v1/api-keys`
- `POST /v1/workspaces/:workspaceId/api-keys/:keyId/revoke`
- `GET /v1/workspaces/:workspaceId/api-keys`
- `GET /v1/workspaces/:workspaceId/models`
- `GET /v1/organizations/:organizationId/usage`
- `GET /v1/organizations/:organizationId/billing`
- `GET /v1/admin/billing/plans` — list billing plans.
- `PUT /v1/admin/billing/plans/:planId` — set `stripePriceId`, `unitAmountCents`, or `active`.

## Security hardening

- Every response includes hardening headers: strict CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and permissions policy.
- Control plane and console are site-wide rate limited per IP (default 300 req/min, configurable with `CONTROL_PLANE_RATE_LIMIT` / `CONSOLE_RATE_LIMIT`).
- Auth endpoints add per-IP+email login/register limits.
- See `docs/OPERATIONS.md` for runbook guidance.

## Edge

- `GET /health`
- `GET /ready` verifies configuration and PostgreSQL connectivity; it returns `503` when the service must not receive traffic.
- `POST /v1/chat/completions`
  - Requires a first-party Bearer key.
  - Resolves workspace entitlement and an approved provider-model-region route.
  - With `EDGE_ENABLE_DISPATCH=false` (the default), admission stops with `402 wallet_authorization_required`.
  - With dispatch explicitly enabled, writes the request journal and wallet reservation before calling the private LiteLLM endpoint.
  - Non-streaming provider failures release the reservation; successful responses are settled from returned OpenAI usage fields.
  - Streaming requests currently return `501 streaming_not_implemented`.
  - If the provider succeeds but settlement fails, returns `503 settlement_pending`; the request must be reconciled and must not be automatically refunded.

## Worker

- The worker claims configured outbox topics with PostgreSQL `FOR UPDATE SKIP LOCKED`.
- Successful handlers mark events `PROCESSED`; failures use exponential retry and eventually `DEAD` after the configured attempt limit.
- No topic handler is registered by default yet, so this is a reliable polling primitive rather than a complete usage-settlement worker.
- Validated LiteLLM usage events can be ingested through the runtime schema boundary and recorded idempotently in `raw_usage_events`; final settlement handlers must still reconcile them against the logical request and provider attempt before capture.

## Stripe

- `POST /v1/webhooks/stripe` verifies the raw body with `Stripe-Signature` and records the event idempotently.
- Duplicate Stripe event IDs are acknowledged without reprocessing.
- `payment_intent.succeeded` credits the customer's wallet through an append-only ledger transaction, idempotent by Stripe event ID.
- `checkout.session.completed` stores the Stripe customer ID and creates/updates the subscription projection.
- `customer.subscription.updated|deleted` syncs subscription status.
- Stripe is a downstream payment projection; it never directly enforces quotas or mutates the authoritative wallet outside the ledgered credit path.

## Security

The public API must not expose LiteLLM management routes, its dashboard, master key, or provider credentials. Error responses intentionally avoid returning database and provider details.
