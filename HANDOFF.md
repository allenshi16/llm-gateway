HANDOFF CONTEXT
===============

GOAL
----
Continue full development of a new commercial multi-tenant LLM API gateway in this directory only, using stock LiteLLM as an independently upgradeable data plane and a custom control plane for all commercial capabilities.

USER REQUESTS
-------------
- Build a LiteLLM-based gateway for US and European users selling DeepSeek, Qwen, Kimi, GLM, and similar model APIs.
- The system must support multi-tenancy, payment, and foundational commercial platform capabilities.
- It must remain relatively independent from LiteLLM so upstream LiteLLM code and features can be synchronized regularly.
- New API is reference material only and must not be integrated.
- Begin complete development according to the agreed architecture.
- Ignore all sibling projects under `/home/allen/project`.

AGREED ARCHITECTURE
-------------------
- Public clients call a custom Edge/API Access service, never LiteLLM directly.
- Edge validates first-party API keys, resolves organization/workspace/plan, applies abuse and rate controls, enforces regional policy, creates a request journal, and performs wallet pre-authorization.
- Edge calls a private stock LiteLLM deployment through mTLS using a short-lived signed internal assertion bound to request ID, audience, tenant, entitlements, region, expiry, and preferably a request-body digest.
- LiteLLM owns OpenAI/Anthropic protocol normalization, provider adapters, routing, health checks, retries, fallbacks, streaming translation, and provider-cost telemetry.
- A thin independently packaged LiteLLM adapter verifies internal assertions and emits versioned normalized usage events.
- A metering worker deduplicates events, records raw provider attempts, calculates customer charges from a versioned price snapshot, captures/releases reservations, writes append-only ledger entries, and exports eligible aggregates to Stripe.
- Stripe owns payment methods, checkout, subscriptions, invoices, taxes, customer portal, refunds, and disputes. It is not the wallet or real-time quota authority.

SOURCE-OF-TRUTH BOUNDARIES
--------------------------
- Custom control-plane PostgreSQL owns accounts, organizations, workspaces, memberships, RBAC, customer API-key hashes, plans, subscriptions, model entitlements, price books, wallets, reservations, immutable ledger, Stripe mappings, provider approvals, and regional policies.
- Redis is for hot API-key cache, RPM/TPM, concurrency counters, abuse controls, and non-authoritative acceleration.
- LiteLLM users, teams, organizations, virtual keys, budgets, and spend are not commercial master data.
- A control-plane workspace may be projected to a LiteLLM Team to reuse model allowlists, RPM/TPM, concurrency, and operational safety budgets.
- MVP may use LiteLLM Virtual Keys behind Edge, but long-term customer-key ownership remains in the custom control plane.
- LiteLLM Budget is a secondary operational safety ceiling, not prepaid balance.
- LiteLLM spend logs are reconciliation telemetry, not the financial ledger.

ACCOUNTING INVARIANTS
---------------------
- Journal every accepted logical request before dispatch.
- Assign stable logical request IDs and separate provider-attempt IDs.
- Wallet reservation, capture, and release are transactionally authoritative in PostgreSQL or a single-writer wallet service.
- A client request can create multiple provider attempts due to retries/fallbacks; record all provider costs but normally charge the customer once for the logical result delivered.
- Ambiguous provider timeouts and client cancellation remain reconcilable states; client disconnect does not prove provider generation or billing stopped.
- Snapshot price-book version and customer price dimensions at request acceptance.
- Keep raw usage events, provider costs, customer charges, reservations, and Stripe exports separate.
- Enforce ledger insert-only permissions, idempotency constraints, and compensating entries instead of updates/deletes.
- Prevent the same usage from both consuming prepaid credits and being invoiced as postpaid usage.

TENANCY MODEL
-------------
- Account
- Organization as the billing/legal entity and Stripe Customer owner
- Workspace/Project as environment or cost-center boundary
- Membership roles: Owner, Admin, Developer, Billing, Viewer for MVP
- API Keys scoped to workspaces with model, route, environment, expiry, IP, RPM, TPM, and concurrency policies
- Enterprise roadmap: SAML, SCIM, custom roles, audit export, private networking, dedicated gateways, contract pricing, and zero-retention routes

