# 01_UBIQUITOUS_LANGUAGE

Version: 1.0
Status: Draft
Document Type: Domain Model
Priority: Critical

---

# Purpose

This document defines the Ubiquitous Language of Life Community OS.

The Ubiquitous Language is the official business vocabulary shared by domain experts, designers, developers, product owners and artificial intelligence systems.

Every concept must have one meaning.

Every meaning must have one name.

---

# Question this document answers

> Which language does the platform use to describe its business?

---

# Scope

This document defines:

- official business terminology;
- naming principles;
- conceptual consistency;
- language governance.

It does not define:

- implementation names;
- database names;
- API contracts;
- programming conventions.

---

# Definition

The Ubiquitous Language is the single official vocabulary of the platform.

Every business conversation should use this language.

Software should adopt it.

Documentation should adopt it.

Artificial Intelligence should adopt it.

There should never be multiple names for the same business concept.

---

# Objectives

The Ubiquitous Language exists to:

- eliminate ambiguity;
- improve communication;
- reduce misunderstandings;
- preserve business knowledge;
- maintain consistency across the platform.

---

# One Concept

One Name

Every business concept has exactly one official name.

Examples:

Person

Territory

Membership

Entity

Place

Resource

Experience

Community Project

Marketplace Listing

Mobility Offer

Conversation

Notification

Media

These names become part of the permanent language of the platform.

---

# One Name

One Meaning

Every official term has exactly one business meaning.

Changing the meaning of an existing term creates ambiguity.

When business meaning changes significantly, a new concept should be introduced instead.

---

# Person

Person represents a real human being.

Person is never:

- User;
- Account;
- Identity;
- Login;
- Session;
- Authentication.

Those concepts belong to technical architecture.

The Domain only understands People.

---

# Business Before Technology

Business terminology always takes precedence over technical terminology.

Examples

Correct

Person

Incorrect

User

Correct

Experience

Incorrect

Event Record

Correct

Entity

Incorrect

Organization Table

Business language should remain independent from implementation.

---

# Naming Principles

Official names should be:

- clear;
- concise;
- stable;
- business-oriented;
- technology-independent.

Names should remain understandable many years into the future.

---

# Synonyms

Synonyms should be avoided.

Examples

Correct

Experience

Incorrect

Activity

Event

Session

Meeting

If different words describe different business realities, they should become different concepts.

---

# Abbreviations

Business concepts should not be abbreviated.

Examples

Correct

Community Project

Incorrect

CP

Correct

Marketplace Listing

Incorrect

Listing (unless context makes it unambiguous)

Documentation should always prioritize clarity.

---

# Language Consistency

Every official document should use exactly the same terminology.

This includes:

- Product Specification;
- Domain Model;
- Architecture;
- APIs;
- Administration;
- AI prompts;
- Documentation;
- Training material.

Consistency improves understanding.

---

# Evolution

The Ubiquitous Language may evolve.

Changes should be exceptional.

Renaming official concepts requires an ADR.

Backward understanding should always be preserved.

---

# Relationships

The Ubiquitous Language defines the official vocabulary for every Domain Model concept, including:

- People
- Memberships
- Territories
- Entities
- Places
- Resources
- Experiences
- Community Projects
- Marketplace Listings
- Mobility Offers
- Conversations
- Notifications
- Media

Future concepts should follow the same naming principles.

---

# Product Rules

Every business concept has one official name.

Every official name has one meaning.

Technical terminology must never replace business terminology.

Synonyms should be avoided.

Language consistency takes precedence over personal preference.

---

# Future Evolution

Future versions may include:

- multilingual business terminology;
- semantic validation;
- AI-assisted terminology governance;
- automated documentation validation.

These additions should preserve the conceptual integrity of the language.

---

# Success Criteria

The Ubiquitous Language is successful when:

- every stakeholder uses the same terminology;
- documentation remains consistent;
- software reflects business language;
- ambiguity disappears;
- future contributors understand the platform without inventing new vocabulary.

---

# Conclusion

The Ubiquitous Language is the common language of Life Community OS.

It ensures that every participant—from business experts to software developers—understands the platform using the same concepts, the same names and the same meanings.

Consistency of language is consistency of thought.

---

*"A shared language creates a shared understanding. A shared understanding creates better software."*