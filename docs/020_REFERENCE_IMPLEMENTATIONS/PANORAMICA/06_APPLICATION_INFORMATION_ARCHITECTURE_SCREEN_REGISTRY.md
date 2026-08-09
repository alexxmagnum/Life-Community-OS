# Application Information Architecture & Screen Registry

Version: 1.0  
Status: Draft  
Document Type: Platform Product Map (Reference tenant: Life Panoramica)  
Depends on:

- `01_UX_PRODUCT_FOUNDATION.md`
- `02_VISUAL_DESIGN_SYSTEM.md`
- `03_HIFI_PRODUCT_SCREENS.md`
- `04_MULTI_TENANT_UI_COMPONENT_SYSTEM.md`
- `05_CORE_USER_JOURNEY_WIREFLOWS.md`
- ADRs 012–034 (especially 012, 014, 017–020, 023–034)

No code · No migrations · No new ADRs

---

## 1. Purpose

This document is the **product map** for the Life Community OS consumer application shell:

- application layers  
- navigation architecture  
- complete screen registry  
- screen responsibilities and access  
- reusable patterns  
- relationships, deep links, notification targets  

It is the blueprint developers and AI agents must follow **before** implementing routes or pages.

### What this is not

- A backend module tree  
- A database-table-to-CRUD page generator  
- A Panoramica-only fork  
- A parallel permission model  

### Brand rule

Consumer identity = **tenant product name** (reference: **Life Panoramica**).  

Never expose in UI: Life Community OS, microapp names, ADR titles, or engineering concepts.

### Core IA principle

Organize around **human intent**, not modules:

| Human question | Primary surface |
|----------------|-----------------|
| What is happening? | Home, Calendar, Community Feed |
| What can I do? | Discover, Create Sheet |
| Where can I participate? | Experiences, Groups, Decide |
| What needs my attention? | Me (inbox, requests, registrations) |
| How do I solve this? | Report, Reserve, Services |

---

## 2. Application layers

```
┌──────────────────────────────────────────────────────────┐
│ 4. MANAGE EXPERIENCE     RBAC-gated stewardship mode     │
├──────────────────────────────────────────────────────────┤
│ 3. CREATE EXPERIENCE     Global creation overlays/flows  │
├──────────────────────────────────────────────────────────┤
│ 2. MEMBER EXPERIENCE     Authenticated community life    │
│    Home · Discover · Calendar · Community · Me           │
├──────────────────────────────────────────────────────────┤
│ 1. PUBLIC EXPERIENCE     Pre-auth / invitation           │
└──────────────────────────────────────────────────────────┘
         ↑ Tenant theme + feature config + content
```

### Layer 1 — Public Experience

Before (or during) authentication. Tenant-branded only.

| Intent | Screens |
|--------|---------|
| Arrive | WelcomeScreen, Splash (cold start) |
| Join | TenantInvitationScreen |
| Sign in | AuthenticationScreen |
| Wait | MembershipPendingScreen (optional) |

### Layer 2 — Member Experience

Authenticated Person with active Membership (ADR-011). Five-destination IA.

| Intent | Destinations |
|--------|--------------|
| Pulse | HomeScreen |
| Explore | DiscoverScreen (+ segments) |
| When | CalendarScreen |
| Belong / talk / decide | CommunityHubScreen (+ canonical areas) |
| Self | ProfileScreen (Me) |

### Layer 3 — Create Experience

Global creation hub and compose flows. Entry via Create Sheet / quick actions. Capability + RBAC gated; feature-config gated.

### Layer 4 — Manage Experience

Stewardship **mode** — not a sixth philosophy of the product. Visible only with governance Permissions (ADR-034). Card-based ops, not enterprise CRUD walls.

---

## 3. Navigation architecture

### 3.1 Why navigation stays simple

- Residents are not operators of a suite of products.  
- Five destinations match the mental model in `01`.  
- Frequent actions use **Create Sheet** and Home quick actions (≤3 taps) instead of more tabs.  
- Areas are **filters**, not apps.  
- Manage is **mode-gated**, not permanent nav clutter.  
- White-label tenants share the same IA; features hide, they don’t spawn new primary tabs.

### 3.2 Mobile

