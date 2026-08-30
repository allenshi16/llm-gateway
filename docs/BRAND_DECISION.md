# Brand decision: Maridian Gateway

**Status**: Decided and applied (2026-08-30)

**Decision**: Rebrand from "Northstar Gateway" to **Maridian Gateway**. The product name, logo mark, and user-facing copy now read "Maridian"; the tagline and the color system are unchanged.

**Rationale**: "Northstar" carries high trademark and name-collision risk for a commercial LLM API gateway serving US/EU developers and enterprises. The replacement name is a distinctive coined word with a clear origin story (derived from *meridian*, the reference line every route is measured against), and it passed a full landing check: no trademark records, no npm/pypi/GitHub collisions, and free `.io`/`.dev`/`.ai` domains.

---

## 1. Background

The gateway needs a brand name that:

- is registrable as a trademark (distinctive, not merely descriptive);
- has no direct collision with existing products in the LLM-gateway / AI-infrastructure space;
- is free on npm, pypi, and GitHub (dev-facing product);
- supports a clean domain strategy (.io/.dev/.ai);
- leaves room for a defensible goods/services description in trademark class 9/42.

The name in use ("Northstar") was assessed against these requirements and found wanting (Section 2). A candidate set was generated and verified (Sections 3–4). "Maridian" was selected and applied (Section 5).

---

## 2. Why "Northstar" was rejected (high risk)

### 2.1 Direct product collisions in the same category

| Collision | Nature | Severity |
|---|---|---|
| **NorthStar LLM API** (Adelaide, AU, via `api.northstarbuyingguides.store`) | OpenAI-compatible LLM inference API on private enterprise hardware; data-residency positioning mirrors ours | Critical |
| **northstar-ai-governance-os** (GitHub, mellowmir94) | "AI governance control plane" for release gates, approvals, audit — conceptually our control plane | High |
| **dromara/northstar** (Gitee GVP project) | Java quant trading platform with `northstar-gateway-ctp/binance/tiger` subprojects — literal "northstar-gateway" collision in CN ecosystem | High |
| **kl3inIT/northstar** (GitHub) | AI-native personal OS with LiteLLM/OpenAI-compatible gateway routing | Medium |
| TokenHub customer testimonial | "Platform lead at **Northstar AI**" appears on an LLM gateway marketplace | Medium |

### 2.2 Live USPTO registrations in classes 9/42 (would be cited against a filing)

| Mark | Reg. No. | Class | Owner | Status |
|---|---|---|---|---|
| NORTHSTAR | 7195021 | 42 | Physicians Group Management, LLC (medical billing SaaS) | LIVE |
| NORTHSTAR | 6870045 | 9 + 42 | Northstar Load Cell and Scale LLC | LIVE |
| NORTHSTAR | 5202451 (SN 79198823) | 41 + 42 | Merck KGaA | LIVE |
| COFORGE NORTHSTAR | SN 99516030 | 42 | Coforge (SaaS infra platform) | NOA issued 2026-06-23 |
| NORTHSTARAI | 8193995 | 42 | Joseph Prillmayer (AI SaaS) | LIVE (2026-03-31) |

### 2.3 Other jurisdictions

- **EUIPO**: `NORTH STAR` (FCA US LLC, class 12 vehicles) registered — not a direct conflict, but the field is crowded.
- **Canada**: NorthStar Software (1434225, utility enterprise software) — ABANDONED, no longer blocking.
- **India**: Northstar Technologies International (class 42), Northstar Software Solutions Pvt Ltd (class 35) on file.
- **Domains**: `northstar.io` and `northstargateway.com` both taken; no clean domain available.

### 2.4 Net assessment

- Trademark registration (US class 42): **high risk** — 3+ live NORTHSTAR class-42 marks; a filing would likely draw 2(d) refusals.
- Direct product collision: **high** — an Australian "NorthStar LLM API" competes in the exact category.
- Brand dilution: **high** — 7+ AI companies use "NorthStar".

Combined, "Northstar" fails the registrability and collision requirements. Result: **rename**.

---

## 3. Candidate generation

Candidates preserve the guiding-star / reference-point / calm-control-plane imagery while being coined rather than real words (real words are far more likely to collide). Each was web-verified for existing companies, trademarks, and software usage.

### 3.1 Candidates eliminated by the collision check

