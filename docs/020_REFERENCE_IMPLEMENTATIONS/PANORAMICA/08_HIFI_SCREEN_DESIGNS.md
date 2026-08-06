# Life Panoramica — Hi-Fi Screen Designs

Version: 1.0  
Status: Draft  
Document Type: Visual Product Design Specification  
Consumer brand: **Life Panoramica** only  
Depends on: `01`–`07`, visual tokens in `02`  
Complements: `03_HIFI_PRODUCT_SCREENS.md` (structure) — this document is the **seen product**

No code · No database · No migrations · No new ADRs

---

## 0. How to read this document

These are **high-fidelity experience designs**, not architecture and not low-fi wireframes.

When you finish reading a screen, you should be able to picture:

- what the first viewport looks like  
- where the eye goes  
- what photography carries  
- what the resident taps next  

### Emotional brief

> My community lives here.

Mediterranean · premium · natural · neighbourly · warm.  
Not a SaaS dashboard, municipal portal, admin tool, or generic app template.

### Design system anchors (from `02`)

| Element | Value |
|---------|--------|
| Background | Linen `#F6F3EE` |
| Primary | Pine `#1F4A3C` |
| Accent (sparse) | Sunlit `#C47A3A` |
| Surfaces | White elevated cards |
| Display type | Humanist serif (Fraunces / Source Serif direction) |
| UI type | Plus Jakarta Sans / DM Sans direction |
| Radius | Cards `22`, sheets `28`, buttons `16` |
| Motion | Soft sheet rise, card press `0.98`, tab fade |

### Component rule

Use platform names: `ExperienceCard`, `AnnouncementCard`, `ResourceCard`, `RecommendationCard`, `GroupCard`, `CreateSheet`.  
Tenant identity = theme + photography + content — never `PanoramicaGolfCard`.

### Shared chrome (member screens)

```
┌─────────────────────────────┐
│ status bar                  │
│ [optional top bar]          │
│                             │
│     SCREEN CONTENT          │
│                             │
│                     (FAB)   │
├─────────────────────────────┤
│ Home  Discover  Cal  Com  Me│
└─────────────────────────────┘
```

Bottom nav: white, hairline top border, active pine icon+label.  
Create: floating pine circle (56) above nav on Home; or rail Create on desktop.  
Content bottom padding ≥ 88 so cards clear the nav.

---

## 1. App Splash / Welcome

### Screen purpose

First breath of the product. Confirm: you are entering **Life Panoramica**, your place.

### User mindset

“I’m home.” Not “I’m logging into software.”

### Visual hierarchy

1. Place photography (emotion)  
2. Wordmark **Life Panoramica** (identity)  
3. One quiet line of belonging  
4. Progress or Continue (utility, last)

### Layout structure — Splash (authenticated warm/cold start)

```
┌──────────────────────────────┐
│▓▓▓▓ FULL-BLEED PHOTO ▓▓▓▓▓▓▓│
│▓▓ fairway / terrace / path ▓▓│
│▓▓ golden hour, no people   ▓▓│
│▓▓ collage, no stickers     ▓▓│
│▓▓                          ▓▓│
│▓▓    ░░░░░ SCRIM ░░░░░     ▓▓│
│▓▓                          ▓▓│
│▓▓   Life Panoramica        ▓▓│  ← display serif, inverse
│▓▓   Your community, alive  ▓▓│  ← optional callout, one line
│▓▓   ━━━━━━━━━━             ▓▓│  ← 2px soft progress
└──────────────────────────────┘
```

**Duration:** 0.8–1.6s cold (cap ~2.5s until session). Warm start: abbreviated fade or skip to Home if cached.

**Motion:** Photo opacity 0→1 (`motion.slow`); wordmark rises 8px + fade (`motion.base`); exit cross-dissolve into Home hero (shared photographic continuity when possible).

### Layout structure — Welcome (no session)

Same photography language. Bottom third becomes action zone on linen-safe scrim:

| Element | Spec |
|---------|------|
| Wordmark | Serif, inverse |
| Supporting | “Community life in Panoramica” |
| Primary | **Continue** / **Sign in** — height 52, pine fill, full width inset 24 |
| Secondary | Ghost: **I have an invitation** |

