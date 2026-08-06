# ADR-022 Search and Discovery Platform Model

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

Life Community OS is a multi-tenant SaaS platform with multiple microapps and many domain entities.

Users and administrators need to find People, profiles, community content, events, incidents and file metadata without each microapp inventing its own search stack.

ADR-014 establishes reusable microapps on Platform Core.

ADR-015 requires shared capabilities that must not be duplicated inside microapps.

ADR-021 establishes Audit/Activity as Core services with the same “emit to Core / do not fork” pattern.

ADR-017 defines Service Directory discovery for Business/Official profiles; that directory may consume this shared Search layer rather than owning a private search engine.

Open questions:

1. What does Platform Core own vs what microapps expose?
2. How do public, authenticated and admin search contexts differ?
3. How do Tenant isolation, visibility and RBAC constrain results?
4. How is indexing kept consistent when entities change?

This ADR defines the **Search and Discovery Platform Model**.

It does not create migrations or tables.

---

## Decision

**Search & Discovery is a Platform Core service.**

Microapps **expose searchable entities** through the shared search layer.

Microapps **do not create independent search systems**.

### Core rules

1. **Search must respect Tenant security** (Tenant Context; fail closed for tenant Business Data).
2. **Search results depend on permissions and visibility.**
3. **Search is not a security boundary** — it never replaces Tenant isolation, RLS, or Authorization.
4. **RBAC controls access to results** (especially admin/operational search).
5. Indexing is Core-operated; microapps publish indexable documents / change events.
6. Life Panoramica uses the same Search Core as any other Tenant — no customer-specific search product fork.

```
Microapps + Core domains
        │ expose documents / change events
        ▼
Platform Core — Search & Discovery
        │ query under Tenant Context + visibility + Permissions
        ▼
Results (filtered, ranked)
```

### Capabilities

| Capability | Purpose |
|------------|---------|
| Global user search | Cross-entity find for eligible authenticated users |
| Admin search | Operational/management find under elevated Permissions |
| Discovery search | Public/community discovery (services, officials, events) |
| Filtering | Facets/constraints (type, area, status, verification, …) |
| Ranking | Relevance and product ranking signals |
| Indexing | Build/update searchable representations |

---

## Search Model

### Searchable entities (initial catalogue)

| Entity | Typical source |
|--------|----------------|
| Person | Platform Core identity (privacy-constrained) |
| Business Profile | Services / profiles (ADR-016 / ADR-017) |
| Official Entity Profile | Services / official profiles |
| Community content | Community microapp (announcements, proposals, …) |
| Events | Events / Community capabilities |
| Incidents | Incidents microapp (permission-sensitive) |
| Files metadata | Core Files (ADR-020) — metadata, not raw private bytes by default |

Additional entity types may register later without changing Tenant isolation rules.

### Document model (conceptual)

A searchable document includes at least:

- Tenant Context;
- entity type + entity id;
- display fields / search text;
- filters/facets (Territory, Area, status, verification, microapp, …);
- visibility class;
- permission/audience hints required for result eligibility;
- updated timestamp for freshness.

Documents are **projections** for findability. Source of truth remains domain systems (and Audit for history — ADR-021).

### Query model

Queries execute with:

1. Tenant Context (required for tenant-scoped indexes);
2. Search context (public / authenticated / admin);
3. Actor Permissions and Membership eligibility where required;
4. Filters + ranking.

Unauthorized hits are omitted (or denied as empty), never returned “and filtered in the UI only” as the sole control.

---

## Indexing

### Ownership

| Layer | Responsibility |
|-------|----------------|
| Platform Core Search | Indexes, analyzers, ranking runtime, query APIs, tenant partitioning |
| Microapps / Core domains | Emit create/update/delete (or reindex) signals with eligible fields |
| Storage/search engine adapter | Replaceable infrastructure behind Core |

### Indexing rules

1. Microapps do not run private Elasticsearch/Meilisearch/Postgres-FTS stacks as the product search source of truth.
2. Domain writes should result in eventual index updates; consistency model may be near-real-time.
3. Deletes/archives/suspensions must remove or tombstone documents from eligible discovery.
4. Reindex/rebuild is a Core operations capability, auditable when privileged (ADR-021).
5. Person indexing must honor privacy minimization (no dumping of sensitive contact data into public discovery documents).

