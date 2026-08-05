# 07_SOFT_DELETE

Version: 1.0
Status: Draft
Document Type: Data Architecture
Priority: High

---

# Purpose

This document defines the Soft Delete Architecture of Life Community OS.

Soft Delete preserves Business Data by logically removing Business Entities while maintaining historical integrity, auditability and recoverability.

Soft Delete belongs to the Data Model.

Business Entities remain recoverable unless permanent deletion is explicitly required.

---

# Question this document answers

> How does Life Community OS remove Business Data without losing Business History?

---

# Scope

This document defines:

- soft delete architecture;
- logical deletion;
- entity lifecycle;
- recovery;
- governance.

It does not define:

- database implementation;
- physical deletion;
- storage engines;
- infrastructure.

---

# Definition

Soft Delete marks a Business Entity as no longer active without physically removing it.

The entity remains part of Business History.

Business identity remains preserved.

---

# Objectives

Soft Delete exists to:

- preserve Business History;
- support recovery;
- improve auditability;
- prevent accidental data loss;
- simplify compliance;
- support long-term integrity.

---

# Soft Delete Philosophy

Business Data should not disappear.

Business History should remain complete.

Deletion is usually a business state.

Not physical destruction.

---

# Soft Delete Architecture

Business Entity

↓

Logical Deletion

↓

Archived State

↓

Recoverable Entity

↓

Permanent Deletion (optional)

Deletion remains controlled.

---

# Responsibilities

Soft Delete is responsible for:

Logical Removal

Recovery

Lifecycle Continuity

Historical Preservation

Relationship Protection

Future Recovery Capabilities

Business Domains remain independent.

---

# Entity Lifecycle

Typical lifecycle:

Created

↓

Active

↓

Updated

↓

Archived

↓

Soft Deleted

↓

Recovered (optional)

↓

Hard Deleted (exceptional)

Identity remains permanent.

---

# Soft Deleted State

A Soft Deleted entity:

keeps its Identifier;

keeps its Audit History;

keeps its Relationships where appropriate;

keeps historical integrity;

remains recoverable.

Business identity never disappears.

---

# Recovery

Soft Deleted entities may be restored.

Recovery preserves:

Identifier

Ownership

Relationships

Audit History

Business Identity

Recovery remains deterministic.

---

# Hard Delete

Permanent deletion should remain exceptional.

Examples include:

Legal Requirements

Privacy Regulations

Explicit Administrative Operations

Data Retention Policies

Hard Delete requires explicit authorization.

---

# Relationships

Soft Delete should preserve relationship integrity whenever possible.

Historical relationships remain valid.

Business consistency has priority.

---

# Ownership

Ownership remains preserved after Soft Delete.

Platform entities remain Platform-owned.

Tenant entities remain Tenant-owned.

Ownership never changes.

---

# Business Independence

Business Domains never implement deletion strategies.

The Data Model defines entity lifecycle.

Persistence implements deletion.

---

# Artificial Intelligence

Artificial Intelligence respects Soft Delete.

AI never exposes logically deleted entities unless explicitly authorized.

---

# Automation

Automation respects Soft Delete rules.

Automation never bypasses entity lifecycle.

---

# Security

Security protects Soft Deleted entities.

Deleted entities remain subject to:

Authentication

Authorization

Permissions

Tenant Isolation

Security remains mandatory.

---

# Performance

Soft Delete should remain efficient.

Optimization may improve retrieval without changing lifecycle behaviour.

---

# Observability

Soft Delete should expose:

Deletion Timestamp

Deleted By

Recovery Events

Lifecycle State

Ownership

Audit History

Soft Delete remains observable.

---

# Product Rules

Soft Delete belongs to the Data Model.

Business History remains preserved.

Recovery remains possible.

Hard Delete remains exceptional.

Architecture remains stable.

---

# Relationship With Auditing

Auditing records deletion events.

Soft Delete changes entity lifecycle.

Responsibilities remain separated.

---

# Relationship With Versioning

Soft Delete preserves historical versions.

Version history remains intact.

---

# Relationship With Security

Security protects deleted entities.

Deletion never bypasses Security.

---

# Governance

Future Soft Delete capabilities should preserve:

- business-first architecture;
- deterministic behaviour;
- historical integrity;
- explicit ownership;
- recoverability.

Major architectural changes require ADR documentation.

---

# Future Evolution

Future versions may introduce:

Recovery Windows;

Retention Policies;

Scheduled Purging;

Legal Hold;

Entity Restoration Workflows;

Lifecycle Analytics.

These capabilities should preserve Soft Delete architecture.

---

# Success Criteria

Soft Delete is successful when:

Business History remains complete;

entities remain recoverable;

Business Domains remain deletion-independent;

future compliance requires no redesign;

architecture remains stable.

---

# Conclusion

Soft Delete preserves Business Data throughout its lifecycle while protecting Business History and supporting future recovery.

Business data evolves.

History remains.

Architecture remains stable.

---

*"Delete logically. Preserve history."*