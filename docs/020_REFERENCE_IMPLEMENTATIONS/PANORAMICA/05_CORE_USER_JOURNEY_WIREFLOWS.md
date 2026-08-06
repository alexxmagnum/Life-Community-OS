# Core User Journey Wireflows

Version: 1.0  
Status: Draft  
Document Type: Platform UX Journeys (Reference: Life Panoramica)  
Depends on:

- `01_UX_PRODUCT_FOUNDATION.md`
- `02_VISUAL_DESIGN_SYSTEM.md`
- `03_HIFI_PRODUCT_SCREENS.md`
- `04_MULTI_TENANT_UI_COMPONENT_SYSTEM.md`
- ADRs 012, 017–021, 023–034 (especially Community 025–034; Incidents 018; Files 020)

No code · No schemas · No new ADRs

---

## 0. How to read this document

### Purpose

Define **complete, reusable user journeys** for Life Community OS — human workflows that any tenant can run with theme + content + configuration.

**Life Panoramica** is the reference experience (branding, photography, Area names). Flows are **not** Panoramica-hardcoded products.

### Brand rule

Residents see only **Life Panoramica** (or the active tenant name). Never “Life Community OS”, microapp names, or engineering terms in journey copy.

### Design rules

| Rule | Application |
|------|-------------|
| Users think in goals | Not “Events module” — “I want to join something” |
| ≤ 3 taps | Frequent actions from Home / Create / bottom nav |
| Mobile first | Phone is primary; desktop adapts |
| Photography first | Media and human content before forms |
| RBAC only | UI hides/disables; AuthZ never invented in UX |
| Tenant boundary | No cross-tenant social or discovery |
| Reusable | Same steps for Life Resort / Municipality / Club |

### Journey template (applied below)

Each journey includes: goal, context, entry, mental model, steps, screens, components, success, errors, empty, notifications, permissions, mobile, desktop.

### Screen & component vocabulary

Screens from `01` / `03`. Components from `04` (`ExperienceCard`, `CreateSheet`, `CameraCapture`, etc.).

---

## 1. First Access / Community Onboarding

### User goal

Become a trusted member of this community and land on a welcoming Home that feels like *my place*.

### Context

A new resident receives access (invitation, property link, or admin-provisioned Membership). They may be elderly or non-technical. Friction must stay low; language must stay human.

### Entry point

- Deep link / invite email / SMS (“Join Life Panoramica”)  
- QR from community office  
- Admin-created account → first login  

### User mental model

“I was invited to my community app. I set a simple profile and start looking around.”

Not: “I configure a SaaS tenant.”

### Step-by-step flow

1. **Invitation** — Open link → branded splash (tenant logo + photo) → “Continue”.  
2. **Registration / sign-in** — Email or phone + secure code (or SSO if tenant configured). Minimal fields.  
3. **Verification** — Confirm invite / Membership eligibility (Person + Membership already or pending approval). Soft wait state if admin must approve.  
4. **Profile creation** — Display name, optional photo (`CameraCapture` / `ImagePicker`), optional Area (“Where do you live?” chips). Privacy defaults on (ADR-033).  
5. **Interests / preferences** — Optional short chips (walking, padel, culture…). Skip always available. Feeds Discover/Home personalization — not a social graph.  
6. **Notifications prefs** — Simple: “Important community news” on by default; optional activity reminders.  
7. **First Home** — Land on Home with greeting, one official card if any, “For you” suggestions, quick actions Reserve / Report / Discover.

**Tap budget after invite accepted:** profile essentials → Home in as few steps as possible; interests are skippable.

### Screens involved

Splash → Auth → (Pending approval) → Profile setup → Interests (optional) → Home

### Components involved

`AppHeader` (minimal), `Avatar`, `ProfileHeader` (setup), `ButtonPrimary`, `FilterChipGroup` (Area/interests), `CameraCapture` / `ImagePicker`, `TenantAppShell` + `MobileBottomNav` on completion

### Success state

Active Membership + Community Profile visible to self; Home shows tenant brand and first content; Create Sheet available if RBAC allows.

### Error cases

| Case | UX |
|------|-----|
| Invalid / expired invite | Plain message + contact community office |
| Wrong tenant link | Stay fail-closed; no cross-tenant peek |
| Auth failure | Retry; large targets; no jargon |
| Pending Membership | Calm waiting screen; notify when approved |

### Empty states

New community with little content: Home hero + “You’re in. Explore what’s nearby” + Discover CTA — never a blank CRUD void.