Invitation path: soft sheet or next screen with invite context (who invited, community name) — still branded Life Panoramica only.

### Main components

`ResponsiveImage` (web/detail variant), brand lockup, `ButtonPrimary`, quiet progress.

### Content examples

- Photo: late-day light on the fairway edge; pine silhouettes; warm stone path  
- Never: stock “team high-five”, generic condo lobby, logo mashup  

### Primary actions

Continue / Sign in → Authentication  

### Secondary actions

Invitation deep link; Try again on offline  

### Empty / loading / error

| State | Design |
|-------|--------|
| Loading | Photo + wordmark + thin progress — no spinner circus |
| No photo asset | Linen field + pine wordmark — never broken-image icon |
| Offline | Keep photo; bottom toast-card: “Can’t connect right now” + **Try again** |

### Accessibility

Wordmark contrast on scrim AA; Continue ≥44px; reduced motion = static photo, no rise.

### Mobile layout

True full-bleed edge-to-edge; respect notch; no bottom nav.

### Desktop adaptation

Full-bleed background with centered 420–480 glass/linen card containing wordmark + Continue — still atmospheric, never “admin login portal” chrome or corporate SSO wall aesthetic.

---

## 2. Home Screen

### Screen purpose

The living room of the community. Answer: what is happening, what matters, what I can do — in one calm scroll.

### User mindset

“Show me my place today — and let me act fast.”

### Visual hierarchy (first viewport must pass the brand test)

If you removed the bottom nav, it must still read as **Life Panoramica**, not a generic feed app.

1. Identity + greeting on photography  
2. Three quick actions (do)  
3. Pulse of time (today)  
4. Official voice (trust)  
5. For you (participate)  

**Forbidden in first viewport:** KPI strips, module grids, “Incidents / Resources / Microapps”, dense widget boards.

### Layout structure — Mobile

```
┌──────────────────────────────┐
│ ○ All Panoramica  ▾     🔔  │  ← Area chip + notifications
│┌────────────────────────────┐│
││ HERO PHOTO (radius.xl)     ││  ≈ 52–58% first viewport
││ soft scrim bottom          ││
││ Life Panoramica            ││  overline label / lockup
││ Good evening, Marta        ││  type.display serif
││ 3 things near you this week││  callout inverse
│└────────────────────────────┘│
│                             │
│  [ Reserve ][ Report ][ Join ] │  ← QuickAction row ≥52h
│                             │
│  Happening now          See ›│
│  ┌────┐ ┌────┐ ┌────┐       │  ← horizontal agenda pills
│  │9:30│ │18:0│ │Sat │       │
│  └────┘ └────┘ └────┘       │
│                             │
│  From the community         │
│  ┌────────────────────────┐ │  ← AnnouncementCard
│  │ Official · Water works │ │
│  │ Saturday maintenance…  │ │
│  └────────────────────────┘ │
│                             │
│  For you                    │
│  ┌────────────────────────┐ │  ← ExperienceCard photo-led
│  │ PHOTO                  │ │
│  │ Sunrise walk · Aldea   │ │
│  │ Sat 8:00 · 12 going  [Register] │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │  ← RecommendationCard
│  │ “Best locksmith…”      │ │
│  └────────────────────────┘ │
│                        (＋)  │  ← Create FAB pine
├──────────────────────────────┤
│ Home● Discover  Cal  Com  Me│
└──────────────────────────────┘
```

### Section design detail

#### Header

- Left: Area chip (`All Panoramica` / `My area` / named Areas) on linen  
- Right: bell (badge soft accent dot if unread) — tap → Notifications  
- Profile is **not** competing in the hero; Me tab owns identity. Optional small avatar top-right only if it doesn’t crowd the brand hero.

#### A) Community Pulse — “Happening now”

Horizontal scroll of soft white pills (`radius.lg`, `elev.1`):

| Part | Treatment |
|------|-----------|
| Time | `type.label` pine or sea |
| Title | `type.bodyStrong`, 1 line truncate |
| Meta | Area · type whisper (Walk / Court / Meeting) |
| Live cue | Tiny accent dot only if starting &lt;2h |