| Candidate | Why eliminated |
|---|---|
| Norstride | Existing AI consultancy (norstride.com) + North Stride Global recruiting |
| Stellance | Two Stellar-blockchain freelance platforms + Stellance Pharmscience |
| Vespera | Crowded: quant workbench, AI sovereignty systems, options analytics, AI agency (4+ entities) |
| Astrel | French IT consultancy + astro camera maker + fresh EXEL Industries EUIPO filing |
| Astrolabe | **Live US trademark** (#7616667, class 42, Astrolabe Interactive) + Montreal game studio + 1979 astrology software |
| Septentrio | Hexagon-owned GNSS giant (satellite navigation — identical semantic space) |
| Alcyone / Alcyon | **ALCYON has live SaaS marks in class 42** (traffic/parking infra) + several software cos |
| Norvix | Dallas/San Diego dev agencies + 2025 USPTO application |

### 3.2 Verified candidates (final four)

| Name | Origin | Landing check (2026-08-30) | Residual risk |
|---|---|---|---|
| **Maridian** | coined from *meridian* (reference line) | npm/pypi/GitHub org all free; `maridian.io`/`.dev`/`.ai` free; **no trademarks found anywhere** | Phonetic proximity to "Meridian" brand family — the only clearance item |
| **Placidus** | Latin "calm" + astrological house system (sky imagery) | npm/pypi/GitHub org free; only `.dev` free | IT companies in DE/FR/PL; SDN research project |
| **Auriga** | constellation Auriga (contains navigation star Capella) | npm/pypi/GitHub org taken; all domains taken | Astronomy-community saturation |
| **Nosta** | compressed "No(rth) + S(tar)" | npm taken; only `.dev` free | Unknown residual |

---

## 4. Selection

**Selected: Maridian.**

- Cleanest landing profile: npm, pypi, GitHub org, and all three preferred domains free; no trademark record anywhere.
- Story fits the product: *"Maridian — the reference line every model route is measured against."*
- Tagline and color system carry over unchanged:
  - tagline: "One calm control plane for every model route."
  - colors: ink `#08111f`, panel `#0d1b2d`, signal `#f2b84b`, mint `#77d8c4`.
- Commerce note: `maridian.com` is held by an unrelated small business-financing company (Maridian Group, est. 2011, zero domain overlap). Acceptable; brand domain is `maridian.dev`/`maridian.io`.

**Known residual risk (accepted)**: phonetic similarity to the "Meridian" trademark family (Meridian Health / Bank / Energy). This is a *clearance* risk, not an infringement risk. Mitigations: file as a composite word mark ("Maridian Gateway"), narrow the goods description, and run a formal clearance search with IP counsel before public commercial launch.

---

## 5. Applied changes (commit `370c9bd`)

| File | Change |
|---|---|
| `packages/brand/src/index.ts` | `name: "Maridian Gateway"` |
| `packages/ui/src/index.tsx` | Logo mark `N`→`M`, text "Northstar"→"Maridian" |
| `apps/web/app/page.tsx` | footer `© 2026 Maridian Gateway` |
| `apps/web/app/marketing-page.tsx` | footer `© 2026 Maridian Gateway` |
| `apps/web/app/docs/page.tsx` | metadata description |
| `apps/console-web/app/layout.tsx` | title template `%s · Maridian Console` |
| `apps/console-web/app/login/page.tsx` | "Use your Maridian account" / "New to Maridian?" |
| `apps/console-web/app/console-frame.tsx` | localStorage key `maridian_selected_workspace` |
| `docs/CONSOLE_ROLLOUT.md` | canary cookie `maridian_console` |

Verified: zero `Northstar`/`northstar`/`North Star` matches repo-wide; typecheck passes (12 packages); tests pass (14 files / 28 tests); live pages on :4300/:4301 render the new brand.

---

## 6. Sources and follow-ups

- USPTO/EUIPO/trademark registrations were verified via public trademark databases (Furm, Markinton, TrademarkElite, Justia, datalog) during August 2026 review.
- npm/pypi/domain/GitHub availability checked via registry and DNS lookups on 2026-08-30.

Follow-ups before public launch:

1. Buy `maridian.dev` / `maridian.io` (and consider `maridian.ai`) while available.
2. Run a formal US/EU clearance search (classes 9, 35, 38, 42) with IP counsel; file `Maridian Gateway` as a composite mark.
3. Decide whether `bestllm.dev` (already registered) serves as the marketing/SEO entry while `maridian.dev` is the brand domain.