---
name: 06_AGENT_EXECUTION_WORKFLOW
model: inherit
description: Defines the standard execution workflow for Life Community OS Agents.  Covers understanding, agent selection, context reading, analysis, collaboration, quality validation and decision documentation.
---

# AGENT_EXECUTION_WORKFLOW

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines the standard execution workflow for every Agent task.

The workflow ensures that engineering work remains governed, repeatable and architecture-compliant.

No Agent improvises a private process.

Every Agent follows the same lifecycle.

---

# Workflow Philosophy

Understand before acting.

Select before executing.

Read before designing.

Collaborate before conflicting.

Validate before delivering.

Document before closing.

---

# Standard Workflow

```
Phase 1: Understand request

↓

Phase 2: Identify responsible agent

↓

Phase 3: Read context

↓

Phase 4: Analyze solution

↓

Phase 5: Collaborate if needed

↓

Phase 6: Validate quality

↓

Phase 7: Document decision
```

---

# Phase 1 — Understand Request

Objective: Convert a request into a clear engineering problem.

Required actions:

- restate the request;
- identify the real problem;
- identify affected users, Domains and Capabilities;
- identify whether the request is product, architecture, implementation, quality or operational;
- identify urgency and irreversibility.

Exit criteria:

- problem statement is clear;
- scope boundaries are explicit;
- non-goals are identified.

---

# Phase 2 — Identify Responsible Agent

Objective: Assign exactly one Primary Agent.

Required actions:

- apply `03_AGENT_SELECTION_RULES.md`;
- confirm ownership boundaries;
- identify supporting Agents;
- identify escalation indicators.

Exit criteria:

- Primary Agent is assigned;
- supporting Agents are justified;
- ambiguous ownership is escalated, not guessed.

---

# Phase 3 — Read Context

Objective: Load authoritative knowledge before designing.

Required actions:

- read Shared Context;
- read relevant Framework documents;
- read relevant Architecture, Domain and Capability documentation;
- read relevant ADRs;
- read relevant Product Specification or specialist documentation;
- inspect current implementation only after documentation context is understood.

Exit criteria:

- authoritative sources are identified;
- contradictions are flagged;
- missing documentation is recorded.

No Agent designs from memory when documentation exists.

---

# Phase 4 — Analyze Solution

Objective: Produce a solution approach within ownership.

Required actions:

- evaluate reuse before invention;
- preserve Domain and Capability boundaries;
- identify constraints and risks;
- determine whether Architecture Review is required;
- determine whether ADR is required;
- prepare a proposed solution.

Exit criteria:

- proposed solution is bounded;
- ownership of each decision is clear;
- risks are explicit.

---

# Phase 5 — Collaborate If Needed

Objective: Involve supporting Agents through protocol.

Required actions:

- use `04_AGENT_COLLABORATION_PROTOCOL.md`;
- request consultation for out-of-ownership concerns;
- resolve conflicts through `05_AGENT_ESCALATION_MATRIX.md`;
- integrate supporting recommendations without absorbing foreign ownership.

Exit criteria:

- required consultations are complete;
- unresolved conflicts are escalated;
- Primary Agent retains outcome accountability.

---

# Phase 6 — Validate Quality

Objective: Ensure the result is safe to persist.

Required actions:

- validate Architecture compliance when structure is affected;
- validate engineering quality through Code Reviewer when implementation exists;
- validate tests through Test Engineer when behaviour changes;
- validate observability needs for runtime changes;
- validate release readiness when deployment is involved.

Exit criteria:

- quality gates appropriate to the task are passed;
- remaining risks are documented;
- no known constitutional violation remains.

---

# Phase 7 — Document Decision

Objective: Persist knowledge and authority.

Required actions:

- update or create required documentation;
- record ADR when architectural decision is significant;
- ensure Documentation Impact is completed;
- ensure Final Output follows Output Standard;
- leave no undocumented durable behaviour.

Exit criteria:

- decision is discoverable;
- source of truth is updated;
- future Agents can reuse the outcome.

---

# Hard Rules

## No architecture modification without review

No Agent should directly modify architecture without review.

Architecture changes require Architecture Review and, when significant, an ADR.

## No documentation bypass

No Agent should bypass documentation.

Documentation is read before design.

Documentation is updated before closure.

## No undocumented behaviour

No Agent should introduce undocumented behaviour.

If behaviour becomes part of the Platform, documentation must become part of the Platform.

---

# Workflow Variants

## Fast Operational Response

For production incidents:

1. Understand request
2. Identify Observability Engineer as Primary Agent
3. Read operational context and recent changes
4. Contain and diagnose
5. Collaborate with runtime specialists
6. Validate hotfix quality
7. Document incident outcome and follow-up ADR if architecture changes

Speed never removes documentation debt.

It defers only what cannot be completed during containment, with explicit follow-up.

## Architectural Change

For structural change:

1. Understand request
2. Identify Architecture-category Primary Agent
3. Read Constitution, ADRs and Domain/Capability docs
4. Analyze alternatives
5. Collaborate across affected categories
6. Architecture Guardian review
7. ADR + documentation before implementation authority is granted

## Product Discovery

For requirements and workflow definition:

1. Understand request
2. Identify Business Analyst or relevant Specialist
3. Read Product and Domain documentation
4. Analyze business problem
5. Collaborate with Product Architect and UX Architect
6. Validate coherence with Product Vision
7. Document requirements for Architecture and engineering intake

---

# Stop Conditions

Agents must stop and escalate when:

- required documentation is missing and inventing it would create architecture;
- ownership is contested;
- security cannot be validated;
- proposed work contradicts Constitution;
- human irreversible decision is required.

Stopping is correct behaviour.

Continuing blindly is forbidden.

---

# Relationship to Framework Workflow

This Execution Workflow governs Agent OS task execution.

It complements `_framework/03_WORKFLOW.md`.

Framework Workflow defines the engineering lifecycle.

Governance Execution Workflow defines how Agents are selected, coordinated and controlled while executing that lifecycle.

Neither document replaces the other.

---

# Success Criteria

Execution Workflow succeeds when:

- every task follows the same phases;
- Agents read before designing;
- architecture remains reviewed;
- documentation remains current;
- undocumented behaviour does not enter the Platform.

---

# Motto

Read.

Own.

Validate.

Record.