Tap → Experience / Reservation / Meeting detail sheet.

#### B) Important information — Official

At most **one** prominent `AnnouncementCard` when published:

- Left accent bar or “Official” badge in pine  
- Optional 16:9 image  
- Title + 2-line preview  
- Calm — editorial, not social noise  

If none: **omit the section** (no empty official box).

#### C) For you

Vertical stack (max ~5) then “See more in Discover”:

- `ExperienceCard` — 16:10 or 4:5 photo, title, when/where, **Register**  
- `RecommendationCard` — neighbour voice, accent whisper, not “verified”  
- Occasional `ServiceCard` if personalized  

Photography first; meta secondary; one primary CTA per card.

#### D) Quick Actions

Three equal cells, not a module grid:

| Action | Icon mood | Destination |
|--------|-----------|-------------|
| **Reserve** | Place / court | Places / last resource |
| **Report** | Camera / care | Create → Report |
| **Join** | People / path | Experiences / next open |

Soft `brand.primarySubtle` fill, pine icon, label `type.label`. Press scale 0.98.

Optional **Create** stays on FAB — fourth intent lives in CreateSheet.

### Main components

Hero `ResponsiveImage`, Area `FilterChipGroup`, `QuickAction`, agenda pills, `AnnouncementCard`, `ExperienceCard`, `RecommendationCard`, `FloatingCreateControl`, `MobileBottomNav`.

### Content examples (Panoramica flavour)

| Slot | Example |
|------|---------|
| Greeting | “Good evening, Marta” |
| Pulse | “09:30 · Padel · Court 2” / “18:00 · Neighbours’ terrace” |
| Official | “Water maintenance Saturday 10:00–14:00 — Aldea Golf” |
| For you | “Sunrise walk along the pines · Sat 8:00” |
| Tip | “Elena recommends Costa Locksmith — same-day keys” |

### Primary actions

Reserve · Report · Join · open pulse/official/for-you cards · Create FAB  

### Secondary actions

Area filter · See all · Save (optional long-press later) · Notifications  

### Empty states

| Condition | Design |
|-----------|--------|
| Quiet day | Hero remains; pulse replaced by linen empty: soft line illustration + “Nothing scheduled — discover something nearby” + **Discover** |
| New member | 1 dismissible welcome card under quick actions — never a tutorial wall |

### Loading states

Hero shimmer (photo-shaped); 3 pill skeletons; 2 card skeletons. No layout jump when official inserts.

### Error states

Inline quiet banner under quick actions: “Some updates couldn’t load” + **Retry**; keep hero + any cached cards.

### Accessibility

Display greeting scales with Dynamic Type; quick actions ≥52×44; Official labelled in text not colour alone; reduced motion = no hero parallax.

### Mobile layout

Single column; section gaps `space.6`–`space.8`; horizontal padding `space.4`.

### Desktop adaptation

```
┌────────┬─────────────────────────────────────────┐
│ Rail   │ Hero full-bleed top                     │
│ Home   │ Quick actions inline                    │
│ Disc.  │ ┌ Today (4) ┐ ┌ Official (8) ┐         │
│ Cal    │ └───────────┘ └──────────────┘         │
│ Com    │ For you — 3-col ExperienceCards         │
│ Me     │                                         │
│ Create │                                         │
└────────┴─────────────────────────────────────────┘
```

Still photographic. Never KPI dashboard. Max content width ~1200; hero may edge-bleed.

### Motion

Tab enter: soft fade. Pull-to-refresh: pine spinner subtle. Card press: scale 0.98. FAB: shadow breathe once on first Home visit (optional, reduced-motion off).

---

## 3. Discover Screen

### Screen purpose

Visual exploration of life around you — experiences, services, places, neighbour tips.

### User mindset

“Help me find something worth doing, booking, or trusting.”

### Visual hierarchy

1. Search (wayfinding)  
2. Segments (what kind of discovery)  
3. Photography grid (desire)  
4. Filters (refine, secondary)

**Not** spreadsheet lists. **Not** yellow-pages density.

### Layout structure — Mobile

