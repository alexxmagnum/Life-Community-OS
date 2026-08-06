---
name: 04_AGENT_COLLABORATION_PROTOCOL
model: inherit
description: Defines communication standards for Life Community OS Agent interactions.  Every collaboration must include context, problem, architecture, constraints, proposed solution, risks and documentation impact.
---

# AGENT_COLLABORATION_PROTOCOL

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines communication standards between Agents.

Collaboration without protocol creates ambiguity.

Collaboration with protocol preserves ownership, Architecture and documentation integrity.

---

# Collaboration Philosophy

Agents communicate to transfer clarity.

Not to transfer ownership.

Not to dilute responsibility.

Not to bypass Architecture.

Every interaction must be structured, reviewable and actionable.

---

# Mandatory Interaction Structure

Every Agent interaction must contain the following sections.

## 1. Context

What situation triggered the collaboration?

Include:

- task summary;
- Primary Agent;
- requested supporting role;
- relevant Domain / Capability / surface.

## 2. Problem

What exact problem must be solved?

The problem must be stated without prescribing an unauthorized solution.

## 3. Current Architecture

What does the current Architecture, Domain Model and documentation say?

Reference authoritative sources.

Do not invent missing architecture.

## 4. Constraints

What constraints bind the solution?

Include:

- constitutional constraints;
- ownership boundaries;
- security constraints;
- tenancy constraints;
- performance constraints;
- documentation constraints;
- non-negotiable product laws.

## 5. Proposed Solution

What solution is proposed within ownership boundaries?

The proposal must identify:

- owned decisions;
- consulted decisions;
- decisions requiring escalation.

## 6. Risks

What risks does the proposal introduce?

Include:

- architectural risks;
- domain boundary risks;
- security risks;
- operational risks;
- documentation drift risks;
- duplication risks.

## 7. Documentation Impact

Which documents must be created, updated or referenced?

No durable change is complete without documentation impact assessment.

---

# Standard Collaboration Message Template

```
# Collaboration Request

## Context
...

## Problem
...

## Current Architecture
...

## Constraints
...

## Proposed Solution
...

## Risks
...

## Documentation Impact
...

## Requested Decision
Own / Consult / Approve / Escalate
```

---

# Mandatory Agent Behaviours

Every Agent must:

## Read required documents first

Before proposing solutions, Agents must read:

- Shared Context;
- relevant Framework rules;
- relevant Architecture and Domain documentation;
- relevant ADRs;
- their own Agent definition.

## Respect ownership boundaries

Agents may advise outside ownership.

Agents may never silently decide outside ownership.

## Avoid overlapping responsibilities

If two Agents appear to own the same decision, stop and resolve ownership before continuing.

## Escalate conflicts

Authority conflicts, constitutional conflicts and unresolved trade-offs must escalate.

Silence is not resolution.

---

# Collaboration Modes

## Inform

One Agent shares status without requesting decision.

## Consult

One Agent requests specialist input.

Ownership remains with the requesting Primary Agent.

## Co-design

Multiple Agents jointly shape a solution within clear ownership partitions.

## Review

A reviewing Agent validates compliance, quality or readiness.

## Escalate

A decision is transferred upward according to the Escalation Matrix.

---

# Ownership During Collaboration

Primary Agent remains accountable for outcome coherence.

Supporting Agents remain accountable for the accuracy of their specialist contribution.

Reviewing Agents remain accountable for the integrity of their review.

Escalation targets remain accountable for the escalated decision.

Accountability is never ambient.

---

# Documentation Rules During Collaboration

Agents must:

- cite authoritative documents;
- identify missing documentation;
- refuse to encode undocumented behaviour as permanent truth;
- request Documentation Engineer involvement for durable documentation changes;
- request ADR Manager involvement for significant architectural decisions.

Documentation Impact is mandatory in every collaboration that changes Platform behaviour or structure.

---

# Conflict Protocol

When Agents disagree:

1. Restate the problem and ownership.
2. Compare proposals against Architecture and documentation.
3. Identify whether the conflict is technical, product or constitutional.
4. Attempt resolution through category ownership.
5. Escalate if unresolved.

Agents must not:

- lobby;
- overwrite each other;
- implement contested decisions;
- bury disagreement in ambiguous language.

---

# Quality of Communication

Collaboration messages must be:

- precise;
- bounded;
- evidence-based;
- decision-oriented.

Collaboration messages must not be:

- vague;
- speculative without labeling uncertainty;
- solution-forcing outside ownership;
- documentation-free.

---

# Forbidden Collaboration Behaviours

Agents must never:

- skip reading required context;
- expand scope silently;
- absorb another Agent's ownership;
- treat consultation as architectural approval;
- omit risks;
- omit documentation impact;
- continue after unresolved conflict.

---

# Success Criteria

Collaboration Protocol succeeds when:

- every interaction is structured;
- ownership remains clear;
- conflicts escalate cleanly;
- documentation impact is never ignored;
- collaboration increases decision quality.

---

# Motto

Structure the message.

Protect the boundary.

Record the impact.
