# Life Panoramica — Visual Design System

Version: 1.0  
Status: Draft  
Document Type: Visual Identity & Design System  
Tenant experience: **Life Panoramica**  
Depends on: `01_UX_PRODUCT_FOUNDATION.md`  
Platform layer (never consumer-facing): Life Community OS

---

## 0. Brand rule (non-negotiable)

The consumer application is named **only**:

# Life Panoramica

Never expose in resident-facing UI, splash, install name, or marketing chrome:

- Life Community OS  
- Platform Core  
- ADR names, microapp engineering names, internal package names  

Those belong to engineering and white-label configuration — not the lived product.

Future tenants (Life Ulldecona, Life Resort, Life Club) swap **brand tokens + photography**, not product architecture.

---

## 1. Design philosophy

### Emotional goal

> When I open this app, I feel that my community is alive.

Not: “I opened software.”  
Yes: “I’m home in Panoramica.”

### Philosophy pillars

| Pillar | Meaning |
|--------|---------|
| **Alive** | Motion, people, places, activity — not empty dashboards |
| **Clear** | One job per screen; large type; plain language |
| **Trusted** | Photography, faces, verified cues, calm hierarchy |
| **Premium** | Restraint, craft, whitespace, material honesty |
| **Inclusive** | Works for young, elderly, technical and non-technical residents |
| **Fast to act** | Frequent paths ≤ 3 taps |

### Quality references (principles, not copies)

- **Apple** — simplicity, clarity, premium calm  
- **Airbnb** — trust, photography, experience storytelling  
- **Strava** — activity pulse, motivation without clutter  
- **Instagram** — visual discovery rhythm  
- **Linear** — precision, polish, intentional motion  

### What we refuse

Generic SaaS blue dashboards · Bootstrap kits · municipal 2010 portals · CRUD tables as primary UX · enterprise admin as the default home · card spam · old forum aesthetics · purple-gradient AI defaults · dense data walls.

---

## 2. Brand direction — Life Panoramica

### Personality

Warm · grounded · Mediterranean · quietly premium · neighbourly · outdoors-alive.

Not corporate. Not loud. Not “startup neon.”

### Emotional tone

| Tone | Expression |
|------|------------|
| Belonging | Soft welcome, human greetings, local place names |
| Vitality | Activity and experiences feel inviting, not obligatory |
| Trust | Clear official vs neighbour voice; verification cues are subtle |
| Calm luxury | Golf/resort landscape without snobbery |

### Visual keywords

`sunlit stone` · `pine shadow` · `fairway green` · `sea-horizon` · `terracotta warmth (accent only)` · `linen white` · `golden hour` · `open air` · `human scale`

### Photography style

- Real Panoramica places and people (or faithful lifestyle photography)  
- Natural light; golden hour and soft morning preferred  
- Wide environmental frames for heroes; intimate crops for people/experiences  
- Avoid stock handshake / generic condo lobby looks  
- Prefer: paths, greens, terraces, community gatherings, local services in context  
- Full-bleed heroes on Home and key Discover moments  
- No heavy text overlays on faces; no sticker spam on photos  

### Icon style

- Simple, rounded geometric line icons (2px optical weight at 24px)  
- Slightly soft corners — friendly, not childish  
- Monochrome by default; accent only for active/selected  
- No skeuomorphism; no emoji as primary navigation  

### Illustration style

- Sparse. Prefer photography.  
- If needed: minimal line illustrations for empty states only (same stroke language as icons)  
- No cartoon mascots; no dense isometric “SaaS town” art  

### White-label readiness

Token layers:

1. **Semantic tokens** (surface, text, accent, success…) — stable across tenants  
2. **Brand tokens** (primary, secondary, hero treatment, logo lockup) — Panoramica-specific now  
3. **Photography pack** — tenant-specific  

Swapping brand tokens + assets yields Life Ulldecona / Resort / Club without redesigning components.

---

## 3. Color system