### Notifications

- Invite reminder (if unused)  
- “You’re approved” when Membership activates  
- Optional welcome official announcement  

### Permissions

- Auth + Membership eligibility (ADR-010 / 011)  
- Profile edit: own Community Profile  
- No Manage entry until governance Permissions assigned  

### Mobile considerations

Large type option; one field per step preferred; camera for avatar optional; “Skip for now” on interests.

### Desktop considerations

Centered calm auth cards; same step order; no admin dashboard as first experience.

### Reuse note

Same onboarding pattern for Life Ulldecona / Resort — only invite copy, theme, and Area labels change.

---

## 2. Daily Home Experience

### User goal

Open the app and immediately feel what is happening in *my* community — then act if I want.

### Context

Returning resident (or freshly onboarded). Session opens on Home (default).

### Entry point

App launch → `TenantAppShell` → **Home**

### User mental model

“What’s happening? What can I do today?”

Not: “Which module do I open?”

### Step-by-step flow

1. **First viewport** — Brand atmosphere photo + greeting (“Good evening, {name}”) + optional Area chip (All | My area).  
2. **Today / This week** — Strip of registered experiences + reservations (Calendar projection).  
3. **Needs attention** — Official announcement or request status update if relevant (one card max in first fold).  
4. **For you** — `ExperienceCard` / `RecommendationCard` / `ServiceCard` rail from personalization + Territory activity.  
5. **Quick actions** — Reserve · Report · Discover (≤1 tap each into those journeys).  
6. Optional scroll — more community pulse without becoming an infinite noisy social feed.

### Screens involved

Home → (tap) Experience/Announcement/Service detail sheets → or Create / Discover / Report / Reserve

### Components involved

`AppHeader`, `AnnouncementCard`, `ExperienceCard`, `EventCard`, `RecommendationCard`, `QuickAction`, `FloatingCreateControl`, `FilterChipGroup` (Area), `ResponsiveImage`

### Success state

User understands today’s pulse in &lt;10 seconds; can reach Register / Reserve / Report in ≤3 taps.

### Error cases

Partial load: show hero + cached Today; inline retry on rails. Never blank white error page as Home.

### Empty states

Quiet day: photographic empty + “Nothing scheduled — Discover something nearby.”

### Notifications

Badge on Me / bell for unread; Home may surface one high-priority official item — not a notification dump.

### Permissions

View published content; quick actions only if create/reserve/report Permissions exist. Manage never appears on Home for standard residents.

### Mobile considerations

Bottom nav; FAB Create; one CTA group in hero budget (aligned with `02` / `03`).

### Desktop considerations

Wider Today + For you grids; same mental model — not KPI widgets.

---

## 3. Create Experience

### User goal

Turn an idea into a published community activity others can join.

### Context

Member with organize/publish Permission creates an event, activity, or meetup (ADR-027 / 026).

### Entry point

- Home → Create → **Experience** (≤3 taps)  
- Discover → Create  
- Group detail → Create activity (scoped)

### User mental model

“I’m inviting neighbours to do something together.”

Not: “I’m filling an Events admin form.”

### Step-by-step flow

1. **Idea** — CreateSheet → Experience. Short title prompt (“What are you organizing?”).  
2. **Type** — Activity / Event / Meetup (human labels; same platform entity family).  
3. **Media** — Add cover photo (`CameraCapture` or `ImagePicker`); preview before continue (ADR-020).  
4. **Details** — When, where (Area / place), capacity optional, short description, visibility (Territory / Area / Group).  
5. **Review** — Photo-led preview card as members will see it.  
6. **Publish** — Publish now or schedule; or save draft.  
7. **After** — Land on detail; optional “Share with group”; Core Notifications to eligible audience / followers.

### Screens involved

CreateSheet → Experience compose (multi-step sheet or full screen) → MediaPreview → Review → Experience detail

### Components involved

`CreateSheet`, `CameraCapture`, `ImagePicker`, `MediaPreview`, `MediaUploadProgress`, `ButtonPrimary`, `FilterChipGroup`, `OrganizerCard` (self), `ExperienceCard` (preview), `ConfirmDialog` (discard draft)

### Success state

Experience `published` (or scheduled); appears in Discover / Calendar / Group; organizer sees manage actions on detail.

### Error cases

