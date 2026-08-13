# Implementation Plan

## Milestone 1: Runnable commercial core

The first milestone proves the full financial and authorization path without coupling commercial state to LiteLLM:

1. Create an organization and workspace.
2. Add members with workspace-scoped roles.
3. Issue a first-party API key whose secret is shown once and only a keyed hash is stored.
4. Configure model products, price versions, entitlements, and approved provider-region routes.
5. Credit a wallet using an append-only ledger transaction.
6. Accept an OpenAI-compatible request at Edge, journal it, reserve the maximum charge transactionally, and dispatch it to private LiteLLM.
7. Persist a normalized usage event through a PostgreSQL outbox.
8. Capture the actual customer charge, release unused reservation value, and record provider-attempt cost separately.
9. Project postpaid usage and payment lifecycle changes to Stripe without making Stripe authoritative for request admission.
10. Expose a minimal developer console over the control-plane APIs.

## Workspace layout

- `apps/control-plane`: tenant, key, catalog, wallet, billing, and administrative APIs.
- `apps/edge`: public OpenAI-compatible access layer and private LiteLLM dispatch.
- `apps/worker`: outbox, usage settlement, reconciliation, and Stripe projection.
- `apps/console`: minimal English developer console.
- `packages/contracts`: versioned request, assertion, usage-event, and API schemas.
- `packages/database`: Prisma schema and database client.
- `packages/core`: reusable domain services and invariant enforcement.
- `infra/litellm`: generated LiteLLM configuration and thin callback/auth adapter.
- `tests`: cross-service integration and failure-path tests.

## Hard invariants

- Every dispatched request has a persisted request journal and reservation.
- Wallet available balance never goes below zero.
- Every wallet mutation creates append-only ledger entries.
- A logical request has at most one customer charge per charge component.
- Provider attempts are independently recorded and never implicitly copied into customer charges.
- Every request stores a price-version snapshot before dispatch.
- Usage events are idempotent by source and source event ID.
- Stripe exports are idempotent and downstream-only.
- Route selection cannot leave the tenant's allowed region/provider set.
- LiteLLM administration and provider credentials are unreachable from public traffic.

## Verification gates

- Strict TypeScript and zero LSP errors.
- Unit tests for key hashing, RBAC, pricing, regional policy, and assertion binding.
- PostgreSQL integration tests for reservation concurrency, ledger balance, idempotent settlement, duplicate events, and callback loss recovery.
- Fastify contract tests for control-plane and Edge APIs.
- LiteLLM compatibility tests for non-streaming and streaming proxy behavior.
- Build all workspaces and validate Docker Compose configuration.

## Later milestones

- EU data plane and tenant home-region assignment.
- SAML/SCIM, custom RBAC, audit exports, and enterprise contracts.
- Provider invoice ingestion and automated reconciliation.
- Dedicated event broker and analytics warehouse when PostgreSQL outbox throughput is insufficient.
- SOC 2 control evidence, penetration testing, and production readiness review.
