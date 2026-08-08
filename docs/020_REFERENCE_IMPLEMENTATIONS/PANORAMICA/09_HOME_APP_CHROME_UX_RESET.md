# Life Panoramica — Home + App Chrome UX Reset

Version: 1.1  
Status: **Superseded for Home structure** — see [`10_HOME_COMMUNITY_OS_FRONT_DOOR.md`](./10_HOME_COMMUNITY_OS_FRONT_DOOR.md)  
Date: 2026-08-08  
Document Type: UX Audit + Implementation Plan  
Priority: High  

**Note:** This v1.0 brief conflicted with the approved Community OS front-door direction (large belonging hero; no “My Spaces” on Home; weather in hero not header). Use **doc 10** as the normative Home redesign plan. Chrome IA notes below remain useful background.

Related product vision: Home answers *“What is happening today in my community?”* — not a landing page, social feed, marketplace shell, or tourism showcase.

Architecture remains unchanged (Territory, CommunityArea, Residency, Official Entities, Channels, Groups, Experiences, Resources, Local entities). No parallel screens. Improve the existing experience.

---

# 1. UX audit — current Home / Header / Footer

## 1.1 Chrome architecture (as shipped)

```
RootLayout (lang="es")
  └─ TenantProvider (lifePanoramicaTheme + demo member)
       └─ (member)/layout → MemberShell
            └─ AppShell
                 ├─ CommunityAppHeader (mobile)
                 ├─ DesktopNavigation (md+)
                 ├─ <main> → HomeScreen / other screens
                 └─ BottomNavigation (mobile)
            ├─ CreateSheet
            └─ CreatePostSheet
```

There is **no traditional site footer**. Primary chrome = header + bottom nav (+ desktop rail).

## 1.2 Key files

| Layer | Path | Responsibility |
|-------|------|----------------|
| Home page | `apps/web/src/app/(member)/page.tsx` | Renders `HomeScreen` |
| Home composition | `apps/web/src/screens/HomeScreen.tsx` | Section order, search, greeting, hero band, pulse, experiences, near-you |
| Chrome orchestrator | `apps/web/src/components/MemberShell.tsx` | Nav items, header props, create sheets |
| Header primitives | `packages/ui/src/layout/CommunityAppChrome.tsx` | `CommunityAppHeader`, unused `AppMenuSheet` / feed cards |
| Shell / nav | `packages/ui/src/navigation/AppShell.tsx`, `Navigation.tsx` | Layout + bottom/desktop nav |
| Home blocks | `packages/ui/src/territory/TerritoryHome.tsx` | `TerritoryHero`, search, pulse, sections, cards |
| Near-you cards | `packages/ui/src/community/CommunityLife.tsx` | `LocalPlaceCard`, `LocalLifeRail` |
| Tenant | `apps/web/src/providers/TenantProvider.tsx` | Theme, features, demo person |
| Theme / data | `tenants/life-panoramica/src/theme.ts`, `community-pulse.ts`, `home-search.ts`, `local-places.ts` | Brand + catalogs |

## 1.3 Current Home hierarchy (top → bottom)

1. **GlobalAppSearch** — search-first; chips Pádel / Paseos / Mercado / Crear  
2. **Greeting** — `Hola, {name}` + area + “Mi agenda” → `/calendar`  
3. **TerritoryHero `variant="band"`** — thin ~72–80px photo strip; caption hardcoded `"Panorámica Golf"`  
4. **QuickActionBar** — Reservar / Eventos / Mercado / Crear (feature-gated)  
5. **CommunityPulseMoment** — “Hoy en {territory}” + stacked activity cards + optional sponsor  
6. **“Qué puedes hacer hoy”** — horizontal experience rail → `/discover`  
7. **“Cerca de ti”** — local places rail → `/discover`  

**Missing vs new vision:** Today as heart of Home; category doors; My Spaces (channels/groups); hamburger menu; personalised ranking without filter-only interests; Official / Community / Services separation inside Today.

