# 04_PRODUCT_LAWS

**Version:** 1.0
**Status:** Draft
**Document Type:** Constitution
**Priority:** Critical

---

# Purpose

This document defines the immutable operational laws that govern Life Community OS.

Unlike principles, which guide design decisions, product laws define mandatory platform behaviour.

Every capability, service and workflow must comply with these laws.

If a future feature cannot respect a Product Law, the feature must be redesigned.

---

# Question this document answers

> **Which operational behaviours are mandatory across the entire platform?**

---

# Scope

This document defines platform-wide behavioural laws.

It does not define:

* implementation
* technology
* APIs
* database models

---

# LAW 1 — Everything Belongs Somewhere

Nothing exists without context.

Every object belongs to another object or to a Territory.

Examples:

* Conversation
* Experience
* Resource
* Marketplace Listing
* Comment
* Place

Orphan objects are not allowed.

---

# LAW 2 — Every Conversation Has Context

Conversations never exist independently.

Every conversation belongs to:

* an Experience
* an Entity
* a Resource
* a Marketplace Listing
* a Project
* another supported Context

Global conversations are not part of the platform architecture.

---

# LAW 3 — Everything Has Ownership

Every object has an owner.

Ownership may belong to:

* Person
* Entity
* Territory
* Platform

Ownership is always explicit.

---

# LAW 4 — Everything Has a Lifecycle

Every object progresses through defined states.

Objects never remain permanently active.

Typical lifecycle:

Draft

↓

Published

↓

Active

↓

Archived

↓

Deleted (optional)

---

# LAW 5 — Every Capability Is Optional

Capabilities are independent.

Every Territory decides which capabilities are enabled.

The platform never assumes every capability exists.

---

# LAW 6 — Every Entity Is Autonomous

Entities manage themselves.

No entity controls another entity unless explicitly configured.

Each Entity owns:

* information
* resources
* experiences
* administrators
* settings

---

# LAW 7 — Every Territory Is Independent

Territories are isolated.

Configuration.

Permissions.

Content.

Capabilities.

Identity.

Everything belongs to the Territory.

---

# LAW 8 — Every Person Has One Identity

A Person has one identity.

Relationships change.

Permissions change.

Membership changes.

Identity remains unique.

---

# LAW 9 — Membership Is Separate From Identity

Identity answers:

Who are you?

Membership answers:

How do you belong?

These concepts must never be merged.

---

# LAW 10 — Permissions Never Define Identity

Permissions describe actions.

Identity describes people.

Membership describes belonging.

These responsibilities remain separate.

---

# LAW 11 — Information Should Never Be Duplicated

Every piece of information has one authoritative source.

Derived information may exist.

Editable duplicates may not.

---

# LAW 12 — The Platform Organizes Information

The platform stores structured information.

Messages never replace structured data.

Examples:

Marketplace Listing

↓

Conversation

NOT

Conversation

↓

Marketplace Listing

---

# LAW 13 — Every Experience Follows the Same Engine

Regardless of type:

* Golf Tournament
* Yoga Class
* Charity Event
* Community Meeting
* Football Training

Every Experience follows the same architectural model.

Only configuration changes.

---

# LAW 14 — Every Resource Uses the Same Reservation Logic

Whether reserving:

* Paddle Court
* Meeting Room
* Barbecue Area
* Sports Hall

The reservation engine remains identical.

Only configuration differs.

---

# LAW 15 — Every Capability Produces Events

Platform behaviour is event-driven.

Capabilities emit events.

Other capabilities may react.

Direct coupling should be minimized.

---

# LAW 16 — Automation Never Owns Business Logic

Business rules belong to the platform.

Automation executes predefined behaviour.

It never defines product logic.

---

# LAW 17 — Artificial Intelligence Never Owns Business Logic

Artificial Intelligence may assist.

It never determines platform rules.

Business logic remains deterministic.

---

# LAW 18 — Every Decision Must Respect the Foundations

The Constitution inherits from the Foundations.

Implementation inherits from the Constitution.

No lower layer may contradict a higher layer.

---

# LAW 19 — Every Capability Must Scale

Every capability must function for:

* 50 users

and

* 50,000 users

without changing the conceptual model.

---

# LAW 20 — Community Life Is Continuous

The platform is designed around continuous participation.

Not isolated interactions.

Every capability should reinforce long-term engagement rather than one-time usage.

---

# Success Criteria

The Product Laws are successful when:

* every capability behaves consistently;
* every Territory follows the same architectural rules;
* platform complexity remains controlled;
* future development becomes predictable;
* new features integrate without breaking existing behaviour.

---

# Conclusion

Product Laws define the operational behaviour of Life Community OS.

They transform philosophy into enforceable platform behaviour.

Every future capability must respect these laws before becoming part of the ecosystem.