| Element | Spec |
|---------|------|
| Bottom nav | Home · Discover · Calendar · Community · Me |
| Create | FAB or center affordance → CreateSheet |
| Area | Optional chip row: All \| My area \| named Areas |
| Sheets | Detail and compose prefer bottom sheets |

### 3.3 Desktop / large screens

| Element | Spec |
|---------|------|
| Primary nav | Left rail **or** top bar with the **same five** destinations |
| Create | Rail footer / header button → same CreateSheet |
| Content | Photography-led multi-column; not datagrid shell |
| Manage | Same mode entry from Me; wider ops canvases |

Responsive rule: **same information architecture**; layout adapts, destinations do not fork.

### 3.4 Feature-aware nav

If a capability is disabled (ADR-023 / 024):

- Hide CreateSheet actions for that capability.  
- Hide Discover segments / Community chips that only exist for that capability.  
- Do not leave dead links or “module coming soon” clutter unless product explicitly wants a teaser.

---

## 4. Reusable screen patterns

| Pattern | Used by | Behaviour |
|---------|---------|-----------|
| `TenantAppShell` | All member screens | Theme, nav, Create, Area context |
| `ContentDetailSheet` | Experiences, announcements, services, resources, incidents | Media → title → body → primary action → social row |
| `ComposeFlow` | Create experience/post/proposal/incident | Multi-step; media-first when relevant |
| `DiscoveryBrowse` | Discover segments | Search + filters + cards |
| `ListWithFilters` | Groups, reservations, incidents, moderation | Chips + cards (not tables as default) |
| `ManageOpsHome` | Admin dashboard | Attention cards → queues |
| `ConfirmGate` | Register, reserve, destructive | Short confirm sheet |

Screen IDs below use **platform names** only (`ExperienceDetailScreen`, never `PanoramicaGolfExperienceScreen`).

---

## 5. Access model (RBAC + Membership + Config)

| Concept | Meaning in IA |
|---------|----------------|
| **Membership** | Belonging — may enter Member layer |
| **RBAC Permission** | May perform privileged actions / see Manage |
| **Feature config** | Capability exists for this Tenant |
| **Visibility scope** | Territory / Area / Group audience on content |

### Capability surfaces (UX personas → Permissions)

| Persona | Typical visibility |
|---------|-------------------|
| **Member** | Layers 1–3 as entitled; no Manage |
| **Group manager** | Member + Manage limited to their Groups |
| **Moderator** | Member + ModerationQueue (+ Area scope if delegated) |
| **Community admin** | Member + full Manage surfaces entitled by Permissions |

UI **hides** unavailable actions. No parallel AuthZ.

---

## 6. Screen registry

### Registry conventions

Each screen lists: purpose, user goal, roles, tenant scope, RBAC, entry points, components, journeys, states, mobile/desktop.

**Tenant scope:** always inside current Tenant Context (fail closed).  
**States (default):** loading = skeletons; empty = photographic calm + CTA; error = inline retry; permission denied = hide or soft deny; offline = cached read + blocked writes with plain message.

---

### 6.1 Public

#### WelcomeScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Brand arrival before auth |
| **User goal** | Confirm I’m in the right community |
| **Roles** | Anonymous |
| **Tenant scope** | Resolved tenant from domain / invite / install |
| **RBAC** | None |
| **Entry** | Cold start no session; logout |
| **Components** | `ResponsiveImage`, brand wordmark, `ButtonPrimary` |
| **Journeys** | §1 Onboarding |
| **Mobile** | Full-bleed photo + Continue |
| **Desktop** | Centered brand panel on atmospheric background |

#### AuthenticationScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Sign in / register with minimal friction |
| **User goal** | Access my community securely |
| **Roles** | Anonymous → Person |
| **Tenant scope** | Current tenant |
| **RBAC** | Auth only |
| **Entry** | Welcome; deep link; session expiry |
| **Components** | Large inputs, `ButtonPrimary`, optional SSO buttons |
| **Journeys** | §1 |
| **Mobile** | One primary method; large targets |
| **Desktop** | Same flow, constrained width |

#### TenantInvitationScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Accept invite / understand who invited me |
| **User goal** | Join this community |
| **Roles** | Invitee |
| **Tenant scope** | Invite’s tenant |
| **RBAC** | Invite token validation |
| **Entry** | Email/SMS/QR deep link |
| **Components** | Brand hero, invite summary, `ButtonPrimary` |
| **Journeys** | §1 |
| **States** | Expired invite → contact office copy |
| **Mobile / Desktop** | Same steps; mobile camera QR optional |

#### MembershipPendingScreen *(optional)*

| Field | Definition |
|-------|------------|
| **Purpose** | Calm wait while Membership is approved |
| **User goal** | Know I’m not stuck |
| **Roles** | Pending member |
| **Entry** | Post-auth pending Membership |
| **Journeys** | §1 |

#### SplashScreen *(system)*

Cold/warm start brand moment → Welcome, Auth, or Home (`03`).

---

### 6.2 Member core

#### HomeScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Personalized community pulse + quick actions |
| **User goal** | Know what’s happening and act fast |
| **Roles** | Member+ |
| **Tenant scope** | Territory; Area filter |
| **RBAC** | View published; quick actions if permitted |
| **Entry** | Default post-auth; bottom nav |
| **Components** | Hero, `AnnouncementCard`, `ExperienceCard`, `QuickAction`, `FloatingCreateControl`, Area chips |
| **Journeys** | §2 Daily Home; entry to §3–9 |
| **Mobile** | Bottom nav + FAB; hero budget per `02`/`03` |
| **Desktop** | Rail + wider For you grid — not KPI dashboard |

#### DiscoverScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Visual exploration hub |
| **User goal** | Find something to do / use / trust |
| **Roles** | Member+ |
| **Config** | Segments appear only if Experiences / Services / Places enabled |
| **Entry** | Nav; Home Discover CTA |
| **Components** | `SearchField`, segment chips, card rails |
| **Journeys** | §4, §7, §9 |
| **Children** | ExperienceList (segment), ServicesDiscovery, ResourceDiscovery |

#### CalendarScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Time-based view of my community life |
| **User goal** | Know when things happen |
| **Roles** | Member+ |
| **RBAC** | View calendar projections (ADR-030) |
| **Entry** | Nav; notification “starts soon” |
| **Components** | Agenda list, month/week toggle, filters |
| **Journeys** | §2, §4, §7 |
| **Mobile** | Agenda default |
| **Desktop** | Week/month optional split |

#### CommunityScreen / CommunityHubScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Belonging hub — territory life for neighbours (D.0.7.1.1) |
| **User goal** | Enter the community and navigate its areas |
| **Roles** | Member+ |
| **Config** | Areas gated by Module Registry + Tenant Configuration + features |
| **Entry** | Bottom nav Comunidad; hamburger Comunidad leaves (same hub) |
| **Canonical areas** | Actualidad · Grupos · Conversaciones · Canales · Propuestas · Participación · Espacios comunitarios · Mascotas |
| **Source of truth** | `tenants/life-panoramica/src/community-hub.ts` |
| **Components** | Chip tabs (`FilterChipRow`), feed cards, `GroupCard`, area surfaces |
| **Journeys** | §5, §6 |
| **Children** | Area surfaces; contextual Conversation screens remain under Group / Experience / Work / Official |
| **Anti-goal** | Not a chat app / global inbox |

#### ProfileScreen *(Me)*

| Field | Definition |
|-------|------------|
| **Purpose** | My presence, attention, stuff, settings; Manage gate |
| **User goal** | Manage myself in this community |
| **Roles** | Member+; Manage link if entitled |
| **RBAC** | Edit own Community Profile; Manage entry Permission-gated |
| **Entry** | Nav; profile deep links |
| **Components** | `ProfileHeader`, `Avatar`, list rows, notification entry |
| **Journeys** | §1 (edit), §5 (saves), §8 (requests), §10 (Manage) |
| **Children** | NotificationsInbox, MyReservations, MyIncidents, Saves, Settings, Manage entry |

---

### 6.3 Create

#### CreateSheet

| Field | Definition |
|-------|------------|
| **Purpose** | Global action menu of allowed creates |
| **User goal** | Start doing something in ≤1 tap from Create |
| **Roles** | Member+ with ≥1 create Permission |
| **Config** | Only list enabled + permitted actions |
| **Entry** | FAB; Home Report/more; rail Create |
| **Components** | `CreateSheet`, action rows |
| **Journeys** | §3, §6, §8, §9 tip |
| **Mobile** | Bottom sheet |
| **Desktop** | Modal or anchored panel — same actions |

#### CreateExperienceScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Compose experience/event/meetup |
| **User goal** | Invite others to an activity |
| **Roles** | Organizer-capable members |
| **RBAC** | Create/publish experience |
| **Entry** | CreateSheet → Experience; Group → Create |
| **Components** | ComposeFlow, `CameraCapture`, `MediaPreview`, preview `ExperienceCard` |
| **Journeys** | §3 |
| **States** | Draft save; pending_review |

#### CreatePostScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Compose community post / news item (non-official unless entitled) |
| **User goal** | Share something with the community |
| **Roles** | Members with post Permission |
| **Entry** | CreateSheet → Post; Community compose |
| **Components** | Composer, optional media |
| **Journeys** | §5 (leads to interaction) |

#### CreateProposalScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Compose proposal / poll seed |
| **User goal** | Start a decision |
| **Roles** | Members with propose Permission; admins |
| **Config** | Hidden if Decide disabled |
| **Entry** | CreateSheet; Community → Decide |
| **Journeys** | Foundation §7.7 |

#### CreateIncidentScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Report problem with media + context |
| **User goal** | Get something fixed / noticed |
| **Roles** | Members with request Permission |
| **Config** | Hidden if Incidents off |
| **Entry** | Home Report; CreateSheet; MyIncidents → New |
| **Components** | `CameraCapture`, `VideoCapture`, `MediaPreview`, Area chips |
| **Journeys** | §8 |

#### CreateGroupScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Create circle/group |
| **User goal** | Start a group |
| **Roles** | Create-group Permission |
| **Entry** | CreateSheet; GroupList → Create |
| **Journeys** | §6 |

#### CreateRecommendationScreen *(optional action)*

Tip/endorsement compose — CreateSheet when Recommendations enabled (ADR-032).

---

### 6.4 Discovery

#### ServicesDiscoveryScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Browse/search Directory services |
| **User goal** | Find local help |
| **Roles** | Member+ |
| **Config** | Services/Directory on |
| **Entry** | Discover → Services; Home CTA; Search |
| **Components** | `SearchField`, `ServiceCard`, recommendation rail |
| **Journeys** | §9 |

#### ServiceDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Business/Official profile detail (Directory SoT) |
| **User goal** | Contact / understand a service |
| **Entry** | ServicesDiscovery; Recommendation link; Search |
| **Components** | `ServiceCard` expanded, `ResponsiveImage`, save |
| **Journeys** | §9 |

#### PlaceDetailScreen

Alias surface for **ResourceDetailScreen** when reached from Places (same entity, human “place” copy). Prefer one implementation: `ResourceDetailScreen`.

#### RecommendationDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Neighbour tip detail (not Directory verification) |
| **User goal** | Trust a neighbour signal |
| **Entry** | Discover rail; Search |
| **Components** | `RecommendationCard`, optional linked `ServiceCard` |
| **Journeys** | §9 |
| **Copy** | Clearly “Neighbour recommendation” |

---

### 6.5 Experiences

#### ExperienceListScreen

| Field | Definition |
|-------|------------|
| **Purpose** | List/filter experiences |
| **User goal** | Browse what’s on |
| **Entry** | Discover → Experiences; deep link category |
| **Components** | `ExperienceCard`, `EventCard`, filters |
| **Journeys** | §4 |
| **Note** | May be Discover segment rather than separate route |

#### ExperienceDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Full experience story + join |
| **User goal** | Decide to participate |
| **Roles** | Members in visibility scope |
| **Entry** | Home; Discover; Calendar; notification; Group |
| **Components** | ContentDetailSheet, `OrganizerCard`, social row |
| **Journeys** | §4, §5 |

#### ExperienceRegistrationScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Confirm registration / waitlist |
| **User goal** | Secure my place |
| **RBAC** | Register Permission |
| **Entry** | ExperienceDetail → Register |
| **Components** | `ConfirmDialog` / confirm sheet |
| **Journeys** | §4 |
| **States** | Full → waitlist; cancelled experience |

---

