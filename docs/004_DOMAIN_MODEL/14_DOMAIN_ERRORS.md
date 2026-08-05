# 14_DOMAIN_ERRORS

Version: 1.0
Status: Draft
Document Type: Domain Model
Priority: Critical

---

# Purpose

This document defines the concept of Domain Errors within Life Community OS.

A Domain Error represents a business operation that cannot be completed because it would violate the rules of the Domain.

Domain Errors express business failure.

They do not represent technical failures.

---

# Question this document answers

> What happens when the business refuses an operation?

---

# Scope

This document defines:

- business failures;
- domain error principles;
- business error ownership;
- relationships with other Domain concepts.

It does not define:

- HTTP status codes;
- exception handling;
- logging;
- infrastructure failures;
- implementation.

---

# Definition

A Domain Error represents a business operation that cannot succeed because it violates the business rules of the Domain.

The error is part of the business language.

It is not a technical exception.

---

# Objectives

Domain Errors exist to:

- protect business integrity;
- express business failure;
- provide consistent business behaviour;
- separate business failures from technical failures.

---

# Domain Error Is Not a Technical Exception

A technical exception represents a software or infrastructure problem.

Examples include:

- database unavailable;
- network timeout;
- file not found;
- authentication provider unavailable.

Those situations belong to Platform Architecture.

A Domain Error represents a valid technical execution that results in an invalid business operation.

---

# Domain Error Is Not Validation

Validation rejects invalid input.

Domain Errors reject invalid business operations.

Example

Invalid email format

↓

Validation

Experience is already full

↓

Domain Error

Both are important.

They represent different responsibilities.

---

# Candidate Domain Errors

Examples include:

Membership Already Active

Membership Expired

Experience Full

Experience Not Published

Resource Unavailable

Marketplace Listing Closed

Conversation Closed

Reservation Not Allowed

Participation Not Eligible

Community Project Archived

These errors express business language.

Not technical language.

---

# Responsibilities

A Domain Error is responsible for:

- expressing business failure;
- protecting Domain integrity;
- preventing invalid business operations.

Nothing more.

---

# Business Language

Domain Errors should use the Ubiquitous Language.

Examples

Correct

Experience Full

Incorrect

CapacityException

Correct

Membership Expired

Incorrect

InvalidMembershipState

Business language always takes precedence over technical terminology.

---

# Relationships

Domain Errors may relate to:

- Aggregates;
- Invariants;
- Domain Policies;
- Specifications;
- Domain Services.

Errors protect the Domain.

They do not modify it.

---

# Product Rules

Every important business failure should have an explicit Domain Error.

Domain Errors should remain technology-independent.

Business language should always be understandable.

Technical implementation should adapt to the Domain Error.

---

# Relationship With Invariants

Violating an Invariant produces a Domain Error.

The operation should not continue.

Business integrity always has priority.

---

# Relationship With Domain Events

Failed business operations should not publish Domain Events.

Only successful business changes become part of business history.

Failure prevents history from changing.

---

# Evolution

New Domain Errors may appear as business behaviour evolves.

Existing Domain Errors should remain stable whenever possible.

Major changes should preserve business language.

---

# Future Evolution

Future versions may introduce:

- richer business error catalogs;
- multilingual business errors;
- AI-assisted business diagnostics;
- policy-aware error explanations.

These additions should preserve business meaning.

---

# Success Criteria

The Domain Error model is successful when:

- business failures are clearly distinguished from technical failures;
- business language remains explicit;
- Domain integrity is preserved;
- implementation naturally reflects business behaviour.

---

# Conclusion

Domain Errors define how Life Community OS expresses business failure.

They ensure that unsuccessful business operations remain understandable, consistent and independent from technical implementation.

The Domain should always explain why the business refused an operation.

---

*"A Domain Error is not a software failure. It is the business protecting itself."*