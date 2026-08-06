# Life Panoramica — UX & Product Foundation

Version: 1.0  
Status: Draft  
Document Type: Tenant Experience Design (Pilot)  
Tenant: Life Panoramica  
Platform: Life Community OS (never shown as the consumer app name)

---

## 1. Purpose

Define the **first tenant experience** for **Life Panoramica** before UI or application code.

This document covers:

1. Information architecture  
2. Main navigation  
3. User roles (experience mapping to Platform RBAC)  
4. Main screens  
5. Core user journeys  
6. MVP scope for the Panoramica pilot  

It does **not** create database tables, UI code, or tenant-specific architecture forks.

---

## 2. Brand & positioning

| Layer | Name the user sees |
|-------|--------------------|
| Consumer / member app | **Life Panoramica** |
| Platform (engineering, admin ops, docs) | Life Community OS |

**Never** present “Life Community OS” as the product name in resident-facing UI, install prompts, or marketing chrome for this tenant.

### Product vision

A **premium digital community experience** for living in Panoramica — trust, activity, beauty, and calm utility.

**Closer to:** Airbnb (trust & experiences), Strava (activity pulse), Apple (simplicity), modern community products.  

**Not:** generic SaaS dashboard, 2010 municipal portal, CRUD admin tool, dense ERP.

### UX principles

- Mobile first  
- Maximum **3 taps** for frequent actions  
- Beautiful visual cards  
- Photography-driven  
- Human-centered  
- No unnecessary complexity  
- Premium UI/UX  
- Responsive  
- Accessible (WCAG-oriented targets for pilot+)

### Architecture constraints (non-negotiable)

Aligned with ADR-012–034:

- Reusable **Community** microapp + Platform Core — **configuration**, not Panoramica fork (ADR-014 / ADR-025)  
- **Person** identity; **Membership** participation; **RBAC** permissions (ADR-010 / ADR-011 / ADR-012)  
- No parallel permission system (ADR-034)  
- Tenant = security boundary; Territory/Area = scope (ADR-002 / ADR-013)  
- Notifications, Files, Audit, Search, Config via Core (ADR-015, 019–023)  
- Areas (Aldea Golf, Detinsa, …) are organizational — not security boundaries (ADR-005)

---

## 3. Information architecture

### 3.1 Mental model (resident)

```
Life Panoramica
  ├── Home (what’s happening for me)
  ├── Discover (experiences, services, places, tips)
  ├── Calendar (when things happen)
  ├── Community (news, talk, groups, decisions)
  └── Me (profile, saves, requests, settings)
```

Admin/moderation tools are **role-gated overlays** or a separate **Manage** mode — not the default resident IA.

### 3.2 Domain map → UX surfaces

| Resident need | Platform / ADR capability | UX surface |
|---------------|---------------------------|------------|
| Know what’s going on | Announcements, news, activity feed (025/026/028) | Home, Community |
| Do something this week | Experiences, events, meetings, calendar (027/030) | Discover, Calendar |
| Book shared amenities | Resources & reservations (031) | Discover → Places / Reserve |
| Find local help | Service Directory + Recommendations (017/032) | Discover → Services |
| Report a problem | Incidents & requests (018) | Me → Requests / quick action |
| Belong locally | Areas, Groups, Community Profile (005/029/033) | Community, Me |
| Decide together | Polls, voting, proposals (025/026) | Community → Decide |
| Talk & react | Comments, reactions, follows, saves (028) | Content detail sheets |
| Govern (staff) | Governance admin (034) | Manage |

### 3.3 Geographic facets (not nav roots)

Primary community = **Territory: Life Panoramica**.  

**Areas** (Aldea Golf, Detinsa, Pinar, Golfmar, Hacienda, Valle Golf, Zona general) are **filters / chips / context**, not separate apps.

Default: “All Panoramica” with optional Area focus (“My area”).

### 3.4 Enabled microapps (pilot configuration)

Per ADR-023 / ADR-024 packaging for this Tenant:

| Microapp / capability | Pilot |
|-----------------------|-------|
| Community (core) | On |
| Services / Directory | On (discovery) |
| Incidents / Requests | On (lightweight) |
| Marketplace | Off |
| Full Bookings commerce | Off (use Community reservations) |

---

## 4. Main navigation

### 4.1 Resident — mobile bottom nav (5)

| Tab | Label | Primary job |
|-----|-------|-------------|
| 1 | **Home** | Personalized pulse + primary CTAs |
| 2 | **Discover** | Experiences, services, places to reserve |
| 3 | **Calendar** | Time-based planning |
| 4 | **Community** | News, groups, discussions, decisions |
| 5 | **Me** | Profile, saves, requests, notifications, settings |

**Floating / hub action (≤1):** “Create” sheet — contextual: request, tip, proposal, photo for incident (permissions permitting). Keeps frequent actions ≤3 taps from Home.

### 4.2 Desktop / large screens

Same five destinations as a **left rail** or top bar; content as photography-led cards in a generous canvas — **not** a dense data table shell.