Avoid generic SaaS blue as primary. Panoramica primary is **Mediterranean pine / deep botanic green**, grounded by **warm stone** and lifted by **sunlit sand** and a **sea-mist** cool surface.

### 3.1 Brand core (light mode)

| Token | Hex | Role |
|-------|-----|------|
| `brand.primary` | `#1F4A3C` | Primary actions, key emphasis, active nav |
| `brand.primaryHover` | `#183A30` | Pressed/hover primary |
| `brand.primarySubtle` | `#E7F0EC` | Soft fills, selected chips |
| `brand.secondary` | `#5C6B63` | Secondary text icons, quiet emphasis |
| `brand.accent` | `#C47A3A` | Warm accent — sparse (highlights, “live” dots, key CTAs secondary) |
| `brand.accentSubtle` | `#F8EFE6` | Accent soft backgrounds |
| `brand.sea` | `#3D6B7A` | Cool secondary accent for discovery/water/trust cues |
| `brand.seaSubtle` | `#E8F1F4` | Cool soft fills |

### 3.2 Neutrals & surfaces (light)

| Token | Hex | Role |
|-------|-----|------|
| `bg.app` | `#F6F3EE` | App background (warm linen, not flat grey) |
| `bg.elevated` | `#FFFFFF` | Cards, sheets, nav |
| `bg.muted` | `#ECE7E0` | Recessed areas, skeleton |
| `bg.heroScrim` | `rgba(20, 28, 24, 0.35)` | Soft scrim over hero photos for legible type |
| `text.primary` | `#1A1F1C` | Primary text |
| `text.secondary` | `#5A635D` | Secondary text |
| `text.tertiary` | `#8A928C` | Meta, timestamps |
| `text.inverse` | `#FFFFFF` | On primary / on photo |
| `border.subtle` | `#E2DDD6` | Hairline borders |
| `border.strong` | `#C9C2B8` | Inputs, dividers |

### 3.3 Semantic

| Token | Hex | Use |
|-------|-----|-----|
| `sem.success` | `#2F6F4E` | Confirmed reservation, resolved |
| `sem.successSubtle` | `#E6F4EC` | Success banners |
| `sem.warning` | `#B8860B` | Attention, waitlist |
| `sem.warningSubtle` | `#FBF3DC` | Warning banners |
| `sem.danger` | `#B42318` | Destructive, urgent incident |
| `sem.dangerSubtle` | `#F8E8E6` | Danger banners |
| `sem.info` | `#3D6B7A` | Neutral info (aligned with sea) |
| `sem.infoSubtle` | `#E8F1F4` | Info banners |
| `sem.official` | `#1F4A3C` | Official announcement marker |
| `sem.neighbour` | `#C47A3A` | Neighbour / tip voice (accent) |

### 3.4 Future dark mode (direction only)

Not required for MVP implementation, but reserved:

| Token | Direction |
|-------|-----------|
| `bg.app` | Deep olive-charcoal `#121814` |
| `bg.elevated` | `#1C2420` |
| `text.primary` | `#F3F0EA` |
| `brand.primary` | Lifted pine `#3E8F72` for actions on dark |
| Borders | Low-contrast stone greys |

Dark mode must preserve contrast for older residents; never pure `#000` blocks of text on `#111`.

### 3.5 Usage rules

- Primary button = `brand.primary` on white/linen — not accent orange by default  
- Accent = sparingly (badges, “happening now”, secondary CTA)  
- Large surfaces stay linen/white; green is for action and identity, not full-screen washes  
- Photos carry emotion; UI color supports, doesn’t compete  

---

## 4. Typography system

### 4.1 Font direction

**Display / brand moments:** expressive humanist serif with Mediterranean warmth  
Recommended pairing direction: **Fraunces** or **Source Serif 4** for display only  

**UI / body:** clean geometric humanist sans, excellent readability  
Recommended: **Plus Jakarta Sans** or **DM Sans** (not Inter/Roboto/Arial as the brand face)

