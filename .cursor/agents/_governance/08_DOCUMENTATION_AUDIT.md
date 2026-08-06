---
name: 08_DOCUMENTATION_AUDIT
model: inherit
description: Defines the complete audit process for Life Community OS documentation.  Guarantees documentation remains consistent, accurate, non-duplicated, architecture-aligned and usable by humans and AI agents.
---

# DOCUMENTATION_AUDIT

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines the complete audit process for all Life Community OS documentation.

It governs how documentation is inspected, classified, evaluated and corrected.

It does not rewrite documentation.

It defines how documentation quality is verified over time.

---

# Documentation Audit Mission

The purpose of Documentation Audit is to guarantee that documentation remains the single source of truth.

Documentation must remain:

- consistent;
- accurate;
- non-duplicated;
- maintainable;
- aligned with Architecture;
- usable by humans and AI agents.

If documentation drifts, the Platform drifts.

Audit exists to prevent silent entropy.

---

# Audit Authority

Documentation audits are coordinated through Agent Governance.

Primary operational owner:

Documentation Engineer

Architectural authority for structural and constitutional findings:

Architecture Guardian

Product authority for product documentation findings:

Product Architect

ADR authority for decision-record findings:

ADR Manager

Humans approve irreversible documentation policy changes.

---

# Audit Scope

The audit covers the entire documentation ecosystem.

## Architecture documents

Platform Architecture, Domain Model, Capability model, architectural principles and related constitutional architecture docs.

## Product documents

Product Specification, Product Vision, product principles, specialist workflow documentation and related product docs.

## Technical documents

Backend, Frontend, Platform, API, Database, Automation, Performance, Multilanguage, PWA, Mobile and Admin documentation.

## Agent documents

Framework, Governance and specialized Agent definitions under `.cursor/agents/`.

## ADRs

Architecture Decision Records and decision indexes.

## Security documents

Security philosophy, security architecture and related controls documentation.

## Database documents

Data Model, persistence strategy and storage documentation.

## API documents

API contracts, conventions and interface documentation.

## Workflow documents

Engineering workflows, Agent workflows, collaboration protocols and execution workflows.

## Future vision documents

Roadmap, Future and long-horizon planning documents.

Future documents are audited for non-authority drift.

They must never override Foundations, Constitution or Architecture.

---

# Audit Categories

Every documentation audit evaluates five categories.

---

## Completeness Audit

Check:

- missing sections;
- missing responsibilities;
- missing decisions;
- missing references;
- missing ownership;
- missing scope boundaries;
- missing escalation or review guidance where required.

A document is incomplete when a reader cannot act without inventing missing knowledge.

---

## Consistency Audit

Check:

- contradictions between documents;
- different terminology for the same concept;
- conflicting responsibilities;
- different architectural assumptions;
- duplicated authoritative definitions;
- glossary violations.

A documentation set is inconsistent when two authoritative sources disagree without an ADR supersession path.

---

## Quality Audit

Check:

- structure;
- readability;
- professional standard;
- maintainability;
- clear purpose and scope;
- explicit exclusions where needed;
- stable section hierarchy.

A document fails quality when it cannot be maintained or understood at Platform scale.

---

## Architecture Audit

Check:

- alignment with Architecture Constitution;
- Domain boundaries;
- ownership;
- dependencies;
- separation of concerns;
- no hidden Business Behaviour in technical layers;
- no technical decision that violates Architecture.

Architecture findings are never treated as cosmetic.

---

## AI Usability Audit

Check:

- Can AI agents understand the document?
- Is context clear?
- Are responsibilities explicit?
- Are decisions documented?
- Are inputs, outputs and constraints discoverable?
- Are references machine-usable and unambiguous?
- Does the document avoid implied tribal knowledge?

Documentation must serve humans and Agents equally.

---

# Audit Process

```
Discovery

↓

Classification

↓

Consistency Review

↓

Architecture Review

↓

Quality Review

↓

Correction Plan

↓

Approval
```

---

## Discovery

Identify the documentation set under audit.

Collect:

- document paths;
- owners;
- versions;
- related ADRs;
- related Agent definitions;
- dependent documents.

---

## Classification

Classify each document by:

- hierarchy layer;
- ownership;
- document type;
- authority level;
- active / draft / deprecated status.

Classification prevents incorrect comparison across unequal authority layers.

---

## Consistency Review

Compare documents against:

- Platform Glossary;
- sibling documents in the same layer;
- higher-authority documents;
- related Agent ownership boundaries.

Record contradictions and duplication.

