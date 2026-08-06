# Multi-Tenant UI Component System

Version: 1.0  
Status: Draft  
Document Type: Platform UI Architecture  
Reference tenant experience: **Life Panoramica** (first theme pack — not a special-case codebase)  
Depends on:

- `01_UX_PRODUCT_FOUNDATION.md`
- `02_VISUAL_DESIGN_SYSTEM.md`
- `03_HIFI_PRODUCT_SCREENS.md`
- ADRs 012–034 (permissions, microapps, Core services, Community domain)

No code · No migrations · No new ADRs in this step

---

## 1. Purpose

Define the **reusable UI foundation** for the Life Community OS platform so that:

- components and patterns are built **once**
- every future tenant reuses the same system
- **Life Panoramica** is the first **branded experience**, not a fork

### What this document is

A contract between Product, Design, and Engineering for:

- platform vs tenant design ownership  
- token layers  
- shared component library naming  
- UX patterns  
- responsive, accessibility, and media behaviour  
- white-label strategy  

### What this document is not

- A Panoramica-only UI kit  
- A permission or tenancy redesign  
- Implementation code  

### Brand rule (consumer surfaces)

Users see the **tenant product name** only (e.g. Life Panoramica).  

Never expose in consumer UI:

- Life Community OS  
- Platform Core  
- engineering/ADR/microapp internal names  

Platform naming stays in engineering docs, admin ops, and this repository.

### Emotional product bar

Translate complex platform capability into human experience:

> This is my place. This is my community. This is where life happens.

Premium, mobile-first, photography-led — not a neighbourhood forum, municipal portal, generic SaaS dashboard, CRUD tool, or WhatsApp clone.

---

## 2. Platform vs Tenant Design Architecture

### Separation of concerns

| Layer | Owns | Examples |
|-------|------|----------|
| **Platform Design System** | Components, interaction patterns, accessibility, responsive behaviour, UX rules, structural tokens | `ExperienceCard`, bottom nav, sheets, focus rings, spacing scale |
| **Tenant Brand Experience** | Name, logo, imagery, colour personality, enabled features, content | “Life Panoramica”, pine green pack, Mediterranean photos, Community+Services on |

```
┌─────────────────────────────────────────────┐
│ Tenant Brand Experience                     │
│ name · logo · colors · imagery · features   │
└──────────────────▲──────────────────────────┘
                   │ theme + config injection
┌──────────────────┴──────────────────────────┐
│ Platform Design System                      │
│ components · patterns · a11y · layout rules │
└──────────────────▲──────────────────────────┘
                   │ consumes
┌──────────────────┴──────────────────────────┐
│ Platform Core + Microapps (architecture)    │
│ RBAC · Tenant Context · Files · Community…  │
└─────────────────────────────────────────────┘
```

### Hard rules

1. **No tenant-specific component names** (`PanoramicaEventCard` ❌ → `ExperienceCard` ✅).  
2. **No duplicate design systems** per tenant.  
3. **Features appear/disappear via configuration** (ADR-023), not by shipping a second app.  
4. **RBAC remains the permission source** (ADR-012 / ADR-034) — UI hides/disables; UI does not invent AuthZ.  
5. **Tenant remains the security boundary** (ADR-002 / ADR-003) — UI never implies cross-tenant browsing.  
6. Agents and humans must **read ADRs** before inventing parallel UI architectures.

### Same component, different tenants

| Component | Life Panoramica | Life Resort | Life Municipality |
|-----------|-----------------|-------------|-------------------|
| `ExperienceCard` | Mediterranean hike | Wine tasting | Cultural festival |
| `ServiceCard` | Local locksmith | Concierge spa | Civic office |
| `AnnouncementCard` | Water maintenance | Resort hours | Town hall notice |

Structure identical; **content + theme** change.

---

## 3. Token Architecture

Three layers. Components bind to **semantic** tokens. Tenants override **brand** tokens. Platform owns **global** tokens.

### Layer 1 — Global platform tokens

Stable across all tenants:

| Category | Examples |
|----------|----------|
| Typography scale | display, title1–3, body, caption, label, button |
| Font roles | `--font-sans`, `--font-display` (families may be themed, roles fixed) |
| Spacing | 4-based scale `space.1`…`space.16` |
| Radius | sm, md, lg, xl, full |
| Elevation | elev.0–2, photo |
| Motion | fast, base, slow + reduced-motion |
| Layout | mobile padding, bottom-nav clearance, content max-width |
| A11y | min touch 44×44, focus ring width, AA contrast targets |

### Layer 2 — Semantic product tokens

Meaning-stable; values may be mapped from brand:

| Token | Meaning |
|-------|---------|
| `color.surface.app` | App background |
| `color.surface.elevated` | Cards, sheets, nav |
| `color.surface.muted` | Recessed areas |
| `color.text.primary` / `secondary` / `tertiary` / `inverse` | Text hierarchy |
| `color.action.primary` | Primary CTA fill |
| `color.action.secondary` | Secondary CTA |
| `color.action.destructive` | Destructive |
| `color.border.subtle` / `strong` | Borders |
| `color.feedback.success` / `warning` / `danger` / `info` | Status |
| `color.accent.community` | Neighbour / social whisper |
| `color.accent.official` | Official voice marker |
| `color.hero.scrim` | Photo scrim |

Components reference **only** Layer 2 (+ Layer 1 structure), never raw tenant hex in component code.

### Layer 3 — Tenant theme tokens

Injected per tenant (white-label):

| Token | Examples |
|-------|----------|
| `tenant.name` | Life Panoramica |
| `tenant.logo` | File reference / asset |
| `tenant.color.brand` | Pine `#1F4A3C` (Panoramica pack) |
| `tenant.color.brandSubtle` | … |
| `tenant.color.accent` | Sunlit `#C47A3A` |
| `tenant.color.sea` | Optional cool accent |
| `tenant.imagery.hero` | Default splash/home pack |
| `tenant.personality` | Optional motion/photo intensity hints |

**Mapping rule:** at runtime, `color.action.primary` ← `tenant.color.brand` (unless semantic override).  

Panoramica values: see `02_VISUAL_DESIGN_SYSTEM.md`. Other tenants supply a different Layer 3 pack without forking components.

### Feature visibility tokens (configuration, not CSS)

Not colours — product config:

- enabled microapps/capabilities (ADR-023 / ADR-024)  
- which Create Sheet actions appear  
- which Discover segments exist  

UI reads configuration + RBAC together.

---

## 4. Component Library

### Naming conventions

| Rule | Example |
|------|---------|
| Domain-agnostic platform names | `ExperienceCard`, `CommunityFeed` |
| No tenant words | ❌ `GolfNeighbourFeed` |
| No engineering leakage in UI copy | Labels come from i18n/content, not ADR titles |
| Composition over one-off screens | Screens assemble library components |

### 4.1 Navigation components

| Component | Purpose | Use when | Do not use when |
|-----------|---------|----------|-----------------|
| `MobileBottomNav` | Primary 5-dest resident nav | Phone/tablet portrait member shell | Desktop primary nav; Manage-only tools |
| `DesktopNav` | Rail or top nav same 5 destinations | ≥ desktop breakpoint | Replacing bottom nav on small phones |
| `AppHeader` | Title, search entry, subtle brand | Secondary screens, Discover | Competing with full-bleed Home hero |
| `CreateSheet` | Global create/action hub | Frequent create paths | Dumping full forms inside the sheet |
| `SearchField` | Large discover/search entry | Discover, directory, global search | Tiny header icons as only search |
| `FilterChipGroup` | Area/date/category filters | Lists and discovery | Replacing navigation IA |

**Behaviour (all nav):** loading = skeleton icons; error = nav still works for cached routes; permission denied = hide Manage/Create actions, never show platform errors; a11y = labels always visible on mobile, 44px targets, selected state not colour-only.

### 4.2 Content components

| Component | Purpose | Use when | Do not use when |
|-----------|---------|----------|-----------------|
| `AnnouncementCard` | Official/calm communications | Official or editorial news | Neighbour tips; KPI widgets |
| `CommunityPostCard` | General community post | Feed items needing discussion entry | Formal votes as the only UI |
| `ExperienceCard` | Photo-led activity/experience | Discover/Home experiences | Admin inventory tables |
| `EventCard` | Time-bound happening | Events/meetings lists | Double-booking resource admin |
| `GroupCard` | Circle/group discovery | Groups directory | Tenant switcher |
| `RecommendationCard` | Neighbour tip / endorsement | Social discovery rail | Implying Directory “verified” |
| `ServiceCard` | Business/Official directory row/card | Services discovery | Person profile |
| `ResourceCard` | Shared amenity / place | Places/reservations | Marketplace checkout (separate) |

**Card rules:** one primary CTA; photography first; meta secondary; no nested card spam in heroes.

**States:** loading skeleton matching aspect ratio; empty = parent pattern; error = inline retry on rail; permission = hide CTA, show view-only if allowed.

### 4.3 People components

| Component | Purpose |
|-----------|---------|
| `Avatar` | Person/community presence image |
| `MemberCard` | Compact member in lists/groups |
| `ProfileHeader` | Community Profile header (contextual, ADR-033) |
| `OrganizerCard` | Experience/event organizer |
| `MembershipBadge` | Human “Member” cue — **not** an AuthZ badge |

**Do not:** use MembershipBadge as permission UI; use RBAC-driven action visibility instead.

### 4.4 Action components

