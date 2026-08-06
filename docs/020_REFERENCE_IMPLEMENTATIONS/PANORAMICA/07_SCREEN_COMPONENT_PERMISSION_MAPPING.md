# Screen · Component · Permission Mapping

Version: 1.0  
Status: Draft  
Document Type: Product Implementation Contract  
Reference tenant experience: **Life Panoramica** (theme + config — not a fork)  
Depends on:

- `01`–`06` in this folder  
- ADR-012, 014, 015, 019–021, 023, 025–034  

No code · No schemas · No migrations · No new ADRs

---

## 1. Purpose

This document is the **implementation contract** between:

| Layer | Responsibility |
|-------|----------------|
| Product experience | Screens, journeys, human goals (`05`, `06`) |
| UI system | Reusable components & patterns (`04`) |
| RBAC | Authorization — who may act (ADR-012, 034) |
| Feature configuration | What exists for this Tenant (ADR-023, 024) |
| Multi-tenant architecture | Tenant isolation; white-label reuse |

### Why it exists

So developers and AI agents can implement screens **without inventing**:

- UI-only permissions  
- component-local ACL  
- tenant-specific security forks  
- random pages mapped from database tables  

### Core principle

**The UI does not define security.**

```
Feature config  →  “Does this capability exist here?”
RBAC            →  “May this Person perform this action?”
Membership      →  “Do they belong to this community?”
Tenant Context  →  “Which isolation boundary?”
UI              →  Reflects the above (show / hide / disable)
```

| Concept | Meaning |
|---------|---------|
| Membership | Belonging (ADR-011) |
| RBAC Permission | Authorization (ADR-012) |
| Tenant | Security boundary (ADR-002 / 003) |
| Feature flag / entitlement | Availability (ADR-023 / 024) |

Never create: hidden ACL systems, permissions inside presentational components, or parallel AuthZ.

### Brand rule

Consumer UI shows **Life Panoramica** (or active tenant name) only. Permission keys and feature keys are **engineering contracts** — never shown as product chrome.

---

## 2. Mapping Model

Every screen is described as:

```
Screen
  ├── purpose / user goal
  ├── components (primary / secondary / patterns)
  ├── capabilities (product capability IDs)
  ├── permissions (RBAC keys — AuthZ source of truth)
  ├── feature dependencies (availability gates)
  ├── role visibility (UX personas → typical actions)
  └── tenant behaviour (theme / config / fail-closed)
```

### Example (canonical)

**ExperienceDetailScreen**

| Dimension | Mapping |
|-----------|---------|
| **Purpose** | Show one experience and allow join |
| **User goal** | Decide to participate |
| **Components** | `ResponsiveImage` (hero), `OrganizerCard`, participant summary, `ButtonPrimary` (Join), `SocialInteractionBar` |
| **Capabilities** | `community.experience.view`, `community.experience.join`, `community.interaction.react`, `community.interaction.comment` |
| **Permissions (typical)** | View/join/react/comment for member roles; organize/edit for organizer; moderate for moderator |
| **Feature** | `community.experiences.enabled` |
| **Tenant** | Same screen; Panoramica content + theme tokens |

### Evaluation order (UI must mirror)

```
1. Tenant Context resolved (fail closed)
2. Plan allows feature?          (ADR-024)
3. Tenant feature enabled?       (ADR-023)
4. Membership eligible?          (ADR-011)
5. Permission granted?           (ADR-012)
6. Render action / fetch data
```

If (2) or (3) fail → **hide surface** (no dead links).  
If (5) fails → **hide or soft-deny action** (never invent grant).  
If (1) fails → **no tenant data**.

### Naming conventions (engineering)

| Kind | Pattern | Example |
|------|---------|---------|
| Feature flag | `{domain}.{slice}.enabled` | `community.experiences.enabled` |
| Capability ID | `{domain}.{entity}.{verb}` | `community.experience.create` |
| Permission key | Same family as ADR-012 catalogue | `community.experience.create` |

