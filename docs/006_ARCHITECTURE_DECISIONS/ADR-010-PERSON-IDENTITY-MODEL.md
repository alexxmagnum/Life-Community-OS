# ADR-010 Person Identity Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Life Community OS needs a human identity model.

A **Person** represents a real individual in the Domain.

Existing decisions already require Person independence:

- ADR-001: Person is not User Account, Membership, Role, or Permission; no direct `tenant_id`; belonging via Membership → Territory → Tenant;
- ADR-001 / Security Platform: Authentication **Identity** is separate from domain Person;
- ADR-007–009: Property does not own Person; Property ↔ Person uses a relationship layer;
- ADR-003: Tenant → Territory remains the isolation path for tenant-scoped Business Data.

Open risk: conflating Person with login accounts, commercial profiles, or institutional identities.

Person must not be mixed with:

- authentication user account;
- business profile;
- official entity profile.

This ADR defines the **Person Identity Model** and domain separation around the human.

It does not create migrations or tables.

---

## Decision

Create **Person** as an independent identity entity in the Domain.

### Core rules

1. **Person is a real human being** — the stable human identity in the Domain.
2. **Person is not a login account.**
3. **Person is not a business.**
4. **Person is not an official entity.**
5. **Person can participate in multiple domain relationships** at once.
6. **Person is not a security boundary.** Isolation remains **Tenant → Territory**.
7. Domain relationships inherit isolation through their owning context (for example Property → Address → Territory → Tenant).
8. Authentication Identity / User Account remains a Security Platform concern, linked to Person explicitly when needed (ADR-001).

---

## Domain Model

### Person

Stable representation of a real individual.

Person answers: **which human is represented?**

Person does **not** answer:

- how they authenticate (User Account / Identity);
- how they appear commercially (Business Profile);
- how an institution is verified (Official Entity);
- what they are allowed to do (Authorization);
- where they belong in a community ecosystem (Membership → Territory).

### Participation pattern

```
Person
  ├── Property Person Relationship → Property     (ADR-008 / ADR-009)
  ├── User Account / Identity                     (Authentication)
  ├── Business Profile                            (commercial representation)
  └── Community Participation / Membership        (Territory belonging)
```

One Person may hold several of these links simultaneously without collapsing concepts.

### Relationship to existing Foundation tables

| Concept | Persistence intent |
|---------|-------------------|
| Person | Domain `persons` (already Foundation) |
| Authentication Identity | Security Platform `identities` linked to Person (ADR-001) |
| Membership | Domain belonging Person → Territory (ADR-001) |
| Property Person Relationship | Independent relationship entity (ADR-008 / ADR-009) |

Business Profile and Official Entity remain future domain/platform entities; this ADR only forbids merging them into Person.

---

## Person vs User vs Business vs Official Entity

| Concept | Question answered | Owns login? | Owns commercial brand? | Is the human? |
|---------|-------------------|-------------|------------------------|---------------|
| **Person** | Which human is this? | No | No | Yes |
| **User Account** (Authentication Identity) | Who is authenticating / logging in? | Yes (credentials / provider subject) | No | No — may represent a Person |
| **Business Profile** | How is a commercial activity presented publicly? | No | Yes | No — may be linked to one or more Persons |
| **Official Entity** | What is the verified institutional representation? | No | Institutional, not personal brand | No — may relate to Persons as representatives |

### Separation rules

1. **Person ≠ User Account**  
   Login credentials, sessions and auth providers never live on Person.

2. **Person ≠ Business Profile**  
   A professional service provider may be a Person who also has a Business Profile; the profile is not the Person row.

3. **Person ≠ Official Entity**  
   Community boards, town halls, associations and similar are Official Entities (or Entity domain), not Person.

4. **Links are explicit**  
   Person → User Account, Person → Business Profile, Person → Official Entity representation (when defined) are relationships — not column collapses.

5. **Roles are not identity types**  
   Resident, owner, app user, and service provider are participation modes via relationships — they do not fork Person into subtypes that replace the human identity.

---

## Examples

### Example 1 — Juan García

One Person: **Juan García**

Can simultaneously be:

| Participation | Modeled as |
|---------------|------------|
| Resident | Property Person Relationship (`resident`) and/or Membership |
| Property owner | Property Person Relationship (`owner`) |
| App user | User Account / Authentication Identity linked to Person |
| Professional service provider | Business Profile linked to Person (future) |

Still one Person row. Not four competing “identity roots.”

### Example 2 — Login without collapsing Person

```
User Account (auth)
  └── linked to → Person: Juan García
```

Authentication verifies the User Account / Identity.  
Domain behaviour references Person after the identity-link boundary (ADR-001).

### Example 3 — Business without replacing Person

```
Person: Ana López
  └── Business Profile: Ana López Reformas
```

Commercial listing and branding hang off Business Profile.  
Ana remains Person for residency, ownership and membership.

### Example 4 — Official Entity is not a Person

```
Official Entity: Comunidad de Propietarios Aldea Golf
  └── representatives → Persons (future relationship)
```

The community association is not stored as a Person.

---

## Security Alignment

| Concern | Owner | Notes |
|---------|-------|-------|
| Identity / User Account | Security Platform | Who is acting / authenticating? |
| Authentication | Security Platform | Proof of Identity |
| Authorization | Security Platform | Allowed actions within Tenant Context |
| Person | Domain | Which human — not a security boundary |
| Membership | Domain | Territory belonging — not permission |
| Property Person Relationship | Domain | Unit association — not permission |
| Tenant Isolation | Platform + Data (ADR-003) | Tenant → Territory |

### Isolation

- **Person is not a security boundary.**
- Isolation remains **Tenant → Territory**.
- Person has no direct `tenant_id` (ADR-001).
- Tenant-scoped visibility of Person remains relationship-derived (Membership → Territory → Tenant) plus Authorization.
- Property relationships inherit isolation through Property → Address → Territory → Tenant (ADR-008 / ADR-009).
- `identities` remain Security Platform data; not Membership-gated tenant Business Data (ADR-003).

### Evaluation order (unchanged)

```
Identity (User Account)
  → Authentication
  → Tenant Context resolution (fail closed)
  → Authorization
  → Domain operations on Person and relationships
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Redesign existing `persons` / `identities` / `memberships` DDL;
- Define Business Profile or Official Entity schemas;
- Define Authentication providers, password rules, or session storage;
- Define Authorization matrices for owners/residents;
- Put login credentials on Person;
- Put `tenant_id` on Person;
- Merge Person with Entity, Business, or Official Entity;
- Replace Membership with Property roles;
- Define UI for profiles or onboarding.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-003 Database Security and RLS Model
- ADR-007 Property Model
- ADR-008 Property Person Relationship Model
- ADR-009 Property Person Relationship Schema
- Security: Identity, Authentication, Authorization
- Product Specification: Person, Membership, Entity
- Data Model: Multitenancy, Entities, Relationships

---

## Decision Rule

Until superseded, every design that represents humans must use Person as the independent human identity, keep User Account / Business Profile / Official Entity separate, and never treat Person as a Tenant isolation or authentication root.