## 1.4 Current header

| Slot | Current |
|------|---------|
| Brand | `theme.logoText` → Life Panoramica |
| Place chip | demo area / `defaultAreaName` (e.g. Aldea Golf) |
| Weather | Hardcoded `24° ☀` |
| Notifications | Stub count 3 → toast |
| Profile | Avatar → `/me` or lightbox |
| Menu | **No hamburger** (`AppMenuSheet` exists but unwired) |

Feels closer to a **thin app bar** than “entering your community.” Brand + area duplicate Home greeting/hero.

## 1.5 Current bottom navigation

| Order | Label | Route | Notes |
|-------|-------|-------|-------|
| 1 | Inicio | `/` | |
| 2 | Comunidad | `/community` | |
| 3 | Crear (+) | `#create` | Center elevated tab |
| 4 | Descubrir | `/discover` | Also covers resources/experiences |
| 5 | Mercado | `/marketplace` | Marketplace-weighted chrome |
| 6 | Perfil | `/me` | Calendar/reservations only via Me-adjacent |

**Problem vs product vision:** Mercado as peer tab pushes marketplace IA; Calendar sidelined; Create-as-tab is OK but destination set should match “community life” not commerce.

## 1.6 Branding & i18n

- Tenant theming works (CSS vars, `TenantProvider`).  
- Hero caption **hardcoded** (should use `theme.identity`).  
- **No i18n library** — Spanish strings hardcoded in screens/UI/tenant.  
- Spec requires UI strings via i18n going forward; English remains for code.

## 1.7 Audit verdict

| Dimension | Finding |
|-----------|---------|
| Product feel | Showcase / generic community app; search-first + photo band |
| Usefulness | Pulse + experiences + near-you exist but lack Today hierarchy and doors |
| Personalisation | Demo member name/area only; interests not used as ranking |
| Chrome IA | Mercado-weighted; no hamburger; weather stub |
| Reuse | Strong primitives + tenant data; recompose Home + nav + header |
| Architecture | Intact — redesign is composition + IA, not domain rewrite |

---

# 2. Target experience (approved product brief)

## 2.1 Product north star

Life Panoramica is **the digital place where a community lives**.

Not: social network, photo feed, tourism app, marketplace, management dashboard.

First question on open: **“What is happening today in my community?”**

## 2.2 Anti-patterns (do not ship)

- Huge hero photography as first viewport  
- Social-media neighbour post feeds  
- Decorative cards / empty statistics / generic counters  
- Interest-only filter that hides community/official/services  
- “Recommended by neighbours” / “community moments” framing for Near you  

## 2.3 New Home structure

| # | Section | Intent |
|---|---------|--------|
| 1 | **App header** | Hamburger · Life Panoramica · notifications · profile · territory/area context (+ optional weather from tenant/config, not fake marketing) |
| 2 | **Personal community intro** | Compact: greeting + area + “Today in your community” — **no large image** |
| 3 | **Today** | Heart: Official / Community / Services items ranked by territory, residency, permissions, interests-as-signal |
| 4 | **Category doors** | High-level: Community · Activities · Reservations · Services · Mobility · Official — subcategories inside destinations |
| 5 | **My Spaces** | My channels · my groups · my communities (WhatsApp replacement surface) |
| 6 | **Near you** | Local entities / services / places / businesses — keep label “Near you” / “Cerca de ti” |

## 2.4 Bottom nav (target)

```
Home · Community · + · Discover · Profile
```

- **Mercado** demoted from primary tab → Discover / Services door / Create listing  
- **+** opens creation sheet (experience, group, proposal, listing, …) — reuse `CreateSheet`  
- Avoid marketplace-app silhouette  

## 2.5 Personalisation rule

Interests = **ranking signal**, not exclusive filter. Padel fan still sees official notices, restaurants, events, services.