### 4.3 Role-gated entry: Manage

Visible only with Community governance Permissions (ADR-034), e.g.:

- entry from **Me → Manage community**, or  
- subtle top switcher **Live / Manage** for admins.

Manage is a **mode**, not a fifth philosophy of the product.

### 4.4 Navigation anti-patterns (forbidden for pilot)

- Sidebar with 15+ admin CRUD links as default home  
- “Life Community OS” wordmark in resident chrome  
- Separate apps per Area  
- Inbox-as-home without visual community context  

---

## 5. User roles (experience ↔ RBAC)

Roles below are **UX personas**. Capabilities come **only** from Platform RBAC Role Assignments (ADR-012 / ADR-034). Membership type (`resident`, etc.) is **participation**, not permission.

### 5.1 Resident / member

| | |
|--|--|
| **Belonging** | Active Membership in Life Panoramica Territory |
| **Sees** | Home, Discover, Calendar, Community, Me |
| **Can (typical Permissions)** | View published content; register for open experiences; reserve eligible resources; create requests; comment/react/save; create tips/proposals if permitted; edit own Community Profile |
| **Cannot** | Official publish, global moderate, resource policy admin (unless also assigned) |

### 5.2 Community administrator

| | |
|--|--|
| **RBAC mapping** | e.g. `community_admin` (+ often communications permissions) |
| **Sees** | All member surfaces + **Manage** |
| **Can** | Configure Community features for Tenant; publish official announcements; manage featured content; assign delegated roles within grant scope; view operational queues |
| **Does not** | Imply billing owner unless separately entitled (ADR-024) |

### 5.3 Group manager

| | |
|--|--|
| **RBAC mapping** | e.g. `group_admin` / organizer scoped to Group(s) |
| **Sees** | Member surfaces + Manage **limited to their Groups** |
| **Can** | Manage group membership presentation; host group experiences/meetings; moderate in-group threads; optionally manage group-linked resources if permitted |
| **Cannot** | Territory-wide official voice or other groups’ admin by default |

### 5.4 Moderator

| | |
|--|--|
| **RBAC mapping** | e.g. `moderator` (optionally Area-scoped) |
| **Sees** | Member surfaces + moderation queues in Manage |
| **Can** | Review `pending_review` content; hide/lock threads; act on reports; Area-limited if delegated |
| **Cannot** | Tenant configuration / role assignment unless also admin |

### 5.5 Role combination

One Person may hold Membership + multiple Role Assignments (e.g. resident + Aldea Golf moderator). UI adapts by **Permission checks**, not by swapping to a different app binary.

---

## 6. Main screens

Photography-first cards; one primary CTA per card; progressive disclosure.

### 6.1 Home

- Hero: community atmosphere photo + short greeting (“Good evening, {display name}”)  
- **Today / This week** strip (calendar + registrations)  
- **Official** announcement card (if any)  
- **For you** experiences / picks  
- Quick actions: Reserve · Report · Discover services  
- Optional Area chip: All | My area  

### 6.2 Discover

Segments (horizontal tabs or chips):

1. **Experiences** — engagement cards (ADR-027)  
2. **Services** — Directory + neighbor recommendations rail (ADR-017 / ADR-032)  
3. **Places** — reservable resources (ADR-031)  

Filters: Area, date, category. No spreadsheet layouts.

### 6.3 Calendar

- Agenda + month/week toggle (mobile defaults to agenda)  
- Items: experiences, events, meetings, reservations  
- Filters: Area, Groups, “Registered only”  
- Detail opens source entity sheet (system of record ≠ calendar copy — ADR-030)

### 6.4 Community

Sub-destinations (top chips, not deep hierarchy):

| Chip | Content |
|------|---------|
| **Feed** | News, announcements, activity (safe Activity projection) |
| **Groups** | Circles / committees (ADR-029) |
| **Talk** | Discussions / open threads |
| **Decide** | Proposals, polls, voting |

### 6.5 Me

- Community Profile (contextual — ADR-033)  
- Notifications inbox (Core — ADR-019)  
- Saves / follows  
- My registrations & reservations  
- My requests / incidents  
- Settings (privacy, notification prefs, language)  
- **Manage community** (role-gated)

### 6.6 Content detail (shared pattern)

Full-bleed media when available → title → Area/Territory context → body → participation module (register / reserve / vote / discuss) → social row (react, save, share-within-tenant) → related cards.

### 6.7 Manage (role-gated)

Card-based ops home — not a datagrid wall:

- Needs review  
- Open requests  
- Upcoming hosted activities  
- Reports  
- Publish official  
- (Admin) People & roles, Areas overview, feature toggles **as entitled**

---

## 7. Core user journeys

Each frequent journey targets **≤ 3 taps** from Home or bottom nav.

### 7.1 See today’s community pulse

1. Open app → **Home**  
2. Scan Today strip + official card  
3. Tap card → detail  

### 7.2 Register for an experience

1. **Discover → Experiences** (or Home card)  
2. Open experience → **Register**  
3. Confirm (capacity/waitlist messaging)

