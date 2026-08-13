# Console frontend rollout and rollback

This document covers shipping the Next.js console (`apps/console-web`) next to the legacy console (`apps/console`) and rolling either one back. It is not a release gate list; blocking checks live in `docs/RELEASE_GATES.md`.

## Components

| Component | App | Dev port | Role |
|---|---|---|---|
| Marketing site | `apps/web` | 4300 | Public SEO surface; links to the console via `NEXT_PUBLIC_CONSOLE_URL` |
| New console | `apps/console-web` | 4301 | Next.js App Router console; session-authenticated UI over `/api/*` rewrites to the control plane |
| Legacy console | `apps/console` | 4200 | Current Node HTTP console; kept as the fallback until the new console is battle-tested |
| Control plane | `apps/control-plane` | 4100 | Session and account APIs; single source of truth for RBAC, wallets, ledger |

The new console is stateless UI. It holds no keys, no tokens, and no authority; every privileged action is enforced server-side by the control plane's `requireMembership`. Rollback therefore never touches data-plane state.

## Release switch

`CONSOLE_RELEASE_TARGET` selects where console traffic goes:

- `legacy` (default) — all console traffic to `apps/console`, the proven path.
- `canary` — internal cookies/headers route a small group to the new console.
- `new` — all console traffic to `apps/console-web`; the cutover state.

The switch is evaluated by the edge/load balancer in front of the console hostname, not by the applications. Example cookie-based canary rule: request carrying `northstar_console=new` is sent to the new console; everyone else stays on the legacy console. Keep the legacy console deployable and dependency-pinned for the entire window in which a rollback could be needed.

## Canary

1. Deploy `apps/console-web` behind the console hostname; set `CONSOLE_RELEASE_TARGET=canary`.
2. Route employees and a trusted customer cohort to the new console with the canary cookie.
3. Watch the new console's request logs and browser-side console errors for CSP violations, failed session calls, and workspace-switching regressions.
4. Run the E2E console suite against the canary target before expanding:
   ```bash
   E2E_CONSOLE_URL="$CANARY_URL" bun run test:e2e
   ```
5. Expand the canary only after zero blocking defects over at least one full billing cycle review window.

## Cutover

1. Confirm the control-plane session APIs (`/v1/auth/*`, `/v1/account/*`) are additive and unchanged in contract; the legacy console must keep working untouched.
2. Freeze the canary cohort for a full review cycle before flipping `CONSOLE_RELEASE_TARGET=new`.
3. Flip the switch, then immediately verify login, dashboard, API keys, usage, billing, members, models, and audit on the new console.
4. Record the new console image digest, config hash, and the switch timestamp as release evidence.

## Rollback

Roll back immediately when any of the following is observed:

- Login, workspace switching, or API key management fails for more than one tenant.
- Session or account errors spike beyond the alert threshold.
- CSP violations or hydration failures appear in production browser logs.
- A control-plane contract change is required to fix the new console.

Procedure:

1. Flip `CONSOLE_RELEASE_TARGET` back to `legacy`. This is a config change, not a redeploy.
2. Verify the legacy console serves traffic and its session endpoints respond.
3. Keep the failed new-console deployment intact for post-mortem; never fix forward in production.
4. Investigate with the failed build's logs; ship a fix through the normal gates (`RELEASE_GATES.md`), not as a hotfix to the broken deployment.

Because the new console is stateless and the control plane owns all state, rollback is reversible at any time with no data migration and no wallet or ledger impact.

## Frontend smoke checklist (post-deploy)

- [ ] Marketing site: `/`, `/models`, `/pricing`, `/platform`, `/resources`, `/docs` return 200 with rendered headings.
- [ ] `robots.txt` and `sitemap.xml` list the expected crawlable routes.
- [ ] Console unauthenticated paths redirect to `/login`.
- [ ] Console login form renders without prefilled credentials.
- [ ] Strict CSP headers (`frame-ancestors 'none'`, nonce-based `script-src`) are present and no browser CSP violations are logged.