Capability IDs in this doc are the **product/AuthZ catalogue for implementation**. Exact Role bundles are assigned via RBAC; Membership type alone never grants them.

---

## 3. Global Permission Principles

### 3.1 How RBAC affects UI

| AuthZ result | UI behaviour |
|--------------|--------------|
| Feature off | Remove nav entry, Create action, routes, search hits |
| Feature on + no Permission | Hide privileged CTA; allow view-only if view Permission exists |
| Permission present | Show enabled control |
| Destructive / irreversible | Show + `ConfirmDialog`; Audit on success (ADR-021) |

Presentational components (`ExperienceCard`, `ButtonPrimary`) **receive** allowed actions from screen/container logic that already queried AuthZ — they do not call a private permission system.

### 3.2 How roles affect actions (UX personas)

Personas are labels for Role Assignments — not AuthZ engines:

| Persona | Typical Permission sets |
|---------|-------------------------|
| Resident / member | view, join, reserve, report, comment, react, save, limited create |
| Group manager | member + group manage + organize within Group scope |
| Moderator | member + content review / hide / handle reports (optional Area scope) |
| Community admin | official publish, configure community, broader manage |
| Tenant config / owner | tenant configuration, role assign (narrow; separate from “resident”) |

Exact keys live in Role definitions; UI checks **Permissions**, not persona strings.

### 3.3 Disabled features disappear

Per ADR-023:

- Hide UI entry points  
- APIs reject new ops  
- Search must not surface as active  
- No notification fan-out for new events of that feature  

### 3.4 Tenant scope

- All member/manage screens operate inside **Tenant Context**.  
- Territory/Area/Group are **audience / organization scopes**, not alternate security roots.  
- Deep links and notifications resolve in-tenant or fail closed.

### 3.5 Audit & notifications

| Action class | Side systems |
|--------------|--------------|
| Publish, moderate, role assign, config change | Audit (ADR-021) |
| Join, reserve, report status, mention, official publish | Notifications (ADR-019) |
| Media upload | Files Core (ADR-020) — no per-screen file AuthZ fork |

---

## 4. Screen Mapping

Legend for **Actions** columns: shown only when feature **and** Permission allow.

---

### 4.1 Public

#### WelcomeScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Brand arrival |
| **Goal** | Confirm right community |
| **Components** | `ResponsiveImage`, tenant wordmark, `ButtonPrimary` |
| **Capabilities** | `platform.public.welcome` |
| **Permissions** | None (anonymous) |
| **Features** | Always (tenant resolved) |
| **Roles** | Anonymous |
| **Tenant** | Theme + logo + hero imagery |

#### AuthenticationScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Sign in / register |
| **Goal** | Authenticate Person |
| **Components** | Form fields, `ButtonPrimary`, optional SSO |
| **Capabilities** | `platform.auth.sign_in` |
| **Permissions** | Authentication only |
| **Features** | Tenant auth methods from config |
| **Roles** | Anonymous → authenticated Person |

#### TenantInvitationScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Accept community invite |
| **Goal** | Join this Tenant community |
| **Components** | Hero, invite summary, `ButtonPrimary` |
| **Capabilities** | `community.membership.accept_invite` |
| **Permissions** | Valid invite token; Membership creation path |
| **Features** | Invitation flows enabled for Tenant |
| **States** | Expired → plain recovery copy |

---

### 4.2 Member core

#### HomeScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Community pulse + quick actions |
| **Goal** | Know what’s happening; act fast |
| **Primary components** | Hero/`ResponsiveImage`, Area `FilterChipGroup`, `AnnouncementCard`, `ExperienceCard`, `RecommendationCard`, `QuickAction`, `FloatingCreateControl` |
| **Patterns** | `TenantAppShell` |
| **Capabilities** | `community.home.view`; optional slices for announce/experience/recommend/reserve/report shortcuts |
| **Permissions** | View published content; Create/Reserve/Report CTAs need matching create Permissions |
| **Features** | Shell always for members; rails respect per-slice flags |
| **Roles** | All members; Manage never on Home |
| **Responsive** | Mobile FAB; desktop rail Create |

#### DiscoverScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Exploration hub |
| **Goal** | Find experiences / services / places |
| **Components** | `SearchField`, segment chips, card grids |
| **Capabilities** | `community.discover.view` + segment caps |
| **Permissions** | View directory/experiences/resources as entitled |
| **Features** | Segment visible iff corresponding `*.enabled` |
| **Roles** | Members |

#### CalendarScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Time view of community life |
| **Goal** | Know when things happen |
| **Components** | Agenda, filters, calendar item rows |
| **Capabilities** | `community.calendar.view` |
| **Permissions** | View projections for visible entities |
| **Features** | Items only from enabled sources (experiences, reservations, meetings) |
| **Roles** | Members |

#### CommunityScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Belong / talk / decide hub |
| **Goal** | Participate in community life |
| **Components** | Chip tabs, feed/group entry cards |
| **Capabilities** | `community.hub.view` |
| **Permissions** | Chip actions gated per sub-capability |
| **Features** | `community.groups.enabled`, `community.decide.enabled`, etc. |
| **Roles** | Members |

#### ProfileScreen (Me)

| Field | Mapping |
|-------|---------|
| **Purpose** | Self, attention, my stuff, Manage gate |
| **Goal** | Manage my presence and entries |
| **Components** | `ProfileHeader`, `Avatar`, list rows, notification entry |
| **Capabilities** | `community.profile.view_self`, `community.profile.edit_self`, `community.manage.enter` |
| **Permissions** | Edit own profile; Manage entry requires governance Permission |
| **Features** | Rows for reservations/incidents/saves only if those features on |
| **Roles** | Members; Manage link admin/moderator/group manager as entitled |

---

### 4.3 Create

#### CreateSheet

| Field | Mapping |
|-------|---------|
| **Purpose** | Global create menu |
| **Goal** | Start an allowed action |
| **Components** | `CreateSheet` action list |
| **Capabilities** | Union of create caps user holds |
| **Permissions** | Each row requires its create Permission |
| **Features** | Row omitted if feature off **or** no Permission |
| **Roles** | Any member with ≥1 create Permission; else Create affordance hidden |

| Action row | Capability | Feature |
|------------|------------|---------|
| Experience | `community.experience.create` | `community.experiences.enabled` |
| Post | `community.content.post.create` | `community.feed.enabled` |
| Proposal | `community.proposal.create` | `community.decide.enabled` |
| Report problem | `incidents.request.create` | `incidents.enabled` |
| Group | `community.group.create` | `community.groups.enabled` |
| Tip | `community.recommendation.create` | `community.recommendations.enabled` |
| Reserve (optional shortcut) | navigates Places | `community.resources.enabled` |

#### CreateExperienceScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Compose experience |
| **Goal** | Organize an activity |
| **Components** | ComposeFlow, `CameraCapture`, `ImagePicker`, `MediaPreview`, `MediaUploadProgress`, preview `ExperienceCard`, `FilterChipGroup` |
| **Capabilities** | `community.experience.create`, `community.experience.publish` |
| **Permissions** | Create; publish may be separate (or pending_review) |
| **Features** | `community.experiences.enabled` |
| **Roles** | Organizer-capable members; group-scoped create may need group organize Permission |
| **Audit / Notify** | Publish → Audit + Notifications |

#### CreatePostScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.content.post.create` |
| **Permissions** | Create post (official voice is separate Permission) |
| **Features** | `community.feed.enabled` |
| **Components** | Composer, optional media |

#### CreateProposalScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.proposal.create` |
| **Features** | `community.decide.enabled` |
| **Permissions** | Propose; voting cast is separate on detail |