### Change pipeline (conceptual)

```
Domain mutation
  → search indexing event
  → Core transforms to document
  → upsert/delete in tenant partition
  → optional Audit for privileged reindex ops
```

---

## Visibility and Security

### Principles

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for tenant search corpora |
| Search | Not a security boundary |
| Visibility | Entity visibility (public/private/restricted, profile verification, content scope) constrains documents |
| RBAC | Controls who may query which contexts and entity classes |
| RLS / domain AuthZ | Remain authoritative; search must not outrank them |

### Result eligibility

A document is returnable only if **all** apply:

1. Tenant Context matches (for tenant-scoped search);
2. Search context allows the entity class;
3. Document visibility allows the audience;
4. Actor holds required Permissions / participation eligibility;
5. Microapp/entity is enabled and not suspended for listing where applicable.

### Anti-leakage

- No cross-tenant search blending by default.
- Admin search does not imply Service Role or bypass of Tenant Context.
- File search returns metadata/references; binary access still goes through Files Core access checks (ADR-020).
- Incident search must not expose restricted fields to unauthorized actors.

---

## Search Contexts

### Public discovery

Audience: broader discovery experiences (still typically Tenant-branded / tenant-scoped community surfaces unless a future ADR defines platform-wide public search).

Typical entities:

- services (Business Profiles);
- official profiles;
- events (when publicly listed).

Constrained by verification/lifecycle and public visibility rules (ADR-016 / ADR-017).

### Authenticated search

Audience: signed-in community participants.

Typical entities:

- community content;
- user-related information eligible to the actor;
- broader event/incident subsets allowed by Permissions.

Requires Authentication + Tenant Context + participation/permission checks.

### Admin search

Audience: operators with explicit admin/search Permissions.

Typical entities:

- operational entities (incidents queues, memberships tooling, verification queues);
- management data;
- richer filters and fields.

RBAC-gated; auditable access where product requires (ADR-021).

---

## Examples

### Example 1 — Find a pharmacy

```
Context: Public discovery
Query: "pharmacy"
Results: verified Business Profiles with matching category/coverage in Tenant
```

### Example 2 — Find an announcement

```
Context: Authenticated search
Query: "water maintenance"
Results: Community announcements visible to actor in Territory/Area scope
```

### Example 3 — Admin finds an incident

```
Context: Admin search
Permission: incidents.search / incidents.manage
Query: "street light Aldea Golf"
Results: matching incidents including operational fields allowed by Permission
```

### Example 4 — Microapp integration

```
Incidents microapp
  → on create/update emits index document
  → does not run its own search cluster
Services directory
  → discovery queries Core Search (or thin facade over it)
```

### Example 5 — Denied result

Actor lacks Permission to view restricted incident → document omitted from results even if text matches.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose search engine vendors;
- Define ranking ML models or personalization algorithms;
- Replace Service Directory product UX (ADR-017);
- Implement autocomplete UI;
- Make search results authoritative over domain reads;
- Define cross-tenant global web search marketplace;
- Index raw private file bytes by default;
- Grant Permissions via “found in search”.

---

## Rejected Alternatives

### Per-microapp independent search systems

Rejected (ADR-015). Inconsistent security, ranking and ops.

### Search as security boundary / Tenant substitute

Rejected. Tenant Context + RLS + RBAC remain authoritative.

### Return all matches and filter only in the client

Rejected. Authorization/visibility must be enforced in the search service path.

### Public discovery indexes unverified and restricted data by default

Rejected. Verification/visibility rules still apply (ADR-016).

### Admin search without Tenant Context

Rejected. Fail closed for tenant Business Data.

---

## Related Domains

- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-021 Audit and Activity Tracking Model
- ADR-017 Service Directory Discovery Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-020 Files and Media Management Model
- ADR-012 Roles and Permissions Model
- ADR-003 Database Security and RLS Model
- ADR-019 Notifications and Communication Model

---

## Decision Rule

Until superseded, findability across microapps must go through Platform Core Search & Discovery: microapps expose indexable entities, queries always respect Tenant security plus visibility and RBAC, and no microapp may implement an independent search system as product source of truth.
