# ADR-031 Community Resources and Reservations Model

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

Communities, municipalities, clubs and organizations manage **shared physical resources** (rooms, courts, amenities, equipment, vehicles, spaces).

ADR-025 defines Community as a reusable microapp.

ADR-027 / ADR-030 cover experiences/events/meetings and unified calendar projections with Core Notifications for reminders.

ADR-011 / ADR-012 require Membership for eligibility and RBAC for capabilities — not Membership type as Authorization.

Open questions:

1. How are shared resources and reservations modeled inside Community without becoming a full commercial Bookings/Marketplace product?
2. How do availability, policies, Groups and Experiences integrate with Calendar?
3. How does Tenant/Territory/Area isolation apply to resource inventory?

This ADR defines the **Community Resources and Reservations Model**.

It does not create migrations or tables.

---

## Decision

**Resources & Reservations is a reusable Community capability** for managing **shared resources and availability**.

It supports operational community use (member amenity booking, meeting rooms, courts, shared assets) under Tenant isolation.

It is **not** by default a consumer marketplace checkout product; paid public booking/commerce remains Bookings/Marketplace microapps when entitled (ADR-014 / ADR-024).

### Core rules

1. **Person remains identity.**
2. **Membership defines eligibility** to reserve (default).
3. **RBAC controls capabilities** (manage resources, approve reservations, override conflicts, configure policies).
4. **Tenant remains the security boundary.**
5. **Territory/Area define scope** for inventory visibility and eligibility.
6. **Notifications and Calendar are Platform/Core / Community capabilities** (reminders via Core Notifications; schedule projection via Calendar — ADR-019 / ADR-030).
7. Resources are not Tenants, not security boundaries, and not Persons.

```
Community Microapp
  └── Resources & Reservations
        ├── Resource inventory
        ├── Availability rules
        └── Reservations
              ↔ Experiences / Meetings / Groups (optional links)
              ↔ Calendar projection + Core Notifications
```

---

## Resource Types

Illustrative resource classes (configurable per Tenant):

| Type | Examples |
|------|----------|
| **Space / room** | Meeting room, hall, coworking desk zone |
| **Amenity** | Pool lane slot, BBQ area, coworking terrace |
| **Sports facility** | Tennis court, paddle court, gym studio |
| **Equipment** | Shared tools, A/V kit, bikes |
| **Vehicle** | Community shuttle / shared cart (if operated by Tenant) |
| **Custom** | Tenant-defined shared assets |

### Resource rules

1. Each Resource belongs to a **Territory** isolation path (optional **Area** organizational location).
2. Resource type is classification — not a Permission.
3. Resources may have capacity (seats, simultaneous bookings) and attributes (size, amenities metadata).
4. Media (photos) use Core Files references (ADR-020).
5. Official Entity or Group may be designated operator/custodian without becoming the Tenant.

---

## Availability Model

Availability defines when a Resource can be reserved.

### Availability inputs (conceptual)

- weekly schedules / blackout dates;
- open hours and slot granularity;
- lead time / max advance booking window;
- buffer before/after reservations;
- maintenance holds;
- recurrence of closed periods;
- capacity per slot.

### Availability rules

1. Availability is evaluated in Tenant Context against existing Reservations and holds.
2. Calendar may show resource busy/free projections for eligible actors — not a second inventory database of record.
3. Conflicts fail closed for double-booking unless an authorized override Permission is used and audited.
4. Timezone policy aligns with Community Calendar scheduling (ADR-030).
5. Area filters help discovery; they do not create separate tenancy for the asset.

---

## Reservation Lifecycle

```
draft
  → requested
  → pending_approval (optional)
  → confirmed
  → checked_in / in_use (optional)
  → completed
  → cancelled
  → no_show (optional)
  → archived
```

| Status | Meaning |
|--------|---------|
| `draft` | User preparing a request |
| `requested` | Submitted |
| `pending_approval` | Awaiting authorized approval when policy requires |
| `confirmed` | Holds the slot |
| `checked_in` / `in_use` | Operational use started |
| `completed` | Finished normally |
| `cancelled` | Released by user/admin policy |
| `no_show` | Confirmed but unused |
| `archived` | Historical retention |

### Lifecycle rules

1. Transitions are Permission- and policy-gated.
2. Confirmation decrements/locks availability for the slot.
3. Cancellation may enforce notice windows and penalties as **community policy** (not SaaS billing by default).
4. Significant overrides (force-book, admin cancel) are auditable (ADR-021).
5. Reservation status is not a security boundary and not an RBAC Role.

---

## Rules and Policies

Per-Tenant (and optionally per-Resource / Area / Group) policy knobs:

| Policy | Purpose |
|--------|---------|
| Who can reserve | Membership + Permission requirements |
| Approval required | Auto-confirm vs moderator approval |
| Max active reservations | Fair-use caps |
| Max duration / slot length | Abuse prevention |
| Min/max notice | Operational planning |
| Allowed roles/groups | Restrict certain amenities |
| Quotas | Daily/weekly limits per Person |
| Deposit/fee hooks | Optional — only if commercial Bookings entitled; otherwise informational |

### Policy rules

1. Policies are Configuration within entitlement (ADR-023 / ADR-024) — not custom code forks.
2. Policies never replace Tenant isolation or RBAC evaluation order.
3. Exceeding fair-use quotas denies new reservations (fail closed for consume paths).
4. “Resident” Membership type alone does not grant manage-resources Permission.