### 7.3 Reserve a court / amenity

1. **Discover → Places**  
2. Pick resource → pick slot  
3. Confirm reservation  

### 7.4 Find a local service

1. **Discover → Services**  
2. Search/category or “Neighbors recommend”  
3. Open Business/Official profile (Directory is source of truth for verification)

### 7.5 Report a broken light / request

1. Home quick action **Report** (or Me → Requests)  
2. Capture photo/video (Files Core capture — ADR-020) + Area + short text  
3. Submit → track in Me  

### 7.6 Read official announcement

1. Home official card **or** Community → Feed  
2. Open announcement  
3. Optional: save / react / notify prefs  

### 7.7 Participate in a decision

1. Community → **Decide**  
2. Open proposal/poll/vote  
3. Discuss and/or cast vote (when open)

### 7.8 Join a local circle

1. Community → **Groups**  
2. Open group → Join / Request  
3. Land in group feed / upcoming activities  

### 7.9 Moderator reviews content

1. Me → **Manage** → Needs review  
2. Open item → Approve / Reject  
3. Done (Audit + optional notify author)

### 7.10 Admin publishes official notice

1. Manage → **Publish official**  
2. Compose + scope (Territory or Area) + media  
3. Publish (or schedule) → Members notified via Core  

---

## 8. MVP scope — Life Panoramica pilot

### 8.1 In scope (pilot)

**Brand & shell**

- Life Panoramica branding only (white-label config — ADR-023)  
- Mobile-first shell with 5-tab nav + Create sheet  
- Area filter chips using seeded Areas  

**Community**

- Official announcements + news (publish path for admins)  
- Experiences/events/meetings: list, detail, register  
- Calendar agenda projection  
- Groups: list/join + simple group feed  
- Discussions on selected content; reactions; saves  
- Proposals + simple poll (one decision mechanic minimum)  
- Community Profile (basic fields + privacy defaults)  

**Services**

- Directory browse/search for Business + Official profiles  
- Neighbor recommendations rail (create tip/endorsement)  

**Operations**

- Member incident/request create + status tracking  
- Photo evidence upload via Core Files pipeline  

**Resources**

- Small set of reservable amenities (e.g. courts / room) with confirm/cancel  

**Governance (thin)**

- Manage mode: moderation queue + official publish + basic role-gated entry  
- RBAC only — no custom ACL  

**Platform wiring (must)**

- Tenant Context Life Panoramica  
- Membership-gated access  
- Notifications for publish / registration / reservation / request status  
- Audit on publish, moderate, role-sensitive admin actions  

### 8.2 Explicitly out of scope (pilot)

- Marketplace / paid checkout commerce  
- Full municipal election-grade voting cryptography  
- Cross-tenant social graph  
- Per-Area separate applications  
- Parallel permission system  
- Heavy desktop admin CRUD as the default product face  
- Displaying “Life Community OS” as the app name  
- Custom Panoramica-only backend architecture  

### 8.3 Success signals (qualitative pilot)

- Resident reaches register / reserve / report in ≤3 taps  
- Home feels photographic and calm, not like an admin console  
- Area filtering understood without training  
- Admins publish and moderate without a separate legacy portal  
- Architecture review: still reusable Community + Core configuration  

---

## 9. Design direction (guidance only)

- One composition per first viewport: brand **Life Panoramica**, one headline moment, one supporting line, primary CTAs, dominant imagery  
- Prefer full-bleed community photography over abstract dashboard chrome  
- Cards as **interaction containers** for content — avoid card spam in the hero  
- Motion: subtle, purposeful (feed entrance, tab transitions, success confirms) — not noise  
- Avoid generic purple-SaaS / generic cream-serif clichés; define a Panoramica-specific palette in a later visual design pass  

---

## 10. Traceability

| Topic | ADRs |
|-------|------|
| RBAC / no parallel AuthZ | 012, 034 |
| Community microapp & governance UX scope | 013, 025–034 |
| Platform vs tenant app | 014, 015, 023, 024 |
| Directory & recommendations | 016, 017, 032 |
| Incidents | 018 |
| Notifications / Files / Audit / Search | 019–022 |
| Identity / Membership / Profile | 010, 011, 033 |
| Areas / Groups / Calendar / Resources | 005, 029, 030, 031 |

---

## 11. Next steps (after this foundation)

1. Visual design system tokens for Life Panoramica (brand, type, photo treatment)  
2. Low-fi wireflows for the 10 journeys above  
3. Screen inventory → reusable UI components in shared `packages/ui` (still no tenant fork)  
4. Permission catalogue mapping for pilot roles (Platform RBAC config, not new AuthZ)  
5. Only then: implement app routes under white-label Tenant shell  

---

## Decision summary

**Life Panoramica** is the only consumer-facing identity. The experience is a premium, mobile-first community product configured on Life Community OS Platform Core + Community microapp, with RBAC-gated Manage for staff — not a SaaS dashboard and not a Panoramica-specific architecture.