Avoid: Inter-as-default SaaS look; tiny grey captions; dense enterprise columns.

### 4.2 Scale (mobile base)

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| `type.display` | 34 / 40 | Semibold–Bold (serif) | Home greeting, empty heroes |
| `type.title1` | 28 / 34 | Semibold | Screen titles |
| `type.title2` | 22 / 28 | Semibold | Section titles |
| `type.title3` | 18 / 24 | Semibold | Card titles |
| `type.body` | 17 / 26 | Regular | Primary reading |
| `type.bodyStrong` | 17 / 26 | Semibold | Emphasis in body |
| `type.callout` | 16 / 24 | Medium | Supporting sentences |
| `type.subcopy` | 15 / 22 | Regular | Secondary descriptions |
| `type.caption` | 13 / 18 | Medium | Meta, timestamps (min readable) |
| `type.label` | 13 / 16 | Semibold | Chips, tabs, overlines |
| `type.button` | 16 / 20 | Semibold | Buttons |

Desktop may step display/title up +2–4px; body stays ≥16px equivalent.

### 4.3 Accessibility text

- Dynamic type / system font scaling supported  
- Never rely on caption-only critical instructions  
- Official content uses plain language; avoid jargon  

---

## 5. Spacing system

Base unit: **4px**. Preferred rhythm: **8px**.

### 5.1 Space tokens

| Token | Value |
|-------|-------|
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |
| `space.12` | 48 |
| `space.16` | 64 |

### 5.2 Layout

| Context | Rule |
|---------|------|
| Mobile page padding | `space.4` (16) horizontal |
| Mobile section gap | `space.6`–`space.8` |
| Card inner padding | `space.4`–`space.5` |
| Bottom nav clearance | content padding-bottom ≥ 88px |
| Desktop content max | 1120–1200px readable column; hero may full-bleed |
| Desktop page padding | `space.8`–`space.12` |
| Grid | 4-col mobile / 12-col desktop; cards span 4 or 6 |

Breathing room > density. If unsure, add space.

---

## 6. Elevation, radius, motion

### Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius.sm` | 10 | Chips, inputs |
| `radius.md` | 16 | Buttons, small cards |
| `radius.lg` | 22 | Primary content cards |
| `radius.xl` | 28 | Sheets, hero media frames |
| `radius.full` | 999 | Avatars, pills (use sparingly) |

Avoid tiny 4px enterprise radius everywhere; avoid pill-everything.

### Elevation

| Token | Treatment |
|-------|-----------|
| `elev.0` | Flat on linen |
| `elev.1` | Soft shadow `0 1px 2px rgba(26,31,28,0.06)`, `0 4px 16px rgba(26,31,28,0.04)` |
| `elev.2` | Sheets / modals stronger soft shadow |
| `elev.photo` | Prefer image edge over heavy multi-shadow stacks |

### Motion

| Token | Duration | Easing |
|-------|----------|--------|
| `motion.fast` | 120–160ms | ease-out |
| `motion.base` | 200–240ms | ease-in-out |
| `motion.slow` | 320–400ms | gentle for sheets |

Intentional motions (pilot): tab cross-fade, sheet rise, card press scale(0.98), success check.  
Respect `prefers-reduced-motion`.

---

## 7. Component language

Cards are **interaction containers** for content — not decorative boxes around everything. Hero/Home first viewport: brand + one moment + CTAs + photography — not a stack of KPI cards.

### 7.1 Buttons

| Variant | Look |
|---------|------|
| **Primary** | Filled `brand.primary`, text inverse, radius.md, height 48–52 |
| **Secondary** | Outline / soft `brand.primarySubtle` |
| **Accent** | Rare; `brand.accent` for high-energy secondary CTA |
| **Ghost** | Text button, no fill |
| **Destructive** | `sem.danger` |

Min hit target **44×44**. Labels clear verbs: Reserve, Report, Register, Publish.

