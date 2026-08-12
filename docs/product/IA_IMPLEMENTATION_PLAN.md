# Life Community OS
# IA Implementation Plan

> Document status: **execution strategy only**.  
> Does **not** modify code, create commits, change routes, or authorize immediate implementation.  
> Decision source: `docs/product/IA_DECISION.md`  
> Supporting sources:  
> - `docs/product/CURRENT_INFORMATION_ARCHITECTURE.md`  
> - `docs/product/IA_PROPOSALS.md`  
> - `docs/product/IA_DECISION_PREPARATION.md`

---

## Objetivo

Translate the approved IA direction into an ordered, low-risk implementation strategy:

**Direction (from IA_DECISION.md):** Hybrid **H1** (Clarify Ownership + Belong/Operate/Life/Profile grammar), delivered as path **H4** (Phase A cleanup → Phase H1 Life root).

**Bottom nav locked:** Inicio · Comunidad · + · Servicios · Perfil  

**Not in scope of this plan’s default path:** B1 tab swap, H3 presets, feature deletion, ConversationExperience replacement, unnecessary route rewrites.

---

## Principios

1. Build on the existing App Router + `MemberShell` + tenant navigation projector.
2. Reuse current screens and UI packages; prefer composition and entry-point changes.
3. Keep route compatibility (maintain / alias / redirect / deprecate-later).
4. Multi-tenant: change projector **content and rules**, not a Panoramica-only hard fork of shell grammar.
5. ConversationExperience remains the universal chat shell (capability, not a section).
6. Do not close items marked **PENDIENTE DE DECISIÓN** in `IA_DECISION.md`.
7. Prefer Tipo A → Tipo B before any Tipo C.
8. Validate with named agents before coding each phase.

### Change type legend

| Tipo | Meaning |
|------|---------|
| **A** | Content only (labels, titles, copy, names) |
| **B** | UX organization (order, access points, hierarchy, ownership in nav/hub) |
| **C** | Structural (new routes, screen migrations, new components) — avoid unless necessary |

---

## Impacto actual

### Surfaces affected by IA_DECISION

| Surface | Decision effect |
|---------|-----------------|
| Bottom nav | Slots stay; active-state ownership must improve |
| Hamburger | From full sitemap → overflow (Life + account); stop duplicating tab roots |
| Create sheet | Group by Comunidad / Planes / Resolver |
| Inicio / Home | Briefing only; fewer launcher doors |
| Comunidad | Belong layers; remove global Explorar portal |
| Servicios | Explicit Operate owner (categories + marketplace + resources entry) |
| Life | Secondary Planes + Cerca directory |
| Perfil | Honest account shortcuts |
| Chat routes | Unchanged ownership (capability) |
| `/housing` | Must not remain a false Community Explorar peer |

### Impact map (planned changes)

