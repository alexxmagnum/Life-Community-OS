---
name: 03_AGENT_SELECTION_RULES
model: inherit
description: Defines which Life Community OS Agent should handle which situations.  Provides deterministic selection rules by concern, category and conflict resolution.
---

# AGENT_SELECTION_RULES

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines which Agent should handle which situations.

Selection rules make Agent assignment deterministic.

Selection rules prevent responsibility overlap.

Selection rules accelerate correct collaboration.

---

# Selection Philosophy

Select by ownership.

Not by availability.

Not by preference.

Not by novelty.

The Agent that owns the concern leads.

Supporting Agents are added only when required.

---

# Selection Process

```
Identify the dominant concern

↓

Map concern to owning Agent

↓

Confirm category ownership

↓

Add supporting Agents by dependency

↓

Escalate if ownership is ambiguous
```

---

# Core Selection Rules

## Architecture questions

Primary Agent: Architecture Guardian

Support when needed: Solution Architect, Domain Architect, Platform Architect, ADR Manager

---

## Solution design across multiple domains

Primary Agent: Solution Architect

Support when needed: Domain Architect, Capability Architect, relevant Backend/Frontend/Platform Agents

---

## Business Domain boundaries

Primary Agent: Domain Architect

Support when needed: Product Architect, Capability Architect, Database Architect

---

## Platform Capability reuse

Primary Agent: Capability Architect

Support when needed: Domain Architect, API Architect, Platform Architect

---

## Architecture decisions and ADRs

Primary Agent: ADR Manager

Support when needed: Architecture Guardian, Solution Architect, Documentation Engineer

---

## Platform technical architecture

Primary Agent: Platform Architect

Support when needed: Infrastructure Architect, Multi Tenant Guardian, Scalability Engineer

---

## Database questions

Primary Agent: Database Architect

Support when needed: Domain Architect, API Architect, Security Architect, Performance Architect

---

## API questions

Primary Agent: API Architect

Support when needed: Database Architect, Security Architect, Event Architect, UI Architect

---

## Security questions

Primary Agent: Security Architect

Support when needed: RBAC Architect, Multi Tenant Guardian, Architecture Guardian

---

## External integrations

Primary Agent: Integration Architect

Support when needed: API Architect, Event Architect, Security Architect

---

## Event-driven design

Primary Agent: Event Architect

Support when needed: Domain Architect, Automation Architect, Integration Architect

---

## Automation workflows

Primary Agent: Automation Architect

Support when needed: Event Architect, AI Architect, Product specialists

---

## Performance questions

Primary Agent: Performance Architect

Support when needed: Database Architect, Scalability Engineer, Observability Engineer

---

## AI architecture

Primary Agent: AI Architect

Support when needed: AI Product Designer, Security Architect, Automation Architect

---

## Design system questions

Primary Agent: Design System Guardian

Support when needed: UI Architect, UX Architect, Accessibility Architect

---

## UI questions

Primary Agent: UI Architect

Support when needed: Design System Guardian, UX Architect, Accessibility Architect, API Architect

---

## UX questions

Primary Agent: UX Architect

Support when needed: Product Architect, UI Architect, Accessibility Architect, Device Experience Architect

---

## Accessibility questions

Primary Agent: Accessibility Architect

Support when needed: UX Architect, UI Architect, Test Engineer

---

## PWA questions

Primary Agent: PWA Architect

Support when needed: Device Experience Architect, Performance Architect, Infrastructure Architect

---

## Cross-device experience

Primary Agent: Device Experience Architect

Support when needed: UX Architect, UI Architect, PWA Architect

---

## Infrastructure questions

Primary Agent: Infrastructure Architect

Support when needed: Platform Architect, Scalability Engineer, Security Architect, CI/CD Engineer

---

## Multi-tenancy questions

Primary Agent: Multi Tenant Guardian

Support when needed: Security Architect, Database Architect, RBAC Architect, Platform Architect

---

## Authorization / RBAC questions

Primary Agent: RBAC Architect

Support when needed: Security Architect, Multi Tenant Guardian, Domain Architect

---

## Scalability questions

Primary Agent: Scalability Engineer

Support when needed: Performance Architect, Infrastructure Architect, Platform Architect

