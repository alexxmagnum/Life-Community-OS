# 03_AGGREGATES

Version: 1.0
Status: Draft
Document Type: Domain Model
Priority: Critical

---

# Purpose

This document defines the Aggregate Model of Life Community OS.

Aggregates represent the primary consistency boundaries of the Domain.

An Aggregate groups business concepts that must remain consistent together.

Every Aggregate protects its own business rules.

---

# Question this document answers

> Which business concepts protect consistency?

---

# Scope

This document defines:

- Aggregate responsibilities;
- consistency boundaries;
- Aggregate ownership;
- Aggregate relationships.

It does not define:

- implementation;
- databases;
- ORM models;
- software classes;
- repositories.

---

# Definition

An Aggregate is a business consistency boundary.

It protects one part of the business from becoming inconsistent.

Everything inside an Aggregate changes together.

Everything outside communicates through well-defined relationships.

---

# Objectives

Aggregates exist to:

- protect business consistency;
- enforce business rules;
- reduce coupling;
- define ownership;
- simplify evolution.

---

# Aggregate Root

Every Aggregate has exactly one Aggregate Root.

The Aggregate Root represents the public business entry point.

External concepts should interact with the Aggregate through its Root.

Internal concepts should remain protected.

---

# Candidate Aggregate Roots

Examples include:

- Person
- Territory
- Membership
- Entity
- Place
- Resource
- Experience
- Community Project
- Marketplace Listing
- Mobility Offer
- Conversation

These are conceptual candidates.

The final Aggregate design should evolve together with the Domain.

---

# Aggregate Responsibilities

Each Aggregate is responsible for:

- protecting its own consistency;
- enforcing its own business rules;
- preserving valid state;
- exposing business behaviour.

Nothing more.

---

# Aggregate Independence

Aggregates should remain independent whenever possible.

No Aggregate should modify another Aggregate directly.

Business collaboration should occur through explicit relationships.

---

# Aggregate Size

Aggregates should remain cohesive.

They should include only concepts that must remain consistent together.

Large Aggregates reduce flexibility.

Very small Aggregates increase complexity.

The platform should seek balance.

---

# Business Consistency

Business consistency belongs inside the Aggregate.

Examples include:

- Membership validity
- Experience capacity
- Resource availability
- Marketplace Listing status

Every Aggregate protects its own rules.

---

# Person Aggregate

Person is expected to be one of the primary Aggregate Roots.

Person represents a real human being.

The Person Aggregate is never responsible for:

- authentication;
- authorization;
- credentials;
- sessions;
- identity providers.

Those concepts belong to technical architecture.

The Domain only models the business identity of a Person.

---

# Aggregate Collaboration

Aggregates collaborate.

They should not become dependent upon each other's internal structures.

Examples:

Person

↓

participates in

↓

Experience

Experience

↓

uses

↓

Place

Place

↓

contains

↓

Resource

Each Aggregate preserves its own integrity.

---

# Relationships

Aggregates may collaborate with:

- Domain Events
- Domain Services
- Policies
- Specifications
- Repositories

Business consistency always remains inside the Aggregate.

---

# Product Rules

Every Aggregate has one responsibility.

Every Aggregate has one Root.

Business consistency belongs to exactly one Aggregate.

Aggregates should avoid circular dependencies.

Conceptual clarity takes precedence over implementation convenience.

---

# Evolution

Aggregates may evolve.

Changes should preserve:

- business meaning;
- consistency;
- language;
- ownership.

Breaking Aggregate boundaries requires architectural justification.

---

# Future Evolution

Future versions may introduce:

- Aggregate refinement;
- Aggregate splitting;
- Aggregate composition;
- shared business policies.

These changes should preserve conceptual integrity.

---

# Success Criteria

The Aggregate Model is successful when:

- every business rule has one owner;
- consistency boundaries remain clear;
- Aggregates collaborate without tight coupling;
- business evolution requires minimal redesign;
- implementation naturally follows business structure.

---

# Conclusion

Aggregates define the consistency boundaries of the Domain.

They protect business rules, preserve conceptual integrity and allow Life Community OS to evolve without coupling unrelated business concepts.

---

*"An Aggregate is not a collection of objects. It is a guardian of business consistency."*