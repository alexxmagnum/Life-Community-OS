# Life Panoramica — Home Experience Redesign (Community OS Front Door)

Version: 1.1  
Status: **P1 + P2 implemented — STOP before P3**  
Date: 2026-08-08  
Document Type: UX Audit + Information Architecture + Implementation Plan  
Priority: Critical  

**Implemented:** P1 global header · P2 belonging hero.  
**Not started:** P3 Today · P4 doors/channels · nav rewrite.

**Supersedes Home structure in** [`09_HOME_APP_CHROME_UX_RESET.md`](./09_HOME_APP_CHROME_UX_RESET.md) where that doc conflicted (e.g. “no large hero”, “My Spaces on Home”). Prefer **this** brief for Home.

Architecture unchanged. Improve existing app. No parallel Home system, fake domain models, or duplicate aggregates.

---

# 1. UX audit (current)

## 1.1 Chrome stack

```
TenantProvider → MemberShell → AppShell
  ├─ CommunityAppHeader (mobile) — brand, area chip, weather stub, bell, avatar
  ├─ DesktopNavigation
  ├─ main → HomeScreen
  └─ BottomNavigation — Inicio · Comunidad · + · Descubrir · Mercado · Perfil
```

No site footer. Create via center tab → `CreateSheet`.

## 1.2 Current Home order (`HomeScreen`)

1. `GlobalAppSearch` (first viewport)  
2. Text greeting + “Mi agenda”  
3. `TerritoryHero` **band** (~thin strip) + hardcoded caption  
4. `QuickActionBar` (Reservar / Eventos / Mercado / Crear)  
5. `CommunityPulseMoment` (mixed sources, editorial rank)  
6. Experiences rail (“Qué puedes hacer hoy”)  
7. Near you (`LocalLifeRail`)

## 1.3 Existing building blocks (reuse)

| Asset | Location | Notes |
|-------|----------|-------|
| `CommunityAppHeader`, `AppMenuSheet` | `packages/ui/.../CommunityAppChrome.tsx` | Menu **unwired** |
| `TerritoryHero` | `packages/ui/.../TerritoryHome.tsx` | Needs **stage/full** belonging hero, not band-only |
| Pulse / cards / sections | same + `CommunityLife.tsx` | Recompose into Today / Channels / Experiences |
| Nav / CreateSheet | `MemberShell`, `Navigation.tsx` | Drop Mercado tab |
| Tenant catalogs | pulse, experiences, channels, local-places, official-entities | Ranking inputs — not new entities |
| Theme identity | `theme.identity` | Greeting/area/weather props — stop hardcoding |

## 1.4 i18n / tenant

- Spanish hardcoded in screens/UI; no message catalogue yet.  
- Spec assumes i18n architecture: use **keyed copy** + tenant identity props; no hardcoded “Life Panoramica” / “Panorámica Golf” in UI components.

---

# 2. Current problems

| Problem | Why it hurts |
|---------|----------------|
| Search-first Home | Feels like a tool/landing, not “my place today” |
| Thin decorative hero band | Tourism strip, not belonging; caption hardcoded |
| Greeting + area + weather split across header/body | Context duplicated / misplaced |
| Mercado as primary tab | Marketplace silhouette vs community OS |
| Pulse as flat mixed stack | No Official / Community / Services storytelling |
| Quick actions Mercado-weighted | Utility buttons over community life |
| “Mi agenda” on Home | Pulls toward “my things” |
| No hamburger explorer | Full community map missing |
| No category doors | Deep structures exposed unevenly or not at all |
| No community Channels rail | WhatsApp replacement not visible on front door |
| Interests unused as ranking | Personalisation absent or filter-shaped elsewhere |
| Decorative density | Cards/actions before daily utility |

**Core IA mistake to avoid going forward:** making Home about **my** groups / reservations / channels / interests. Those belong in **Profile**. Home = **what is happening in my community**.

---

# 3. New information architecture

## 3.1 Product north star

> The digital place where a community lives.  
> Open → “I want to know what is happening today in my place.”