| Área | Archivo relacionado (principal) | Tipo | Impacto | Riesgo |
|------|----------------------------------|------|---------|--------|
| Bottom nav items | `apps/web/src/components/MemberShell.tsx` (`buildNav`) | A/B | Labels stay; create grouping later | Bajo |
| Active tab mapping | `MemberShell.tsx` (`activeFromPath`) | B | Secondary routes must not always map to Inicio | Medio (orientation) |
| Hamburger projection | `tenants/life-panoramica/src/navigation-projector.ts` | B | Tree reshape to overflow | Medio |
| Community hub areas | `tenants/life-panoramica/src/community-hub.ts` | A/B | Align visible Belong layers; pending merge decisions | Medio |
| Community UI layers | `apps/web/src/screens/CommunityScreen.tsx` | B | Remove/gate Explorar portal; layer titles | Medio |
| Community deep links | `community-hub.ts` (`?tab=` + legacy map) | B | Aliases for collapsed areas | Bajo–Medio |
| Home composition | `apps/web/src/screens/HomeScreen.tsx` | B | Fewer doors; briefing focus | Medio |
| Home intents/copy | `tenants/life-panoramica/src/home-premium.ts` | A/B | Intent ownership toward Life/Operate | Bajo–Medio |
| Home UI primitives | `packages/ui/src/home/HomePremium.tsx` | A | Copy only if needed | Bajo |
| Create sheet actions | `MemberShell.tsx` (`createSections`) | B | Group by job owners | Bajo |
| Services hub | `apps/web/src/screens/ServicesHubScreen.tsx` | A/B | Operate vocabulary / doors | Bajo |
| Services categories | `tenants/life-panoramica/src/service-near-hubs.ts` | A | Near “Servicios” label collision (**pendiente**) | Bajo (blocked by D8) |
| Marketplace labels | marketplace screens + projector leaf | A | Mercado vs Compra y venta (**pendiente D7**) | Bajo |
| Resources / reservas entry | projector Reservas leaves; Services hub; Community Explorar | B | Single Operate owner; collapse duplicate leaves | Bajo–Medio |
| Experiences entry | projector; Home; Community Explorar | B | Life/Planes owner | Bajo |
| Activities entry | `explorer-nav.ts` + projector | B | Planes family (**nesting pendiente D4**) | Bajo–Medio |
| Discover / Near | `DiscoverScreen.tsx`; `/near/*`; projector “Cerca de ti” | B | Single Cerca story (**D2/D3 pendientes**) | Medio |
| Profile shortcuts | `ProfileScreen.tsx`; projector Mi perfil | A/B | Honest leaves | Bajo |
| Official entry | Community oficial section; projector Oficial | B | Belong entry + optional overflow shortcut | Bajo |
| Housing dead link | `CommunityScreen.tsx` Explorar tile | B | Gate until route exists | Bajo |
| Chat screens | `*ConversationScreen.tsx` + `ConversationExperience` | — | **No IA ownership change** | N/A |
| New routes | — | C | **Not required** in default H1/H4 path | — |
| Route renames | — | C | Avoid; prefer aliases | — |

---

## Cambios por área

### Navegación

#### Bottom Navigation

| Item | Permanece | Cambia | Se mueve | Alias temporal |
|------|-----------|--------|----------|----------------|
| Inicio | Yes (`/`) | Responsibility → briefing | — | — |
| Comunidad | Yes (`/community`) | Internal Belong layers | Explorar cross-links leave this tab’s ownership | `?tab=` aliases |
| + Crear | Yes (sheet) | Section grouping by owners | — | — |
| Servicios | Yes (`/services`) | Explicit Operate ownership messaging | Booking/marketplace entry gravity stays here | — |
| Perfil | Yes (`/me`) | Honest shortcuts | Fake multi-leaves collapsed | — |

**Active state (plan):** map Life routes (`/experiences*`, `/activities*`, `/discover`, `/near*`) and Official (`/official*`) to a defined secondary highlight policy — **PENDIENTE DE DECISIÓN D11** whether mandatory in first engineering slice. Until D11: document intended mapping (e.g. no false Inicio, or explicit “none/Inicio briefing only” rule).

#### Hamburger Menu

| Today | Future (H1) |
|-------|-------------|
| Full sitemap including Comunidad/Servicios/Perfil trees | Overflow: **Life (Planes + Cerca)**, optional Oficial shortcut, **Cuenta** |
| Reservas two leaves → `/resources` | One Operate booking entry (label **pendiente D1**) |
| Actividades + Experiencias peer categories | One **Planes** family (**nesting pendiente D4**) |
| Cerca de ti separate + Discover elsewhere | One **Cerca** story (**D2/D3 pendientes**) |
| Comunidad 8 leaves | Reduce to Belong surfaces or deep-links that match visible layers |

**Alias temporal:** keep old leaf ids/hrefs resolving where areas collapse (especially Community `?tab=`).

---

### Community (Belong)

Target shape (from decision + requested plan framing):

```
Comunidad
├── Ahora
├── Grupos
├── Proponer   (decide surface)
└── Oficial
```

#### Existing screens / pieces

