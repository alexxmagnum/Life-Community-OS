# ADR-020 Files, Media and Automated Storage Intelligence Model

Version: 1.1
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-06
Updated: 2026-08-06

---

## Status

Accepted

---

## Context

All Life Community OS microapps require file and media capabilities.

Duplicating file handling per microapp would create inconsistent security, storage, optimization and cleanup.

ADR-015 places **Files** and **media references** in Platform Core and forbids microapp-local parallel stacks for shared foundations.

ADR-014 requires microapps to share Platform Core and inherit Tenant security.

ADR-019 shows the same Core-consumption pattern for Notifications: microapps publish/consume; Core owns the shared service.

ADR-021 requires security-relevant file operations to be auditable.

Open questions:

1. What is owned by Core vs referenced by microapp domain entities?
2. How do visibility levels interact with Tenant isolation and RBAC?
3. How can storage providers change without rewriting every microapp?
4. How are capture, processing, optimization, delivery, retention and cleanup automated so Tenants do not rely on manual storage hygiene?
5. How do contextual capture flows (camera, gallery, documents) stay microapp-UX while pipelines stay Core?

This ADR defines the **Files, Media and Automated Storage Intelligence Model**.

It does not create migrations or tables.

---

## Decision

**Files & Media is a Platform Core service.**

Microapps **reference and consume** files but **do not own independent storage systems** and **never implement independent media pipelines**.

### Additional Decision — complete digital asset lifecycle

Files & Media Core is responsible not only for storage abstraction but also for the **complete lifecycle of digital assets**:

- capture (via Core-backed APIs / contextual UX hooks);
- upload;
- processing;
- optimization;
- delivery;
- retention;
- cleanup;
- storage intelligence.

```
Microapps (Community, Incidents, Services, …)
        │ contextual capture UX + File References
        ▼
Platform Core — Files, Media & Storage Intelligence
        │ validate → secure → process → optimize → store → deliver → lifecycle
        ▼
Storage abstraction + CDN (provider-replaceable)
```

### Core rules

1. **Microapps do not create separate file systems** or media processing pipelines.
2. **Files are not owned by one microapp** as a private storage silo.
3. **File references belong to domain entities** (incident, profile, event, etc.).
4. **Tenant remains the security boundary**; files inherit Tenant Context.
5. **Visibility controls access** (within Tenant rules); **RBAC controls management actions**.
6. **Audit tracks relevant operations** (ADR-021).
7. Storage providers and CDNs are replaceable behind Core abstraction.
8. **No manual cleanup should be required** as the default operating mode — Core Storage Intelligence manages unused, temporary, duplicate and oversized assets under policy.
9. Life Panoramica uses the same Core Files service as any other Tenant.

### Core responsibilities

| Responsibility | Meaning |
|----------------|---------|
| Capture / upload | Accept contextual uploads under Tenant Context |
| Storage abstraction | Provider-agnostic store/retrieve/delete |
| Validation & security checks | Type/size limits, malware/content policy hooks |
| Metadata extraction | Type, size, dimensions, duration, checksums, timestamps |
| Duplicate detection | Hash-based Physical File reuse |
| Optimization & variants | Thumbnails, previews, modern formats, video compression |
| Access control | Enforce Tenant + visibility + Authorization |
| Delivery | Lazy/responsive delivery, CDN caching |
| Lifecycle management | temporary → active → archived → trash → deleted |
| Storage intelligence | Usage analytics, orphan/temp cleanup, archive recommendations |
| Audit | Security-relevant file operations |

---

## File Model

### Physical File

The **stored object** (and its derived variants) managed by Platform Core.

Represents bytes in storage plus Core metadata (content type, size, hashes, status, Tenant Context, visibility, created-by Identity/Person linkage as applicable).

Physical Files are Core resources. They are not “Incident files” or “Community files” as separate storage products.

### File Reference

The **relationship between a file and a domain entity**.

Examples:

- Incident → photo / short video File Reference;
- Business Profile → logo / gallery File Reference;
- Official Entity → institutional document File Reference;
- Community event / experience → image / gallery File Reference.

### Ownership rules

| Concept | Owns |
|---------|------|
| Platform Core | Physical File, variants, storage, processing, metadata, access, delivery, lifecycle, intelligence |
| Domain entity (microapp) | File Reference (why this file is attached / ordered / labeled) |
| Tenant | Isolation boundary for tenant-scoped files |
| Microapp module | Contextual capture UX and which entity types may attach files — not a private bucket or transcoder |

### Deduplication

The system detects identical files using hashing (and related content identity signals).

Example:

```
Multiple users upload the same image
  → One Physical File
  → Multiple File References
```

Deduplication is **within Tenant isolation rules** by default (no accidental cross-tenant byte sharing that leaks existence/metadata across Tenants unless a future ADR explicitly defines platform-shared content).

---

## Media Capture Layer

Files can originate from:

- device camera;
- video capture;
- device gallery;
- document upload;
- external integrations.

