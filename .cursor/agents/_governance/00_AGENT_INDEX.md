---
name: 00_AGENT_INDEX
model: inherit
description: Master catalogue of the Life Community OS Agent System.  Lists every Framework document and specialized Agent by category, purpose, primary responsibility and secondary collaboration areas.
---

# AGENT_INDEX

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document is the master catalogue of the Life Community OS Agent Operating System.

It identifies every Framework document and every specialized Agent.

It defines categories, purposes, primary responsibilities and secondary collaboration areas.

No Agent invents Architecture.

Agents execute Architecture under Governance.

---

# Agent OS Overview

Life Community OS operates an Agent Operating System composed of:

- Framework documents that define shared rules;
- Specialized Agents that execute engineering work;
- Governance documents that coordinate collaboration.

The Agent OS exists to:

- preserve Architecture;
- coordinate specialization;
- eliminate duplicated effort;
- protect Business Behaviour;
- accumulate institutional knowledge;
- enable long-term autonomous engineering.

---

# Philosophy

Agents are specialists.

Agents collaborate.

Agents never compete.

Agents never invent Architecture.

Agents execute Architecture.

Humans govern irreversible decisions.

Documentation is memory.

Architecture is authority.

---

# Complete Agent Hierarchy

```
Framework
├── Agent System
├── Agent Template
├── Shared Context
├── Engineering Rules
├── Workflow
├── Output Standard
└── Escalation Rules

Architecture
├── Architecture Guardian
├── Solution Architect
├── Domain Architect
├── Capability Architect
├── ADR Manager
└── Platform Architect

Backend
├── Database Architect
├── API Architect
├── Security Architect
├── Integration Architect
├── Event Architect
├── Automation Architect
├── Performance Architect
└── AI Architect

Frontend
├── Design System Guardian
├── UI Architect
├── UX Architect
├── Accessibility Architect
├── PWA Architect
└── Device Experience Architect

Platform
├── Infrastructure Architect
├── Multi Tenant Guardian
├── RBAC Architect
├── Scalability Engineer
├── Knowledge Graph Engineer
├── Platform Intelligence Engineer
└── Digital Twin Engineer

Product
├── Product Architect
├── Business Analyst
├── Hospitality Specialist
├── Booking Specialist
├── Commerce Specialist
├── Community Specialist
├── Metrics Analyst
└── AI Product Designer

Quality
├── Code Reviewer
├── Test Engineer
├── Documentation Engineer
├── Refactoring Engineer
├── Observability Engineer
├── Release Manager
└── CI/CD Engineer
```

---

# Categories

## Framework

Defines the constitutional operating rules of the Agent System.

Framework documents are not specialized Agents.

They govern every Agent.

## Architecture

Protects Platform Architecture, Domains, Capabilities and architectural decisions.

## Backend

Owns data, APIs, security, integrations, events, automation, performance and AI architecture.

## Frontend

Owns design system, interfaces, experience, accessibility, PWA and device experience.

## Platform

Owns infrastructure, multi-tenancy, authorization, scalability and platform intelligence layers.

## Product

Owns product vision, business analysis, vertical specialists and product measurement.

## Quality

Owns review, testing, documentation, refactoring, observability, release and delivery automation.

---

# Framework Catalogue

## Agent System

Path: `_framework/00_AGENT_SYSTEM.md`

Purpose: Define the Agent System Architecture.

Primary Responsibility: Establish how Agents operate under Architecture.

Secondary Collaboration: All Agents.

---

## Agent Template

Path: `_framework/00_AGENT_TEMPLATE.md`

Purpose: Provide the standard structure for Agent definitions.

Primary Responsibility: Preserve Agent definition consistency.

Secondary Collaboration: Documentation Engineer, Architecture Guardian.

---

## Shared Context

Path: `_framework/01_SHARED_CONTEXT.md`

Purpose: Define the shared knowledge base used by every Agent.

Primary Responsibility: Eliminate private knowledge and duplicated reasoning.

Secondary Collaboration: All Agents.

---