### 7.2 Navigation

**Mobile bottom bar**

- 5 destinations: Home, Discover, Calendar, Community, Me  
- Elevated white surface, subtle top border  
- Active: `brand.primary` icon + label; inactive: `text.tertiary`  
- Optional center **Create** affordance opening a bottom sheet (not a sixth confusing tab)

**Desktop**

- Left rail or refined top bar with same 5 items  
- Active indicator: soft green pill behind item  
- Content canvas on linen; no multi-panel admin chrome by default  

**Transitions**

- Soft fade/slide between tabs (`motion.base`)  
- Sheets spring from bottom on mobile  

### 7.3 Cards

| Card type | Pattern |
|-----------|---------|
| **Experience** | 4:5 or 16:10 photo, title, meta (when/where), primary CTA |
| **Announcement / official** | Optional image; official badge; calm typography; less “social noise” |
| **Neighbour recommendation** | Avatar + short quote + service thumb; accent whisper |
| **Service / directory** | Photo or logo, name, category, verification chip, coverage |
| **Resource / place** | Amenity photo, availability cue, Reserve CTA |
| **Group** | Cover, name, member avatars row, Join |
| **Profile** | Large avatar, display name, area chips, interests |
| **Incident (member)** | Status chip, photo thumb, short title — dignified, not alarming neon |

Marketplace-style discovery cards (for future sell/listings) share Experience/Service card DNA: photo-led, one CTA, minimal meta.

### 7.4 Sheets, modals, filters

- **Bottom sheets** for Create, filters, confirm — primary mobile pattern  
- **Center modals** only for destructive confirms on desktop  
- **Filters**: horizontal chips (Area, date, category) — not modal forests  
- **Search**: large field, recent suggestions, photographic result rows  

### 7.5 Avatars & media

- Avatars 32 / 40 / 56 / 88  
- Image variants from Files Core: thumb / preview / web / detail (ADR-020)  
- Lists always load **thumb/preview**, never originals  

---

## 8. Main navigation design (summary)

| | Mobile | Desktop |
|--|--------|---------|
| Structure | Bottom 5 + Create sheet | Rail/top 5 + Create |
| Labels | Always visible | Icon + label |
| Active | Primary green | Soft pill + primary |
| Manage | Via Me when permitted | Same; optional tools panel |

Never rename the product chrome to engineering terms.

---

## 9. Content presentation patterns

### Community posts / news

Editorial calm; official badge when applicable; photo optional; actions secondary under fold.

### Experiences / events / meetings

Photo hero; date/time prominent; Area chip; Register as primary; capacity as quiet meta.

### Groups

Cover + people; short purpose; Join; upcoming strip.

### Services

Directory trust: verification chip from profile status (ADR-016/017) — never fake “verified” from a tip alone (ADR-032).

### Recommendations

Human voice; avatar; “Neighbour tip” label; link to service if present.

### Incidents / requests

Clear status (submitted → …); media evidence gallery; timeline in plain language; no blame UI.

### Reservations

Resource image; slot clarity; confirm sheet; add-to-calendar cue; reminder expectation.

---

## 10. Camera and media experience (ADR-020)

Feel **native and effortless**. Microapps provide contextual capture; processing stays on the platform Files service (never named in UI).

### Patterns

| Flow | UX |
|------|----|
| Open camera | System/permission sheet → full-bleed viewfinder |
| Capture photo | Shutter; instant preview; Retake / Use |
| Short video | Duration limit visible (e.g. progress ring); auto-stop |
| Gallery pick | Multi-select with count; compression note |
| Preview | Large preview; optional crop later |
| Upload | Quiet progress; “Optimizing…” not technical pipeline jargon |
| Failure | Human retry; keep draft text |

### Gallery presentation

- Horizontal filmstrip on create forms  
- Grid on detail (lazy, thumbs first)  
- Lightbox for detail variant  

### Copy (user-facing)

