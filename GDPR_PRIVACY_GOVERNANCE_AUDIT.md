# GDPR_PRIVACY_GOVERNANCE_AUDIT.md

**Phase:** 17X — GDPR, Privacy & Data Governance Foundation  
**Date:** 2026-09-01  
**Constraint:** GDPR governs existing domain data. No GlobalPrivacyEntity, UniversalConsentEntity, GDPRScore, ComplianceScore, PersonalDataMirror, CrossTenantPrivacyAdmin, or PrivacySocialGraph. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → DOMAIN DATA.

---

## 1. Privacy governance model

`packages/types/src/privacy/privacy-context.ts`

`PrivacyContext` projects rights and consent for a person within a tenant:

- consent: recommendations, activityVisibility, marketingCommunication
- rights: exportAllowed, deletionAllowed, restrictionAllowed
- dataScope: personalData, ownedContent, participationData

It does not store messages, reservations, or activity. Each domain keeps its source of truth.

---

## 2. Personal data classification

| Class | Domains |
|-------|---------|
| Identity | Person (name, email, phone, avatar, locale) |
| Community | Membership (territory, role) |
| Activity | Experience, Reservation, Help, Marketplace |
| Communication | Conversation, Messages, Notifications |
| Housing | Housing, Residency |

---

## 3. Consent management

`PrivacyConsentService` separates optional consent from required permissions:

- **Required (no optional consent):** authentication, security, membership, reservations
- **Optional:** recommendations, public activity visibility, marketing communication

Changes are audited as `privacy.consent.changed`.

---

## 4. Personal data export (17X)

Distinct from Phase 17V tenant backup/export:

| 17V | 17X |
|-----|-----|
| Platform Operator → Export Tenant | Person → Export my data |
| SaaS backup scope | Own profile, memberships, preferences, favorites, participations, reservations |

API: `GET /api/privacy/export` — self only. Attempt to export another person → `403 privacy_access_denied` (`export_other_person_data`).

---

## 5. Account deletion & anonymization

`PersonalAnonymizationService` — delete ≠ blind erase.

Process: Request → Validation → Anonymization → Legal retention.

Identity fields are nulled or replaced (`Usuario eliminado`). Audit and legal records are preserved when required. Requires `explicitConfirmation`.

---

## 6. Data retention foundation

`PrivacyRetentionPolicy` defines rules for:

- messages
- audit
- security_events
- personal_preferences

Rules are contractual only. Automatic deletion is not executed in this phase.

---

## 7. Tenant privacy configuration

Each tenant holds `PrivacyConfiguration`:

- privacyPolicyUrl
- legalContact
- dataControllerName
- retentionSettings

Life Community OS = technology provider. Tenant community = local data controller.

---

## 8. Privacy admin surfaces

| Surface | Path | Access |
|---------|------|--------|
| Platform | `/platform/privacy` | Platform Operator — global config, audit |
| Community Admin | `/admin/privacy` | Local config only — no user export, no private messages |

Community Admin cannot read global private data or export users.

---

## 9. Privacy audit

Extended `AdminAuditLog` actions:

- privacy.export.requested / completed
- privacy.delete.requested / completed
- privacy.consent.changed
- privacy.access.denied

Metadata is sanitized. Never stores password, token, secret, or message_content.

---

## 10. Security integration (17W)

Privacy uses the existing pipeline:

Session → Tenant → Territory → Authorization → Privacy Check

No parallel authorization. Uses `assertTenantBoundary` and `assertSelfPersonAccess`.

---

## 11. Media & community privacy

- `personalMediaPolicy` — avatar own-only; private media owner-only; cross-tenant denied
- `privateMessageVisible` — participant-only within tenant
- Integrates with 17N (recommendations), 17O (trust), 17K (shareActivity, appearInParticipants)

---

## 12. Invariants

- Tenant ≠ Territory
- Person ≠ Membership
- Privacy ≠ Permission
- Consent ≠ Capability
- Export personal ≠ Tenant Backup
- Delete ≠ uncontrolled erase
- GDPR ≠ Domain Data

---

## 13. Validation

- `pnpm -r typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm --filter @life-community-os/types test` — 188 PASS
- `pnpm --filter @life-community-os/web test:isolation` — 318 PASS
- `pnpm --filter @life-community-os/web build` — PASS