Not tourism, gallery, social network, marketplace, or admin dashboard.

## 3.2 Final Home structure (normative)

```
1. HEADER              (global chrome — outside hero)
2. HERO TERRITORY      (belonging — large image + contextual overlay)
3. TODAY IN PANORAMICA (heart — ranked community life now)
4. COMMUNITY CATEGORIES (high-level doors)
5. COMMUNITY CHANNELS  (life happens here — NOT “My channels”)
6. EXPERIENCES         (create life — Experience-only activity aggregate)
7. NEAR YOU            (local life, not generic directory)
8. CREATE              (via + / sheet — permission-gated, not dominant)
9. BOTTOM NAVIGATION
```

Resources/bookings are **not** a Home primary section; reachable via Categories → Reservations and Discover. Relationship Resource → Availability → Booking → Experience stays domain-correct (ADR-027/031).

## 3.3 Header (global)

```
☰   Life Panoramica              🔔   👤
```

| Include | Exclude |
|---------|---------|
| Hamburger (full explorer) | Weather |
| App identity (`theme.logoText`) | Territory/area chips |
| Notifications | Statistics / cards |
| Profile | Hero content |

## 3.4 Hero Territory

- **Keep large hero image** — “This is my place,” not tourism marketing.  
- Imagery: community life, gardens, neighbours, pools, streets, golf, local atmosphere (tenant asset).  
- **Overlay only:** greeting · area (residency/context) · weather (e.g. `☀️ 24º · Soleado`).  
- **No** counters, fake activity numbers, dashboards, CTAs inside hero.  
- Header remains **above** hero, not painted into the image.

## 3.5 Today in Panoramica (heart)

Buckets (examples): Official · Activities · Community · Services.  
Order by: territory · residency · permissions · interests-as-**rank**, not filter.  
Padel fan still sees notices, restaurants, other events.

## 3.6 Main categories (doors)

🏡 Community · 🎯 Activities · 📅 Reservations · 🛍 Services · 📍 Near you · 🏛 Official  

Subcategories live **inside** destinations (not hundreds of channels on Home).

## 3.7 Community Channels

Label concept: **Channels where community life happens** — never “My channels”.  
Examples: General info, Pádel, Golf, Buy/sell, Mobility, Pets, Families, Restaurants.  
Exploration surface; membership depth can live in Profile later.

## 3.8 Experiences

Only activity aggregate. Create life; may connect Channel → Participants → Resource → LocalEntity (existing domain). Home shows a curated rail, not a booking engine.

## 3.9 Near you

Local life by territory/relevance: restaurants, pharmacy, supermarket, services, places. Not “recommended by neighbours.”

## 3.10 Create (+)

Experience · Group · Proposal · Announcement · Offer service — capability-gated. Present, not dominant.

## 3.11 Bottom navigation

```
Home · Community · + · Discover · Profile
```

**Do not** add Reservations / Marketplace / Groups as primary tabs (internal areas via menu/doors/Discover).

## 3.12 Hamburger — human intention map

Not a DB entity dump:

| Top | Inside (examples) |
|-----|-------------------|
| Community | Areas, Neighbours, Help, Proposals |
| Activities | Pádel, Tennis, Golf, Events, Classes |
| Exchange | Buy/Sell, Services, Shared mobility |
| Local life | Near you, places, businesses |
| Official | Administration, Municipality, Public services |

---

# 4. Component impact

| Component | Action |
|-----------|--------|
| `CommunityAppHeader` | Slim to ☰ · brand · 🔔 · 👤; remove area/weather |
| `AppMenuSheet` | Wire + restructure to intention map (§3.12) |
| `TerritoryHero` | Full belonging hero + overlay props (greeting, area, weather); retire Home band usage |
| New `TodayInTerritorySection` (or evolve pulse) | Bucketed Today cards from ranked builder |
| New `CategoryDoors` | Six doors → existing routes/filters |
| New `CommunityChannelsRail` | Channel catalog exploration (not “mine”) |
| Experiences rail | Keep/refine `ExperiencePreviewCard` section |
| Near you | Keep `LocalLifeRail` / `LocalPlaceCard`; copy polish |
| `QuickActionBar` / search-first | Demote or remove from first viewport |
| `BottomNavigation` / `MemberShell` `buildNav` | 5 tabs; Mercado out |
| `CreateSheet` | Align actions/labels; keep permission gates |
| Tenant `buildHomeToday` (new) | Ranking over existing catalogs |
| Profile (later, not Home) | Own “my” groups / reservations / channels |