Say: *Add photo*, *Recording…*, *Almost ready*  
Don’t say: *CDN*, *AVIF*, *Physical File*, *variant generation*

---

## 11. Interaction principles

1. **One primary action** per view  
2. **3-tap rule** for Sell/Report/Reserve/Create experience (when Sell exists later; MVP uses Report/Reserve/Create)  
3. **Optimistic calm** — confirmations are soft, not confetti explosions  
4. **Progressive disclosure** — advanced filters behind “More”  
5. **Safe defaults** — privacy-minimized profiles (ADR-033)  
6. **Official ≠ neighbour** — distinct visual voice, same component family  
7. **Empty states** — one photo + one sentence + one CTA  

### 3-tap examples (aligned with brief)

| Goal | Path |
|------|------|
| Report problem | Home → Report → Submit |
| Reserve | Home → Place card / Discover Places → Reserve |
| Create activity | Home → Create → Experience |
| Sell (future) | Home → Create → Sell |

---

## 12. Accessibility rules

| Requirement | Standard |
|-------------|----------|
| Contrast | Body text ≥ WCAG AA on linen/white |
| Hit targets | ≥ 44×44 px |
| Text | Dynamic Type / large text path |
| Focus | Visible focus rings on keyboard/desktop |
| Language | Short sentences; avoid idioms-only instructions |
| Motion | Honor reduced motion |
| Errors | Text + icon, not color alone |
| Older residents | Prefer title3+ for critical actions; high-contrast primary buttons |

Semantic colors must remain distinguishable in light mode; test warning vs accent warmth.

---

## 13. Token summary (implementation-ready names)

Semantic names for future `packages/ui` / CSS variables — values as specified above:

```
--lp-color-bg-app
--lp-color-bg-elevated
--lp-color-text-primary
--lp-color-text-secondary
--lp-color-brand-primary
--lp-color-brand-accent
--lp-color-brand-sea
--lp-color-border-subtle
--lp-color-sem-success | warning | danger | info
--lp-radius-md | lg | xl
--lp-space-1 … --lp-space-16
--lp-font-sans
--lp-font-display
--lp-text-body | title1 | display
--lp-shadow-elev-1
--lp-motion-base
```

Prefix `lp` = Life Panoramica brand pack. White-label later: swap pack, keep semantic structure (`--color-bg-app` mapped from tenant theme).

---

## 14. Examples (composition)

### Home (mobile first viewport)

1. Status bar + quiet **Life Panoramica** wordmark  
2. Full-bleed community photo (fairway / terrace golden hour) with light scrim  
3. Display greeting: “Good evening, María”  
4. One line: “Your community this week”  
5. CTA row: **Discover** · **Reserve** · **Report**  
6. Below fold: Today strip + one official card — not KPIs  

### Experience card

Photo → “Sunset yoga · Aldea Golf” → Sat 18:00 · 6 spots → **Register**

### Manage mode (admin)

Same visual language; denser lists allowed but still card/row hybrid — never dump residents into a 1998 table as the brand moment.

---

## 15. Non-goals

- Implementing CSS/React in this document  
- Database or architecture changes  
- Final logo SVG lockup (direction only)  
- Dark mode full production polish  
- Copywriting of all micro-strings  

---

## 16. Next steps

1. Logo / wordmark exploration for **Life Panoramica**  
2. Hi-fi frames for Home, Discover, Create sheet, Experience detail  
3. Map tokens → shared UI package (tenant theme injection)  
4. Accessibility review with large-text samples  
5. Then implement screens against `01_UX_PRODUCT_FOUNDATION.md` journeys  

---

## Decision summary

**Life Panoramica** gets a Mediterranean, photography-led, mobile-first visual system: pine primary, warm linen surfaces, sunlit accent, humanist serif + readable sans, generous spacing, photo cards, native camera flows, and white-label-ready tokens — premium and approachable, never a SaaS dashboard and never branded as Life Community OS.