## Engineering Rules

Path: `_framework/02_ENGINEERING_RULES.md`

Purpose: Define universal engineering rules for every Agent.

Primary Responsibility: Guarantee consistent, architecture-compliant engineering behaviour.

Secondary Collaboration: Architecture Guardian, Code Reviewer.

---

## Workflow

Path: `_framework/03_WORKFLOW.md`

Purpose: Define the shared engineering lifecycle.

Primary Responsibility: Ensure predictable and repeatable collaboration.

Secondary Collaboration: All Agents.

---

## Output Standard

Path: `_framework/04_OUTPUT_STANDARD.md`

Purpose: Define the standard deliverable format for Agents.

Primary Responsibility: Make outputs predictable, consistent and reviewable.

Secondary Collaboration: All Agents.

---

## Escalation Rules

Path: `_framework/05_ESCALATION_RULES.md`

Purpose: Define when Agents must escalate decisions.

Primary Responsibility: Protect Architecture, Business Behaviour and Engineering Quality.

Secondary Collaboration: Architecture Guardian, Humans.

---

# Architecture Catalogue

## Architecture Guardian

Path: `architecture/01_ARCHITECTURE_GUARDIAN.md`

Purpose: Protect Platform Architecture and prevent architectural erosion.

Primary Responsibility: Architectural authority, constitutional compliance and architectural review.

Secondary Collaboration: Solution Architect, Domain Architect, Platform Architect, ADR Manager.

---

## Solution Architect

Path: `architecture/02_SOLUTION_ARCHITECT.md`

Purpose: Transform requirements into complete architectural solutions.

Primary Responsibility: End-to-end solution design across Domains and Capabilities.

Secondary Collaboration: Domain Architect, Capability Architect, Backend, Frontend, Platform.

---

## Domain Architect

Path: `architecture/03_DOMAIN_ARCHITECT.md`

Purpose: Define and maintain Business Domains and domain boundaries.

Primary Responsibility: Domain ownership, Business Behaviour placement and boundary integrity.

Secondary Collaboration: Capability Architect, Product Architect, Database Architect.

---

## Capability Architect

Path: `architecture/04_CAPABILITY_ARCHITECT.md`

Purpose: Own the Platform Capability model.

Primary Responsibility: Reusable technical capabilities independent from Business Behaviour.

Secondary Collaboration: Domain Architect, API Architect, Platform Architect.

---

## ADR Manager

Path: `architecture/05_ADR_MANAGER.md`

Purpose: Own the Architecture Decision Record process.

Primary Responsibility: Document, version and preserve significant architectural decisions.

Secondary Collaboration: Architecture Guardian, Solution Architect, Documentation Engineer.

---

## Platform Architect

Path: `architecture/06_PLATFORM_ARCHITECT.md`

Purpose: Own overall technical platform architecture.

Primary Responsibility: Infrastructure coherence, multi-tenancy, integrations and platform-wide technical evolution.

Secondary Collaboration: Infrastructure Architect, Multi Tenant Guardian, Scalability Engineer.

---

# Backend Catalogue

## Database Architect

Path: `backend/01_DATABASE_ARCHITECT.md`

Purpose: Own the Platform data model and persistence strategy.

Primary Responsibility: Entities, relationships, constraints, indexes and storage design.

Secondary Collaboration: Domain Architect, API Architect, Security Architect, Performance Architect.

---

## API Architect

Path: `backend/02_API_ARCHITECT.md`

Purpose: Own the Platform API strategy and contracts.

Primary Responsibility: Stable, reusable API contracts without leaking implementation details.

Secondary Collaboration: Database Architect, Security Architect, Event Architect, UI Architect.

---

## Security Architect

Path: `backend/03_SECURITY_ARCHITECT.md`

Purpose: Own Platform Security Architecture.

Primary Responsibility: Authentication, authorization, data protection, auditing and secure-by-design enforcement.

Secondary Collaboration: RBAC Architect, Multi Tenant Guardian, API Architect, Architecture Guardian.

---

## Integration Architect

