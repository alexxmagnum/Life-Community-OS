# ADR-028 Community Participation and Social Interaction Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Community requires **structured participation mechanisms** to create engagement around announcements, proposals, discussions, experiences, events and meetings.

ADR-025–027 define Community as a reusable microapp with publishing, experiences/events, Territory/Area scope, and Core consumption for identity, Membership, RBAC, Notifications, Files and Audit.

Open risk: accidentally building a general-purpose social network (global follows, viral graphs, cross-tenant feeds) that conflicts with Tenant isolation and community-purpose UX.

Open questions:

1. Which interaction primitives are in-scope for Community engagement?
2. How do comments, reactions, follows and feeds stay tenant-safe?
3. How do reporting and moderation attach to RBAC, Notifications and Audit?

This ADR defines the **Community Participation and Social Interaction Model**.

It does not create migrations or tables.

---

## Decision

**Community provides reusable interaction capabilities.**

It is **not a general social network**.

It enables **useful participation inside Tenant and Territory** (and optional Area visibility), attached to Community content and activities.

### In-scope interactions

- Comments
- Replies
- Reactions
- Mentions
- Following
- Saved content
- Activity feed
- Reporting
- Moderation

### Core rules

1. **Identity comes from Person** (ADR-010).
2. **Participation comes from Membership** (ADR-011) for community eligibility.
3. **Permissions come from RBAC** (ADR-012).
4. **Notifications use Platform Core** (ADR-019).
5. **Audit uses Platform Core** (ADR-021).
6. **Tenant remains the security boundary.**
7. **Territory/Area define visibility** for interactive surfaces tied to scoped content.
8. Interactions are content/activity-centric — not a global people graph product.

```
Community content / experience / event / meeting
  └── Interactions (comments, reactions, follows, saves, reports)
        ↑ Person + Membership + RBAC
        ↑ Core Notifications + Audit
```

---

## Interaction Model

### Comments and replies

Threaded conversation on Community entities (discussions, announcements when allowed, proposals, experiences, events, meetings, etc.).

Rules:

- Author is a Person.
- Create/reply requires RBAC Permission + audience eligibility (typically Membership in scope).
- Replies nest under comments; locking a thread is a moderation action.
- Comments are Communication content; they may emit Notifications (“new reply”) without becoming the notification store.

### Reactions

Lightweight signals (e.g. acknowledge/support) on content or comments.

Rules:

- Reactions are not Permissions and not votes for formal Voting features (ADR-025/026).
- Formal decision outcomes use Polls/Voting — not reaction counts as governance authority.
- Reaction availability may be configured per content type/Tenant.

### Mentions

References to Persons (and optionally Official/Business profiles where product allows) inside comments/content.

Rules:

- Mentions resolve inside Tenant Context; no cross-tenant mention resolution by default.
- Mention delivery uses Core Notifications.
- Mentioning someone does not grant them access to restricted content; visibility checks still apply when opening the target.

### Following

User elects to follow specific **Community entities** (and optionally organizers/topics where product allows) to receive updates.

Rules:

- Default follow targets are content/activities/topics inside the Tenant — not a platform-wide social graph.
- Following a Person globally across Tenants is out of default scope.
- Follow preferences affect Notifications; they do not bypass RBAC or content visibility.

### Saved content

Person bookmarks content for later inside the Tenant community surfaces.

Rules:

- Saves are personal to the Person within Tenant Context.
- Saved items remain subject to visibility; if content becomes restricted/unpublished, save access fails closed.

### Activity feed

User-facing stream of relevant Community actions and followed items.

Rules:

- Feed is a curated Activity projection (ADR-021 alignment) plus Community interaction events — not an unrestricted firehose.
- Feed eligibility respects Tenant Context, Membership, RBAC and Territory/Area visibility.
- Feed is not Audit and must not expose privileged operational fields.

### Interaction attachment

Interactions attach to publishable Community entities under ADR-026 lifecycle. Draft/`pending_review` items are not broadly interactive unless explicitly permitted for authors/moderators.

---

## Moderation

Moderation governs interactive participation quality and safety.

### Moderator capabilities (RBAC-gated)

- hide/remove comments and replies;
- lock/unlock threads;
- restrict reactions/mentions on an item;
- mute/block interaction privileges for an actor **within the Tenant** (product policy);
- act on reports;
- escalate to Tenant admins / Official Entity contacts where configured.

### Moderation rules