Ordering inputs (conceptual): territory · CommunityArea (residency-derived) · RBAC/capabilities · time (“today”) · interests · verification gates (private channels already domain-ruled).

---

# 3. Proposed component changes

## 3.1 Header — `CommunityAppHeader` (+ wire `AppMenuSheet`)

| Change | Detail |
|--------|--------|
| Add hamburger | Opens `AppMenuSheet` (reuse unused primitive) with secondary destinations: Calendar, Reservations, Marketplace, Settings stubs, Report |
| Keep brand | `theme.logoText` |
| Territory context | Area name + optional weather **from props/tenant config** (remove hardcoded stub or mark clearly as demo config) |
| Notifications / profile | Keep; notifications remain stub until backend |
| Desktop | Align rail brand + menu equivalents |

## 3.2 Home — recompose `HomeScreen`

| Remove / demote | Add / elevate |
|-----------------|--------------|
| Full/large hero photography | Compact **PersonalCommunityIntro** (new or slim greeting block) |
| Search as first viewport | Search as optional secondary (header action or below intro) — not the emotional first beat |
| Thin photo band as “brand” | Drop band from first viewport (asset can remain for other surfaces) |
| Flat pulse stack as only “today” | **TodaySection** with Official / Community / Services groupings |
| Quick actions as Mercado-weighted | Align with doors or fold into Categories |
| — | **CategoryDoors** grid/rail (6 high-level doors) |
| — | **MySpacesSection** (channels/groups — demo catalogs until Wave C UI) |
| Keep Near you | Retitle/clarify; reuse `LocalLifeRail` / `LocalPlaceCard` |

### New / adapted UI primitives (packages/ui)

| Component | Role |
|-----------|------|
| `PersonalCommunityIntro` | Greeting + area + today line (tenant strings) |
| `TodaySection` + `TodayGroup` | Ranked buckets: official / community / services |
| `CategoryDoors` | High-level entry tiles → existing routes |
| `MySpacesSection` | Channels / groups / communities shortcuts |
| `CommunityAppHeader` | + menu button; context row polish |
| `AppMenuSheet` | Wire from header |
| `BottomNavigation` | 5 items: home, community, create, discover, me (drop Mercado tab) |

Reuse: `CommunityActivityCard`, `ExperiencePreviewCard`, `LocalPlaceCard`, `CreateSheet`, `HomeSection`, tenant `buildCommunityPulse` / official entity catalogs / channel demo lists as **data sources** for Today + My Spaces.

## 3.3 Data / ranking (tenant layer — no architecture change)

| Source | Use |
|--------|------|
| Official entities + announcements (demo/pulse) | Today → Official |
| Experiences / groups / channels (demo) | Today → Community; My Spaces |
| Local places / services | Today → Services; Near you |
| Residency / demo person area | Intro context + ranking boost |
| Capabilities | Gate official / create / private |

Implement a pure function e.g. `buildHomeToday(personCtx)` in tenant pack — ranking, not new domain aggregates.

## 3.4 i18n

- Introduce minimal message catalogue for Home + chrome (e.g. `messages/es.json` or tenant `copy.ts` keyed map) before scattering new Spanish literals.  
- Do not hardcode “Life Panoramica” outside `theme.logoText`.  
- Full `next-intl` can be phased; **keyed copy** is the minimum for this reset.

---

# 4. File impact list

### Must-touch

1. `apps/web/src/screens/HomeScreen.tsx` — full recomposition  
2. `apps/web/src/components/MemberShell.tsx` — nav IA, header menu props  
3. `packages/ui/src/layout/CommunityAppChrome.tsx` — header + menu wire  
4. `packages/ui/src/navigation/Navigation.tsx` — tab set (drop Mercado)  
5. `packages/ui/src/territory/TerritoryHome.tsx` — intro / today / doors / my-spaces primitives (or split new files under `packages/ui/src/home/`)  
6. `packages/ui/src/index.ts` — exports  