```
┌──────────────────────────────┐
│ Discover                     │  title1
│ ┌──────────────────────────┐ │
│ │ 🔍 Search experiences…   │ │  height 48, radius.md
│ └──────────────────────────┘ │
│ [Experiences] Services Places│  segment pills
│ Area · This week · Outdoor › │  filter chips scroll
│                             │
│ ┌──────────┐ ┌──────────┐   │  2-col photo cards
│ │  PHOTO   │ │  PHOTO   │   │
│ │ Walk     │ │ Padel    │   │
│ │ Sat·Reg. │ │ Sun·Open │   │
│ └──────────┘ └──────────┘   │
│                             │
│ (Services segment example)  │
│ Neighbours recommend →      │  horizontal RecommendationCards
│ then ServiceCard grid       │
└──────────────────────────────┘
```

### Segment visual languages

| Segment | Card | Cue |
|---------|------|-----|
| **Experiences** | `ExperienceCard` 4:5 or 3:4 | Date · Area · Register |
| **Services** | `ServiceCard` | Category · subtle verified chip if Directory says so |
| **Places** | `ResourceCard` | “Next: Tomorrow 10:00” · **Reserve** |

Recommendations: horizontal rail **above** Services grid — accent whisper “Neighbour tip”, never confused with official verification.

### Main components

`SearchField`, segment control, `FilterChipGroup`, `ExperienceCard`, `ServiceCard`, `ResourceCard`, `RecommendationCard`.

### Content examples

- Experiences: “Mediterranean stretch class · Valle Golf terrace”  
- Services: “Panoramica Garden Care · Outdoors”  
- Places: “Padel Court 2 · Available today 17:00”  
- Tip: “Ask for Marta at the bakery — best ensaimada Saturday morning”  

### Primary actions

Open card → detail; Reserve on place card; Register on experience  

### Secondary actions

Search, filters, clear filters, pull refresh  

### Empty states

Full-bleed soft empty in results zone: “Nothing matches — try All Panoramica” + **Clear filters**. Photography still in header chrome.

### Loading states

2×3 skeleton cards matching photo aspect.

### Error states

Keep search + segments; results area message + **Retry**.

### Accessibility

Search always labelled; segment selected state not colour-only (weight + subtle fill); card titles announced with CTA.

### Mobile layout

Sticky search + segments under title; results scroll; 2-col grid gap `space.3`.

### Desktop adaptation

3–4 column card gallery; filters as top row or left 240 rail; optional detail side panel (40%) on card click — still photo-led, not data table.

### Motion

Segment switch: cross-fade grid (`motion.fast`). Card hover (desktop): lift `elev.1` → `elev.2` gently.

---

## 4. Calendar Screen

### Screen purpose

Time made human — what the community is doing, and what I committed to.

### User mindset

“What’s on — and what am I part of?”

### Visual hierarchy

1. Title + Agenda/Month toggle  
2. Filters (Registered only feels personal)  
3. Day groups with living rows  

Must feel **alive** (photos optional thumbs, soft type dots) — not Outlook/Google corporate density.

### Layout structure — Mobile (Agenda default)

```
┌──────────────────────────────┐
│ Calendar          [Agenda│Month] │
│ All · Registered only · Groups   │
│                             │
│ Today · Thursday 12          │  type.title3
│ ┌──────────────────────────┐ │
│ │ ● 09:30–10:30            │ │  sea/primary/accent dot by type
│ │   Padel with neighbours  │ │
│ │   Court 2 · Reserved     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ● 18:00                  │ │
│ │   [thumb] Community BBQ  │ │  optional 40² photo
│ │   Aldea Golf · Going     │ │
│ └──────────────────────────┘ │
│                             │
│ Tomorrow · Friday 13         │
│ …                           │
└──────────────────────────────┘
```

Type dots (max 3 hues): experience = pine, reservation = sea, meeting = secondary grey — labelled in text too.

### Month mode

Large warm month grid; days with items get soft pine dots; select day → agenda list slides below. No tiny 40-event cram.

### Main components

Segmented control, `FilterChipGroup`, agenda rows, optional month grid, detail sheet on tap.

### Content examples