1. Moderator powers come from **RBAC**, not Membership type alone.
2. Moderation actions are auditable.
3. Authors may receive Notifications on moderation outcomes where appropriate.
4. Moderation is Tenant-scoped — no cross-tenant moderator authority by default.
5. Official content threads may have stricter interaction policies than open discussions.

---

## Reporting

Reporting lets participants flag harmful, spam, or policy-violating interactions/content.

### Report model (conceptual)

- reporter Person;
- target entity (content, comment, reaction context, etc.);
- reason / category;
- status (submitted → under_review → resolved / rejected);
- Tenant Context.

### Reporting rules

1. Submitting a report requires Authentication and Tenant Context; eligibility typically requires Membership.
2. Reports create moderation work items — they do not auto-delete content unless policy automation is explicitly enabled and Permissioned.
3. Report handling is RBAC-gated; reporters do not see other reporters’ private details by default.
4. Report lifecycle events may notify moderators via Core Notifications and append Audit Events.
5. Reporting is not a substitute for Incidents service-desk workflows (ADR-018); community abuse reports stay in Community moderation unless escalated.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for all interactions |
| Territory / Area | Visibility scope inherited from parent content/activity |
| Person | Identity of authors/reporters |
| Membership | Participation eligibility |
| RBAC | Comment, react, mention, follow, save, report, moderate |
| Notifications | Core delivery for mentions, replies, follows, reports |
| Audit | Moderation, privilege restrictions, sensitive report resolutions |
| Not a social network | No cross-tenant social graph as product default |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / interaction feature enabled?
  → Authorization (RBAC)
  → Membership / audience eligibility
  → Parent content visibility (Territory/Area + lifecycle)
  → Interaction mutation
  → Notifications + Audit/Activity as applicable
```

### Alignment statements

- Interaction APIs must not return other Tenants’ threads.
- Mentions/follows cannot be used to probe existence of Persons across Tenants.
- Activity feed personalization never widens access beyond Authorization.
- Disabled interaction features must not expose historical interaction write APIs (ADR-023).

---

## Examples

### Example 1 — Proposal discussion

```
Published proposal (Area scope)
Members comment / reply
Mentions notify Persons via Core
Moderator locks thread after decision
Audit: thread.locked
```

### Example 2 — Experience reactions and saves

```
Published experience
Members react and save
Follow experience → reminders/updates via Notifications
Not a formal vote outcome
```

### Example 3 — Report abuse

```
Member reports a comment
Moderators with community.moderate Permission review
Comment hidden; reporter notified of resolution category
```

### Example 4 — What this is not

```
No global “follow anyone on the platform”
No cross-tenant public social feed
No Membership type granting moderate-all
```

### Example 5 — Meeting comments with restricted attachments

```
Meeting discussion comments allowed for attendees/eligible Members
Attachment visibility remains restricted via Files Core rules
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Build a general social network, DMs product, or viral ranking system;
- Define full trust & safety policy catalogues or legal takedown runbooks;
- Replace formal Polls/Voting with reactions;
- Implement realtime presence/chat protocols in detail;
- Make follows grant content access;
- Allow cross-tenant interaction graphs by default;
- Absorb Incidents case management into comment reporting.

---

## Rejected Alternatives

### Community as a general social network

Rejected. Scope is useful participation inside Tenant/Territory community surfaces.

### Membership type as moderation authority

Rejected (ADR-012). RBAC grants moderate/report-handle Permissions.

### Per-microapp notification or audit for interactions

Rejected (ADR-019 / ADR-021).

### Cross-tenant mentions/follows by default

Rejected. Breaks isolation model and product intent.

### Reactions as binding governance votes

Rejected. Voting/polls remain formal decision features.

### Feed as Audit source of truth

Rejected. Audit remains immutable Core history; feed is curated Activity/UX.

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-026 Community Content Publishing Model
- ADR-027 Community Experiences and Events Model
- ADR-012 Roles and Permissions Model
- ADR-019 Notifications and Communication Model
- ADR-021 Audit and Activity Tracking Model
- ADR-011 Membership Community Participation Model
- ADR-010 Person Identity Model
- ADR-018 Incidents and Community Requests Model
- ADR-022 Search and Discovery Platform Model
- ADR-023 Configuration and Feature Management Model

---

## Decision Rule

Until superseded, Community engagement interactions must be implemented as structured, content-centric capabilities (comments, replies, reactions, mentions, following, saves, activity feed, reporting, moderation) inside Tenant/Territory(/Area) scope, using Person + Membership + RBAC and Core Notifications/Audit — never as a general social network or cross-tenant social graph.
