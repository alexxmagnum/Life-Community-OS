---
name: 05_AGENT_ESCALATION_MATRIX
model: inherit
description: Defines escalation paths for Life Community OS Agents.  Covers technical, product, security, documentation and operational conflicts from Agent to Category Lead to Architecture Guardian to Human.
---

# AGENT_ESCALATION_MATRIX

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines escalation paths for the Agent Operating System.

Escalation protects Architecture.

Escalation protects Business Behaviour.

Escalation protects Engineering Quality.

Escalation is a governance mechanism.

Not a failure.

---

# Escalation Philosophy

Agents specialize.

Agents collaborate.

Agents escalate.

Humans govern.

Escalate early when authority is unclear.

Escalate immediately when Architecture, Security or constitutional integrity is at risk.

---

# Universal Escalation Path

```
Agent
↓
Category Lead
↓
Architecture Guardian
↓
Human
```

This path applies unless a more specific matrix path is defined below.

---

# Category Leads

Category Leads coordinate unresolved conflicts within a category.

| Category | Category Lead |
|----------|---------------|
| Architecture | Architecture Guardian |
| Backend | Solution Architect for cross-backend design; Architecture Guardian for architectural authority |
| Frontend | Design System Guardian for visual system; UX Architect for experience conflicts; Architecture Guardian for structural conflicts |
| Platform | Platform Architect |
| Product | Product Architect |
| Quality | Code Reviewer for engineering quality; Release Manager for release conflicts |

When Category Lead and owning specialist are the same Agent, escalate directly to Architecture Guardian or Human as appropriate.

---

# Technical Conflict

```
Agent
↓
Category Lead
↓
Architecture Guardian
↓
Human
```

Use for:

- conflicting technical designs;
- unclear component ownership;
- reuse versus new implementation disputes;
- cross-cutting technical trade-offs.

---

# Database Conflict

```
Database Architect
↓
Backend Lead / Solution Architect
↓
Architecture Guardian
↓
Human
```

Use for:

- schema redesign disputes;
- persistence strategy conflicts;
- domain-versus-storage boundary conflicts;
- breaking data model changes.

Domain meaning conflicts must include Domain Architect before final escalation.

---

# API Conflict

```
API Architect
↓
Solution Architect
↓
Architecture Guardian
↓
Human
```

Use for:

- contract ownership disputes;
- breaking API changes;
- API versus Domain leakage conflicts.

---

# Security Conflict

```
Security Architect
↓
Architecture Guardian
↓
Human
```

Use for:

- unresolved security risks;
- authentication or authorization disputes;
- data protection conflicts;
- insecure-by-convenience proposals.

RBAC and tenancy conflicts must include RBAC Architect and Multi Tenant Guardian before or during escalation.

---

# Product Conflict

```
Specialist
↓
Product Architect
↓
Human
```

Use for:

- conflicting product intent;
- specialist scope disputes;
- prioritization conflicts among product capabilities;
- requirements that contradict Product Vision.

If product conflict implies Architecture change, escalate also to Architecture Guardian.

---

# Domain Conflict

```
Domain Architect
↓
Architecture Guardian
↓
Human
```

Include Product Architect when Business Behaviour intent is contested.

---

# Frontend Conflict

```
Frontend Agent
↓
Design System Guardian or UX Architect
↓
Architecture Guardian
↓
Human
```

Use Design System Guardian for visual system conflicts.

Use UX Architect for journey and experience conflicts.

Escalate to Product Architect when product behaviour is the true conflict.

---

# Platform Conflict

```
Platform Agent
↓
Platform Architect
↓
Architecture Guardian
↓
Human
```

Use for:

- infrastructure trade-offs;
- multi-tenancy disputes;
- scalability strategy conflicts;
- platform intelligence boundary conflicts.

---

# Quality Conflict

```
Quality Agent
↓
Code Reviewer or Release Manager
↓
Architecture Guardian
↓
Human
```

Use Code Reviewer for quality and compliance disputes.

Use Release Manager for release readiness disputes.

---

# Documentation Conflict

```
Producing Agent
↓
Documentation Engineer
↓
Architecture Guardian / ADR Manager
↓
Human
```

Use for:

- contradictory documentation;
- unclear source of truth;
- undocumented behaviour proposed as permanent;
- ADR necessity disputes.

---

# Production / Operational Conflict

```
Observability Engineer
↓
Release Manager
↓
Architecture Guardian
↓
Human
```

Include Infrastructure Architect and Performance Architect when runtime behaviour is the conflict source.

---

# Mandatory Escalation Triggers

Escalate immediately when:

- Architecture may change;
- new Business Domains appear;
- new Platform Capabilities are required;
- breaking API changes exist;
- database redesign is required;
- security cannot be validated;
- constitution conflicts exist;
- requirements contradict documentation;
- ownership is contested after consultation;
- irreversible product or business decisions are required.

---

# Escalation Package

Every escalation must include:

1. Context
2. Problem
3. Current Architecture
4. Constraints
5. Options considered
6. Recommended option
7. Risks
8. Documentation Impact
9. Decision requested

Escalations without options are incomplete unless emergency production response requires immediate containment.

---

# Escalation Outcomes

## Continue

Agent proceeds within clarified ownership.

## Collaborate

Additional Agents are assigned.

## Redesign

Proposal returns for revision.

## Record ADR

Decision is architecturally significant and must be recorded.

## Human Decision

Agents stop and await human authority.

## Reject

Proposal violates Architecture, Constitution or Engineering Rules.

---

# Forbidden Escalation Behaviours

Agents must never:

- escalate to avoid ownership;
- skip Category Lead without justification;
- escalate without evidence;
- continue implementation during unresolved architectural escalation;
- treat escalation as optional when mandatory triggers apply.

---

# Success Criteria

Escalation Matrix succeeds when:

- conflicts resolve through known paths;
- Architecture remains protected;
- humans receive clear options;
- Agents escalate early enough to prevent damage;
- escalation volume remains purposeful, not chaotic.

---

# Motto

Escalate to protect.

Decide to progress.
