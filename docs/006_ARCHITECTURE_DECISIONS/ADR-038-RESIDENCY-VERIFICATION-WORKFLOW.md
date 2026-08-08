# ADR-038 Residency Verification Workflow

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-08

---

## Status

Accepted

---

## Context

ADR-037 derives Community Area resource eligibility from active Property Person Relationships. Without a verification gate, a Person could **claim** a residence and immediately access restricted resources or private channels.

Product requirement:

- Residency claims must **not** grant access automatically.
- A Person requesting access to a Community Area must create a **residency verification request**.
- Restricted resources and private channels require an **active verified** residency relationship.
- Verification evidence must **not** be stored on Person (identity separation; Files via Platform Core — ADR-020).

Open questions:

1. How does claim → verification → active residency work without embedding documents on Person?
2. Which verification methods are first-class?
3. How do Channel / Resource gates consume verified residency only?

This ADR defines the **Residency Verification Workflow**.

It does not create migrations or tables. Expanding SQL relationship `status` CHECK for `pending_verification` is a follow-up migration.

---

## Decision

**Declaring residence creates a claim, not access.**

```
Person declares residence (Property + role)
        │
        ▼
PropertyPersonRelationship
  status = pending_verification
        │
        ▼
ResidencyVerification (request case)
        │
        ▼
Evidence + method validation
  (certificate / owner invite / admin approval / documentation)
        │
        ▼
Relationship status = active
  (verified residency — eligible for ADR-036/037 derivation)
```

### Core rules

1. **Claim ≠ access.** `pending_verification` relationships never contribute Community Area ids for restricted reserve / private channel access.
2. **Only `active` (+ temporal validity)** relationships grant residency-derived eligibility (ADR-037), and only after successful verification.
3. **ResidencyVerification** is a separate aggregate from Person and from the relationship row’s metadata blob for evidence.
4. **Evidence is not stored on Person.** File bytes and document metadata live in Platform Core Files (ADR-020) referenced by verification evidence records.
5. Verification outcome does **not** grant RBAC Permissions; it only activates the relationship used as eligibility input.
6. Territory **Membership** remains separate (ADR-011). Verification does not replace Membership.

---

## Aggregates

### PropertyPersonRelationship (extended lifecycle)

| Status | Meaning |
|--------|---------|
| `pending_verification` | Claim submitted; awaiting verification — **no** restricted access |
| `active` | Verified (or policy-exempt) and currently in effect |
| `inactive` | Temporarily not in effect |
| `ended` | Concluded |
| `archived` | Historical retention |
| `rejected` | Verification denied; claim not activated |

Transition into `active` for residency claims that require verification **must** pass through a completed `ResidencyVerification` (unless Tenant policy explicitly auto-activates a role — default is verify-first for resident/tenant/family_member claims).

### ResidencyVerification

| Field (conceptual) | Purpose |
|--------------------|---------|
| `id` | Case identity |
| `relationshipId` | Property Person Relationship under review |
| `personId` | Claimant (denormalized for queries; not evidence storage) |
| `territoryId` / `communityAreaId?` | Scope of the claim |
| `method` | How verification is attempted |
| `status` | Case lifecycle |
| `reviewedByPersonId?` | Authority / admin reviewer when applicable |
| `decisionNote?` | Non-sensitive review note |
| timestamps | created / updated / decided |

### ResidencyVerificationEvidence

| Field (conceptual) | Purpose |
|--------------------|---------|
| `id` | Evidence row |
| `verificationId` | Parent case |
| `kind` | certificate scan, invite token ref, admin decision ref, etc. |
| `fileId?` | Core Files reference (ADR-020) — **not** Person-attached |
| `externalReference?` | Invite id / case ref without embedding binaries on Person |
| `metadata` | Non-identity operational attributes |

**Forbidden:** `persons.verification_document_*`, storing PDF/bytes on Person, or treating Identity as a document vault.

---

## Verification methods

| Method | Meaning |
|--------|---------|
| `residency_certificate` | Official residency certificate / equivalent document via Files |
| `owner_invitation` | Property owner invites / confirms the claimant |
| `administration_approval` | Territory Authority / admin approves without (or in addition to) docs |
| `approved_documentation` | Other approved document set via Files |

Methods are configurable per Tenant (ADR-023). Multiple evidence items may support one verification case.

---

## Access gates

| Surface | Rule |
|---------|------|
| Restricted Resource reservation (`reservationScope: community_area`, private amenities, etc.) | Requires derived areas from **active verified** residencies (ADR-036 + ADR-037) |
| Private / area-restricted Channel participation | Requires `requiresVerifiedResidency` (or equivalent) + active verified residency in the Channel’s Community Area when scoped |
| Public Territory information | May remain visible with Membership alone — claim pending does not unlock private surfaces |

Channel may declare:

- `requiresVerifiedResidency: boolean`
- optional `communityAreaId` for area-private neighbour channels

---

## Lifecycle (verification case)

```
draft / submitted
  → under_review
  → approved → relationship.active
  → rejected  → relationship.rejected (or remains pending until closed)
  → cancelled
```

Approval is auditable when privileged (ADR-021). Notifications may inform claimant (ADR-019).

---

## Explicitly out of scope

- Storing documents on Person  
- Automatic access on self-declaration  
- Full document OCR / AI verification product  
- SQL CHECK expansion in this change set  
- UI / demo catalogs  

---

## Consequences

### Positive

- Prevents residency spoofing for restricted assets and private channels  
- Keeps identity clean; evidence in Files + verification aggregate  
- Fits existing Property relationship graph  

### Negative / follow-ups

- Foundation SQL status enum needs `pending_verification` / `rejected` before persistence  
- Owner-invitation and admin queues need product flows later  

---

## Compliance

Until superseded:

1. Pending claims never unlock restricted area access.  
2. Evidence stays off Person.  
3. Active verified residency is the eligibility input to ADR-036/037.  
4. Type contracts expose verification aggregates and guards before product wiring.

---

## References

- ADR-008 / ADR-009 Property Person Relationship  
- ADR-010 Person Identity  
- ADR-020 Files Media Management  
- ADR-021 Audit  
- ADR-035 Community Channels  
- ADR-036 Resource Access Scoping  
- ADR-037 Residency-Derived Access  