#### CreateIncidentScreen

| Field | Mapping |
|-------|---------|
| **Purpose** | Report with media |
| **Components** | `CameraCapture`, `VideoCapture`, `ImagePicker`, `MediaPreview`, Area chips, `ButtonPrimary` |
| **Capabilities** | `incidents.request.create` |
| **Permissions** | Create request/incident |
| **Features** | `incidents.enabled` |
| **Roles** | Members with create; assign/close **not** here |

---

### 4.4 Experiences

#### ExperienceListScreen

| Field | Mapping |
|-------|---------|
| **Components** | `ExperienceCard`, `EventCard`, `FilterChipGroup`, `SearchField` |
| **Capabilities** | `community.experience.view` |
| **Features** | `community.experiences.enabled` |
| **Permissions** | View in audience scope |

#### ExperienceDetailScreen

| Field | Mapping |
|-------|---------|
| **Primary components** | Hero media, `OrganizerCard`, meta, body, Join CTA, `SocialInteractionBar` |
| **Secondary** | Related cards, share-within-tenant |
| **Capabilities** | `community.experience.view`, `.join`, `.manage` (organizer), interaction caps |
| **Permissions** | View/join/interact; edit/cancel for organizer Permissions; moderate if entitled |
| **Features** | `community.experiences.enabled`; interactions need `community.interactions.enabled` |
| **Roles** | Member join; manager/organizer manage; moderator hide |

#### ExperienceRegistrationScreen

| Field | Mapping |
|-------|---------|
| **Components** | Confirm sheet / `ConfirmDialog` |
| **Capabilities** | `community.experience.join` |
| **Permissions** | Register / waitlist |
| **Features** | Experiences enabled |
| **Notify** | Confirmation + reminders |

---

### 4.5 Community

#### CommunityFeedScreen

| Field | Mapping |
|-------|---------|
| **Components** | `AnnouncementCard`, `CommunityPostCard`, `CommunityFeed` pattern |
| **Capabilities** | `community.feed.view`, `community.announcement.view` |
| **Permissions** | View; compose if create Permission |
| **Features** | `community.feed.enabled` |

#### GroupListScreen

| Field | Mapping |
|-------|---------|
| **Components** | `GroupCard`, search |
| **Capabilities** | `community.group.view` |
| **Features** | `community.groups.enabled` |
| **Permissions** | View discoverable groups; create if `community.group.create` |

#### GroupDetailScreen

| Field | Mapping |
|-------|---------|
| **Components** | Group `ProfileHeader`, `MemberCard`, feed cards, `ExperienceCard`, `EmptyAction` |
| **Capabilities** | `community.group.view`, `.join`, `.manage`, organize-in-group |
| **Permissions** | Join/request; manage members/moderate for group manager Permissions |
| **Features** | Groups enabled |
| **Roles** | Member; group manager scoped Manage actions |

#### ConversationScreen (Interactions)

| Field | Mapping |
|-------|---------|
| **Components** | Thread, composer, `Avatar`, `SocialInteractionBar` |
| **Capabilities** | `community.interaction.comment`, `.reply`, `.react`, `.mention`, `.report_abuse` |
| **Permissions** | Matching interaction Permissions; lock/hide = moderate |
| **Features** | `community.interactions.enabled` |
| **Anti-goal** | Not a social network / DM product (ADR-028) |

---

### 4.6 Resources

#### ResourceDiscoveryScreen

| Field | Mapping |
|-------|---------|
| **Components** | `ResourceCard`, filters, `SearchField` |
| **Capabilities** | `community.resource.view` |
| **Features** | `community.resources.enabled` |

#### ResourceDetailScreen

| Field | Mapping |
|-------|---------|
| **Components** | Media, policy summary, Reserve CTA |
| **Capabilities** | `community.resource.view`, `community.reservation.create` |
| **Permissions** | View; Reserve needs create reservation Permission |
| **Features** | Resources enabled |