---

## Group Integration

| Integration | Behaviour |
|-------------|-----------|
| Group-owned / group-preferred resource | Eligibility may require Group Membership (ADR-029) |
| Committee room | Private visibility to Group + admins |
| Group event holds | Experience/Meeting can reserve a Resource |

### Rules

1. Groups organize access — they are not Resource Tenants.
2. Private group resources remain Tenant-scoped in persistence/isolation.
3. Group organizers need RBAC (possibly group-scoped) to manage linked resources/reservations.

---

## Experience Integration

| Integration | Behaviour |
|-------------|-----------|
| Experience/Event/Meeting venue | Links to a Resource reservation hold |
| Capacity alignment | Activity capacity may be constrained by Resource capacity |
| Series | Recurring experiences may create recurring resource holds (ADR-027 / ADR-030) |

### Rules

1. Experience remains system of record for participation registration; Resource reservation is the asset hold.
2. Cancelling an Experience should release or cancel linked Resource holds per policy.
3. Double systems of truth are forbidden: conflict checks must include both activity holds and direct reservations.

---

## Calendar Integration

| Integration | Behaviour |
|-------------|-----------|
| Community Calendar | Shows confirmed reservations / resource holds eligible to the viewer |
| Resource calendar | Admin/organizer view of a Resource timeline |
| Reminders | Core Notifications for upcoming reservations |

### Rules

1. Calendar is a projection (ADR-030); reservation records remain authoritative for holds.
2. Members see only what visibility + Membership + Permissions allow.
3. Reminders do not use a Community-local SMTP stack (ADR-019).

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for resources and reservations |
| Territory / Area | Inventory location and eligibility scope |
| Person | Identity of requester/approver |
| Membership | Default eligibility |
| RBAC | Manage resources, approve, override, configure policies |
| Groups | Optional eligibility organization |
| Notifications / Calendar | Core / Community scheduling surfaces |
| Resource / Reservation | Not security boundaries |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / resources feature enabled?
  → Authorization (reserve vs manage)
  → Membership / Group eligibility
  → Territory/Area scope
  → Policy + availability + conflict check
  → Reservation lifecycle transition
  → Calendar projection + Notifications + Audit as applicable
```

### Alignment statements

- Resource APIs must not list other Tenants’ assets.
- Admin override is Permissioned and auditable — not Service Role in clients.
- Disabled capability must not expose reservation write paths (ADR-023).
- Optional fees/checkout require entitled Bookings/Marketplace flows; Resources & Reservations remains operational by default.

---

## Examples

### Example 1 — Paddle court reservation

```
Resource: Paddle Court 1 (Area: Aldea Golf)
Member requests 18:00–19:00
Policy: auto-confirm if available
Status: confirmed
Calendar shows hold; reminder 1h before via Core Notifications
```

### Example 2 — Meeting room with approval

```
Resource: Community Meeting Room
Group: Pool Committee
Request → pending_approval
Organizer with resources.approve confirms
Meeting entity linked to reservation
```

### Example 3 — Experience holds venue

```
Experience: Yoga series (recurring)
Each occurrence reserves Studio A with buffers
Registration on Experience; asset conflict blocks double-book
```

### Example 4 — Unauthorized manage

```
Member can reserve eligible amenities
Cannot create resources or force-override conflicts without Permission
```

### Example 5 — Municipality / club reuse

```
Same capability:
  Municipality books civic rooms
  Club books courts
  Residential community books BBQ areas
No tenant-specific fork
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Implement full hospitality PMS / hotel inventory systems;
- Define Marketplace seller listings for private resources across Tenants;
- Build payment capture, invoicing, or channel-manager integrations (Bookings/Billing as entitled);
- Replace Incidents for maintenance outages (maintenance holds may link to Incidents later);
- Make Resource a Tenant or RLS root;
- Finalize IoT lock/access-control hardware protocols;
- Allow Membership type alone to grant resource administration.

---

## Rejected Alternatives

### Resources as nested Tenants

Rejected. Breaks SaaS isolation model.

### Per-customer reservation forks

Rejected (ADR-014 / ADR-025). Reusable Community capability.

### Calendar as inventory system of record

Rejected (ADR-030). Reservations/resources remain authoritative for holds.

### Membership type grants manage-all-resources

Rejected (ADR-012).

### Independent notification stack for reservation reminders

Rejected (ADR-019).

### Always-on public paid booking marketplace inside this capability

Rejected as default. Operational community reservations first; commerce microapps separate.

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-027 Community Experiences and Events Model
- ADR-030 Community Calendar and Scheduling Model
- ADR-029 Community Groups and Circles Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-019 Notifications and Communication Model
- ADR-021 Audit and Activity Tracking Model
- ADR-020 Files, Media and Automated Storage Intelligence Model
- ADR-023 Configuration and Feature Management Model
- ADR-024 Billing and Plans Model
- Future: Bookings / Marketplace microapps

---

## Decision Rule

Until superseded, shared physical community assets must be managed through the Community Resources & Reservations capability: Tenant-scoped resources with Territory/Area scope, Membership eligibility, RBAC management, policy-based availability, reservation lifecycle, optional Group/Experience links, and Calendar/Notifications integration — never as nested tenancy, a calendar-only inventory, or a default commercial marketplace fork.