| Existing | Reuse | Adaptation | Pending |
|----------|-------|------------|---------|
| `CommunityScreen` / Hub surfaces | Yes | Retitle layers; remove/gate Explorar portal; scroll targets | Layer naming vs area ids |
| Groups list → detail/conversation | Yes | Entry remains Comunidad | — |
| Publications / content detail | Yes | Plaza / Ahora ownership | Conversaciones area rename (**D6**) |
| Proposals UI | Yes | Single **Proponer** surface | Merge Participación (**D5**) |
| Channels / official blocks | Yes | Oficial entry only | — |
| Mascotas panel | Yes as content/filter | Not a top Belong root | Placement under Plaza or Life later |
| Espacios tile → `/resources` | Move ownership | Leave Comunidad; enter via Servicios | — |
| Experiencias / Servicios tiles | Move ownership | Leave Comunidad | — |
| Vivienda → `/housing` | Gate | Do not ship dead peer | Implement route later or hide |

**Components to reuse:** `CommunityHubSurfaces`, existing cards/rows, group/content screens, official entity screens, ConversationExperience for group/neighbour/official chats.

**No capability deletion:** pets, spaces, experiences remain reachable via their owners.

---

### Services (Operate)

| Capability | Clearly Operate today? | Mixed today? | Reorg plan |
|------------|------------------------|--------------|------------|
| Profesionales / work / help / mobility / recommendations | Yes (hub + categories) | Also Discover “Ayuda” / Home doors | Primary remains Servicios; secondary links OK |
| Marketplace | Yes (gravity) | Label split Mercado vs Compra y venta | Owner Servicios; label **D7** |
| Resources / reserve | Partially | Community Explorar, hamburger Reservas×2, Create, Services | Single Operate entry; Profile keeps **Mis reservas** |
| Report | Adjacent | Create only | Keep as Resolver-adjacent create action |