#### ReservationFlowScreen

| Field | Mapping |
|-------|---------|
| **Components** | Slot chips, policy, `ConfirmDialog` |
| **Capabilities** | `community.reservation.create` |
| **Permissions** | Create reservation; approval path if policy requires staff Permission elsewhere |
| **Features** | Resources enabled |
| **Notify** | Confirmed / pending / reminder |

#### MyReservationsScreen / ReservationDetailScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.reservation.view_own`, `.cancel_own` |
| **Permissions** | Own reservations; staff may view broader with manage Permission |
| **Features** | Resources enabled |
| **Entry** | Me; Calendar; notification “reservation confirmed” → Detail |

---

### 4.7 Incidents

#### CreateIncidentScreen

See §4.3.

#### IncidentDetailScreen

| Field | Mapping |
|-------|---------|
| **Components** | `MediaGallery`, status timeline (human labels), body |
| **Capabilities** | `incidents.request.view_own`, `incidents.request.view_ops`, `incidents.request.update_status` |
| **Permissions** | Reporter: own view; ops: queue + status transitions |
| **Features** | `incidents.enabled` |
| **Roles** | Member reporter; moderator/admin ops as entitled |

#### MyIncidentsScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `incidents.request.view_own` |
| **Features** | `incidents.enabled` |
| **Components** | ListWithFilters, `EmptyAction` |

---

### 4.8 Manage

All Manage screens require **feature community governance surfaces** + **explicit Permissions**. Membership never unlocks Manage.

#### AdminDashboardScreen

| Field | Mapping |
|-------|---------|
| **Components** | ManageOpsHome attention cards |
| **Capabilities** | `community.manage.dashboard.view` |
| **Permissions** | Any of: moderate, official publish, resource manage, configure — tiles filtered by Permission |
| **Features** | Manage mode available when Tenant has Community governance packaging |
| **Roles** | Admin / moderator / group manager (scoped tiles) |

#### ContentManagementScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.announcement.publish_official`, `community.content.feature` |
| **Permissions** | Official publish / feature content |
| **Features** | Feed/announcements capability on |
| **Audit** | Required on publish |

#### ModerationQueueScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.moderation.review`, `.hide`, `.resolve_report` |
| **Permissions** | Moderator Permissions (optional Area scope) |
| **Features** | Interactions/content moderation on |
| **Audit** | Required on decisions |

#### ResourceManagementScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.resource.manage`, `community.reservation.approve` |
| **Permissions** | Manage resources / approve |
| **Features** | `community.resources.enabled` |

#### ExperienceManagementScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `community.experience.manage` |
| **Permissions** | Manage hosted / Territory experiences as scoped |
| **Features** | Experiences enabled |

#### TenantConfigurationScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `tenant.configuration.manage`, `community.configure` |
| **Permissions** | Configuration Permissions (narrow) |
| **Features** | N/A (meta); changes feature flags for others |
| **Audit** | Required |
| **Note** | Does not replace billing owner (ADR-024) unless also entitled |

#### MemberManagementScreen

| Field | Mapping |
|-------|---------|
| **Capabilities** | `members.view`, `roles.assign` (within grant) |
| **Permissions** | People view + role assignment Permissions |
| **Features** | Always in Manage for entitled admins |
| **Audit** | Required on role changes |
| **Anti-pattern** | Custom ACL UI |

---

## 5. Component Mapping

Components never own AuthZ. Screens pass **allowedActions** / hide slots.

### 5.1 By screen (primary set)

