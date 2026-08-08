# PLATFORM_GLOSSARY

Version: 1.0
Status: Canonical
Document Type: Platform Glossary
Priority: Constitutional

---

# Purpose

This document defines the official vocabulary of Life Community OS.

Every architectural document, implementation, API, database, user interface, automation, AI component and engineering discussion must use these definitions consistently.

Every concept has exactly one official meaning.

Terminology remains consistent.

Knowledge remains unambiguous.

---

# Scope

This Glossary governs:

- Architecture
- Engineering
- Business
- Product
- Documentation
- AI
- Automation
- APIs
- Data
- UX

This is the official language of the Platform.

---

# A

## Aggregate

A consistency boundary inside a Business Domain.

Aggregates own Business Rules and guarantee consistency.

---

## API

A public contract exposing Platform Capabilities or Business Behaviour.

APIs never expose internal implementation.

---

## Architecture

The permanent structure governing the Platform.

Architecture defines responsibilities.

Architecture is technology independent.

---

## Architecture Decision Record (ADR)

A permanent document explaining an architectural decision.

Every significant architectural decision requires an ADR.

---

## Artificial Intelligence

A reusable Platform Capability providing reasoning, generation, prediction or analysis.

Artificial Intelligence never owns Platform Governance.

---

## Automation

Deterministic execution of predefined workflows.

Automation orchestrates.

Automation never owns Business Behaviour.

---

# B

## Booking

A reservation of a resource during a specific period.

Bookings belong to Business Domains.

---

## Business Behaviour

The official rules governing how a business operates.

Business Behaviour belongs exclusively to Business Domains.

---

## Business Domain

A cohesive boundary containing Business Behaviour.

Domains own rules.

Domains own policies.

Domains own state.

---

## Business Event

A meaningful occurrence inside a Business Domain.

Events describe facts.

Events never describe implementation.

---

# C

## Capability

A reusable Platform service.

Capabilities provide functionality reusable by multiple Business Domains.

Capabilities never own Business Behaviour.

---

## Command

An intention to change Platform State.

Commands request actions.

Commands never describe facts.

---

## Configuration

Platform customization without changing Architecture.

Configuration adapts behaviour.

Architecture remains unchanged.

---

## Connector

A Platform Component integrating external systems.

Connectors isolate providers.

---

## Context

A bounded operational environment.

Contexts organize responsibilities.

---

## Contract

A stable agreement between components.

Contracts remain versioned.

Breaking changes require new versions.

---

## Channel

An organization layer for structured community communication inside a Territory (ADR-035).

Channels organize where Community Content and Experiences are published.

Channel is not a Tenant, not a security boundary, not a chat room, and not a replacement for Group, Experience, Resource, or LocalEntity.

---

## Community Area

An optional organizational geography inside a Territory (ADR-005).

Product language may call this a Micro Area.

Community Area is not a Tenant and not a security or authorization boundary.

---

# D

## Data

Persistent information representing Platform facts.

Business Data remains authoritative.

---

## Digital Twin

A governed digital representation of a real Business.

Digital Twins reflect reality.

They never replace reality.

---

## Domain Service

A reusable Business Behaviour shared within a Domain.

Domain Services remain inside Business Domains.

---

# E

## Entity

A business object with persistent identity.

Entities belong to Business Domains.

---

## Event

A recorded fact describing something that happened.

Events remain immutable.

---

## Experience

**Platform UX sense:** a user interaction journey inside the Platform. Experiences consume Capabilities.

**Community domain sense (ADR-027 / ADR-039):** a participatory community activity, event, or meeting (registration, capacity, attendance). Product UI may label this an “Activity” via i18n; the canonical domain type remains Experience.

Do not introduce a parallel Activity aggregate beside Experience. Forbidden: Activity, SportActivity, or EventActivity domain entities.

Experience may reference Channel, Group, CommunityArea, and Resource without replacing those aggregates.

---

# G

## Governance

The rules controlling evolution, security and architectural consistency.

Governance belongs to the Platform.

---

# I

## Integration

Communication between Life Community OS and external systems.

Integrations remain replaceable.

---

## Intelligence

Knowledge interpreted to improve decisions.

Platform Intelligence belongs to the Platform.

---

# K

## Knowledge

Governed organizational understanding accumulated over time.

Knowledge belongs to the Platform.

Never to providers.

---

## Knowledge Graph

Semantic relationships connecting Platform concepts.

Knowledge Graph enriches reasoning.

---

# M

## Membership

Participation of a Person inside a Territory community (ADR-011).

Membership is belonging — not authentication and not authorization.

Community Area resource eligibility is not stored on Membership; it is derived from active Property Person Relationships (ADR-037).

---

## Module

A logical grouping of related functionality.

Modules organize implementation.