| Case | UX |
|------|-----|
| Upload fail | Keep draft; retry media |
| Missing required time/place | Inline validation, large fields |
| No Permission | Action absent from CreateSheet |
| Moderation hold | “Thanks — we’ll review shortly” (pending_review) |

### Empty states

N/A mid-flow; draft list in Me if abandoned drafts exist.

### Notifications

- Followers / group members: “New experience” (prefs permitting)  
- Organizer: publish confirmation; later registration alerts  

### Permissions

Create/publish experience Permission (RBAC). Group-scoped create may require group organizer Permission. Official Territory-wide voice remains admin path if restricted.

### Mobile considerations

Camera-native cover; bottom sheets for date/time; minimal typing; voice-friendly short description.

### Desktop considerations

Larger compose canvas; same steps; drag-drop image allowed as alternate to camera.

---

## 4. Join Experience

### User goal

Discover something interesting and secure my place (register / join).

### Context

Open experiences with registration or open attendance (ADR-027). Capacity / waitlist messaging when relevant.

### Entry point

- Home For you card  
- Discover → Experiences  
- Calendar item  
- Community Group upcoming  

### User mental model

“This looks good — I want to go.”

### Step-by-step flow

1. **Discovery** — Browse `ExperienceCard` grid/rail; filter Area / date.  
2. **Details** — Full-bleed media → title → when/where → organizer → description → who’s going (optional count).  
3. **Participation** — **Register** / **Join** → confirm sheet (capacity note).  
4. **Success** — Confirmation + “Add to my calendar view”; detail shows “You’re going”.  
5. **Reminders** — Prefs: reminder before start.  
6. **Attendance** — Optional check-in / “I’m here” if enabled; otherwise calendar + reminder is enough for pilot.

### Screens involved

Discover / Home / Calendar → Experience detail → Confirm participation → (Me → My registrations)

### Components involved

`ExperienceCard`, `EventCard`, `OrganizerCard`, `Avatar`, `ButtonPrimary`, `ConfirmDialog`, `MembershipBadge` (optional social cue — not AuthZ)

### Success state

Registration recorded; item on Calendar “Registered”; cancellation available per policy.

### Error cases

Full capacity → waitlist offer or “Full”. Cancelled experience → soft message. Network fail → retry keep selection.

### Empty states

Discover Experiences empty: photographic + “Be the first to organize” (if permitted) or “Check back soon”.

### Notifications

- Registration confirmed  
- Reminder before start  
- Change/cancel by organizer  
- Waitlist promoted  

### Permissions

View + register Permissions; Membership in scope. Private/group experiences: eligibility checks fail closed.

### Mobile considerations

One primary Join button sticky; share-within-tenant later — not external social spam.

### Desktop considerations

Split view list + detail optional; same Join CTA.

---

## 5. Community Interaction

### User goal

Participate lightly on community content — acknowledge, discuss, keep for later — without entering a social network.

### Context

ADR-028: comments, replies, reactions, mentions, following entities, saves. Content-centric. No global people graph; no DMs product; reactions ≠ formal votes.

### Entry point

Any content detail (announcement, post, experience, proposal) → social row / thread

### User mental model

“I’m joining the conversation about *this* thing.”

Not: “I’m building a follower empire.”

### Step-by-step flow

1. Open content detail.  
2. **React** — one-tap acknowledgment (configured set).  
3. **Comment** — short text; optional mention (@person) within Tenant.  
4. **Reply** — nested under comment.  
5. **Save** — bookmark to Me → Saves.  
6. **Follow** — follow *this* experience / topic / group activity for updates (entity follow — not cross-tenant person graph).  
7. Report abuse if needed → moderation queue (not Incident amenity report).

### Screens involved

Content detail sheet → Comment composer → Thread → Me Saves / Following

### Components involved

`CommunityPostCard` / `AnnouncementCard` / detail chrome, `SocialInteractionBar` (pattern), `Avatar`, `ButtonGhost`, `ConfirmDialog` (delete own comment)

### Success state

Reaction/comment/save persisted; author notified per prefs; thread remains readable and calm.

### Error cases

Locked thread → composer hidden + “Discussion closed”. Visibility lost on restricted content → fail closed. Mention of inaccessible Person → don’t leak existence beyond policy.

### Empty states

No comments: “Start the conversation” with composer if permitted.

### Notifications

- Reply to your comment  
- Mention  
- Followed entity updates  
- Moderation outcome if reported  

### Permissions

Comment/react/save/follow Permissions + Membership eligibility. Moderate/hide requires moderator Permissions (ADR-028 / 034).