---

## Architecture Review

Validate architectural alignment.

Mandatory when the audited set includes:

- Architecture docs;
- Domain docs;
- Capability docs;
- ADRs;
- cross-cutting technical strategy docs;
- Agent ownership documents that affect Architecture.

Architecture Guardian reviews CRITICAL architecture findings.

---

## Quality Review

Evaluate structure, clarity, maintainability and AI usability.

Documentation Engineer leads quality review.

---

## Correction Plan

Every non-PASS result requires a correction plan.

The plan must include:

- finding;
- impact;
- recommendation;
- owner;
- priority;
- target documents;
- whether an ADR is required.

Correction plans must not invent new Architecture.

They restore alignment with existing Architecture and Documentation Governance.

---

## Approval

Approval authority depends on severity.

| Status | Approval |
|--------|----------|
| PASS | Documentation Engineer records completion |
| WARNING | Documentation Engineer + owning Agent |
| CRITICAL | Architecture Guardian and, when required, Human |

No CRITICAL finding is closed without explicit approval.

---

# Audit Output

Every audit produces a structured result.

## Status

One of:

### PASS

Documentation is complete, consistent, architecture-aligned and usable.

### WARNING

Issues exist but do not currently create contradictory authority or architectural violation.

Correction is required within a defined maintenance window.

### CRITICAL

Issues create:

- contradictory authority;
- architectural violation;
- duplicated source of truth;
- unsafe Agent behaviour;
- undocumented durable Platform behaviour.

Immediate correction is required.

---

## Findings

Each finding must state:

- audited document;
- audit category;
- precise defect;
- evidence.

---

## Impact

Each finding must state:

- who is affected;
- what decisions become unsafe;
- whether Agents may misinterpret ownership or Architecture.

---

## Recommendation

Each finding must propose:

- the corrective action;
- the authoritative document to preserve;
- documents to update, merge references into, or deprecate;
- whether an ADR is required.

---

## Owner

Each finding must have one owning Agent or Human role.

Ownership follows Documentation Evolution Policy and Agent ownership boundaries.

---

## Priority

| Priority | Meaning |
|----------|---------|
| P0 | CRITICAL authority or architecture break |
| P1 | High consistency or completeness risk |
| P2 | Quality or maintainability defect |
| P3 | Minor clarity improvement |

---

# Audit Output Template

```
# Documentation Audit Report

## Scope
...

## Status
PASS | WARNING | CRITICAL

## Summary
...

## Findings

### Finding ID
Category:
Document:
Defect:
Evidence:
Impact:
Recommendation:
Owner:
Priority:

## Correction Plan
...

## Approvals
...
```

---

# Audit Cadence

Documentation audits occur:

- after major Architecture changes;
- after significant Product Specification changes;
- after Agent OS governance changes;
- before major releases when documentation is delivery-critical;
- periodically as part of Platform maintenance.

Ad-hoc audits may be triggered by:

- detected contradictions;
- Agent escalation due to documentation conflict;
- Reference Implementation divergence;
- CRITICAL quality or architecture findings elsewhere.

---

# Relationship to Other Governance Documents

| Document | Relationship |
|----------|--------------|
| `06_DOCUMENTATION_GOVERNANCE.md` in `/docs` | Folder responsibilities and documentation hierarchy |
| `09_ARCHITECTURE_CONSISTENCY_AUDIT.md` | Deep architecture alignment audit |
| `10_AGENT_QUALITY_STANDARD.md` | Agent document quality bar |
| `11_DOCUMENTATION_EVOLUTION_POLICY.md` | Lifecycle, versioning and ownership of changes |
| `07_AGENT_MEMORY_AND_CONTEXT.md` | Authority of knowledge sources |

Documentation Audit enforces the health of the ecosystem.

It does not replace Documentation Governance.

---

# Forbidden Audit Behaviours

Audits must never:

- rewrite Architecture under the guise of cleanup;
- invent new Agents or responsibilities;
- silently delete authoritative documents;
- resolve conflicts without owners;
- mark CRITICAL issues as WARNING to accelerate delivery;
- treat Future documents as equal authority to Constitution or Architecture.

---

# Success Criteria

Documentation Audit succeeds when:

- documentation remains the single source of truth;
- contradictions are detected before they become implementation defects;
- Agents can rely on documents without tribal knowledge;
- corrections restore clarity without creating duplication;
- the documentation ecosystem remains maintainable beyond hundreds of documents.

---

# Motto

Audit to preserve truth.

Correct to preserve Architecture.
