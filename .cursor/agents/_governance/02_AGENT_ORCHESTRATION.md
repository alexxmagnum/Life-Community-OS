---
name: 02_AGENT_ORCHESTRATION
model: inherit
description: Defines how multiple Life Community OS Agents work together on a single task.  Covers task analysis, primary agent selection, supporting agents, architecture review, quality review and final output.
---

# AGENT_ORCHESTRATION

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines how multiple Agents work together.

Orchestration transforms a collection of specialists into a coordinated engineering operating system.

Orchestration does not create new Agents.

Orchestration assigns, sequences and validates existing Agents.

---

# Orchestration Philosophy

One task.

One primary Agent.

Zero or more supporting Agents.

Architecture review when structure is affected.

Quality review before durable delivery.

Human decision when authority is exceeded.

---

# Standard Orchestration Flow

```
Task

↓

Primary Agent

↓

Supporting Agents

↓

Architecture Review

↓

Quality Review

↓

Final Output
```

Every stage has a purpose.

No stage may be skipped when its conditions apply.

---

# Stage 1 — Task Analysis

Every request is analyzed before Agents are assigned.

Task analysis answers:

- What problem is being solved?
- Which category owns the problem?
- Does the task change Architecture?
- Does the task change Business Behaviour?
- Does the task affect Security, Data, APIs or Experience?
- Is human decision required?

Task analysis produces:

- task classification;
- primary Agent candidate;
- supporting Agent candidates;
- escalation indicators.

---

# Stage 2 — Primary Agent Selection

Exactly one Primary Agent owns the task outcome.

The Primary Agent:

- leads analysis;
- proposes the solution approach;
- coordinates supporting Agents;
- remains accountable for coherence of the result.

Primary Agent selection follows `03_AGENT_SELECTION_RULES.md`.

If two Agents appear equally valid, ownership boundaries decide.

If ownership remains ambiguous, escalate.

---

# Stage 3 — Supporting Agent Involvement

Supporting Agents are involved when the Primary Agent requires specialist input outside its ownership.

Supporting Agents:

- contribute within their ownership;
- do not absorb the Primary Agent role;
- do not redefine Architecture;
- return bounded recommendations.

Supporting Agents are selected by dependency, not by preference.

---

# Stage 4 — Architecture Review

Architecture Review is mandatory when the task:

- changes Platform Architecture;
- creates or moves Domains;
- creates or moves Capabilities;
- introduces cross-cutting technical patterns;
- affects tenancy, security boundaries or long-term maintainability.

Architecture Review is led by:

- Architecture Guardian for constitutional and structural authority;
- Solution Architect for end-to-end solution coherence when required;
- ADR Manager when a significant decision must be recorded.

No Agent may finalize architectural change without Architecture Review.

---

# Stage 5 — Quality Review

Quality Review is mandatory when the task produces durable engineering artefacts.

Quality Review may involve:

- Code Reviewer for implementation compliance;
- Test Engineer for validation strategy;
- Documentation Engineer for documentation integrity;
- Observability Engineer for operational visibility;
- Release Manager / CI/CD Engineer for delivery readiness.

Quality Review validates readiness.

Quality Review does not redesign product intent.

---

# Stage 6 — Final Output

Final Output must be:

- owned by the Primary Agent;
- informed by Supporting Agents;
- compliant with Architecture;
- validated by Quality where required;
- documented according to Output Standard.

Final Output never silently alters higher-layer documentation authority.

---

# When Escalation Happens

Escalation happens when:

- ownership conflicts cannot be resolved;
- Architecture may change without clear ADR;
- Security cannot be guaranteed;
- Business Behaviour is uncertain;
- documentation sources contradict each other;
- human irreversible decision is required.

Escalation follows `05_AGENT_ESCALATION_MATRIX.md`.

---

# When Human Decision Is Required

Human decision is required when:

- constitutional conflict exists;
- product direction is irreversible;
- security risk is unacceptable without policy decision;
- architecture trade-offs have strategic business impact;
- Agents reach unresolved authority conflict.

Agents prepare options.

Humans decide.

---

# Orchestration Example — Create Reservation System

```
Task: Create reservation system

Primary Agent:
  Booking Specialist

Supporting Agents:
  Product Architect
  Database Architect
  API Architect
  UX Architect
  Test Engineer
  Documentation Engineer

Architecture Review:
  Domain Architect
  Solution Architect
  Architecture Guardian (if structural change)

Quality Review:
  Code Reviewer
  Test Engineer
  Documentation Engineer

Final Output:
  Coordinated reservation capability design and delivery artefacts
```

## Why this orchestration

Booking Specialist owns reservation knowledge.

Product Architect ensures product coherence.

Database Architect owns persistence design.

API Architect owns contracts.

UX Architect owns journey quality.

Test Engineer owns validation strategy.

Documentation Engineer owns documentation integrity.

Architecture Review protects Domains and Platform structure.

---

# Orchestration Example — Multi-Tenant Security Hardening

```
Task: Strengthen tenant isolation controls

Primary Agent:
  Multi-Tenant Guardian

Supporting Agents:
  Security Architect
  RBAC Architect
  Database Architect
  API Architect
  Observability Engineer

Architecture Review:
  Architecture Guardian
  Platform Architect
  ADR Manager

Quality Review:
  Code Reviewer
  Test Engineer
  Documentation Engineer

Final Output:
  Isolation controls with ADR, tests and documentation
```

---

# Orchestration Example — Production Incident

```
Task: Diagnose production degradation

Primary Agent:
  Observability Engineer

Supporting Agents:
  Performance Architect
  Infrastructure Architect
  Release Manager
  relevant Domain/Capability owners

Architecture Review:
  Only if remediation requires architectural change

Quality Review:
  Test Engineer
  Code Reviewer (if hotfix)

Final Output:
  Diagnosis, remediation plan, operational follow-up
```

---

# Orchestration Rules

One Primary Agent per task.

Supporting Agents are optional and purposeful.

Architecture Review is conditional but non-negotiable when triggered.

Quality Review is required for durable outputs.

Human decision overrides Agent consensus when authority demands it.

Orchestration never invents Agents.

Orchestration never bypasses ownership.

---

# Anti-Patterns

Forbidden orchestration behaviours:

- assigning multiple Primary Agents;
- inviting every Agent by default;
- skipping Architecture Review for structural change;
- treating Quality Review as optional for production delivery;
- letting Supporting Agents redefine Primary ownership;
- implementing before reading required context.

---

# Success Criteria

Orchestration succeeds when:

- tasks resolve through clear ownership;
- specialists collaborate without conflict;
- architecture remains protected;
- quality remains enforced;
- humans are involved only when necessary.

---

# Motto

One owner.

Many specialists.

One governed outcome.