- “Reserved · Court 2”  
- “Going · Sunrise walk”  
- “Open · Owners’ meeting (optional)”  

### Primary actions

Tap row → source detail (register/cancel/reserve manage as allowed)  

### Secondary actions

Toggle Registered only; jump today; month select  

### Empty states

“Your week is open” + atmospheric mini-illustration + **Discover something**

### Loading states

5 agenda skeleton rows.

### Error states

Inline retry; if month cached, keep navigation.

### Accessibility

Row height ≥52; time read before title; don’t rely on dot colour alone.

### Mobile layout

Agenda-first; generous day headers; linen background between white rows.

### Desktop adaptation

Split: month (5 cols) + agenda (7 cols); selected day highlighted with `brand.primarySubtle`. Still airy — not enterprise scheduling software.

### Motion

Day expand soft; Registered filter animates rows out with fade (respect reduced motion).

---

## 5. Community Screen

### Screen purpose

Human participation — news, circles, conversation, decisions — structured, calm, neighbourly.

### User mindset

“This is our shared space.”

### Visual hierarchy

1. Chips: Feed · Groups · Talk · Decide  
2. Area filter  
3. Content for active chip  

**Avoid:** Facebook/Instagram clone energy, infinite noisy firehose, story rings, like leaderboards as governance.

### Layout structure — Mobile

```
┌──────────────────────────────┐
│ Community                    │
│ [Feed] Groups  Talk  Decide  │  sticky chips
│ Area: All Panoramica     ▾   │
│                             │
│ FEED EXAMPLE                │
│ ┌──────────────────────────┐ │
│ │ Official                 │ │  AnnouncementCard
│ │ Pathway lighting update  │ │
│ │ 2h · Aldea Golf          │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Ana · Neighbours         │ │  CommunityPostCard
│ │ Anyone for evening walk? │ │
│ │ ❤️ 12   💬 4        Save │ │  SocialInteractionBar quiet
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Groups chip

2-col `GroupCard`: cover photo, name, 3 avatars, **Join** / **Open**.

#### Talk chip

Thread rows: title, last reply preview, unread soft pine pip — structured discussions, not DMs.

#### Decide chip

Proposal cards: status chip Open / Closing soon / Closed; title; **Participate** — formal path distinct from reactions (ADR-028).

### Main components

Chip tabs, `AnnouncementCard`, `CommunityPostCard`, `GroupCard`, thread rows, proposal cards, `SocialInteractionBar` on detail (keep feed row quiet).

### Content examples

- Official: “Pathway lighting update — Phase 2 complete”  
- Post: “Anyone for an evening walk toward Detinsa?”  
- Group: “Padel mornings · 28 members”  
- Proposal: “Extend pool summer hours · Closes Friday”  

### Primary actions

Open item → detail + conversation; Join group; Participate in decision  

### Secondary actions

Compose via CreateSheet; Area filter; react/save on detail  

### Empty states

Per chip, one photo + one sentence + CTA (“No open decisions yet”).

### Loading states

Feed: 3 card skeletons. Groups: 2×2 shimmer.

### Error states

Chip-level error + Retry; chips remain tappable.

### Accessibility

Chip selection announced; Official vs Neighbour via badge text; comment counts not colour-only.

### Mobile layout

Sticky chip bar; single column feed; avoid nested tab hell.

### Desktop adaptation

Feed two-column masonry-lite (same card widths); Groups 3-col; Decide list with status — still cards, not data grid.

### Motion

Chip content cross-fade; new post inserts with gentle slide (`motion.base`).

---

## 6. Profile / Me Screen

### Screen purpose

Identity and participation — who I am here, what needs me, what I’ve joined, how I configure my presence.

### User mindset

“My place in this community.”

### Visual hierarchy

1. Profile presence (human)  
2. Attention (what needs me)  
3. My life shortcuts (activities, reservations, contributions)  
4. Settings  
5. Manage (only if entitled — quiet, not dominant)

### Layout structure — Mobile

```
┌──────────────────────────────┐
│ Me                           │
│          ┌────┐              │
│          │Avatar│            │  72–88
│          └────┘              │
│        Marta Ruiz            │  title2
│   Member · Life Panoramica   │  caption — human, not “RBAC”
│   Aldea Golf · Walking, Padel│  chips
│      [ Edit profile ]        │  secondary button
│                             │
│ ┌──────────────────────────┐ │
│ │ 🔔 Notifications      3 ›│ │  attention
│ └──────────────────────────┘ │
│                             │
│ My community life            │
│ ┌────────┐ ┌────────┐       │  2×2 shortcut tiles
│ │ Going  │ │ Places │       │  soft photo or icon+count
│ │ 2 upcom│ │ 1 book │       │
│ └────────┘ └────────┘       │
│ ┌────────┐ ┌────────┐       │
│ │Requests│ │ Saves  │       │
│ │ 1 open │ │ 8 saved│       │
│ └────────┘ └────────┘       │
│ Groups I’ve joined        ›  │
│ Contributions / tips      ›  │
│                             │
│ Settings                     │
│ Notifications prefs       ›  │
│ Privacy                   ›  │
│ Language                  ›  │
│ Sign out                     │
│                             │
│ ┌──────────────────────────┐ │  only if RBAC
│ │ Manage community        ›│ │  primarySubtle
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Shortcut tiles: white, `radius.lg`, optional tiny photo corner — participation, not admin metrics.