| Component | Purpose |
|-----------|---------|
| `ButtonPrimary` / `ButtonSecondary` / `ButtonGhost` / `ButtonDestructive` | Standard actions |
| `QuickAction` | Home Reserve / Report / Join style |
| `FloatingCreateControl` | Opens `CreateSheet` |
| `ConfirmDialog` | Destructive/significant confirms |
| `EmptyAction` | CTA inside empty states |

**Permission denied:** disable or hide per UX rule (prefer hide for Create actions user cannot use; explain on explicit denied navigation).

### 4.5 Media components (ADR-020)

| Component | Purpose |
|-----------|---------|
| `CameraCapture` | Contextual photo capture |
| `ImagePicker` | Gallery multi-select |
| `VideoCapture` | Short video with duration policy UX |
| `MediaPreview` | Retake / Use |
| `MediaGallery` | Filmstrip / grid |
| `ResponsiveImage` | Serves thumb → preview → web → detail |
| `MediaUploadProgress` | Human “Optimizing…” not pipeline jargon |

**Never** expose CDN/Physical File/variant engineering terms in UI copy.

### 4.6 Universal component behaviour matrix

Every component in the library must specify (in Storybook/docs later):

| Concern | Requirement |
|---------|-------------|
| Purpose | One sentence |
| When to use / not | Explicit |
| Responsive | mobile / tablet / desktop notes |
| Accessibility | roles, labels, contrast, hit target |
| Loading | skeleton or progressive |
| Empty | parent or self |
| Error | recoverable |
| Permission denied | hide / disable / explain |

---

## 5. UX Patterns

Patterns compose components. They are **platform-reusable**.

### 5.1 Feed (`CommunityFeed`)

**Purpose:** Community activity stream (official + neighbour-safe activity).  

**Uses:** `AnnouncementCard`, `CommunityPostCard`, `RecommendationCard`, filters.  

**Not:** Cross-tenant social graph; admin audit log; module-named sections.  

**States:** skeletons; empty “Community is quiet”; error retry; respect Area filter.

### 5.2 Discovery (`DiscoveryBrowse`)

**Purpose:** Visual exploration of experiences, services, places.  

**Uses:** segments + `SearchField` + `FilterChipGroup` + cards.  

**Aligns:** ADR-017 directory, ADR-027 experiences, ADR-031 resources, ADR-032 recommendations.

### 5.3 Experience creation (`ExperienceCreateFlow`)

**Purpose:** Organizer creates experience/event/group content.  

**Uses:** `CreateSheet` → form with `CameraCapture` / gallery → publish path (ADR-026).  

**RBAC:** only if organize/publish permissions; else action absent from CreateSheet.

### 5.4 Reservation flow (`ReservationFlow`)

**Purpose:** Select resource → slot → confirm.  

**Uses:** `ResourceCard` → slot sheet → `ConfirmDialog` / success.  

**Calendar:** projection updates via ADR-030; reminders via notifications service (unnamed in UI).

### 5.5 Reporting flow (`ReportIncidentFlow`)

**Purpose:** Report problem with media + context.  

**Uses:** Create → Report → `CameraCapture` / picker → description → Area chip → submit.  

**Aligns:** ADR-018, ADR-020. Dignified status UI — not alarming admin tickets.

### 5.6 Social interaction (`SocialInteractionBar` + thread)

**Purpose:** Comments, replies, reactions, mentions, saves (ADR-028).  

**Uses:** on detail sheets; moderation via Manage when permitted.  

**Not:** general social network DMs product.

### 5.7 Shell pattern (`TenantAppShell`)

**Purpose:** Host nav + outlet + Create + theme.  

**Injects:** tenant tokens, feature flags, RBAC-gated actions.  

**Brand:** `tenant.name` in chrome — never platform name.

---

## 6. Responsive Rules

| Breakpoint (guidance) | Behaviour |
|-----------------------|-----------|
| Mobile (&lt;768) | Bottom nav; sheets; single column; agenda-first calendar |
| Tablet (768–1024) | Bottom or side nav; 2-col discovery |
| Desktop (≥1024) | `DesktopNav`; multi-col grids; split calendar optional |

### Rules

- Mobile is the design source of truth; desktop is adaptation.  
- Touch targets ≥ 44px on all breakpoints for primary actions.  
- Prefer bottom sheets on mobile; center dialogs sparingly on desktop.  
- Home hero remains photographic on desktop — not a widget dashboard.  
- Manage mode may use denser lists but same tokens/components.

---

## 7. Accessibility Rules

| Rule | Detail |
|------|--------|
| Contrast | AA minimum for text on surfaces |
| Type | Support dynamic type / large text; critical actions ≥ comfortable sizes from Panoramica scale |
| Targets | ≥ 44×44 |
| Focus | Visible focus rings (platform token) |
| Colour | Official vs neighbour also labeled, not colour-only |
| Motion | Honor `prefers-reduced-motion` |
| Language | Plain resident language; no engineering terms |
| Screen readers | Icon-only controls have names; cards have accessible names + CTA |