| Screen | Primary components | Secondary / patterns |
|--------|--------------------|----------------------|
| Welcome | `ResponsiveImage`, wordmark, `ButtonPrimary` | — |
| Authentication | Inputs, `ButtonPrimary` | — |
| Invitation | Hero, `ButtonPrimary` | — |
| Home | `AnnouncementCard`, `ExperienceCard`, `QuickAction`, `FloatingCreateControl`, Area chips | `RecommendationCard`, `TenantAppShell` |
| Discover | `SearchField`, segment chips, card grids | `FilterChipGroup` |
| Calendar | Agenda rows, filters | Opens `ContentDetailSheet` |
| Community | Chip tabs, entry cards | — |
| Profile | `ProfileHeader`, `Avatar`, rows | Manage entry |
| CreateSheet | `CreateSheet` | — |
| Create Experience | `CameraCapture`, `MediaPreview`, compose fields | `ExperienceCard` preview |
| Create Post | Composer, media optional | — |
| Create Proposal | Composer | — |
| Create Incident | `CameraCapture`, `VideoCapture`, `MediaPreview`, Area chips | `MediaUploadProgress` |
| Experience List | `ExperienceCard`, `EventCard` | Filters |
| Experience Detail | Hero, `OrganizerCard`, Join, `SocialInteractionBar` | `ContentDetailSheet` |
| Registration | `ConfirmDialog` | — |
| Feed | `AnnouncementCard`, `CommunityPostCard` | `CommunityFeed` |
| Groups | `GroupCard` | — |
| Group Detail | Group header, `MemberCard`, cards | `EmptyAction` |
| Conversation | Thread, composer, `Avatar` | Report abuse control |
| Resource Discovery | `ResourceCard` | — |
| Resource Detail | Media, Reserve CTA | Policy text |
| Reservation Flow | Slots, `ConfirmDialog` | — |
| My Reservations | List cards | — |
| Incident Detail | `MediaGallery`, timeline | — |
| My Incidents | List cards | `EmptyAction` |
| Admin Dashboard | Ops cards | — |
| Content Mgmt | Compose official, preview `AnnouncementCard` | — |
| Moderation | Queue cards, `ConfirmDialog` | Content preview |
| Resource Mgmt | `ResourceCard`, policy editors | Approval list |
| Tenant Config | Settings forms | Branding asset pickers |
| Member Mgmt | `MemberCard`, role assign confirm | — |

### 5.2 Shared library (from `04`) — AuthZ-neutral

Navigation: `MobileBottomNav`, `DesktopNav`, `AppHeader`, `CreateSheet`, `SearchField`, `FilterChipGroup`  
Content: `AnnouncementCard`, `CommunityPostCard`, `ExperienceCard`, `EventCard`, `GroupCard`, `RecommendationCard`, `ServiceCard`, `ResourceCard`  
People: `Avatar`, `MemberCard`, `ProfileHeader`, `OrganizerCard`, `MembershipBadge` (**not** AuthZ)  
Actions: `ButtonPrimary` / Secondary / Ghost / Destructive, `QuickAction`, `FloatingCreateControl`, `ConfirmDialog`, `EmptyAction`  
Media: `CameraCapture`, `ImagePicker`, `VideoCapture`, `MediaPreview`, `MediaGallery`, `ResponsiveImage`, `MediaUploadProgress`

---

## 6. Capability Mapping

Capabilities are **product abilities**, independent of which widget renders them.

