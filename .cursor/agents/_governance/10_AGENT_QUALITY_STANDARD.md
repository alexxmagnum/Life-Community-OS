---
name: 10_AGENT_QUALITY_STANDARD
model: inherit
description: Defines the quality standard every Life Community OS Agent document must follow.  Specifies required sections, ownership rules, escalation clarity and source-of-truth references.
---

# AGENT_QUALITY_STANDARD

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines the quality standard every Agent document must follow.

Agent documents are operating contracts.

They must remain complete, explicit, non-overlapping and usable by humans and AI agents.

This standard does not change existing Agent responsibilities.

It defines how Agent quality is measured and preserved.

---

# Mission

Guarantee that every Agent definition remains:

- structurally complete;
- ownership-clear;
- escalation-aware;
- architecture-aligned;
- free from responsibility overlap;
- maintainable at Agent OS scale.

---

# Audit Authority

Primary operational owner:

Documentation Engineer

Architectural compliance owner:

Architecture Guardian

Agent Framework compliance references:

`_framework/00_AGENT_TEMPLATE.md`

`_framework/00_AGENT_SYSTEM.md`

No Agent may declare itself exempt from this standard.

---

# Required Agent Document Structure

Every Agent document must contain the following sections.

## Identity

Agent identity metadata must include:

- Version
- Status
- Category
- Role

Identity may appear as a metadata block and/or an `# Identity` section.

Identity must be unambiguous and stable.

---

## Mission

The enduring mission of the Agent.

Mission must remain stable over time.

---

## Purpose

Why the Agent exists and what problem class it owns.

Purpose must not duplicate another Agent's purpose as authoritative ownership.

---

## Responsibilities

What the Agent owns.

Responsibilities must be explicit, bounded and testable.

---

## Never Responsible For

What the Agent must never own.

Limits are mandatory.

An Agent without limits is an ownership defect.

---

## Authority

The decision rights of the Agent.

Authority must align with Responsibilities.

---

## Reads Before Working

Authoritative documents the Agent must read before producing work.

This section anchors source-of-truth behaviour.

---

## Inputs

What the Agent consumes.

Inputs must be concrete enough for collaboration and orchestration.

---

## Outputs

What the Agent produces.

Outputs must be reviewable and transferable to the next Agent.

---

## Decision Process

How the Agent reasons toward a solution.

Decision Process must reinforce Architecture-first behaviour.

---

## Review Checklist

How the Agent validates its own work before delivery.

---

## Principles

Operating principles specific to the Agent's specialization.

Principles must not contradict Framework or Constitution.

Section title may be `# Principles` or `# <Specialization> Principles`.

---

## Collaboration

Which Agents are consulted and why.

Collaboration must distinguish ownership from consultation.

---

## Escalation

When and to whom the Agent escalates.

Escalation paths must align with Agent Escalation Matrix and Framework Escalation Rules.

---

## Forbidden Behaviour

Behaviours the Agent must never perform.

---

## Success Criteria

Observable conditions that indicate the Agent is succeeding.

---

## Failure Criteria

Observable conditions that indicate the Agent is failing.

---

## Constitutional Authority

The higher-authority documents the Agent must always obey.

---

## Motto

A short operational reminder of the Agent's role.

---

# Required Metadata Frontmatter

Every Agent document should expose machine-usable identity through frontmatter where the Agent OS format requires it.

Minimum expected identity fields in the document body:

| Field | Requirement |
|-------|-------------|
| Version | Required |
| Status | Required |
| Category | Required |
| Role | Required |

Category must be one of:

- Architecture
- Backend
- Frontend
- Platform
- Product
- Quality

---

# Quality Rules

## Every responsibility must have one owner

No two Agent documents may claim primary ownership of the same responsibility.

Shared collaboration is allowed.

Shared ownership is not.

## Every agent must know its limits

`Never Responsible For` and `Forbidden Behaviour` are mandatory quality controls.

## Every agent must know escalation path

Escalation must be explicit enough that an Agent can stop safely.

## Every agent must reference source of truth

`Reads Before Working` and `Constitutional Authority` must point to authoritative Platform documents.

## Every agent must avoid overlap

Purpose, Responsibilities and Authority must be distinctive within the Agent OS.

---

# Quality Evaluation Model

Agent documents are evaluated as:

## PASS

All required sections exist and ownership is clear, bounded and non-overlapping.

## WARNING

Structure is mostly complete, but clarity, references or collaboration boundaries need improvement.

## CRITICAL

Missing mandatory sections, conflicting ownership, absent escalation path, or contradiction with Architecture/Framework authority.

---

# Section Quality Criteria

| Section | Quality bar |
|---------|-------------|
| Mission | Stable, singular, non-overlapping |
| Purpose | Explains existence without absorbing adjacent roles |
| Responsibilities | Explicit ownership list |
| Never Responsible For | Explicit exclusions |
| Authority | Matches responsibilities |
| Reads Before Working | Concrete authoritative sources |
| Inputs / Outputs | Actionable and transferable |
| Decision Process | Architecture-respecting sequence |
| Review Checklist | Verifiable checks |
| Collaboration | Consultation, not ownership transfer |
| Escalation | Clear path and triggers |
| Forbidden Behaviour | Enforceable prohibitions |
| Success / Failure Criteria | Observable |
| Constitutional Authority | Present and binding |

---

# Overlap Detection Rules

An Agent document fails overlap review when:

- its Purpose restates another Agent's Purpose as its own ownership;
- its Responsibilities include another Agent's primary authority;
- its Authority allows silent decisions outside category ownership;
- its Collaboration section implies co-ownership of durable decisions.

Suspected overlaps escalate to Architecture Guardian when architectural authority is involved.

Product specialist overlaps escalate to Product Architect first.

---

# AI Usability Requirements

Agent documents must be understandable by AI agents without tribal knowledge.

Therefore each Agent document must make explicit:

- what it owns;
- what it never owns;
- what it reads;
- what it produces;
- when it escalates;
- which constitutional documents bind it.

Ambiguous prose that requires human institutional memory is a WARNING or CRITICAL defect depending on impact.

---

# Relationship to Agent Template

`_framework/00_AGENT_TEMPLATE.md` defines the structural template.

This document defines the quality bar against which Agent documents are audited.

Template provides shape.

Quality Standard provides enforcement criteria.

---

# Agent Quality Audit Output Template

```
# Agent Quality Audit Report

## Agent
...

## Status
PASS | WARNING | CRITICAL

## Required Sections
Identity:
Mission:
Purpose:
Responsibilities:
Never Responsible For:
Authority:
Reads Before Working:
Inputs:
Outputs:
Decision Process:
Review Checklist:
Principles:
Collaboration:
Escalation:
Forbidden Behaviour:
Success Criteria:
Failure Criteria:
Constitutional Authority:
Motto:

## Overlap Findings
...

## Escalation Path Clarity
...

## Source of Truth References
...

## Recommendations
...

## Owner
...
```

---

# Forbidden Behaviours

Agent Quality Standard enforcement must never:

- rewrite Agent responsibilities during audit without governed change process;
- create new Agents to resolve overlap;
- ignore CRITICAL ownership conflicts;
- approve Agent documents that lack limits or escalation;
- treat mottos or stylistic differences as substitutes for missing structure.

---

# Success Criteria

Agent Quality Standard succeeds when:

- every Agent document is structurally complete;
- every responsibility has one owner;
- every Agent knows its limits;
- every Agent knows its escalation path;
- every Agent references source of truth;
- Agent OS remains coherent as the Platform grows.

---

# Motto

Complete structure.

Clear ownership.

No overlap.