---

## Knowledge graph questions

Primary Agent: Knowledge Graph Engineer

Support when needed: Domain Architect, Platform Intelligence Engineer, Digital Twin Engineer

---

## Platform intelligence questions

Primary Agent: Platform Intelligence Engineer

Support when needed: Knowledge Graph Engineer, AI Architect, Metrics Analyst

---

## Digital twin questions

Primary Agent: Digital Twin Engineer

Support when needed: Knowledge Graph Engineer, Domain Architect, Observability Engineer

---

## Product vision and capability direction

Primary Agent: Product Architect

Support when needed: Business Analyst, Domain Architect, Solution Architect

---

## Business workflow / requirements

Primary Agent: Business Analyst

Support when needed: Product Architect, Domain Architect, UX Architect, Metrics Analyst

---

## Hospitality

Primary Agent: Hospitality Specialist

Support when needed: Booking Specialist, Commerce Specialist, Product Architect, UX Architect

---

## Reservations / booking

Primary Agent: Booking Specialist

Support when needed: Hospitality Specialist, Product Architect, Database Architect, API Architect, UX Architect

---

## Commerce / sales / payments

Primary Agent: Commerce Specialist

Support when needed: Product Architect, Security Architect, API Architect, Booking Specialist

---

## Community

Primary Agent: Community Specialist

Support when needed: Product Architect, UX Architect, Metrics Analyst, Domain Architect

---

## Product metrics / KPIs

Primary Agent: Metrics Analyst

Support when needed: Observability Engineer, Product Architect, Business Analyst

---

## AI product experience

Primary Agent: AI Product Designer

Support when needed: AI Architect, Product Architect, UX Architect

---

## Code quality

Primary Agent: Code Reviewer

Support when needed: Test Engineer, Refactoring Engineer, Documentation Engineer, Architecture Guardian

---

## Testing strategy

Primary Agent: Test Engineer

Support when needed: Code Reviewer, Security Architect, Performance Architect, CI/CD Engineer

---

## Documentation architecture

Primary Agent: Documentation Engineer

Support when needed: ADR Manager, Architecture Guardian, producing Agents

---

## Refactoring / technical debt

Primary Agent: Refactoring Engineer

Support when needed: Code Reviewer, Architecture Guardian, Test Engineer

---

## Production problems

Primary Agent: Observability Engineer

Support when needed: Performance Architect, Infrastructure Architect, Release Manager, relevant Domain owners

---

## Deployment / release

Primary Agent: Release Manager

Support when needed: CI/CD Engineer, Test Engineer, Observability Engineer

Alternative when pipeline automation is the dominant concern: CI/CD Engineer

---

## Delivery automation / pipelines

Primary Agent: CI/CD Engineer

Support when needed: Release Manager, Infrastructure Architect, Test Engineer

---

# Conflict Resolution Rules

## Same category conflict

Resolve by ownership boundaries defined in Agent documents.

If unresolved, escalate to category coordinating authority:

- Architecture → Architecture Guardian
- Product → Product Architect
- Frontend visual system → Design System Guardian
- Quality engineering review → Code Reviewer
- Release/delivery → Release Manager

## Cross-category conflict

Escalate to Architecture Guardian when Architecture, Domains, Capabilities, Security or tenancy are affected.

Escalate to Product Architect when product intent is the conflict.

Escalate to Humans when authority is exceeded.

## Multiple matching rules

Choose the Agent owning the durable decision.

Example:

A reservation UI request is led by Booking Specialist for workflow truth, with UX Architect and UI Architect as supporting Agents.

A reservation schema request is led by Database Architect, with Booking Specialist and Domain Architect as supporting Agents.

---

# Selection Anti-Patterns

Never select an Agent because:

- it is more general;
- it is more technical;
- it is more available;
- it previously worked nearby;
- it can improvise outside ownership.

Never assign Architecture Guardian as Primary Agent for ordinary implementation work.

Architecture Guardian protects Architecture.

Specialists execute.

---

# Success Criteria

Selection Rules succeed when:

- the correct Primary Agent is obvious;
- supporting Agents are minimal and justified;
- conflicts resolve through ownership;
- work begins without inventing structure.

---

# Motto

Match the concern to the owner.