| Capability ID | Meaning | Primary screens | Typical holders |
|---------------|---------|-----------------|-----------------|
| `community.home.view` | Open Home | Home | Members |
| `community.discover.view` | Open Discover | Discover | Members |
| `community.calendar.view` | Open Calendar | Calendar | Members |
| `community.feed.view` | View feed | Feed, Home | Members |
| `community.announcement.view` | View official/news | Home, Feed, Detail | Members |
| `community.announcement.publish_official` | Official voice | Content Management, Create (admin) | Admin / communications |
| `community.experience.view` | View experiences | List, Detail, Home | Members |
| `community.experience.create` | Create | Create Experience | Organizers, managers, admins |
| `community.experience.publish` | Publish / submit | Create Experience | Organizers (+ moderation policy) |
| `community.experience.join` | Register | Detail, Registration | Members |
| `community.experience.manage` | Edit/cancel host | Detail, Experience Mgmt | Organizer, admin |
| `community.group.view` | List/view groups | Group List/Detail | Members |
| `community.group.create` | Create group | Create Group | Permitted members, admin |
| `community.group.join` | Join/request | Group Detail | Members |
| `community.group.manage` | Manage group | Group Detail, Manage | Group manager |
| `community.interaction.comment` | Comment | Conversation, Detail | Members |
| `community.interaction.reply` | Reply | Conversation | Members |
| `community.interaction.react` | React | Detail | Members |
| `community.interaction.mention` | Mention | Conversation | Members |
| `community.interaction.save` | Save | Detail, Saves | Members |
| `community.interaction.follow` | Follow entity | Detail | Members |
| `community.interaction.report_abuse` | Report content | Conversation | Members |
| `community.moderation.review` | Review queue | Moderation | Moderator, admin |
| `community.proposal.create` | Create proposal | Create Proposal | Permitted members, admin |
| `community.proposal.vote` | Cast vote | Proposal Detail | Eligible members |
| `community.recommendation.create` | Create tip | Create tip | Members if enabled |
| `community.resource.view` | View places | Discovery, Detail | Members |
| `community.resource.manage` | Manage inventory/policy | Resource Mgmt | Resource managers, admin |
| `community.reservation.create` | Book | Reservation Flow | Members |
| `community.reservation.view_own` | See my bookings | My Reservations | Members |
| `community.reservation.cancel_own` | Cancel own | Reservation Detail | Members (policy) |
| `community.reservation.approve` | Approve pending | Resource Mgmt | Managers |
| `incidents.request.create` | Report | Create Incident | Members |
| `incidents.request.view_own` | Track own | My Incidents, Detail | Reporters |
| `incidents.request.view_ops` | Ops queue | Manage / Detail | Ops roles |
| `incidents.request.update_status` | Transition status | Incident Detail (ops) | Ops roles |
| `directory.service.view` | Browse services | Services Discovery | Members |
| `community.profile.edit_self` | Edit Community Profile | Profile edit | Self |
| `community.manage.enter` | Open Manage mode | Profile → Manage | Governance roles |
| `community.configure` | Community feature config | Tenant Configuration | Community admin |
| `tenant.configuration.manage` | Broader tenant config | Tenant Configuration | Tenant config roles |
| `roles.assign` | Assign roles | Member Management | Admins within grant |
| `community.membership.accept_invite` | Accept invite | Invitation | Invitees |

**Create Experience** capability example:

| Used by | CreateExperienceScreen, CreateSheet row, Group “Create activity” |
| Available when | `community.experiences.enabled` + plan allows |
| Granted to | Roles that include `community.experience.create` (often organizer, group manager, admin — **not** “resident” string alone) |

---

## 7. RBAC Visibility Rules

### Resident / member (typical)

**Can (if Permission + feature):** view community surfaces; join experiences; reserve; report; comment/react/save; create allowed non-official content; edit own Community Profile.  

**Cannot:** official Territory publish; global moderate; tenant configure; approve others’ reservations; assign roles — unless also assigned those Permissions.

### Group manager

**Can:** everything a member can **plus** manage **own Groups** (members, in-group moderation, organize group experiences) within grant.  

**Cannot:** other groups’ admin; Territory-wide official voice; tenant configuration — by default.

### Moderator

**Can:** review `pending_review`; hide/lock; resolve abuse reports; optional Area-limited queue.  

**Cannot:** tenant configuration / arbitrary role assignment unless also admin.

### Community administrator

**Can:** official publish; featured content; community configure; broader experience/resource oversight; assign delegated Community roles within grant.  

**Cannot:** imply billing owner or bypass Tenant isolation.

### UI rules (all roles)