**Do not invent** parallel Home data models — compose OfficialEntity, Channel, Experience, Resource, LocalEntity demo/SQL-backed catalogs already present.

---

# 5. Files to modify

### Must

1. `apps/web/src/screens/HomeScreen.tsx`  
2. `apps/web/src/components/MemberShell.tsx`  
3. `packages/ui/src/layout/CommunityAppChrome.tsx`  
4. `packages/ui/src/navigation/Navigation.tsx`  
5. `packages/ui/src/territory/TerritoryHome.tsx` (hero + possibly new section exports)  
6. `packages/ui/src/index.ts`  

### Likely

7. `packages/ui/src/navigation/AppShell.tsx` — hero full-bleed spacing under fixed header  
8. `tenants/life-panoramica/src/theme.ts` — identity / weather demo config / hero asset  
9. `tenants/life-panoramica/src/home-today.ts` (**new**) — ranking builder  
10. `tenants/life-panoramica/src/channels.ts` / official-entities / experiences / local-places — inputs only  
11. Keyed copy module (i18n-ready) for Home + chrome + menu  
12. `apps/web/src/app/globals.css` — hero overlay tokens if needed  

### Explicitly not in this Home pass

- Wave C–F migrations / new domain tables  
- Profile “my things” redesign (follow-up)  
- Real notifications / weather APIs (tenant/demo config OK)  
- Marketplace removal as feature (tab demotion only)  

---

# 6. Implementation plan

## P1 — Chrome front door

1. Header: ☰ · brand · 🔔 · 👤  
2. Wire `AppMenuSheet` with intention IA  
3. Bottom nav: Home · Community · + · Discover · Profile  
4. Keyed copy for chrome  

**Exit:** Community OS chrome, not marketplace chrome.

## P2 — Belonging hero

1. Upgrade `TerritoryHero` to large belonging stage  
2. Overlay: greeting, area, weather from tenant/demo props  
3. Remove search/quick-actions/agenda from first viewport  
4. Fix hardcoded territory caption  

**Exit:** Open = “this is my place.”

## P3 — Today heart

1. `buildHomeToday` (territory, residency, capabilities, interest weights)  
2. Today UI with Official / Activities / Community / Services  
3. Replace flat pulse as primary story  

**Exit:** “What’s happening today” answered.

## P4 — Doors + Channels + Experiences + Near you

1. Category doors  
2. Community Channels rail (not “my”)  
3. Experiences rail polish  
4. Near you polish  

**Exit:** Full Home structure shipped.

## P5 — Harden

1. Empty states (no empty decorative modules)  
2. Permission-gated Create  
3. A11y + motion (2–3 intentional)  
4. Mark doc 09 superseded; sync Panoramica hi-fi notes that still assume wrong Home IA  

---

# 7. Design rules (implementation guardrails)

- Premium, simple, modern digital village  
- Avoid dashboards, card spam, button farms, empty modules, social-feed aesthetics  
- Experience ≠ Resource; bookings privacy rules unchanged  
- Interests rank, never exclusive-filter Home  
- No “My …” sections on Home  

---

# 8. Deliverable checklist

| # | Deliverable | Section |
|---|-------------|---------|
| 1 | UX audit | §1 |
| 2 | Current problems | §2 |
| 3 | New information architecture | §3 |
| 4 | Component impact | §4 |
| 5 | Files to modify | §5 |
| 6 | Implementation plan | §6 |

---

# STOP

Await approval to implement. Recommended first slice: **P1 + P2**.
