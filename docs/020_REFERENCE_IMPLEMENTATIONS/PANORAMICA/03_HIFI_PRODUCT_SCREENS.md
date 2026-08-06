# Life Panoramica — UX-003 Hi-Fi Product Screens

Version: 1.0  
Status: Draft  
Document Type: Hi-Fi Experience Specification  
Depends on:

- `01_UX_PRODUCT_FOUNDATION.md`
- `02_VISUAL_DESIGN_SYSTEM.md`

Consumer brand: **Life Panoramica** only  
No code · No database · No architecture changes

---

## 0. Spec rules

### Brand

Resident-facing chrome says **Life Panoramica** only. Never show platform/engineering names.

### User mental model (global)

Residents do **not** think in modules. They think:

1. What is happening?  
2. What can I do?  
3. Where can I participate?  
4. What needs my attention?  

Screens are organized around those questions — not backend microapps.

### Design constraints

- Mobile first; ≤3 taps for frequent actions  
- Photography first; premium cards; large readable type  
- Native mobile feeling; accessible for older residents  
- No CRUD tables as primary interaction  
- Tokens from `02_VISUAL_DESIGN_SYSTEM.md`

### Shared chrome (all main tabs)

| Element | Spec |
|---------|------|
| Status bar | System; content respects safe areas |
| Bottom nav | Home · Discover · Calendar · Community · Me |
| Active tab | `brand.primary` icon + label |
| Create | Opens Global Create Sheet (from Home FAB/center or nav affordance) |
| Area context | Optional chip row: **All Panoramica** \| **My area** (and named Areas) |

---

## 1. App Launch / Splash

### Purpose

Brand arrival and trust: confirm the resident is entering **Life Panoramica**, then land on Home (or auth/onboarding if required).

### User mental model

“I’m opening my community.” Not “I’m launching software.”

### Hierarchy

1. Brand wordmark **Life Panoramica**  
2. Atmospheric photography (place, not logo collage)  
3. Quiet loading indication  
4. Transition into Home  

### Sections

| Zone | Content |
|------|---------|
| Full-bleed photo | Fairway / terrace / path at golden hour |
| Soft scrim | Bottom third for legibility |
| Wordmark | Display serif or refined lockup, `text.inverse` |
| Tagline (optional, one line) | e.g. “Your community, alive” |
| Progress | Thin indeterminate bar or soft pulse — no spinner circus |

### Components

- Full-bleed `Image` (detail/web variant, not tiny thumb)  
- Brand wordmark  
- Optional Lottie-free opacity fade  

### Interactions

| Event | Behaviour |
|-------|-----------|
| Cold start | Splash 0.8–1.6s or until session ready (whichever later, capped ~2.5s) |
| Warm start | Abbreviated splash or skip if content cached |
| Session valid | → Home |
| Session missing | → Welcome / sign-in (still branded Life Panoramica) |
| First Membership | → soft “Choose your area” sheet (skippable) then Home |

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Loading | Photo + wordmark + quiet progress |
| Offline / fail session | Keep brand; message “Can’t connect right now” + **Try again** (large primary button) |
| No photo asset | Solid linen `bg.app` + wordmark — never broken-image icon |

### Mobile behaviour

Full viewport; ignore bottom nav until Home mounts; respect notch.

### Desktop adaptation

Centered 480px card over blurred community photo, or full-bleed same as mobile with max readable wordmark; no “admin login portal” chrome.

---

## 2. Home

### Purpose

Answer **what’s happening now**, what’s relevant to me, and what I can do next — in one calm scroll.

### User mental model

“Show me my community today — and let me act fast.”

### Hierarchy (top → bottom)

1. Brand + greeting (alive, personal)  
2. Quick actions (do something)  
3. Happening now / today (attention + time)  
4. Important official voice (trust)  
5. For you — activities & discovery (participate)  
6. Neighbour / local pulse (optional)  

**Not:** KPI tiles, module grids, “Incidents / Microapps / RBAC” sections.

### Sections

#### A. Hero composition (first viewport)

- Full-bleed or large rounded hero photo (`radius.xl`)  
- Soft scrim  
- Overline/wordmark: **Life Panoramica**  
- `type.display`: “Good evening, {first or display name}”  
- One supporting line: e.g. “3 things this week near you”  
- Area chip: All Panoramica / My area  