### Likely

7. `packages/ui/src/navigation/AppShell.tsx` — spacing if header grows  
8. `tenants/life-panoramica/src/theme.ts` — identity strings for intro/today (no hardcoded brand in UI)  
9. `tenants/life-panoramica/src/community-pulse.ts` / new `home-today.ts` — Today ranking builder  
10. `tenants/life-panoramica/src/channels.ts` / groups catalogs — My Spaces inputs  
11. `apps/web/src/providers/TenantProvider.tsx` — expose copy/ranking helpers if needed  
12. Minimal i18n keys module (new) under `apps/web` or `packages/ui`  

### Optional / later

13. Discover screen entry anchors for category doors  
14. Docs sync: `docs/020_REFERENCE_IMPLEMENTATIONS/PANORAMICA/01_UX_PRODUCT_FOUNDATION.md`, `08_HIFI_SCREEN_DESIGNS.md` (older hi-fi still assumes large photo hero — **supersede for Home**)  
15. `home-feed.ts` / social feed primitives — keep unused or retire from Home path  

### Explicitly out of scope

- Domain migrations / Wave C–F DDL  
- New parallel routes for “Home v2”  
- Removing Marketplace capability (only demote from primary nav)  
- Real notifications backend  

---

# 5. Implementation plan (phased)

## Phase H1 — Chrome IA (low risk)

1. Bottom nav → Home / Community / + / Discover / Profile  
2. Wire hamburger → `AppMenuSheet` (Calendar, Reservations, Marketplace, …)  
3. Header context: brand + area from tenant/demo; remove or config-drive weather  
4. i18n keys for nav + header  

**Exit:** Chrome matches community-life IA; Mercado still reachable.

## Phase H2 — Home skeleton (no large hero)

1. Replace first viewport with `PersonalCommunityIntro`  
2. Demote search (below intro or header)  
3. Remove TerritoryHero band from Home first viewport  
4. Keep temporary pulse/experiences/near-you below until Today lands  

**Exit:** Home no longer feels like a landing/showcase.

## Phase H3 — Today + ranking

1. `buildHomeToday` from existing catalogs (official / community / services)  
2. `TodaySection` UI with residency/capability-aware ordering  
3. Interests as boost weights only  

**Exit:** Heart of Home answers “what’s happening today.”

## Phase H4 — Doors + My Spaces + Near you

1. `CategoryDoors` → existing routes (`/community`, `/discover`, `/resources`, …)  
2. `MySpacesSection` from channel/group demo catalogs  
3. Polish Near you (label + content; no neighbour-recommendation framing)  

**Exit:** Full target hierarchy shipped on existing architecture.

## Phase H5 — Hardening

1. Tenant-prop audit (no hardcoded territory names)  
2. Visual pass (motion 2–3 intentional cues; avoid decorative card spam)  
3. Docs update superseding photo-hero Home hi-fi  
4. Accessibility: header menu, doors, nav  

---

# 6. Risks & open decisions (for approval)

| Topic | Recommendation | Needs product confirm? |
|-------|----------------|----------------------|
| Search placement | Below intro or header icon | Yes if search must stay first |
| Weather | Hide until real data / tenant config | Yes |
| Category door count | Six as briefed; Mobility may deep-link Discover filter | Soft |
| My Spaces empty states | CTA to Discover / Community when none | Soft |
| Older hi-fi photo hero docs | Supersede for Home | Doc only |
| Mercado tab removal | Menu + Discover/Services | Confirmed by brief |

---

# 7. Deliverable checklist

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | UX audit of current Home/Header/Footer | §1 |
| 2 | Proposed component changes | §3 |
| 3 | File impact list | §4 |
| 4 | Implementation plan | §5 |

---

# STOP

**No code changes in this phase.**

Await explicit approval to implement (recommend starting **Phase H1 + H2**).