1. Check **Permission keys**, not persona labels.  
2. Scope constraints (Group/Area) filter **which objects** actions apply to — still RBAC.  
3. Fail closed on missing Tenant Context or Permission.  
4. No parallel permission system in components or microapps (ADR-034).

---

## 8. Feature Configuration

### Master feature flags (implementation catalogue)

| Flag | When OFF |
|------|----------|
| `community.experiences.enabled` | Hide Experiences segment, Create Experience, experience calendar items, experience manage tiles |
| `community.feed.enabled` | Hide Feed compose; limit Home community rail |
| `community.groups.enabled` | Hide Groups chip, Create Group |
| `community.interactions.enabled` | Hide social row / Conversation composer (view-only body may remain) |
| `community.decide.enabled` | Hide Decide chip, Create Proposal |
| `community.recommendations.enabled` | Hide tips rail, Create tip |
| `community.resources.enabled` | Hide Places, Reserve, My Reservations, Resource Mgmt |
| `incidents.enabled` | Hide Report, Create Incident, My Incidents, ops incident tiles |
| `directory.services.enabled` | Hide Services segment |
| `community.calendar.enabled` | Rare; if off hide Calendar tab (prefer keep tab with empty) |

### Example

`community.experiences.enabled = ON` → show Activities/Experiences surfaces.  
`= OFF` → remove navigation segment, Create action, discovery cards, and do not expose active experience data via member APIs/search.

### Availability vs Permission (ADR-023)

| State | UI |
|-------|-----|
| Feature OFF | No UI |
| Feature ON, no Permission | No privileged CTA; optional view if view Permission |
| Feature ON + Permission | Full action |

Plan entitlements (ADR-024) constrain what admins may enable.

---

## 9. Tenant Customization

### Allowed per tenant

| Allowed | Mechanism |
|---------|-----------|
| Branding (name, logo, colours, imagery) | Theme tokens Layer 3 (`04`) |
| Enabled capabilities | Feature flags + plan |
| Content | Tenant data |
| Labels / i18n tone | Catalogues |
| Auth methods | Tenant config |
| Area names | Territory/Area content |

### Not allowed

| Forbidden | Why |
|-----------|-----|
| Forked component libraries per tenant | Breaks reuse |
| Custom security / ACL beside RBAC | Violates ADR-012 / 034 |
| Navigation that breaks the 5-destination IA | Breaks platform consistency |
| Tenant-prefixed screens (`PanoramicaXScreen`) | Prevents white-label |
| Permissions defined in UI components | Security drift |
| Exposing “Life Community OS” in consumer chrome | Brand rule |

Life Panoramica = first **theme + content + flag pack**, identical screen/permission contract.

---

## 10. Implementation Readiness Checklist

Before coding a screen, verify:

- [ ] **Purpose** and **user goal** documented (`06` + this map)  
- [ ] **Components** listed from `04` (no one-off tenant widgets)  
- [ ] **Capabilities** identified  
- [ ] **Permissions** mapped; UI only reflects AuthZ  
- [ ] **Feature dependencies** known; OFF hides all entry points  
- [ ] **Tenant behaviour** = theme/config/content only  
- [ ] **Responsive** mobile-first + desktop adaptation noted  
- [ ] **States**: loading / empty / error / permission denied / offline  
- [ ] **Notifications / Audit / Files** use Core — no duplicates  
- [ ] **No** DB-table-driven page; **no** UI-only permission  
- [ ] Deep links and notification targets match `06`  
- [ ] Consumer copy has **no** platform/engineering terms  

### Agent rule

If a requested UI action is not in this mapping, **stop and align** with ADR-012 / 023 / 034 and product docs — do not invent a permission in the component.

---

## 11. Decision summary

This contract binds **screens → components → capabilities → RBAC → feature flags → tenant availability**. Membership grants belonging; RBAC grants power; configuration grants existence; the UI only mirrors those truths. Life Panoramica validates the contract as the first tenant experience without becoming a special-case security or component fork.