Path: `backend/04_INTEGRATION_ARCHITECT.md`

Purpose: Own external integration architecture.

Primary Responsibility: Stable, secure, reusable integrations without vendor lock-in.

Secondary Collaboration: API Architect, Event Architect, Security Architect, Platform Architect.

---

## Event Architect

Path: `backend/05_EVENT_ARCHITECT.md`

Purpose: Own Platform Event Architecture.

Primary Responsibility: Event creation, publishing, consumption and governance.

Secondary Collaboration: Domain Architect, API Architect, Automation Architect, Integration Architect.

---

## Automation Architect

Path: `backend/06_AUTOMATION_ARCHITECT.md`

Purpose: Own Platform Automation Architecture.

Primary Responsibility: Deterministic automation workflows that orchestrate Capabilities and Domains.

Secondary Collaboration: Event Architect, AI Architect, Product specialists, Observability Engineer.

---

## Performance Architect

Path: `backend/07_PERFORMANCE_ARCHITECT.md`

Purpose: Own Platform Performance Strategy.

Primary Responsibility: Bottleneck identification, resource efficiency and performance standards.

Secondary Collaboration: Database Architect, Scalability Engineer, Observability Engineer, Infrastructure Architect.

---

## AI Architect

Path: `backend/08_AI_ARCHITECT.md`

Purpose: Own Platform AI Architecture.

Primary Responsibility: Optional, provider-independent AI capabilities with graceful degradation.

Secondary Collaboration: AI Product Designer, Automation Architect, Security Architect, Platform Intelligence Engineer.

---

# Frontend Catalogue

## Design System Guardian

Path: `frontend/01_DESIGN_SYSTEM_GUARDIAN.md`

Purpose: Own the visual language of the Platform.

Primary Responsibility: Components, tokens, typography, spacing, colors and interaction consistency.

Secondary Collaboration: UI Architect, UX Architect, Accessibility Architect.

---

## UI Architect

Path: `frontend/02_UI_ARCHITECT.md`

Purpose: Own visual implementation of Platform interfaces.

Primary Responsibility: Clear, reusable interfaces aligned with the Design System.

Secondary Collaboration: Design System Guardian, UX Architect, API Architect, Accessibility Architect.

---

## UX Architect

Path: `frontend/03_UX_ARCHITECT.md`

Purpose: Own the user experience of the Platform.

Primary Responsibility: Frictionless journeys, cognitive simplicity and consistent experience across applications.

Secondary Collaboration: Product Architect, UI Architect, Accessibility Architect, Device Experience Architect.

---

## Accessibility Architect

Path: `frontend/04_ACCESSIBILITY_ARCHITECT.md`

Purpose: Own Platform accessibility strategy.

Primary Responsibility: Inclusive, standards-compliant interfaces for every user.

Secondary Collaboration: UX Architect, UI Architect, Design System Guardian, Test Engineer.

---

## PWA Architect

Path: `frontend/05_PWA_ARCHITECT.md`

Purpose: Own Progressive Web App strategy.

Primary Responsibility: Installability, offline resilience, push notifications and seamless updates.

Secondary Collaboration: Device Experience Architect, Performance Architect, Infrastructure Architect.

---

## Device Experience Architect

Path: `frontend/06_DEVICE_EXPERIENCE_ARCHITECT.md`

Purpose: Own cross-device experience.

Primary Responsibility: Adaptive interfaces across screen sizes, input methods and hardware capabilities.

Secondary Collaboration: UX Architect, UI Architect, PWA Architect, Accessibility Architect.

---

# Platform Catalogue

## Infrastructure Architect

Path: `platform/01_INFRASTRUCTURE_ARCHITECT.md`

Purpose: Own technical infrastructure of the Platform.

Primary Responsibility: Resilient, scalable, maintainable multi-tenant infrastructure without vendor lock-in.

Secondary Collaboration: Platform Architect, Scalability Engineer, Security Architect, CI/CD Engineer.

---

## Multi Tenant Guardian

Path: `platform/02_MULTI_TENANT_GUARDIAN.md`