### Main components

`Avatar`, `ProfileHeader`, chips, attention row, shortcut tiles, settings rows, Manage entry.

### Content examples

- “Member · Life Panoramica”  
- “2 upcoming · Sunrise walk, Padel”  
- “Court 2 · Tomorrow 17:00”  
- “Street light · Received”  

### Primary actions

Edit profile · open Notifications · open shortcut destinations  

### Secondary actions

Settings · Sign out (confirm) · Manage community  

### Empty states

Notifications: “You’re all caught up.”  
Reservations tile: “No bookings — Reserve a place.”  

### Loading states

Avatar circle shimmer + 4 tile skeletons.

### Error states

Show cached profile; banner on failed refresh.

### Accessibility

Edit control labelled; Manage not implied by Membership badge; large settings rows ≥52.

### Mobile layout

Single column; settings lower; Manage never above personal life for standard members.

### Desktop adaptation

Left profile card (4 cols); right attention + shortcuts + settings (8). Same warmth.

### Motion

Edit opens sheet rise; sign-out confirm modal soft fade.

---

## 7. Create Sheet

### Screen purpose

The universal “I want to start something” entry — fast, permission-aware, feature-aware.

### User mindset

“Help me do the next useful thing — quickly.”

### Visual hierarchy

1. Drag handle  
2. Title **Create**  
3. Large action rows (icon + title + one-line why)  
4. Nothing else (no form dump inside the sheet)

### Layout structure — Mobile

```
░░░░░░░░░ scrim ░░░░░░░░░░░
┌──────────────────────────┐ ← radius.xl top, elev.2
│         ───              │ handle
│ Create                   │ title2
│                          │
│ (○)  Create experience   │ ≥56h
│      Host a walk, class… │
│                          │
│ (○)  Share an update     │  Publish / post — human copy
│      Post for neighbours │
│                          │
│ (○)  Report a problem    │
│      Photo + short note  │
│                          │
│ (○)  Start a proposal    │ if decide enabled
│ (○)  Reserve a place     │ shortcut
│ (○)  Recommend something │ if tips enabled
│ (○)  Official notice     │ admin only
│                          │
└──────────────────────────┘
```

Icon circles: `brand.primarySubtle` with pine glyph. Rows omitted when feature off or Permission missing (`07`) — sheet never shows dead engineering modules.

### Main components

`CreateSheet`, action rows, scrim, drag handle.

### Content examples (resident copy)

| Row | Subtitle |
|-----|----------|
| Create experience | Host a walk, class, or meetup |
| Share an update | Post for neighbours |
| Report a problem | Take a photo and tell us |
| Start a proposal | Ask the community to decide |
| Reserve a place | Courts, rooms, shared spaces |
| Recommend something | Tip neighbours locally |
| Official notice | Community announcement (stewards) |

### Primary actions

Tap row → dismiss sheet (`motion.base`) → compose flow or Discover Places  