#### B. Quick actions (≤3 taps entry)

Horizontal row of large tappable actions (icon + label), height ≥52:

| Action | Goes to |
|--------|---------|
| **Reserve** | Discover → Places (or last resource) |
| **Report** | Create sheet → Report problem |
| **Join** | Discover → Experiences (or next open registration) |

Optional fourth under “More” in Create sheet — keep first row to 3.

#### C. Happening now

Horizontal **Today / Upcoming** cards (agenda-style):

- Time · title · place/Area · type cue (experience / reservation / meeting)  
- Tap → detail  

#### D. Needs your attention (conditional)

Only if relevant:

- Waitlist promoted  
- Reservation reminder  
- Request status change  
- Vote closing soon  

Use calm `sem.info` / `sem.warning` banners — not alarm red unless urgent safety.

#### E. Official

Single premium **announcement card** (if published):

- Official badge  
- Title + 2-line preview  
- Optional image  
- Tap → detail  

If none: omit section entirely (don’t show empty official box).

#### F. For you

Vertical experience / recommendation cards (photo-led):

- Experience cards with **Register**  
- Service tip cards with “Neighbour recommends”  
- Max ~5 then “See more in Discover”

### Components

Hero, chips, action buttons, agenda pills, announcement card, experience cards, bottom nav, Create affordance.

### Interactions

| Gesture | Result |
|---------|--------|
| Pull to refresh | Reload personalized home |
| Tap Area chip | Refilter home rails |
| Tap Create | Global Create Sheet |
| Long-press experience (optional later) | Save |

### Empty states

| Condition | UI |
|-----------|-----|
| No upcoming | Friendly empty: photo + “Nothing scheduled — discover something nearby” + **Discover** |
| New member | Soft onboarding tips as 1–2 cards, dismissible |

### Loading states

- Hero photo shimmer  
- Skeleton for Today strip and 2 card placeholders  
- No layout jump when official appears  

### Error states

Inline banner: “Some updates couldn’t load” + **Retry**; show any cached rails.

### Mobile behaviour

Single column scroll; hero ~52–62% of first viewport; sticky bottom nav; generous padding `space.4`.

### Desktop adaptation

- Hero full-bleed top  
- Below: 12-col grid — Today (4) + Official (8) or stacked  
- For you as 2–3 column card grid  
- Left rail nav; Create in rail footer  

---

## 3. Discover

### Purpose

Answer **what can I do / find** — experiences, local services, places to reserve — via visual browsing.

### User mental model

“Help me find something to do, someone to call, or a place to book.”

### Hierarchy

1. Search  
2. Segment: Experiences | Services | Places  
3. Filters (Area, date, category)  
4. Results as photography cards  

### Sections

#### Header

- Title: **Discover** (`type.title1`)  
- Search field (large): placeholder “Search experiences, services, places”  

#### Segment control

Pill tabs: **Experiences** · **Services** · **Places**  
Active: `brand.primarySubtle` + primary text.

#### Filter chips

Horizontal scroll: Area · Today/This week · Category · Open now (services) · Available (places)

#### Results

**Experiences:** 4:5 or landscape photo cards; meta date/Area; CTA Register/View  

**Services:** logo/photo; name; category; verification chip; coverage whisper; tap → profile  

**Places:** amenity photo; name; next available cue; **Reserve**  

**Services rail (optional):** “Neighbours recommend” horizontal tips above grid when on Services.

### Components

Search, segments, chips, experience/service/resource cards, empty illustration-light state.

### Interactions

| Action | Behaviour |
|--------|-----------|
| Change segment | Instant swap; preserve Area filter |
| Search | Debounced; photographic result rows |
| Reserve | → slot sheet (≤2 more taps from card) |
| Pull refresh | Reload segment |

### Empty states

“Nothing matches — try All Panoramica” + clear filters CTA.

### Loading states

Card skeleton grid (2-col mobile).

### Error states

Full-segment error with Retry; keep search chrome visible.

### Mobile behaviour

Sticky search+segments under title; results scroll beneath.

### Desktop adaptation

Search full width; filters left or top; results 3-col grid; service detail in side panel optional.

---

## 4. Calendar

### Purpose

Answer **when** — unified view of experiences, meetings, events, reservations.

### User mental model

“What’s on — and what am I committed to?”

### Hierarchy