### 6.6 Community

#### CommunityFeedScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Activity/news stream |
| **User goal** | Catch up on community voice |
| **Entry** | Community → Feed; may be default Community chip |
| **Components** | `AnnouncementCard`, `CommunityPostCard`, `CommunityFeed` pattern |
| **Journeys** | §2, §5 |

#### GroupListScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Discover/join groups |
| **User goal** | Find my circle |
| **Config** | Groups enabled |
| **Entry** | Community → Groups |
| **Components** | `GroupCard`, search |
| **Journeys** | §6 |

#### GroupDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Group home — feed, members, upcoming |
| **User goal** | Participate in the circle |
| **Roles** | Members; managers see manage actions |
| **Entry** | GroupList; invite link; notification |
| **Components** | `ProfileHeader` (group), `MemberCard`, `ExperienceCard` |
| **Journeys** | §6, §3 scoped |

#### ConversationScreen *(Interaction)*

| Field | Definition |
|-------|------------|
| **Purpose** | Threaded comments/replies on a content entity |
| **User goal** | Discuss *this* thing |
| **RBAC** | Comment Permission; locked threads hide composer |
| **Entry** | Content detail → comments; Talk chip; notification “new reply” |
| **Components** | SocialInteractionBar, `Avatar`, composer |
| **Journeys** | §5 |
| **Anti-goal** | Not a global DM/social network |

#### DecideListScreen / ProposalDetailScreen *(Decide)*

Community → Decide when enabled; proposal/poll detail + vote — Permissions for cast vote; reactions never replace formal votes (ADR-028).

---

### 6.7 Resources

#### ResourceDiscoveryScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Browse reservable places/amenities |
| **User goal** | Find something to book |
| **Config** | Reservations/Resources on |
| **Entry** | Discover → Places; Home Reserve |
| **Components** | `ResourceCard`, filters |
| **Journeys** | §7 |

#### ResourceDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Place story + availability entry |
| **User goal** | Choose when to book |
| **Entry** | ResourceDiscovery; Search; Experience venue link |
| **Components** | Media, policy summary, slot entry |
| **Journeys** | §7 |

#### ReservationFlowScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Slot select → policy → confirm |
| **User goal** | Complete a booking |
| **RBAC** | Create reservation |
| **Entry** | ResourceDetail → Reserve |
| **Components** | Slot chips, `ConfirmDialog` |
| **Journeys** | §7 |
| **States** | Conflict refresh; pending_approval |

#### ReservationDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | View/cancel one reservation |
| **User goal** | Manage my booking |
| **Entry** | MyReservations; Calendar; **notification “reservation confirmed”** |
| **Journeys** | §7 |

#### MyReservationsScreen

| Field | Definition |
|-------|------------|
| **Purpose** | List my bookings |
| **User goal** | See what I’ve reserved |
| **Entry** | ProfileScreen → Reservations |
| **Components** | ListWithFilters |
| **Journeys** | §7 |

---

### 6.8 Incidents

#### CreateIncidentScreen

Defined under Create (§6.3).

#### IncidentDetailScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Status + media + history for one request |
| **User goal** | Track progress |
| **Roles** | Reporter; ops with view Permission |
| **Entry** | MyIncidents; notification status change; Manage queue |
| **Components** | `MediaGallery`, status timeline (human labels) |
| **Journeys** | §8 |
| **Copy** | No engineering lifecycle enum names as primary UI |

#### MyIncidentsScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Reporter’s request list |
| **User goal** | See what I reported |
| **Entry** | ProfileScreen → Requests |
| **Config** | Incidents on |
| **Journeys** | §8 |

---

### 6.9 Me utilities

| Screen | Purpose | Entry |
|--------|---------|-------|
| NotificationsInboxScreen | Attention inbox (ADR-019) | Me; bell |
| SavesScreen | Saved content (ADR-028) | Me → Saves |
| SettingsScreen | Privacy, notification prefs, language, Area default | Me → Settings |
| CommunityProfileEditScreen | Edit Community Profile (ADR-033) | Me → Edit profile |
| OnboardingProfileScreen | First-run profile/interests | §1 after auth |

---

### 6.10 Manage