### Secondary actions

Scrim tap / swipe down dismiss  

### Empty states

If no actions entitled: “Nothing to create right now” + Close — rare.

### Loading states

≤200ms: 3 shimmer rows while Permissions resolve, then real list.

### Error states

Toast: “Couldn’t start — try again.”

### Accessibility

Each row name + subtitle announced; focus trap in sheet; dismiss labelled; 56px rows for elderly users.

### Mobile layout

Detent ~55–70% height; scroll if many; safe-area bottom padding.

### Desktop adaptation

Centered 420 modal or anchored popover from Create — **same rows**, same copy, no admin form warehouse.

### Motion

Rise from bottom with gentle ease; dismiss reverse; selected row brief highlight before navigate.

### Chained speed (≤3 taps to enter flow)

| Goal | Path |
|------|------|
| Report | Home FAB → Report → camera compose |
| Experience | Home FAB → Create experience → compose |
| Reserve | Home Reserve **or** Create → Reserve a place |

---

## 8. Cross-screen visual language

### Photography

Hero and cards use real place/people energy: pines, paths, terraces, courts, neighbour gatherings. Prefer golden hour and soft morning. No sticker spam on faces.

### Cards

White on linen, `radius.lg`, soft `elev.1`, photo edge &gt; heavy shadow stacks. One CTA. Generous internal padding `space.4`–`space.5`.

### Official vs neighbour

| Voice | Visual |
|-------|--------|
| Official | Pine badge “Official”, calmer type, less social chrome |
| Neighbour | Accent whisper, avatar, warmer meta |

### Type on photo

Always scrim; inverse text; never hairline grey on bright sky.

### Motion palette (ship intentional)

1. Tab cross-fade  
2. Sheet rise / dismiss  
3. Card press scale  
Optional: success check on reserve/register  

### Global states

| State | Treatment |
|-------|-----------|
| Offline | Top quiet banner on linen |
| Permission denied | Soft sheet, plain language |
| Media upload | “Optimizing…” — never pipeline jargon (ADR-020) |

---

## 9. Responsive summary

| Screen | Mobile essence | Desktop essence |
|--------|----------------|-----------------|
| Splash/Welcome | Full-bleed ritual | Centered brand card on photo |
| Home | Hero + 3 actions + pulse | Hero + split Today/Official + 3-col For you |
| Discover | 2-col photo gallery | 3–4 col gallery ± side detail |
| Calendar | Agenda-first | Month + agenda split |
| Community | Chip + single stream | Chip + 2-col / 3-col groups |
| Me | Avatar stack + tiles | Profile card + right column |
| Create | Bottom sheet | Modal/popover same actions |

---

## 10. Accessibility (all designed screens)

- Body ≥17; critical actions never caption-only  
- Contrast AA on linen/white/pine  
- Targets ≥44 (quick actions/create rows ≥52)  
- Focus order: header → main → nav  
- Labels for icon-only controls  
- `prefers-reduced-motion` honored  
- Elderly-friendly: plain verbs Reserve / Report / Join / Create  

---

## 11. White-label readiness

Same compositions for Life Resort / Municipality / Club:

- Swap brand tokens + photography pack + content  
- Keep hierarchy, components, Create actions (feature-gated)  
- Never fork Home into a dashboard for “more serious” tenants — density changes via content and Manage mode, not a different product face  

---

## 12. What success looks like

A resident opens Life Panoramica and feels:

1. **Place** — pine, linen, real light  
2. **Pulse** — something is happening  
3. **Agency** — Reserve, Report, Join within three taps  
4. **Trust** — official voice is clear; neighbour voice is human  
5. **Belonging** — Me and Community feel like participation, not account settings  

A designer or engineer reading this can paint the screens without inventing a SaaS template.

---

## Decision summary

These hi-fi designs define the **seen** Life Panoramica product: photographic Splash/Welcome, a brand-first Home with pulse and three quick actions, visual Discover, living Calendar, structured Community, participation-centered Me, and a fast Create Sheet — premium Mediterranean consumer UX on reusable platform components, ready for Figma and implementation without architecture reinvention.
