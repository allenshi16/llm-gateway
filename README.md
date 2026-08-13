# LLM Gateway

Commercial multi-tenant LLM API gateway for US and European developers and enterprises. It exposes OpenAI-compatible APIs for approved DeepSeek, Qwen, Kimi, GLM, and future model routes while keeping LiteLLM as a private, independently upgradeable data plane.

## Architecture

- Control plane: organizations, workspaces, memberships, API keys, catalog, entitlements, wallets, ledger, Stripe mappings, and provider approvals.
- Edge: public API authorization, policy checks, request journaling, wallet reservation, and private LiteLLM dispatch.
- Worker: PostgreSQL outbox processing, usage settlement, reconciliation, and Stripe projection.
- LiteLLM: stock version-pinned provider translation, routing, health checks, and operational cost telemetry.

See `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md`, and `HANDOFF.md` for the full boundaries and invariants.

Control-plane mutation endpoints require the private `CONTROL_PLANE_ADMIN_TOKEN`; do not publish the control plane directly to the internet.

## Local development

1. Copy `.env.example` to `.env` and replace all placeholder secrets. The `dev:*` scripts load this root `.env` automatically.
2. Install dependencies with `bun install`.
3. Start infrastructure with `docker-compose -f infra/docker-compose.yml up -d postgres redis` (or `docker compose` where the Compose v2 plugin is installed).
4. Run `bun run db:generate`, `bun run db:push`, and `bun run db:seed`.
5. Start services with the `dev:*` scripts.

LiteLLM remains private and is started through the Compose profile after provider credentials and approved routes are configured. The current Edge returns a safe `402 wallet_authorization_required` response before dispatch; real wallet authorization, request journaling, outbox settlement, and LiteLLM dispatch are MVP follow-up work.
