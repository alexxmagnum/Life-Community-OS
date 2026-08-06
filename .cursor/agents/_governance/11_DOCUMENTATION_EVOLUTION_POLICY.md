---
name: 11_DOCUMENTATION_EVOLUTION_POLICY
model: inherit
description: Defines how Life Community OS documentation evolves over time.  Covers lifecycle, versioning, ownership, deprecation and rules against undocumented architecture, capability or breaking changes.
---

# DOCUMENTATION_EVOLUTION_POLICY

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines how documentation evolves over time.

Documentation is living Platform memory.

Evolution must remain controlled, owned and reversible through governance.

This policy does not redesign the documentation tree.

It defines how change enters, matures and exits the documentation ecosystem.

---

# Mission

Ensure documentation evolves by refinement, not by entropy.

Every durable Platform change must leave durable documentation.

No obsolete authority may remain active.

No significant change may remain undocumented.

---

# Evolution Philosophy

Documentation grows by refinement.

Never by duplication.

Documentation changes follow Architecture.

Never the opposite.

Stability is preferred over novelty.

Controlled evolution is preferred over informal updates.

---

# Documentation Lifecycle

```
Creation

↓

Review

↓

Approval

↓

Implementation

↓

Maintenance

↓

Deprecation
```

Every durable document follows this lifecycle.

Temporary notes are not Platform documentation until they enter Creation under ownership.

---

## Creation

A document is created when a new authoritative concern requires a home.

Creation requires:

- clear purpose;
- clear scope;
- clear owner;
- correct folder placement according to Documentation Governance;
- no duplicated authority.

Creation of new top-level folders requires architectural justification and ADR, per Documentation Governance.

---

## Review

Review validates:

- completeness;
- consistency;
- architecture alignment;
- ownership clarity;
- AI usability;
- overlap risk.

Reviewers depend on document type and severity.

---

## Approval

Approval grants authority for the document to become active guidance.

Approval authority follows Ownership rules below and audit severity rules in Documentation Audit.

---

## Implementation

Implementation may proceed only after required documentation authority exists for the change class.

For architectural change, ADR and Architecture review precede implementation authority.

For product capability change, Product documentation authority precedes durable delivery.

---

## Maintenance

Active documents are refined as the Platform evolves.

Maintenance includes:

- clarifications;
- reference updates;
- consistency corrections;
- version increments;
- alignment with ADRs.

Maintenance must not silently change authority.

---

## Deprecation

Documents are deprecated when they are no longer authoritative.

Deprecation requires:

- explicit status change;
- replacement or supersession reference;
- ADR when architectural authority changes;
- removal from active Agent read-paths.

Obsolete documentation must not remain active.

---

# Evolution Rules

## No undocumented architecture changes

Architecture must be documented before or as a governed precondition to durable implementation.

Significant architectural decisions require ADRs.

## No undocumented business capability

Business capabilities must exist in Product and, where applicable, Domain authority layers before becoming permanent Platform behaviour.

## No undocumented breaking changes

Breaking changes to APIs, data, behaviour or contracts require documentation and governed approval before release authority.

## No obsolete documentation remains active

Deprecated or superseded documents must be marked and removed from active authority paths.

---

# Versioning

Documentation versioning communicates the blast radius of change.

## Major

Architecture changes.

Constitutional or structural authority changes.

Incompatible reinterpretation of Platform meaning.

Major changes require Architecture Guardian involvement and, when significant, ADR.

## Minor

Capability additions.

Compatible expansions of behaviour, process or guidance.

Minor changes require owning Agent approval and consistency review when cross-layer impact exists.

## Patch

Corrections and clarifications.

No intentional authority change.

Patch changes still must not introduce silent contradictions.

---

# Versioning Rules

- Version identity must be visible in the document.
- Supersession must be explicit.
- Major changes must not be disguised as Patch.
- Roadmap and Future documents do not version away active Architecture authority.

---

# Ownership