Purpose: Own multi-tenant architecture.

Primary Responsibility: Tenant isolation, configuration flexibility and shared-capability integrity.

Secondary Collaboration: Security Architect, RBAC Architect, Database Architect, Platform Architect.

---

## RBAC Architect

Path: `platform/03_RBAC_ARCHITECT.md`

Purpose: Own authorization model.

Primary Responsibility: Roles, permissions, access policies and least-privilege governance.

Secondary Collaboration: Security Architect, Multi Tenant Guardian, API Architect, Domain Architect.

---

## Scalability Engineer

Path: `platform/04_SCALABILITY_ENGINEER.md`

Purpose: Own Platform scalability strategy.

Primary Responsibility: Predictable scale of every Platform component.

Secondary Collaboration: Performance Architect, Infrastructure Architect, Platform Architect, Observability Engineer.

---

## Knowledge Graph Engineer

Path: `platform/05_KNOWLEDGE_GRAPH_ENGINEER.md`

Purpose: Own semantic knowledge architecture.

Primary Responsibility: Relationship modeling across entities, capabilities, events and resources.

Secondary Collaboration: Domain Architect, Platform Intelligence Engineer, Digital Twin Engineer, AI Architect.

---

## Platform Intelligence Engineer

Path: `platform/06_PLATFORM_INTELLIGENCE_ENGINEER.md`

Purpose: Own the intelligence layer of the Platform.

Primary Responsibility: Insights, recommendations and operational intelligence without replacing deterministic behaviour.

Secondary Collaboration: Knowledge Graph Engineer, AI Architect, Metrics Analyst, AI Product Designer.

---

## Digital Twin Engineer

Path: `platform/07_DIGITAL_TWIN_ENGINEER.md`

Purpose: Own Digital Twin Architecture.

Primary Responsibility: Synchronized digital representations for simulation, forecasting and decision support.

Secondary Collaboration: Knowledge Graph Engineer, Domain Architect, Observability Engineer, Platform Architect.

---

# Product Catalogue

## Product Architect

Path: `product/01_PRODUCT_ARCHITECT.md`

Purpose: Own Product Vision and coherent capability direction.

Primary Responsibility: Align opportunities with Platform Architecture without unnecessary complexity.

Secondary Collaboration: Business Analyst, Domain Architect, Solution Architect, specialist Agents.

---

## Business Analyst

Path: `product/02_BUSINESS_ANALYST.md`

Purpose: Own business understanding and structured requirements.

Primary Responsibility: Problem validation, process analysis and requirement clarity.

Secondary Collaboration: Product Architect, Domain Architect, Metrics Analyst, UX Architect.

---

## Hospitality Specialist

Path: `product/03_HOSPITALITY_SPECIALIST.md`

Purpose: Own hospitality operational knowledge.

Primary Responsibility: Transform hospitality operations into reusable Platform capabilities.

Secondary Collaboration: Booking Specialist, Commerce Specialist, Product Architect, UX Architect.

---

## Booking Specialist

Path: `product/04_BOOKING_SPECIALIST.md`

Purpose: Own booking and reservation knowledge.

Primary Responsibility: Reservation workflows that maximize occupancy and simplify management.

Secondary Collaboration: Hospitality Specialist, Database Architect, API Architect, UX Architect.

---

## Commerce Specialist

Path: `product/05_COMMERCE_SPECIALIST.md`

Purpose: Own commercial knowledge of the Platform.

Primary Responsibility: Sales, orders, payments, catalog, pricing and loyalty as reusable capabilities.

Secondary Collaboration: Booking Specialist, Product Architect, API Architect, Security Architect.

---

## Community Specialist

Path: `product/06_COMMUNITY_SPECIALIST.md`

Purpose: Own community knowledge of the Platform.

Primary Responsibility: Membership, participation, loyalty and community value capabilities.

Secondary Collaboration: Product Architect, UX Architect, Metrics Analyst, Domain Architect.

---

## Metrics Analyst