All Manage screens: **Permission-gated**; feature-config aware; Audit on sensitive actions (ADR-021). Consumer chrome still shows **tenant name**, not platform name.

#### AdminDashboardScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Ops home — what needs attention |
| **User goal** | Steward the community today |
| **Roles** | Admin / moderator / group manager (scoped tiles) |
| **Entry** | Me → Manage community; Live/Manage switch |
| **Components** | ManageOpsHome cards |
| **Journeys** | §10 |
| **Mobile** | Card stack |
| **Desktop** | Multi-column attention board |

#### ContentManagementScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Official publish / featured content |
| **User goal** | Speak with community voice |
| **RBAC** | Official publish Permissions |
| **Entry** | Manage → Publish / Content |
| **Journeys** | §10a |

#### ModerationQueueScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Review pending content & abuse reports |
| **User goal** | Keep community healthy |
| **RBAC** | Moderate Permissions (optional Area scope) |
| **Entry** | Manage → Needs review; notification |
| **Journeys** | §10b |

#### ExperienceManagementScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Hosted/upcoming experiences ops |
| **User goal** | Manage activities I/we host |
| **RBAC** | Organize / manage experiences |
| **Entry** | Manage → Experiences; Group manage |
| **Journeys** | §3, §10 |

#### ResourceManagementScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Availability policies; approve reservations |
| **User goal** | Keep places fair and bookable |
| **RBAC** | Manage resources / approve |
| **Entry** | Manage → Places |
| **Journeys** | §10c |

#### TenantConfigurationScreen

| Field | Definition |
|-------|------------|
| **Purpose** | Features, branding assets, defaults (ADR-023) |
| **User goal** | Configure this community experience |
| **RBAC** | Tenant config Permissions (narrow set) |
| **Entry** | Manage → Settings |
| **Journeys** | §10d |
| **Note** | Not billing owner console unless also entitled (ADR-024) |

#### MemberManagementScreen

| Field | Definition |
|-------|------------|
| **Purpose** | People overview; role assignment within grant |
| **User goal** | Invite / assign stewardship roles |
| **RBAC** | People & role assignment Permissions |
| **Entry** | Manage → People |
| **Journeys** | §10 |
| **Anti-pattern** | Custom ACL matrix UI |

---

## 7. Screen relationships

### 7.1 Parent / child (logical)

```
Public
  Welcome → Authentication → (Invitation) → (Pending) → Member

Member shell
  Home
  Discover
    ├─ ExperienceList → ExperienceDetail → ExperienceRegistration
    ├─ ServicesDiscovery → ServiceDetail
    │                    → RecommendationDetail
    └─ ResourceDiscovery → ResourceDetail → ReservationFlow → ReservationDetail
  Calendar → (opens source detail sheets)
  Community
    ├─ CommunityFeed → ContentDetail → Conversation
    ├─ GroupList → GroupDetail → (CreateExperience scoped)
    └─ Decide → ProposalDetail
  Me (Profile)
    ├─ NotificationsInbox → (deep target screens)
    ├─ MyReservations → ReservationDetail
    ├─ MyIncidents → IncidentDetail
    ├─ Saves → ContentDetail
    ├─ Settings / ProfileEdit
    └─ Manage (if permitted)
         ├─ AdminDashboard
         ├─ ContentManagement
         ├─ ModerationQueue → ContentDetail
         ├─ ExperienceManagement → ExperienceDetail
         ├─ ResourceManagement → ResourceDetail
         ├─ TenantConfiguration
         └─ MemberManagement

Create (overlay)
  CreateSheet → CreateExperience | CreatePost | CreateProposal
             | CreateIncident | CreateGroup | CreateRecommendation
```

### 7.2 Primary navigation paths

| From | To | Trigger |
|------|----|---------|
| Any member tab | CreateSheet | Create affordance |
| Home | CreateIncident / Reserve / Discover | Quick actions |
| Calendar item | Source detail | Tap |
| Notification | Target screen | Tap |
| GroupDetail | CreateExperienceScreen | Create activity |
| ExperienceDetail | ConversationScreen | Comments |
| Manage | Queues / publish | Ops cards |

### 7.3 Deep links (patterns)