1. View switch: Agenda (default mobile) | Month  
2. Filters: Area · Registered only · Groups  
3. Chronological items  

### Sections

#### Header

**Calendar** + view toggle  

#### Agenda list

Grouped by day:

- Time range  
- Colour/type dot (experience / meeting / reservation) — not rainbow chaos; use sea/primary/accent sparingly  
- Title · place · status (Registered / Reserved)  
- Tap → source detail  

#### Month (secondary)

Dots on days with items; select day → agenda below.

### Components

Segmented control, filter chips, agenda rows, month grid, detail sheet.

### Interactions

| Action | Behaviour |
|--------|-----------|
| Toggle Registered only | Show user’s registrations/reservations |
| Tap item | Detail (register/cancel if allowed) |
| Swipe day (optional) | Adjacent day |

### Empty states

“Your week is open” + **Discover something** CTA.

### Loading states

Agenda row skeletons for 5 lines.

### Error states

Inline retry; month grid still navigable if cached.

### Mobile behaviour

Agenda-first; month behind toggle; large row hit areas (≥52px).

### Desktop adaptation

Split view: month left (5 cols) + agenda right (7 cols); no tiny Google-Calendar clone density.

---

## 5. Community

### Purpose

Answer **where I participate** — talk, belong, decide, hear official and neighbour voices.

### User mental model

“This is our shared space — news, people, conversations, decisions.”

### Hierarchy

1. Chips: Feed · Groups · Talk · Decide  
2. Area filter  
3. Content stream / directories for active chip  

### Sections

#### Feed

Mixed but calm:

- Official announcements (badge)  
- News cards  
- Light activity (followed items) — not a noisy social firehose  

#### Groups

Grid/list of group covers; member avatars; Join/Open.

#### Talk

Open discussions / threads needing attention; preview last reply; unread cue.

#### Decide

Proposals, polls, votes — status chips (Open / Closing soon / Closed); primary Participate.

### Components

Chip tabs, announcement/news cards, group cards, thread rows, proposal cards, compose entry (via Create).

### Interactions

| Action | Behaviour |
|--------|-----------|
| Switch chip | Preserve scroll position per chip if possible |
| Open item | Detail with comments/reactions |
| Join group | Confirm sheet → group home |

### Empty states

Per chip: one photo + one sentence + CTA (e.g. Decide empty → “No open decisions”).

### Loading states

Feed card skeletons; groups 2×2 shimmer.

### Error states

Chip-level error + Retry.

### Mobile behaviour

Sticky chip bar; photography cards; avoid nested tabs beyond one row.

### Desktop adaptation

Chips + two-column feed; groups as 3-col cards; Decide as structured list with status column (still not a data grid).

---

## 6. Me / Profile

### Purpose

Answer **me in this community** — identity presence, attention inbox, my stuff, settings; gate to Manage if permitted.

### User mental model

“My profile, my things, my alerts — and community tools if I’m trusted to help.”

### Hierarchy

1. Profile header  
2. Attention (notifications / tasks)  
3. My activity shortcuts  
4. Settings & support  
5. Manage (role-gated)  

### Sections

#### Profile header

- Large avatar (56–88)  
- Display name (`type.title2`)  
- Membership cue: “Member · Life Panoramica” (human language)  
- Area chips / interests (ADR-033)  
- **Edit profile**  

#### Attention

- Notifications row (badge count)  
- Pending: waitlist, approvals you requested, closing votes  

#### My shortcuts (cards or rows)

| Item | Destination |
|------|-------------|
| Registrations | List of experiences signed up |
| Reservations | Upcoming places |
| Requests | Incident/request status |
| Saves | Saved content |
| Groups | Groups I joined |

#### Settings

Language, notification preferences, privacy, sign out — large rows, clear labels.

#### Manage community (if RBAC)

Highlighted row with primary subtle background: **Manage community** → Manage mode (out of this doc’s main resident set, but entry lives here).

### Components

Avatar, chips, list rows, badges, settings groups, edit sheet.

### Interactions

| Action | Behaviour |
|--------|-----------|
| Edit profile | Sheet: photo, display name, interests, privacy |
| Open notifications | Inbox list; tap → deep link |
| Sign out | Confirm modal |

### Empty states

No notifications: “You’re all caught up.”  
No reservations: CTA to Places.

### Loading states

Header skeleton + 4 row placeholders.