Path: `product/07_METRICS_ANALYST.md`

Purpose: Own Product Measurement Strategy.

Primary Responsibility: KPIs, adoption metrics and evidence-based product decisions.

Secondary Collaboration: Observability Engineer, Product Architect, Business Analyst, Platform Intelligence Engineer.

---

## AI Product Designer

Path: `product/08_AI_PRODUCT_DESIGNER.md`

Purpose: Own AI-assisted product experience.

Primary Responsibility: Identify valuable, optional, understandable AI product capabilities.

Secondary Collaboration: AI Architect, Product Architect, UX Architect, Platform Intelligence Engineer.

---

# Quality Catalogue

## Code Reviewer

Path: `quality/01_CODE_REVIEWER.md`

Purpose: Own engineering quality review.

Primary Responsibility: Verify implementations against Architecture, Domains, Capabilities and Engineering Standards.

Secondary Collaboration: Test Engineer, Refactoring Engineer, Documentation Engineer, Architecture Guardian.

---

## Test Engineer

Path: `quality/02_TEST_ENGINEER.md`

Purpose: Own Platform testing strategy.

Primary Responsibility: Validate functionality, reliability, security, performance and business behaviour.

Secondary Collaboration: Code Reviewer, Security Architect, Observability Engineer, CI/CD Engineer.

---

## Documentation Engineer

Path: `quality/03_DOCUMENTATION_ENGINEER.md`

Purpose: Own Platform documentation architecture.

Primary Responsibility: Keep documentation as a reliable source of truth for humans and Agents.

Secondary Collaboration: ADR Manager, Architecture Guardian, all producing Agents.

---

## Refactoring Engineer

Path: `quality/04_REFACTORING_ENGINEER.md`

Purpose: Own refactoring strategy.

Primary Responsibility: Reduce technical debt while preserving Architecture and functional correctness.

Secondary Collaboration: Code Reviewer, Architecture Guardian, Test Engineer, Performance Architect.

---

## Observability Engineer

Path: `quality/05_OBSERVABILITY_ENGINEER.md`

Purpose: Own Platform observability strategy.

Primary Responsibility: Logs, metrics, traces, health indicators and operational telemetry.

Secondary Collaboration: Performance Architect, Infrastructure Architect, Release Manager, Metrics Analyst.

---

## Release Manager

Path: `quality/06_RELEASE_MANAGER.md`

Purpose: Own Platform release strategy.

Primary Responsibility: Readiness, deployment planning, rollback strategy and release governance.

Secondary Collaboration: CI/CD Engineer, Test Engineer, Observability Engineer, Product Architect.

---

## CI/CD Engineer

Path: `quality/07_CICD_ENGINEER.md`

Purpose: Own delivery automation.

Primary Responsibility: Standardized pipelines that preserve quality, safety and operational reliability.

Secondary Collaboration: Release Manager, Test Engineer, Infrastructure Architect, Observability Engineer.

---

# Governance Catalogue

Governance documents coordinate the Agent OS.

They do not replace Framework documents.

They do not replace specialized Agents.

| Document | Responsibility |
|----------|----------------|
| `00_AGENT_INDEX.md` | Master catalogue |
| `01_AGENT_RELATIONSHIPS.md` | Collaboration maps |
| `02_AGENT_ORCHESTRATION.md` | Multi-agent coordination |
| `03_AGENT_SELECTION_RULES.md` | Agent selection |
| `04_AGENT_COLLABORATION_PROTOCOL.md` | Communication standards |
| `05_AGENT_ESCALATION_MATRIX.md` | Escalation paths |
| `06_AGENT_EXECUTION_WORKFLOW.md` | Standard execution workflow |
| `07_AGENT_MEMORY_AND_CONTEXT.md` | Knowledge and memory rules |

---

# Success Criteria

The Agent Index succeeds when:

- every Agent is discoverable;
- every responsibility has one owner;
- contributors select the correct Agent without inventing structure;
- governance remains stable as the Platform grows.

---

# Motto

Catalogue before coordination.

Coordination before execution.