Documentation ownership determines who may evolve which documents.

## Architecture documents

Owner: Architecture Guardian

Supporting owners by concern:

- Domain Architect for Domain documentation
- Capability Architect for Capability documentation
- Platform Architect for overall technical platform architecture docs
- ADR Manager for ADR process and records

## Technical documents

Owner: Responsible technical Agent

Examples:

- Database documentation → Database Architect
- API documentation → API Architect
- Security documentation → Security Architect
- Frontend system documentation → Design System Guardian / relevant Frontend Architect
- Infrastructure documentation → Infrastructure Architect

## Product documents

Owner: Product Architect

Supporting owners by concern:

- Business Analyst for requirements documentation
- Specialist Agents for vertical knowledge documentation
- Metrics Analyst for measurement documentation

## Quality documents

Owner: Quality agents according to concern

Examples:

- Testing documentation → Test Engineer
- Documentation architecture → Documentation Engineer
- Observability documentation → Observability Engineer
- Release documentation → Release Manager
- Delivery automation documentation → CI/CD Engineer
- Review standards → Code Reviewer

## Agent Framework and Governance documents

Owner: Architecture Guardian with Documentation Engineer support

Changes to Agent OS governance are architectural in nature and require controlled evolution.

## Future and Roadmap documents

Owner: Product Architect for product sequencing; Architecture Guardian when architectural horizon items are involved

Future documents remain non-authoritative until promoted through governed lifecycle.

---

# Change Intake Process

```
Proposed change

↓

Identify documentation owner

↓

Classify version impact
Major / Minor / Patch

↓

Draft documentation change

↓

Review

↓

Approve

↓

Implement related system change

↓

Maintain or deprecate related documents
```

Implementation must not outrun documentation authority for durable Platform behaviour.

---

# Promotion and Demotion

## Promotion

Knowledge may be promoted when it becomes Platform authority.

Examples:

- Future idea → Product Specification
- Reference Implementation pattern → Platform Capability documentation
- Technical experiment → ADR + Architecture documentation

Promotion requires ownership, review and approval.

## Demotion

Knowledge may be demoted when it is no longer authoritative.

Examples:

- active Architecture doc → deprecated
- product rule → historical reference after supersession
- ADR → superseded ADR

Demotion must leave a discoverable trail.

---

# Relationship to Audits

Evolution is verified by:

- `08_DOCUMENTATION_AUDIT.md`
- `09_ARCHITECTURE_CONSISTENCY_AUDIT.md`
- `10_AGENT_QUALITY_STANDARD.md`

Evolution Policy defines how documents change.

Audit documents define how document health is verified.

---

# Relationship to Documentation Governance

`/docs/000_FOUNDATIONS/06_DOCUMENTATION_GOVERNANCE.md` defines folder responsibilities and structural stability.

This Evolution Policy defines lifecycle, versioning and ownership of change inside that stable structure.

Folder renames and moves still require ADR.

---

# Forbidden Evolution Behaviours

Documentation evolution must never:

- introduce undocumented architecture;
- introduce undocumented business capabilities;
- introduce undocumented breaking changes;
- leave obsolete documents active;
- duplicate authority across folders;
- use Future documents as hidden Constitution;
- change Agent responsibilities under documentation maintenance without governed review;
- create new top-level documentation folders without architectural justification and ADR.

---

# Evolution Output Template

```
# Documentation Change Record

## Document
...

## Owner
...

## Change Class
Major | Minor | Patch

## Reason
...

## Authority Impact
...

## Related ADRs
...

## Reviewers
...

## Approval
...

## Deprecations / Supersessions
...
```

---

# Success Criteria

Documentation Evolution Policy succeeds when:

- documentation lifecycle is predictable;
- ownership of change is unambiguous;
- architecture, capabilities and breaking changes remain documented;
- obsolete authority is retired;
- the documentation ecosystem remains trustworthy across decades.

---

# Motto

Evolve by governance.

Never by silence.