### Mobile considerations

Composer in bottom sheet; large send target; avoid nested gesture hell.

### Desktop considerations

Inline thread beside media; same interaction set.

### Anti-patterns (forbidden)

Stories, streaks, public like leaderboards as governance, infinite stranger feed, cross-tenant follows.

---

## 6. Create Group

### User goal

Start or manage a circle so people with a shared interest can gather and act (ADR-029).

### Context

Interest circle, activity group, or committee — still inside Tenant; **not** a new Tenant or security boundary.

### Entry point

- Community → Groups → Create  
- CreateSheet → Group (if permitted)  
- Manage → Groups (admins)

### User mental model

“I’m starting a small circle in my community.”

### Step-by-step flow

1. **Creation** — Name, short purpose, optional cover photo, type (interest / activity / committee).  
2. **Visibility** — Discoverable to members / Area / invite-only (audience policy inside Tenant — not new isolation root).  
3. **Area (optional)** — Link to Community Area for local organization.  
4. **Members** — Invite members (search Persons in Tenant) or share join link; join = request or open per settings.  
5. **Activity** — Empty group Home: create first experience / post CTA.  
6. **Manage** — Group manager: members, moderate group threads, edit settings (RBAC + group role).

### Screens involved

Community Groups → Create Group flow → Group Home → Members sheet → (optional) Create Experience scoped

### Components involved

`GroupCard`, `CreateSheet`, `ProfileHeader` (group), `MemberCard`, `Avatar`, `CameraCapture`, `FilterChipGroup`, `ButtonPrimary`, `EmptyAction`

### Success state

Group exists; creator is member + group organizer role; appears in Groups list per visibility; members can join/request.

### Error cases

Name conflict soft warn; invite outside Tenant rejected silently/fail closed; Permission denied → Create absent.

### Empty states

Group with no posts: “Plan your first meetup” + Create Experience.

### Notifications

- Invite received  
- Join request (for managers)  
- Accepted into group  
- New activity in group (prefs)  

### Permissions

Create group Permission; manage members/moderate via group_admin / moderator Permissions — Membership type alone is insufficient (ADR-029 / 034).

### Mobile considerations

Short create wizard; invites via searchable member list.

### Desktop considerations

Members table still card-like; avoid enterprise ACL matrices in UI.

---

## 7. Reserve Resource

### User goal

Book a shared amenity (court, room, place) and trust it will show on my calendar (ADR-031 / 030).

### Context

Reservable Resources with availability slots and policies (duration, lead time, approval if required).

### Entry point

- Home → **Reserve**  
- Discover → **Places**  
- Resource linked from Experience (hold) — advanced  

### User mental model

“I want the paddle court on Saturday morning.”

### Step-by-step flow

1. **Discovery** — Places segment → `ResourceCard` list (photo, name, Area).  
2. **Availability** — Open resource → date → available slots (human times).  
3. **Reservation** — Select slot → confirm policy summary (duration, cancel rules) → Submit.  
4. **Confirmation** — Success sheet; status `confirmed` or `pending_approval`.  
5. **Calendar** — Appears on Calendar + Me → My reservations.  
6. **Change** — Cancel / modify per policy from detail.

### Screens involved

Discover Places / Home Reserve → Resource detail → Slot sheet → Confirm → Calendar / Me

### Components involved

`ResourceCard`, `FilterChipGroup`, `ButtonPrimary`, `ConfirmDialog`, `EmptyAction`, Calendar item projection

### Success state

Reservation created; slot held; reminders scheduled via Core Notifications; conflicts prevented by platform rules.

### Error cases

Slot taken → refresh alternatives. Policy violation → plain explanation. Approval needed → “We’ll confirm soon”. Permission denied → Reserve hidden.

### Empty states

No places configured: hide Places or show “Places coming soon” (config). No slots that day: “Try another day”.

### Notifications

- Reservation confirmed  
- Pending → approved/declined  
- Reminder before start  
- Cancellation  

### Permissions

Create reservation Permission; manage resources / approve = governance Permissions. Membership eligibility for amenity policies.

### Mobile considerations

Large slot chips; sticky Reserve; ≤3 taps from Home when resource known from recent/quick path.

### Desktop considerations

Week grid optional for slot picking; same confirmation language.

---

## 8. Report Incident

### User goal

Report a problem with evidence and track progress without feeling like a ticket system (ADR-018 / 020).

### Context

Broken light, hazard, maintenance request. Dignified operational language.