Architecture remains independent from Modules.

---

## Multi-Tenant

A Platform architecture supporting multiple isolated organizations using the same system.

Tenant isolation is mandatory.

---

# O

## Observability

The capability of understanding Platform behaviour through metrics, logs, traces and health information.

Every Capability remains observable.

---

## Organization

A Business operating inside Life Community OS.

Organizations own resources.

Organizations belong to Tenants.

---

# P

## Permission

An authorization allowing specific actions.

Permissions remain centralized.

---

## Person

Stable human domain identity (ADR-010).

Person is not a User Account, not a Membership, and must not carry durable Community Area permission lists. Area-scoped resource access is derived from active residencies (ADR-037).

---

## Platform Capability

Reusable technical functionality available across Business Domains.

Platform Capabilities never own Business Behaviour.

---

## Platform Intelligence

Collective intelligence emerging from Knowledge, Analytics, AI and Platform Capabilities.

Platform Intelligence belongs to the Platform.

---

## Policy

A governed business rule controlling behaviour.

Policies belong to Business Domains.

---

## Property

A real-estate unit located at an Address (ADR-007).

Property does not own Person. Associations use Property Person Relationship.

---

## Property Person Relationship

Time-aware association between Person and Property (ADR-008 / ADR-009).

Roles include owner, resident, tenant (renter), family_member, guest, staff, and related types.

Temporal fields: validFrom, validTo, status. Claims begin as pending_verification and do not grant restricted access until verification activates the relationship (ADR-038). Active verified relationships derive Community Area affiliations for resource access (ADR-037). Not a security boundary and not a Permission.

---

## Residency Verification

A verification case that validates a Property Person Relationship claim before it becomes active (ADR-038).

Methods may include residency certificate, owner invitation, administration approval, and approved documentation. Evidence is stored via Platform Core Files references — never as documents on Person.

---

## Provider

An external technology or service.

Providers remain replaceable.

---

# Q

## Query

A request for information.

Queries never modify state.

---

# R

## Resource

Anything that can be managed or reserved inside a Tenant community context (ADR-031).

Examples include:

Tables

Rooms

Courts

Equipment

Vehicles

Staff

Territorial community resources are owned by a Territory Authority (Official Entity Profile), Community Area–scoped stewardship, or an eligible Entity owner — not by resident Persons as owners of territorial assets.

Resources are not owned by Channels.

Resource access must not assume all Territory residents share all resources. Visibility (public information) and reservation eligibility are distinct and may be scoped by Community Area affiliation (ADR-036).

---

## Role

A collection of Permissions assigned to Users.

Roles simplify authorization.

---

# S

## Security

Protection of Platform Assets.

Security remains centralized.

---

## Session

A temporary authenticated interaction between a User and the Platform.

Sessions remain secure.

---

## State Machine

The official lifecycle governing Business Behaviour.

State Machines belong to Business Domains.

---

# T

## Tenant

The highest isolation boundary inside the Platform.

Every Organization belongs to one Tenant.

Tenants remain isolated.

---

## Territory

A geographical or functional community environment belonging to exactly one Tenant.

Territory is where community life is organized. It is not the same as Tenant Membership or a Channel.

---

## Territory Authority

Product alias for an Official Entity Profile (ADR-016) that governs a Territory: official communication, territorial resource stewardship, verification, and related governance responsibilities (ADR-034).

Territory Authority is not a normal resident Person and is not a Membership type. Permissions remain RBAC Role Assignments.

---

## Tool

A callable capability consumed by AI or Automation.

Tools remain permission-controlled.

---

# U

## User

A human interacting with the Platform.

Users receive Roles.

Roles grant Permissions.

---

## User Experience (UX)

The complete interaction between Users and the Platform.

UX remains human-centered.

---

# V

## Visit

A real-world presence inside a Business.

A Visit may generate:

Reservations

Orders

Payments

Events

Experiences

The Visit represents the operational context.

---

# W

## Workflow

A deterministic sequence of activities.

Workflows orchestrate operations.

Business Behaviour remains inside Domains.

---

# Constitutional Rules

Every future concept should:

have exactly one official definition;

avoid synonyms;

avoid ambiguity;

remain technology independent;

remain reusable.

---

# Governance

New glossary entries require:

Architecture Review

↓

Documentation Update

↓

Approval

↓

Version Increment

Terminology remains governed.

---

# Success Criteria

The Glossary is successful when:

every engineer uses the same vocabulary;

AI interprets concepts consistently;

documentation remains coherent;

Business and Engineering share the same language;

knowledge remains unambiguous.

---

# Conclusion

The Platform Glossary defines the official language of Life Community OS.

Architecture defines concepts.

Engineering implements concepts.

Knowledge preserves concepts.

---

*"Shared architecture begins with a shared language."*