| Pattern | Opens |
|---------|-------|
| `/invite/{token}` | TenantInvitationScreen |
| `/experiences/{id}` | ExperienceDetailScreen |
| `/groups/{id}` | GroupDetailScreen |
| `/reservations/{id}` | ReservationDetailScreen |
| `/requests/{id}` | IncidentDetailScreen |
| `/services/{id}` | ServiceDetailScreen |
| `/manage/moderation/{id}` | Moderation item (RBAC) |

All deep links resolve **inside Tenant Context**; cross-tenant IDs fail closed.

### 7.4 Notifications → screens

| Notification (human) | Target screen |
|----------------------|---------------|
| Your reservation is confirmed | ReservationDetailScreen |
| Reminder: experience starts soon | ExperienceDetailScreen |
| New reply to your comment | ConversationScreen (anchored) |
| You were mentioned | ConversationScreen / ContentDetail |
| Request update: In progress | IncidentDetailScreen |
| You’re approved to join | HomeScreen (or GroupDetail if group invite) |
| Official announcement | ContentDetail (announcement) |
| Needs your review | ModerationQueueScreen / item |
| Reservation awaiting approval | ResourceManagementScreen / ReservationDetail |

---

## 8. Feature configuration matrix

| Capability off | UI effect |
|----------------|-----------|
| Experiences | Hide Discover Experiences; hide Create Experience; Calendar filters adjust |
| Services / Directory | Hide Services segment & related Create tips to services |
| Recommendations | Hide tips rail & Create recommendation |
| Resources / Reservations | Hide Places, Reserve quick action, My Reservations |
| Incidents | Hide Report, Create Incident, My Incidents |
| Groups | Hide Groups chip & Create Group |
| Decide / Proposals | Hide Decide chip & Create Proposal |
| Marketplace | Remains off for Panoramica pilot — no Sell UI |

Disabled capabilities **must not expose UI**.

Example packaging:

| Tenant type | Often on |
|-------------|----------|
| Private community (Panoramica-like) | Experiences, Groups, Reservations, light Incidents, Services |
| Municipality | Incidents, Proposals, Services, official publish |
| Resort / Club | Experiences, Reservations, Groups, concierge-like Services |

---

## 9. Reusability rules

1. **Platform screen IDs only** — no tenant prefixes.  
2. **Theme + content + config** differentiate tenants — not forked screens.  
3. **One detail pattern** for content-like entities.  
4. **No duplicate screens** for the same goal (e.g. one ResourceDetail for “Places”).  
5. **Agents must consult this registry** before adding routes.  
6. **Life Panoramica** = reference theme pack + sample content, not a special codebase branch of screens.

### SaaS checklist

- [ ] Screen works for Life Resort with only brand/config/content changes?  
- [ ] Name has no tenant or golf-specific hardcoding?  
- [ ] Hidden when capability/Permission missing?  
- [ ] Tenant isolation assumed?  
- [ ] Matches a journey in `05`, not a database table?

---

## 10. Quality bar

| Requirement | IA implication |
|-------------|----------------|
| Mobile first | Bottom nav + sheets; desktop is adaptation |
| Premium UX | Photography-led destinations; no menu sprawl |
| Accessibility | Large targets; plain language screen titles |
| White-label | Shell reads tenant tokens |
| Scale | Five tabs + Create + Manage mode scales better than 50 CRUD links |

### Forbidden

- Hundreds of menu items  
- Technical naming in nav (“Microapp Community”, “RBAC Admin”)  
- Module-based primary navigation  
- Panoramica-only screen classes  
- Screens that exist only because a table exists  

---

## 11. Implementation guidance (for agents)

1. Implement `TenantAppShell` + five member roots first.  
2. Wire CreateSheet to gated compose screens.  
3. Add detail sheets used by multiple journeys.  
4. Add Me utilities + notification deep links.  
5. Add Manage mode last among consumer surfaces, still card-based.  
6. Never invent routes not in this registry without product review.  
7. Respect ADRs for Permissions, Files, Notifications, Tenant Context.

---

## 12. Decision summary

The application is a **four-layer, goal-based product map**: Public → Member (five destinations) → Create → Manage. The screen registry defines reusable, Permission-aware, feature-configurable screens that any tenant — starting with Life Panoramica — can run without forking. Navigation stays intentionally small; complexity lives in content and configuration, not in menus.