### Entry point

- Home → **Report** (≤3 taps to submit path)  
- CreateSheet → Report a problem  
- Me → My requests → New  

### User mental model

“Something’s wrong — I’ll show them and tell them where.”

### Step-by-step flow

1. **Start** — Report → choose photo/video first (camera-led).  
2. **Capture** — `CameraCapture` / `VideoCapture` / `ImagePicker` → `MediaPreview` (Retake / Use).  
3. **Location** — Area chip + optional map pin / place note (Territory always implied).  
4. **Description** — Short plain text (“Street light out near…”) — large field, optional voice-to-text later.  
5. **Submission** — Submit → soft “Thanks — we received it”.  
6. **Tracking** — Me → My requests: human statuses (Received → In progress → Resolved) mapped from lifecycle without exposing engineering enums as primary copy.

### Screens involved

Create / Home Report → Capture → Compose → Success → Me Requests → Request detail

### Components involved

`CreateSheet`, `CameraCapture`, `VideoCapture`, `ImagePicker`, `MediaPreview`, `MediaGallery`, `MediaUploadProgress`, `FilterChipGroup` (Area), `ButtonPrimary`, `QuickAction`

### Success state

Item `submitted` / `received`; media attached via Files Core; reporter can view status history.

### Error cases

Upload fail → keep text + retry media. Offline → save draft locally if product supports, else clear retry. Permission denied → Report hidden. Duplicate soft warn optional.

### Empty states

No requests yet: “Report something that needs attention” + CTA.

### Notifications

- Submission received  
- Status changes (assigned, in progress, resolved)  
- Optional ask for more info  

### Permissions

Create incident/request Permission. Assign/close = operations/governance Permissions — never implied by Membership type alone.

### Mobile considerations

Camera-first; minimal typing; large targets for elderly users; no mandatory long forms.

### Desktop considerations

Upload from disk allowed; same Area + description steps; still not a ServiceNow clone UI.

### Copy rules

Never show “Physical File”, “variant pipeline”, or “microapp” in this flow.

---

## 9. Local Discovery

### User goal

Find services, places, and neighbour-trusted tips nearby (ADR-017 / 032 / 031).

### Context

Directory Business/Official profiles are source of truth for verification. Recommendations are neighbour social signals — not Directory verification.

### Entry point

- Home → Discover services / For you tips  
- Discover → Services | Places | (Recommendations rail)  
- SearchField global  

### User mental model

“Who can help? What’s good around here? What can I book?”

### Step-by-step flow

1. **Open Discover** — Segments: Experiences | Services | Places.  
2. **Services** — Browse/search categories; open `ServiceCard` → Business/Official profile.  
3. **Recommendations** — “Neighbors recommend” rail (`RecommendationCard`); open tip → optional linked service.  
4. **Places** — Reservable amenities → handoff to Reserve journey.  
5. **Contribute** — CreateSheet → Tip / recommendation (if permitted) with optional photo.  
6. **Save** — Save service/tip to Me for later.

### Screens involved

Discover → segment lists → Service / Recommendation / Resource detail → (Reserve) → Me Saves

### Components involved

`SearchField`, `FilterChipGroup`, `ServiceCard`, `RecommendationCard`, `ResourceCard`, `ExperienceCard`, `ResponsiveImage`, `EmptyAction`

### Success state

User finds a useful contact or place; verification cues only when Directory says so; tips clearly labelled as neighbour recommendations.

### Error cases

Search empty → suggestions + clear filters. Service unpublished → fail closed. Confusing tip vs verified → UI labels distinct.

### Empty states

No services yet: “Local services will appear here”; tips empty: “Share a recommendation”.

### Notifications

Optional: new tip in followed category (prefs); not spammy discovery pushes by default.

### Permissions

View directory; create recommendation Permission separate from Directory admin. Directory manage = RBAC.

### Mobile considerations

Chip filters; photography cards; search large and early.

### Desktop considerations

Multi-column cards; map optional later — not required for pilot mental model.

---

## 10. Community Governance

### User goal

Keep the community healthy: publish official voice, moderate, manage resources, configure what members see — without turning the product into an enterprise console (ADR-034 / 026 / 023).

### Context

Community administrator, moderator, or group manager. **Manage** is a mode, not the default IA.

### Entry point

- Me → **Manage community** (role-gated)  
- Live / Manage switcher for entitled users  

### User mental model

“I’m taking care of the community.”

Not: “I’m administering Life Community OS.”