The **capture experience should be contextual** to the microapp flow, while upload/processing always goes through File Core.

### Examples

**Incident creation** — user can directly:

- open camera;
- capture photo;
- record short video;
- attach evidence.

**Experience / event creation** — user can:

- capture cover image;
- upload gallery;
- attach media.

**Business profile** — user can:

- upload logo;
- upload gallery.

Microapps provide UX entry points; they must not implement separate upload→transcode→CDN pipelines.

---

## Automated Media Processing Pipeline

Every uploaded asset follows an automated pipeline:

```
Capture / Upload
  ↓
Validation
  ↓
Security checks
  ↓
Metadata extraction
  ↓
Duplicate detection
  ↓
Optimization
  ↓
Variant generation
  ↓
Storage
  ↓
CDN delivery
  ↓
File Reference creation
```

### Pipeline rules

1. Pipeline stages are Core-owned and policy-driven (per Tenant plan/configuration where applicable — ADR-023).
2. Failure at security/validation fails closed for publish/attach.
3. Duplicate detection may short-circuit to an existing Physical File + new File Reference.
4. File Reference creation binds the domain entity after the Physical File (or reused file) is durable.
5. System processing emits Audit Events such as `file.processed` where relevant (ADR-021).

---

## Image Optimization

The system automatically generates optimized versions, including:

- thumbnail;
- preview;
- web optimized;
- detail version.

Support modern formats:

- WebP;
- AVIF where applicable.

**Original files should only be retained when required** (policy, legal, or product necessity). Otherwise prefer optimized/variant retention to control storage.

Clients should request the smallest suitable variant for the view — never force full originals into list/grid UIs.

---

## Video Processing

Video support must include:

- maximum duration policies;
- maximum size policies;
- compression;
- optimized delivery.

Example — short incident videos:

- limited duration;
- compressed automatically;
- delivered via optimized variants / streaming-friendly forms as Core defines.

Microapps declare intent (e.g. “incident evidence clip”); Core enforces limits and processing.

---

## Automated Storage Intelligence

The platform continuously manages storage.

### Automatic processes

- detect unused files;
- remove temporary uploads;
- detect duplicates;
- optimize oversized media;
- archive old content;
- calculate storage usage.

**No manual cleanup should be required** as the default operational expectation. Admins may still run governed actions; intelligence should prevent routine manual hygiene.

### Storage Analytics

Provide automated insights:

- storage consumption;
- optimization opportunities;
- duplicate files;
- cleanup recommendations;
- tenant usage.

Analytics are tenant-scoped. Cross-tenant aggregates, if any, are Platform Context / commercial ops only — never mixed Business Data listings.

---

## Lifecycle Management

File lifecycle:

```
temporary
  → active
  → archived
  → trash
  → deleted
```

| State | Meaning |
|-------|---------|
| `temporary` | Upload in progress / not yet referenced; eligible for rapid cleanup |
| `active` | Referenced and in operational use |
| `archived` | Retained but not primary delivery |
| `trash` | Soft-removed; recoverable until retention elapses |
| `deleted` | Permanently removed per policy |

**Deletion must respect retention policies** (Tenant/platform legal and product rules). Lifecycle transitions for sensitive assets are Authorization-gated and auditable when required.

---

## Lazy Loading and Delivery Optimization

The system must support:

- lazy loading;
- thumbnails;
- progressive loading;
- CDN caching;
- responsive media delivery.

**The application should never load unnecessarily large assets** when a smaller variant satisfies the UI.

Delivery URLs/tokens remain Core-issued, short-lived where private/restricted, and tenant-safe.

---

## Storage Model

### Abstraction

```
Contextual capture / Upload API (Core)
  → Tenant Context + Permissions + constraints
  → automated processing pipeline
  → persist Physical File (+ variants) metadata
  → write bytes via Storage Adapter
  → CDN publication as applicable
  → return file id + File Reference hooks
```

### Adapter rules

1. Microapps call Core APIs; they do not embed provider SDKs as the source of truth.
2. Bucket/container layout is an infrastructure detail of the adapter.
3. Provider migration must not require rewriting Incident/Community domain schemas — only Core adapter + metadata.
4. Direct client uploads (e.g. signed URLs) are allowed only through Core-issued, short-lived, tenant-scoped credentials.
5. CDN is part of delivery optimization, not a bypass of visibility/RBAC checks for private/restricted assets.

### Metadata (conceptual)

Physical File metadata includes at least:

- stable file id;
- Tenant Context;
- visibility;
- content type / size / media metrics;
- content hash (deduplication);
- storage keys for original (if kept) and variants;
- lifecycle status;
- created/updated timestamps;
- created-by actor linkage;
- processing status.

Exact schema is deferred to migration design.

---

## Visibility

File visibility levels:

| Visibility | Meaning |
|------------|---------|
| `public` | Readable under product-defined public rules (still Tenant-associated where tenant Business Data applies; never silently cross-tenant) |
| `private` | Readable only by authorized actors related to the owning context |
| `restricted` | Readable by a narrower authorized set (e.g. assignees/admins only) |

### Visibility rules

1. Visibility is an **access policy attribute**, not a Permission name and not Membership type.
2. Changing visibility is an RBAC-gated management action.
3. `public` does not mean “all Tenants worldwide”; default directory/media publicness is within Tenant product rules unless a future ADR defines platform-public media.
4. Restricted incident evidence remains restricted even if the parent Territory is broad.
5. Variants inherit parent visibility unless explicitly stricter.
6. Notifications (ADR-019) should deep-link to authorized views rather than attaching unrestricted private binaries by default.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for tenant-scoped files |
| Files | Inherit Tenant Context |
| Visibility | Constrains read access within policy |
| RBAC | Upload, replace, delete, change visibility, manage, intelligence admin |
| Audit | Tracks relevant file/lifecycle/intelligence operations |
| Microapps | Contextual capture + references only; no independent media pipeline |
| Service Role / signed URLs | Backend-issued, short-lived, never long-lived client secrets |
| Deduplication | Must not leak cross-tenant existence by default |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Authorization (file Permissions)
  → Visibility check
  → Storage read/write / variant delivery via Core
  → Audit (security-relevant operations)
```

### Alignment statements

- File bytes, variants and metadata must not leak across Tenants.
- Orphan/temporary files are Core intelligence responsibilities — microapps must not leave unmanaged provider objects.
- Preview/optimized derivatives inherit Tenant Context and visibility unless explicitly stricter.
- Storage analytics exposing another Tenant’s usage are forbidden outside Platform Context.
- Core Files used by Notifications/Communications follow the same isolation rules.

---

## Examples

### Example 1 — Incident evidence capture

```
Incident creation UX
  → camera / short video / gallery
  → Core upload pipeline (validate, secure, optimize)
  → Physical File (+ variants)
  → File References on Incident
  visibility: restricted
```

### Example 2 — Deduplicated gallery upload

```
User A and User B upload identical image bytes in same Tenant
  → one Physical File
  → two File References (different entities or same)
```

### Example 3 — Business Profile media

```
Business Profile
  ├── logo → File Reference → optimized variants
  └── gallery → File References
        visibility: public (within Tenant directory rules)
```

### Example 4 — Storage intelligence

```
Temporary uploads with no File Reference past TTL → removed
Old inactive media → archived per policy
Tenant usage dashboard → consumption + duplicate recommendations
```

### Example 5 — Anti-pattern avoided

Incidents microapp does **not** create `incidents-bucket` with its own transcoder/CDN/ACL model. It uses contextual capture + File References to Core Physical Files.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose object-storage, CDN, or transcoder vendors;
- Define exact byte/duration limits or virus-scanning vendors;
- Implement in-browser advanced image editors or full DAM suites;
- Define legal hold / GDPR export runbooks in detail;
- Make Files an Authorization engine;
- Allow unbounded cross-tenant public CDNs without Tenant association;
- Require retaining every original forever;
- Move domain entities into Core because they have attachments;
- Mandate real-time ML content moderation product details (hooks may exist later).

---

## Rejected Alternatives

### Per-microapp storage or media pipelines

Rejected. Causes inconsistent security, optimization, lifecycle and provider lock-in (ADR-015).

### Domain entity stores raw provider URLs only

Rejected as primary model. Core must own Physical File identity, processing, access issuance and lifecycle.

### Visibility = RBAC role

Rejected. Visibility is access class; Permissions authorize management and elevated reads.

### Files without Tenant Context

Rejected for tenant Business Data. Fail closed (ADR-003 alignment).

### Microapp “owns” the file exclusively forever

Rejected. Physical Files are Core resources; microapps own references/attachments.

### Manual-only storage cleanup as the operating model

Rejected. Automated Storage Intelligence is required so routine hygiene is not a human dependency.

### Cross-tenant physical deduplication by default

Rejected unless a future ADR defines safe platform-shared content. Default dedupe stays tenant-safe.

---

## Related Domains

- ADR-015 Platform Core Services Model
- ADR-019 Notifications and Communication Model
- ADR-021 Audit and Activity Tracking Model
- ADR-023 Configuration and Feature Management Model
- ADR-014 Microapp Platform Architecture
- ADR-012 Roles and Permissions Model
- ADR-018 Incidents and Community Requests Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-013 Community Microapp Governance Model
- ADR-003 Database Security and RLS Model
- Security: Audit, Encryption, Secrets (provider credentials)

---

## Decision Rule

Until superseded, all file and media handling must go through Platform Core Files, Media and Automated Storage Intelligence: capture/upload/processing/optimization/delivery/retention/cleanup live in Core; domain entities hold File References; Tenant Context, visibility and RBAC govern access; Audit tracks relevant operations; and no microapp may implement an independent file system or media pipeline.