REGIONAL AND PROVIDER POLICY
----------------------------
- Residency and provider approvals are hard pre-routing constraints, not preferences.
- Run separate US and EU data planes as the product matures.
- No cross-region fallback without explicit tenant permission.
- Maintain a provider-model-region approval registry containing endpoint, resale approval, DPA status, retention/training policy, residency, legal/security review status, review expiry, and kill switch.
- Verify provider-by-provider rights for API resale or embedded end-user access. Open model licenses do not automatically grant hosted API resale rights.
- Prefer officially supported US/EU regional endpoints where available.

LITELLM SCOPE
-------------
- Keep: provider adapters, OpenAI-compatible normalization, explicitly tested Anthropic translation, health checks, routing within approved sets, bounded retries, permitted fallbacks, token/cost telemetry, and private operational endpoints.
- Avoid: public LiteLLM exposure, public dashboard/admin APIs, master-key exposure, arbitrary provider base URLs, customer-supplied provider credentials, uncontrolled passthrough routes, commercial authority in LiteLLM DB, aggressive retries after ambiguous timeouts or streaming start, shared response cache without tenant-isolation policy, and prompt/response logging by default.
- Use official stable signed images pinned by digest.
- Maintain only a small external auth/callback/event adapter and generated configuration.
- Never copy LiteLLM source into this project or modify its Prisma schema.

UPGRADE STRATEGY
----------------
- Automated dependency/release proposal, never automatic production promotion.
- Verify image signature and digest.
- Contract tests cover Chat Completions, Responses, Anthropic Messages, streaming, tool calls, structured output, embeddings, usage fields, errors, routing, and fallbacks.
- Financial/failure tests cover callback loss, duplicate/out-of-order events, timeout after provider acceptance, provider success followed by process crash, streaming cancellation, missing usage, cache/reasoning tokens, retries, price-version changes, and rollback compatibility.
- Progressive rollout through internal, canary, staged percentages, and rapid rollback.

INITIAL IMPLEMENTATION PLAN
---------------------------
1. Create the independent project and architecture documentation.
2. Scaffold a TypeScript workspace with control-plane API, Edge API, metering worker, shared contracts, and a future web console.
3. Add PostgreSQL, Redis, stock LiteLLM, and local orchestration.
4. Implement organizations, workspaces, memberships, RBAC, API-key generation/hash/rotation/revocation, model catalog, entitlements, and regional policies.
5. Implement request journal, wallet accounts, authoritative reservations, raw usage events, immutable ledger, outbox, and reconciliation worker.
6. Implement the private LiteLLM assertion adapter and normalized usage callback.
7. Implement Stripe Checkout/subscriptions/webhooks/meter export as a downstream projection.
8. Add developer console, documentation, usage and billing views.
9. Add security, failure-injection, compatibility, integration, and deployment tests.
10. Conduct a full architecture, code-quality, security, and QA review.

CURRENT STATE
-------------
- This directory was newly created and contains only project instructions and this handoff.
- No application code, package configuration, database schema, or git repository has been created yet.
- Environment observed previously: Node.js 23, npm 10, Python 3.12, Docker 20.10. Docker Compose v2 was not available through `docker compose`; check whether legacy `docker-compose` is installed before choosing local orchestration commands.
- Background research agents failed because of external model configuration/billing errors; direct official LiteLLM and Stripe documentation was used instead.

REFERENCES
----------
- https://docs.litellm.ai/docs/proxy/architecture
- https://docs.litellm.ai/docs/proxy/custom_auth
- https://docs.litellm.ai/docs/proxy/call_hooks
- https://docs.litellm.ai/docs/proxy/db_info
- https://docs.litellm.ai/docs/proxy/cost_tracking
- https://docs.litellm.ai/docs/proxy/multi_tenant_architecture
- https://docs.litellm.ai/docs/proxy/users
- https://docs.litellm.ai/docs/proxy/virtual_keys
- https://docs.stripe.com/api/billing/meter-event
- https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en
- https://www.trade.gov/consolidated-screening-list

CONTINUATION INSTRUCTION
------------------------
- Work only inside `/home/allen/project/llm-gateway`.
- Do not inspect or reuse sibling projects.
- Start by creating a concrete staged implementation plan, then scaffold and verify the first runnable milestone rather than producing more conceptual analysis.
