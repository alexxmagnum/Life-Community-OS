# 13_FACTORIES

Version: 1.0
Status: Draft
Document Type: Domain Model
Priority: Critical

---

# Purpose

This document defines the concept of Factories within Life Community OS.

A Factory represents the Domain mechanism responsible for creating valid business concepts when their creation requires more than simple construction.

Factories create valid business objects.

They do not own business behaviour.

---

# Question this document answers

> How are valid business concepts created?

---

# Scope

This document defines:

- business creation;
- object construction;
- creation responsibilities;
- business consistency during creation.

It does not define:

- constructors;
- dependency injection;
- object containers;
- implementation details.

---

# Definition

A Factory creates Domain concepts that require business knowledge during their creation.

Its purpose is to ensure that every created object already satisfies the rules of the Domain.

Creation should never produce an invalid business concept.

---

# Objectives

Factories exist to:

- centralize complex creation logic;
- guarantee valid initial state;
- reduce duplicated creation logic;
- preserve Domain consistency.

---

# Factory Is Not a Builder

A Builder assembles objects.

A Factory creates valid business concepts.

Factories express business meaning.

Builders express construction processes.

---

# Factory Is Not a Repository

Factories create.

Repositories retrieve and persist.

Their responsibilities never overlap.

---

# Candidate Factories

Examples include:

Membership Factory

Experience Factory

Community Project Factory

Marketplace Listing Factory

Mobility Offer Factory

Conversation Factory

Reservation Factory

These examples represent business creation.

Not implementation patterns.

---

# Responsibilities

A Factory is responsible for:

- creating valid business concepts;
- applying creation rules;
- guaranteeing initial consistency;
- simplifying complex construction.

Nothing more.

---

# Initial Consistency

Factories should guarantee that every created concept starts in a valid business state.

Business consistency begins at creation.

It should never depend on later corrections.

---

# Business Language

Factories should use the Ubiquitous Language.

Examples

Correct

Membership Factory

Incorrect

MembershipCreator

Correct

Experience Factory

Incorrect

ExperienceBuilder

Business terminology always takes precedence.

---

# Relationships

Factories may collaborate with:

- Aggregates;
- Value Objects;
- Domain Policies;
- Specifications.

Factories should not own business state.

---

# Product Rules

Factories create valid business concepts.

Factories should not contain unrelated business behaviour.

Factories should remain focused on creation.

Business consistency should exist from the first moment.

---

# Relationship With Aggregates

Factories commonly create Aggregate Roots.

Once created, the Aggregate becomes responsible for protecting its own consistency.

Creation responsibility ends when the Aggregate exists.

---

# Relationship With Value Objects

Factories may compose Value Objects during creation.

Every Value Object should already satisfy its own business rules.

Factories coordinate.

Value Objects validate themselves.

---

# Evolution

Factories may evolve as business creation becomes more sophisticated.

Creation logic should remain centralized.

Duplicated creation behaviour should be avoided.

---

# Future Evolution

Future versions may introduce:

- configurable factories;
- AI-assisted creation;
- template-based creation;
- cross-context factories.

These additions should preserve Domain consistency.

---

# Success Criteria

The Factory model is successful when:

- every business concept begins in a valid state;
- creation logic remains centralized;
- duplicated creation behaviour disappears;
- implementation naturally reflects business creation.

---

# Conclusion

Factories provide Life Community OS with a consistent and expressive way to create valid business concepts.

They ensure that Domain objects enter the system already respecting the business rules that define them.

---

*"A Factory does not simply create objects. It creates valid business concepts."*