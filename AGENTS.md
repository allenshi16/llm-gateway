# LLM Gateway Project Instructions

## Workspace Boundary

- This project is rooted at `/home/allen/project/llm-gateway`.
- Do not inspect, read, modify, or reuse code from sibling directories under `/home/allen/project` unless the user explicitly requests it later.
- Treat this directory as a new, independent project.

## Product Goal

Build a commercial, multi-tenant LLM API gateway for US and European developers and enterprises, offering DeepSeek, Qwen, Kimi, GLM, and future models through OpenAI-compatible APIs.

## Architectural Boundary

- LiteLLM is the independently upgradeable model data plane.
- Do not maintain a permanent LiteLLM source fork.
- Do not expose LiteLLM, its master key, dashboard, or management endpoints publicly.
- The custom control plane owns accounts, organizations, workspaces, memberships, RBAC, customer API keys, plans, subscriptions, price books, wallets, immutable ledgers, Stripe mappings, provider approvals, and regional policies.
- LiteLLM users, teams, virtual keys, budgets, and spend may be used as operational projections or safety controls, but never as the commercial or financial source of truth.
- LiteLLM spend is reconciliation telemetry, not the customer invoice ledger.
- New API is a product-reference only. Do not integrate it or copy its source.

## Financial Correctness

- Persist a request journal before provider dispatch.
- Use authoritative transactional wallet reservations: reserve, capture, and release.
- Redis may accelerate reads and limits, but must not be the authoritative wallet or ledger.
- Keep provider-attempt costs separate from customer logical-request charges.
- Store versioned price snapshots for every accepted request.
- Ledger entries are append-only; corrections use compensating entries.
- Stripe is a downstream payment and invoice projection, not real-time quota enforcement.

## Security and Residency

- Public requests enter a custom Edge/API Access service before LiteLLM.
- Edge-to-LiteLLM traffic uses private networking, mTLS, and short-lived request-bound signed assertions.
- Region, provider, model, retention, and fallback rules are hard policy constraints.
- No cross-region fallback unless the tenant policy explicitly permits it.
- Every provider-model-region route requires commercial, privacy, security, and residency approval plus an immediate kill switch.

## Engineering Expectations

- Start with a modular TypeScript control plane, a separate Edge service, PostgreSQL, Redis, and a stock version-pinned LiteLLM container.
- Prefer a PostgreSQL outbox and worker for the first milestone; introduce a dedicated event broker only when scale requires it.
- Use strict TypeScript. Never use `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Add deterministic tests for API contracts, tenancy isolation, key authorization, wallet invariants, event idempotency, callback loss, retries, streaming cancellation, and regional routing.
- Pin LiteLLM stable images by digest and verify signatures in the release workflow.
- Run diagnostics, tests, typecheck, and build after changes.