Components must remain usable for elderly and non-technical residents.

---

## 8. Media Patterns

Aligned with ADR-020 Files & Media — UI consumes platform media; tenants don’t own pipelines.

| Pattern | Behaviour |
|---------|-----------|
| Contextual capture | Incident vs experience entry points differ; pipeline shared |
| Preview before commit | Retake / Use always |
| Progressive display | Lists use thumb/preview; lightbox uses detail |
| Upload feedback | Soft progress; failure keeps form draft |
| Galleries | Lazy load; never force originals into feeds |
| Permissions | OS camera permission copy is human; deny is recoverable |

White-label: compression/limits may follow plan entitlements (ADR-024) — UX messaging stays human (“Video is a bit long”).

---

## 9. White-label Strategy

### What changes per tenant

| Change | Mechanism |
|--------|-----------|
| Name / logo | Theme + assets |
| Colours / accent | Layer 3 tokens |
| Photography | Asset pack / CMS |
| Enabled features | Configuration + entitlements |
| Default Area labels | Tenant content |
| Tone of voice copy | i18n catalogues |

### What never forks per tenant

| Stable | Why |
|--------|-----|
| Component source | One library |
| Nav IA (5 destinations) | Shared product model (configurable labels/order later if needed via config, not forks) |
| RBAC evaluation | Platform AuthZ |
| Tenant isolation UX assumptions | Security boundary |
| Media pipeline UX contract | ADR-020 |

### Rollout model

1. Build components against semantic tokens.  
2. Ship **Life Panoramica** theme pack.  
3. Add **Life Ulldecona / Resort / Club / Municipality** packs.  
4. QA checklist: rebrand without code changes to components.

---

## 10. Reuse Guidelines

### For designers

- Specify screens with **platform component names**.  
- Attach **tenant theme** references separately.  
- Prefer patterns from §5 over new one-off widgets.

### For engineers / agents

- Before adding a component: search library for existing.  
- Never prefix with tenant name.  
- Gate actions with RBAC + feature flags.  
- Read ADRs; do not invent parallel permission or file systems.  
- Keep consumer strings free of platform branding.

### For product

- New capability → extend microapp + pattern, not a new app shell.  
- Pilot scope for Panoramica is configuration of the platform experience.

### SaaS reusability checklist (gate)

Before merging UI foundations, verify:

- [ ] Works for another tenant with only theme + content + config changes?  
- [ ] Branding swappable without rewriting components?  
- [ ] Features enable/disable through configuration?  
- [ ] RBAC remains permission source?  
- [ ] Tenant remains security boundary in UX assumptions?  
- [ ] No duplicate AuthZ / Files / Notifications UI stacks?  
- [ ] No consumer exposure of “Life Community OS”?  

---

## 11. Future Tenant Examples

| Tenant | Theme personality | Same components |
|--------|-------------------|-----------------|
| **Life Panoramica** | Mediterranean pine, linen, golf/nature photography | All §4–5 |
| **Life Ulldecona** | Town/civic warmth, local streets photography | Same |
| **Life Resort** | Luxury calm, deeper neutrals, hospitality imagery | Same |
| **Life Club** | Member-club energy, stronger accent, social photography | Same |
| **Life Municipality** | Civic clarity, higher info density still using cards not CRUD | Same |

Example: `ExperienceCard` + `ReservationFlow` + `ReportIncidentFlow` ship once; each tenant fills experiences/resources/incidents content under its theme.

---

## 12. Alignment (silent architecture)

| Concern | Authority |
|---------|-----------|
| Permissions | ADR-012, ADR-034 |
| Microapps / enablement | ADR-014, ADR-023, ADR-024 |
| Core services | ADR-015, 019–022 |
| Profiles / directory | ADR-016, 017, 033 |
| Community domain | ADR-025–032 |
| Media | ADR-020 |
| Panoramica UX | `01`–`03` in this folder |

UI system **consumes** these decisions; it does not redefine them.

---

## 13. Next steps

1. Map §4 components → `packages/ui` inventory (implementation later).  
2. Implement token provider (Layer 1–3) with Panoramica pack.  
3. Build `TenantAppShell` + CreateSheet + key cards.  
4. Storybook: theme switch demo (Panoramica ↔ placeholder Resort).  
5. Accessibility audit on shell + Home/Discover.  

---

## Decision summary

The Multi-Tenant UI Component System separates **Platform Design System** (reusable components, patterns, a11y, tokens) from **Tenant Brand Experience** (name, logo, colours, imagery, features). Life Panoramica is the first theme pack on a shared library — build once, rebrand many times — with RBAC, Tenant isolation, and Core services preserved, and with **Life Panoramica** as the only name residents see.
