# 08_REPOSITORIES

Version: 1.0
Status: Draft
Document Type: Domain Model
Priority: Critical

---

# Purpose

This document defines the concept of Repositories within Life Community OS.

A Repository represents the Domain mechanism used to obtain and persist Aggregate Roots.

Repositories provide access to business concepts.

They do not define storage technology.

---

# Question this document answers

> How does the Domain access Aggregates?

---

# Scope

This document defines:

- Aggregate access;
- Repository responsibilities;
- Domain persistence abstraction;
- business boundaries.

It does not define:

- databases;
- SQL;
- PostgreSQL;
- Supabase;
- ORM frameworks;
- implementation.

---

# Definition

A Repository represents the business abstraction responsible for retrieving and persisting Aggregate Roots.

The Domain works with Repositories.

The Domain never depends on storage technology.

---

# Objectives

Repositories exist to:

- isolate the Domain from persistence;
- provide consistent Aggregate access;
- preserve business boundaries;
- simplify implementation changes.

---

# Repository Is Not a Database

A Repository is a business abstraction.

A database is one possible implementation.

The Domain should never know whether data comes from:

- PostgreSQL;
- MongoDB;
- memory;
- files;
- APIs;
- future technologies.

Storage belongs to Architecture.

Repositories belong to the Domain.

---

# Repository Is Not an Aggregate

Aggregates represent business consistency.

Repositories provide access to Aggregates.

Repositories never own business rules.

---

# Candidate Repositories

Examples include:

Person Repository

Membership Repository

Territory Repository

Entity Repository

Place Repository

Resource Repository

Experience Repository

Community Project Repository

Marketplace Listing Repository

Mobility Offer Repository

Conversation Repository

Each Repository manages one Aggregate Root.

---

# Responsibilities

A Repository is responsible for:

- retrieving Aggregates;
- persisting Aggregates;
- locating Aggregates;
- hiding persistence details.

Nothing more.

---

# Aggregate Ownership

Repositories work only with Aggregate Roots.

Internal objects remain inside their Aggregate.

Repositories should never expose internal Aggregate structures independently.

---

# Queries

Repositories may support business queries.

Queries should express business language.

Examples

Correct

Find Active Membership

Find Upcoming Experiences

Find Available Resources

Incorrect

Execute SQL

Run Query

Select Rows

Business language always takes precedence.

---

# Consistency

Repositories should preserve Aggregate consistency.

Persistence should never bypass Aggregate rules.

Business consistency belongs to the Aggregate.

Repositories respect it.

---

# Relationships

Repositories collaborate with:

- Aggregates;
- Domain Services;
- Specifications;
- Domain Events.

They remain independent from infrastructure.

---

# Product Rules

Every Aggregate Root has one Repository.

Repositories expose business concepts.

Repositories never expose storage technology.

Repositories should remain technology-independent.

---

# Relationship With Platform Architecture

The Domain defines Repository contracts.

Platform Architecture defines Repository implementations.

The implementation may change.

The Domain contract should remain stable.

---

# Evolution

Repositories may evolve.

New persistence technologies should require implementation changes only.

The Domain should remain unaffected.

---

# Future Evolution

Future versions may support:

- distributed repositories;
- cached repositories;
- event-sourced repositories;
- read models;
- hybrid persistence strategies.

These additions should preserve Domain independence.

---

# Success Criteria

The Repository model is successful when:

- the Domain remains independent from persistence;
- Aggregate consistency is preserved;
- storage technology can change without affecting business logic;
- business language remains explicit.

---

# Conclusion

Repositories provide the Domain with a stable and technology-independent way to access Aggregate Roots.

They protect the business from persistence concerns and ensure that implementation decisions never redefine the Domain.

---

*"Repositories hide persistence so the Domain can focus on the business."*