# ADR-020 Files and Media Management Model

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

All Life Community OS microapps require file and media capabilities.

Duplicating file handling per microapp would create inconsistent security and storage.

ADR-015 places **Files** and **media references** in Platform Core and forbids microapp-local parallel stacks for shared foundations.

ADR-014 requires microapps to share Platform Core and inherit Tenant security.

ADR-019 shows the same Core-consumption pattern for Notifications: microapps publish/consume; Core owns the shared service.

Open questions:

1. What is owned by Core vs referenced by microapp domain entities?
2. How do visibility levels interact with Tenant isolation and RBAC?
3. How can storage providers change without rewriting every microapp?

This ADR defines the **Files and Media Management Model**.

It does not create migrations or tables.

---

## Decision

**Files & Media is a Platform Core service.**

Microapps **reference and consume** files but **do not own independent storage systems**.

### Core rules

1. **Microapps do not create separate file systems.**
2. **Files are not owned by one microapp** as a private storage silo.
3. **File references belong to domain entities** (incident, profile, event, etc.).
4. **Tenant remains the security boundary**; files inherit Tenant Context.
5. **Visibility controls access** (within Tenant rules); **RBAC controls management actions**.
6. Storage providers are replaceable behind Core abstraction.
7. Life Panoramica uses the same Core Files service as any other Tenant.

```
Microapps (Community, Incidents, Services, …)
        │ attach / request upload / resolve URLs
        ▼
Platform Core — Files & Media
        │ metadata + access + lifecycle
        ▼
Storage abstraction (provider-replaceable)
```

### Core responsibilities

| Responsibility | Meaning |
|----------------|---------|
| File upload | Accept and validate uploads under Tenant Context |
| Storage abstraction | Provider-agnostic store/retrieve/delete |
| Metadata management | Type, size, checksum, owner actor, timestamps, etc. |
| Access control | Enforce Tenant + visibility + Authorization |
| Previews | Thumbnails/derived renditions where applicable |
| Lifecycle management | Retention, soft-delete/archive, orphan cleanup |

---

## File Model

### Physical File

The **stored object** managed by Platform Core.

Represents bytes in storage plus Core metadata (content type, size, hashes, status, Tenant Context, visibility, created-by Identity/Person linkage as applicable).

Physical Files are Core resources. They are not “Incident files” or “Community files” as separate storage products.

### File Reference

The **relationship between a file and a domain entity**.

Examples:

- Incident → photo File Reference;
- Business Profile → logo File Reference;
- Official Entity → institutional document File Reference;
- Community event → image / attachment File Reference.

### Ownership rules

| Concept | Owns |
|---------|------|
| Platform Core | Physical File, storage, metadata, access enforcement, previews, lifecycle |
| Domain entity (microapp) | File Reference (why this file is attached / ordered / labeled) |
| Tenant | Isolation boundary for tenant-scoped files |
| Microapp module | Feature UX and which entity types may attach files — not a private bucket architecture |

A Physical File may have multiple references only if Core explicitly allows sharing; default Foundation intent is one primary reference graph per upload use case unless product defines reuse.

---

## Storage Model

### Abstraction

```
Upload API (Core)
  → validate Tenant Context + Permissions + constraints
  → persist Physical File metadata
  → write bytes via Storage Adapter
  → optional preview derivation
  → return file id + reference hooks
```

### Adapter rules

1. Microapps call Core APIs; they do not embed provider SDKs as the source of truth.
2. Bucket/container layout is an infrastructure detail of the adapter.
3. Provider migration must not require rewriting Incident/Community domain schemas — only Core adapter + metadata.
4. Direct client uploads (e.g. signed URLs) are allowed only through Core-issued, short-lived, tenant-scoped credentials.

### Metadata (conceptual)

Physical File metadata includes at least:

- stable file id;
- Tenant Context;
- visibility;
- content type / size;
- storage key (adapter-internal);
- created/updated timestamps;
- created-by actor linkage;
- lifecycle status (e.g. active, archived, deleted).

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
5. Notifications (ADR-019) should deep-link to authorized views rather than attaching unrestricted private binaries by default.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for tenant-scoped files |
| Files | Inherit Tenant Context |
| Visibility | Constrains read access within policy |
| RBAC | Upload, replace, delete, change visibility, manage |
| Microapps | Reference only; no independent storage control plane |
| Service Role / signed URLs | Backend-issued, short-lived, never long-lived client secrets |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Authorization (file Permissions)
  → Visibility check
  → Storage read/write via Core
  → Audit (security-relevant operations)
```

### Alignment statements

- File bytes and metadata must not leak across Tenants.
- Orphan files after entity deletion follow Core lifecycle policy (detach, retain, or purge) — microapps must not leave unmanaged provider objects.
- Preview derivatives inherit the parent file’s Tenant Context and visibility unless explicitly stricter.
- Core Files used by Notifications/Communications follow the same isolation rules.

---

## Examples

### Example 1 — Incident photos

```
Incident (Incidents microapp)
  └── File References → Physical Files (photos, documents)
        visibility: restricted
        Tenant: Life Panoramica
```

### Example 2 — Business Profile media

```
Business Profile (Services)
  ├── logo → File Reference
  └── gallery → File References
        visibility: public (within Tenant directory rules)
```

### Example 3 — Official Entity documents

```
Official Entity Profile
  └── institutional documents → File References
        visibility: public or restricted per document
        management: RBAC + verification governance
```

### Example 4 — Community event image

```
Community Event
  └── image attachment → File Reference
        visibility: public within Territory audience rules
```

### Example 5 — Anti-pattern avoided

Incidents microapp does **not** create `incidents-bucket` with its own ACL model parallel to Core. It stores File References to Core Physical Files.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose object-storage vendors or CDN providers;
- Define virus-scanning vendors or exact size limits;
- Implement image editor UX or full DAM product features;
- Define legal hold / GDPR export runbooks in detail;
- Make Files an Authorization engine;
- Allow unbounded cross-tenant public CDNs without Tenant association;
- Move domain entities into Core because they have attachments.

---

## Rejected Alternatives

### Per-microapp storage systems

Rejected. Causes inconsistent security, lifecycle and provider lock-in (ADR-015).

### Domain entity stores raw provider URLs only

Rejected as primary model. Core must own Physical File identity, access issuance and lifecycle.

### Visibility = RBAC role

Rejected. Visibility is access class; Permissions authorize management and elevated reads.

### Files without Tenant Context

Rejected for tenant Business Data. Fail closed (ADR-003 alignment).

### Microapp “owns” the file exclusively forever

Rejected. Physical Files are Core resources; microapps own references/attachments.

---

## Related Domains

- ADR-015 Platform Core Services Model
- ADR-019 Notifications and Communication Model
- ADR-014 Microapp Platform Architecture
- ADR-012 Roles and Permissions Model
- ADR-018 Incidents and Community Requests Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-013 Community Microapp Governance Model
- ADR-003 Database Security and RLS Model
- Security: Audit, Encryption, Secrets (provider credentials)

---

## Decision Rule

Until superseded, all file and media handling must go through Platform Core Files & Media: Physical Files and storage live in Core, domain entities hold File References, Tenant Context and visibility govern access, RBAC governs management, and no microapp may implement an independent file system.