### Step-by-step flow (composed journeys)

#### 10a Publish official content

1. Manage → **Publish official**  
2. Compose announcement (media optional)  
3. Scope: Territory or Area  
4. Publish or schedule → members notified  

#### 10b Moderate

1. Manage → **Needs review** / Reports  
2. Open item → Approve / Hide / Reject with reason  
3. Author notified when appropriate; Audit recorded  

#### 10c Manage resources

1. Manage → Places / Resources  
2. Edit availability windows / policies (as permitted)  
3. Approve pending reservations if policy requires  

#### 10d Configure tenant (admin)

1. Manage → Settings (entitled)  
2. Feature toggles, branding assets, default notification categories — via Platform Configuration (ADR-023)  
3. People & roles: assign RBAC roles within grant scope — never invent ACL UI  

#### 10e Group-scoped manage

Group manager sees Manage limited to their Groups (members, group content, group experiences).

### Screens involved

Me → Manage home → Publish / Moderation queue / Resources / Settings / People (as entitled)

### Components involved

`AnnouncementCard` (preview), `CreateSheet` / compose, `MediaPreview`, `ConfirmDialog`, `MemberCard`, `ResourceCard`, card-based ops tiles (not datagrid wall)

### Success state

Official content live; queues cleared; configuration saved; Audit trail exists (not shown as consumer feed).

### Error cases

Insufficient Permission → entry hidden or soft deny. Concurrent edit → refresh. Dangerous role change → `ConfirmDialog` + Audit.

### Empty states

Empty review queue: “You’re all caught up.” Calm, not gamified.

### Notifications

- Staff: new report / pending review / pending reservation approval  
- Members: official publish, moderation outcomes on their content  

### Permissions

Strict RBAC (ADR-012 / 034). Membership type never grants governance. Billing owner ≠ community admin unless separately assigned (ADR-024).

### Mobile considerations

Card ops home works on phone for publish + moderate; dense config may prefer desktop but must remain usable.

### Desktop considerations

Wider queues; still photography-aware and human — not a generic admin template.

---

## Cross-journey map (goals → surfaces)

| Human goal | Journey | Primary surface |
|------------|---------|-----------------|
| Get in | §1 Onboarding | Splash → Home |
| Feel the pulse | §2 Daily Home | Home |
| Organize | §3 Create Experience | CreateSheet |
| Join in | §4 Join Experience | Discover / detail |
| Participate lightly | §5 Interaction | Detail social |
| Belong in a circle | §6 Create Group | Community → Groups |
| Book a place | §7 Reserve | Discover Places |
| Get help / fix | §8 Report | Home Report |
| Find local life | §9 Discovery | Discover |
| Steward the place | §10 Governance | Manage |

---

## Tap-budget cheat sheet (frequent paths)

| Action | Ideal path |
|--------|------------|
| See what’s on | Open app → Home |
| Join activity | Home/Discover card → Register → Confirm |
| Reserve | Home Reserve / Places → slot → Confirm |
| Report | Home Report → capture → Submit |
| Create activity | Home Create → Experience → … → Publish |
| Official publish | Me Manage → Publish → Publish |

---

## Reusability checklist

Before treating a journey as done:

- [ ] Works for another tenant with theme + content + config only?  
- [ ] No module-named steps in user copy?  
- [ ] ≤3 taps for frequent happy paths?  
- [ ] RBAC gates every privileged step?  
- [ ] Tenant isolation assumed end-to-end?  
- [ ] Media via ADR-020 patterns?  
- [ ] Social limited to ADR-028 (no social network product)?  
- [ ] Life Panoramica is reference brand only — not a code fork?  

---

## Alignment (authority, not duplication)

| Journey | Primary ADRs |
|---------|----------------|
| Onboarding / profile | 010, 011, 033 |
| Home / feed | 025, 026, 028, 021 (activity projection) |
| Experiences | 027, 026, 030 |
| Interaction | 028 |
| Groups | 029 |
| Reservations | 031, 030 |
| Incidents | 018, 020 |
| Discovery | 017, 032 |
| Governance | 034, 023, 012 |
| Notifications (all) | 019 |

---

## Decision summary

These wireflows define **goal-based, mobile-first journeys** for the Life Community OS platform, referenced through Life Panoramica. Users move through invitation → living Home → create/join → light participation → groups → reserve → report → discover → steward — always in human language, always reusable, always Permission-aware, never module-first and never exposing the platform name to residents.