**Reuse:** `ServicesHubScreen`, `ServicesCategoryScreen`, marketplace/*, resources/*, reservations, work flows, related ConversationExperience contexts.

---

### Life (Planes + Cerca)

| Piece | Role under decision | Plan note |
|-------|---------------------|-----------|
| `/experiences*` | Planes primary moments | Move entries from Community Explorar / scattered menus into Life root |
| `/activities/*` | Planes family | **D4** nesting vs peer — do not close here |
| `/discover` | Cerca family | **D2/D3** — do not close here |
| `/near/*` | Cerca categories | Same |
| Home nearby / intents | Secondary shortcuts | Reduce to briefing doors once Life root exists |

**Secondary capacity:** Life is **not** a bottom-nav slot in phases 1–2.

**Blocked work:** final Cerca IA, Discover shell vs hub, Actividades nesting, public names — wait for pendientes.

---

### Inicio / Create / Perfil (brief)

| Area | Plan |
|------|------|
| Inicio | Keep `HomeScreen`; limit intents to owned doors; drop sitemap behaviour |
| Create | Reuse `CreateSheet`; regroup sections only |
| Perfil | Reuse `ProfileScreen`; collapse dishonest hamburger leaves; keep real shortcuts |

### Conversation

| Plan |
|------|
| **No structural IA migration.** Keep all `*ConversationScreen` + ConversationExperience. Ensure nav never introduces a Conversaciones section that implies inbox. |

---

## Estrategia de rutas

Default: **maintain**. Prefer **alias** over rename. **Redirect** only when a leaf must move without breaking bookmarks. **Deprecated futuro** for hollow/duplicate entries after replacements exist.

| Ruta actual | Estado futuro | Strategy |
|-------------|---------------|----------|
| `/` | maintain | Briefing ownership |
| `/community` | maintain | Belong layers |
| `/community?tab=actualidad\|grupos\|…` | maintain + alias | Map collapsed tabs to surviving layers; keep legacy map |
| `/community?tab=conversaciones` | alias | Fold into Plaza until D6 names settled |
| `/community?tab=participacion` | alias | Fold into Proponer until D5 |
| `/community?tab=espacios\|mascotas` | alias / soft-deprecate as roots | Content reachable elsewhere; not Belong roots |
| `/community/content/[id]` | maintain | |
| `/community/groups/*` | maintain | |
| `/community/neighbours/*/conversation` | maintain | |
| `/services` + `/services/[category]` | maintain | Operate |
| `/services/work/*` | maintain | |
| `/marketplace*` | maintain | Operate owner |
| `/resources*` | maintain | Operate booking entry |
| `/reservations` | maintain | Perfil list + Operate adjacency |
| `/experiences*` | maintain | Life/Planes |
| `/activities/[slug]` | maintain | Life/Planes family |
| `/discover` | maintain (pending D3) | Do not redirect until D3 |
| `/near/*` | maintain | Cerca family |
| `/official/*` | maintain | Belong entry |
| `/me`, `/calendar`, `/notifications`, `/report` | maintain | |
| Conversation routes (`…/conversation`) | maintain | Capability |
| `/housing` | deprecated until implemented | Gate UI entry; no silent 404 from Comunidad |
| `/dev/assets` | maintain | Out of product IA |

**Avoid Tipo C** unless a pending decision explicitly requires a new route later.

---

## Roadmap

Aligned with H4: safe → UX reorg → screen adaptation → future cleanup.

### FASE 1 — Cambios seguros (labels, ownership wiring, navegación menor)

**Objetivo:** Encode ownership rules without reshaping user mental model violently; stop obvious duplication and dead ends.

**Archivos afectados (expected):**

- `apps/web/src/components/MemberShell.tsx` (activeFromPath if D11 yes; create section titles)
- `tenants/life-panoramica/src/navigation-projector.ts` (collapse duplicate Reservas leaves; begin trimming duplicate tab-root categories)
- `apps/web/src/screens/CommunityScreen.tsx` (gate `/housing`; optionally hide cross-module Explorar tiles behind flag)
- Docs only updates as needed for QA checklists

**Tipo:** mostly A/B  

**Riesgo:** Bajo  

**Validación necesaria:**

- Bottom nav still five slots
- No broken primary flows
- Housing tile not clickable to 404
- Agent review: Product Architect + Architecture Guardian

**Exit criteria:** Duplicate Reservas leaves gone; dead housing entry gated; ownership documented in code comments/projector structure started.

**FASE 1 status (2026-08-12):** Foundation cleanup executed — see `docs/product/IA_PHASE1_FOUNDATION_CLEANUP_REPORT.md`. Housing door gated + `/housing` compatibility redirect; Reservas hamburger collapsed to one leaf. Did **not** start FASE 2.

---

### FASE 2 — Reorganización UX (comunidad, menú, accesos)

**Objetivo:** Belong Community shape; hamburger → Life overflow + Cuenta; Home/Create align to owners.

**Archivos afectados (expected):**

- `CommunityScreen.tsx` + `community-hub.ts` (Ahora / Grupos / Proponer / Oficial)
- `navigation-projector.ts` (Life root; remove peer Comunidad/Servicios clones)
- `HomeScreen.tsx` + `home-premium.ts`
- `MemberShell.tsx` createSections
- Possibly `ServicesHubScreen.tsx` copy for Operate clarity (A)

**Tipo:** B (light A)  

**Riesgo:** Medio  

**Validación necesaria:**

- Deep links `?tab=` still resolve
- Experiencias/Servicios/Espacios reachable via owners
- Elder/new-user walkthrough of 4 bottom sections + Life overflow
- Agents: UX/Product Designer + Product Architect + Multi-tenant Guardian

**Blocked by pendientes if attempted too early:** D5/D6 for final Community area naming; D4 for final Planes tree; D2/D3 for final Cerca tree — use interim labels that do not contradict decision.

**Exit criteria:** Comunidad has no global Explorar portal; hamburger is overflow; Home is briefing-first.

---

### FASE 3 — Adaptación de pantallas

**Objetivo:** Tighten screen headers/empty states/section intros to match Belong / Operate / Life without new routes.

**Archivos afectados (expected):**

- Community / Services / Discover / Experiences / Near / Profile screens (copy + section hierarchy)
- Optional UI chrome strings in `packages/ui` only where shared labels confuse ownership (careful: multi-tenant)

**Tipo:** A/B  

**Riesgo:** Medio  

**Validación necesaria:**

- No ConversationExperience API changes
- Tenant pack still projects correctly with modules off
- Agents: UX/Product Designer + Architecture Guardian

**Exit criteria:** User-facing surfaces speak the selected ownership; pendientes still marked where unresolved.

---

### FASE 4 — Limpieza futura

**Objetivo:** After pendientes D1–D12 are decided, finalize vocabulary, Cerca structure, optional B1/H3 evaluation, deprecate leftover aliases.

**Archivos afectados:** TBD after pendientes; may include projector, community-hub area ids, Discover/Near composition.

**Tipo:** A/B; Tipo C only if a pending decision requires it  

**Riesgo:** Medio → Alto if B1/H3 pursued  

**Validación necesaria:** Explicit product sign-off on each pendiente; Multi-tenant Guardian for presets; Architecture Guardian for any Tipo C.

**Exit criteria:** Pendientes closed or explicitly deferred; alias list reduced; optional tab-swap decision recorded separately.

---

## Riesgos

| Riesgo | Fase | Mitigación |
|--------|------|------------|
| Partial adoption (docs say Belong, UI still Explorar) | 1–2 | Exit criteria require Explorar portal gated/removed |
| Breaking `?tab=` bookmarks | 2 | Keep `LEGACY_TAB_MAP` / aliases |
| Hamburger too empty before Life root ready | 2 | Interim Planes+Cerca leaves even if nesting pending |
| Label decisions (D1/D2/D7/D8) leaking into code early | 1–3 | Use interim neutral copy; don’t invent finals |
| Active-state confusion | 1 | Resolve D11 before large UX reorg |
| UI package hardcoding Panoramica strings | 3 | Prefer tenant pack / projector copy |
| Accidental ConversationExperience churn | all | Explicit non-touch list in PRs |
| Scope creep into B1 | 4 | Require separate decision amendment |

---

## Validaciones

### Before implementation (agent review)

Repo agent roles to consult (from Agent OS catalogue):

| Agent | Must validate |
|-------|----------------|
| **Product Architect** (`01_PRODUCT_ARCHITECT`) | Direction still matches IA_DECISION; phase exit criteria; no feature deletion; pendientes not silently closed |
| **UX Architect** / product design owner (`03_UX_ARCHITECT` or design partner) | Cognitive load of Belong layers; Home briefing; hamburger overflow discoverability; elder clarity |
| **Architecture Guardian** (`01_ARCHITECTURE_GUARDIAN`) | No unnecessary Tipo C; package boundaries (ui vs tenant vs web); ConversationExperience untouched; evolution-over-rewrite |
| **Multi-Tenant Guardian** (`02_MULTI_TENANT_GUARDIAN`) | Projector changes remain tenant-configurable; grammar not Panoramica-only; module-off behaviour |

Optional later: **Documentation Engineer** for keeping IA docs in sync after each phase; **Code Reviewer** when PRs start.

### Per-phase validation checklist (product)

1. Bottom nav slots unchanged.  
2. Primary owners reachable in ≤2 taps for Plaza, Resolver, Planes, Cerca (Cerca may be hamburger until D2/D3).  
3. No dead Community Explorar peers.  
4. Existing conversation contexts still open.  
5. Deep links degrade safely.  
6. Pendientes remain listed until human-closed.

---

## Pendientes (do not close in this plan)

Carried from `IA_DECISION.md` §8 — implementation must not invent finals:

D1 booking vocabulary · D2 Cerca public name · D3 Discover role · D4 Actividades nesting · D5 Propuestas/Participación merge timing · D6 Conversaciones naming · D7 Mercado vs Compra y venta · D8 near “Servicios” collision · D9 Belong/Operate user-facing vs internal · D10 future B1 allowance · D11 activeFromPath in phase 1 · D12 legacy `?tab=` forever policy · **D13 Housing/Living ownership** (`docs/product/D13_HOUSING_LIVING.md`)

---

## Explicit non-authorization

This plan does **not**:

- modify code  
- create commits  
- change routes now  
- start refactors  
- approve B1/H3  
- resolve pendientes  

Next step after stakeholder acceptance of this plan: engineering tickets sliced by **FASE 1 → 4**, each gated by the agent validations above.

---

*End of IA Implementation Plan.*