### Error states

Profile cached if possible; banner on failed refresh.

### Mobile behaviour

Single column; avatar prominent; settings at bottom.

### Desktop adaptation

Profile card left (4 cols); shortcuts + settings right (8 cols).

---

## 7. Global Create Sheet

### Purpose

Universal **what can I do / create** hub — keep frequent actions ≤3 taps from Home.

### User mental model

“I want to add or start something.”

### Hierarchy

1. Sheet title: **Create**  
2. Permission-filtered actions as large rows  
3. Cancel / swipe down  

### Sections / actions (show only if allowed)

| Action | Resident copy | Result |
|--------|---------------|--------|
| Report a problem | Photo-first request | Incident create flow |
| Recommend / tip | Neighbour tip | Recommendation compose |
| Start a proposal | Community idea | Proposal draft |
| Create experience | Host something | Experience create (organizer Permission) |
| Publish official | Official notice | Announcement compose (admin) |
| Reserve a place | Shortcut | Discover Places |
| Sell something | Future / if enabled | Hidden in MVP if Marketplace off |

Visual: icon in soft circle + title + one-line subtitle; row height ≥56.

### Components

Bottom sheet (`radius.xl` top), action rows, safe-area padding, drag handle.

### Interactions

| Action | Behaviour |
|--------|-----------|
| Open | From Home Create / nav; animate `motion.base` rise |
| Select action | Sheet dismisses → flow |
| Scrim tap / swipe | Dismiss |
| No permissions | Sheet still opens with helpful actions (Reserve, Report if allowed) or message |

### Empty states

If somehow no actions: “Nothing to create right now” + close.

### Loading states

Brief permission resolve: 3 shimmer rows max 200ms then content.

### Error states

If action fails to open: toast “Couldn’t start — try again.”

### Mobile behaviour

Detent ~50–70% height; scroll if many actions; large type.

### Desktop adaptation

Centered modal 420px or anchored popover from Create button — same action list, not a form dump.

### Chained flows (3-tap examples)

| Goal | Taps |
|------|------|
| Report | Home → Create → Report → (compose is continuation; submit is 4th intentional) — foundation counts Create entry as part of path; keep compose single-screen |
| Experience (organizer) | Home → Create → Experience |
| Tip | Home → Create → Tip |

Compose screens: one primary scroll, photo at top, submit sticky bottom (≥48 height).

---

## 8. Cross-screen states library

### Global loading

Prefer skeleton matching layout; avoid full-screen blockers after first paint.

### Global offline

Top quiet banner: “You’re offline — showing saved info.”

### Global permission denied

Plain sheet: “You don’t have access to do that.” + OK (no technical codes).

### Media (ADR-020 UX)

Capture from Report/Experience: native camera → preview → Use; show “Optimizing…” not pipeline jargon.

---

## 9. Accessibility checklist (all screens)

- Text ≥ body 17 / titles larger  
- Contrast AA on linen/white  
- Hit targets ≥ 44px  
- Focus order: header → primary content → nav  
- Don’t rely on colour alone for Official vs Neighbour (use badge labels)  
- Reduced motion: skip hero parallax; keep opacity fades  

---

## 10. Traceability

| Screen | Foundation | Visual system | Capability ADRs (silent) |
|--------|------------|---------------|---------------------------|
| Splash / Home | §6.1, journeys | Brand, hero, cards | 025–027, 019 |
| Discover | §6.2 | Discovery cards | 017, 027, 031, 032 |
| Calendar | §6.3 | Agenda | 030, 027 |
| Community | §6.4 | Feed/groups | 025–029 |
| Me | §6.5 | Profile | 033, 019, 034 entry |
| Create | §4.1 Create | Sheet | 018, 026, 027, 032 |

---

## 11. Next steps

1. Hi-fi visual frames (Figma) for Splash, Home, Discover, Create  
2. Motion prototype for sheet + tab transitions  
3. Content inventory sample for Panoramica Areas  
4. Implement against shared UI tokens — still white-label tenant shell  

---

## Decision summary

Hi-fi Life Panoramica screens prioritize **happening / do / participate / attention**, not backend modules: photographic Home, segmented Discover, agenda Calendar, human Community, personal Me, and a Global Create Sheet — premium Mediterranean consumer UX with ≤3-tap actions and zero platform-name leakage.
