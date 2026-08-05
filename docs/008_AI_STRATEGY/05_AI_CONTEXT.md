# 05_AI_CONTEXT

Version: 1.1
Status: Draft
Document Type: AI Architecture
Priority: Critical

---

# Purpose

This document defines the AI Context Architecture of Life Community OS.

AI Context provides structured information required for intelligent execution while preserving security, privacy and deterministic business behaviour.

Artificial Intelligence should never operate without explicit platform context.

Context belongs to the platform.

Not to the provider.

---

# Question this document answers

> Which information does Artificial Intelligence use to understand a request?

---

# Scope

This document defines:

- AI Context;
- Context sources;
- Context composition;
- Context lifecycle;
- Context security.

It does not define:

- AI Memory;
- prompts;
- providers;
- infrastructure.

---

# Definition

AI Context is the structured information assembled by the platform and supplied to Artificial Intelligence during execution.

Context explains the current situation.

Artificial Intelligence interprets context.

It never creates business truth.

---

# Objectives

AI Context exists to:

- improve execution quality;
- reduce hallucinations;
- improve consistency;
- preserve deterministic behaviour;
- protect sensitive information;
- support future AI capabilities.

---

# Automation-First Context

Context is only assembled when Artificial Intelligence is required.

Execution priority remains:

Business Rules

↓

Automation

↓

Artificial Intelligence

↓

Human Review (when required)

If deterministic execution is sufficient, AI Context should never be built.

---

# AI Context Philosophy

Artificial Intelligence should never infer critical platform information.

The platform explicitly provides all relevant context.

Explicit information always has priority over assumptions.

---

# Context Architecture

```text
Business Domain
        │
Application Service
        │
Automation Engine
        │
AI Service
        │
Context Builder
        │
AI Capability Layer
        │
Provider
```

The Context Builder belongs to the Core Platform.

---

# Context Categories

Context may include:

- Business Context
- User Context
- Tenant Context
- Conversation Context
- Language Context
- Execution Context
- Historical Context
- Security Context

Each category has one responsibility.

---

# Business Context

Examples include:

- Reservation
- Order
- Event
- Member
- Business
- Marketplace Listing

Business Context explains the business situation.

---

# User Context

Examples include:

- User ID
- Role
- Permissions
- Preferences
- Language
- Timezone

User Context explains who is interacting with the platform.

---

# Tenant Context

Examples include:

- Tenant ID
- Brand
- Subscription
- Enabled Features
- Locale
- Configuration

Tenant Context explains where execution occurs.

---

# Conversation Context

Examples include:

- Previous Messages
- Conversation Summary
- Current Topic
- Pending Questions
- Conversation State

Conversation Context supports continuity.

---

# Language Context

Examples include:

- Language
- Locale
- Formatting Rules
- Translation Preferences

Language Context supports multilingual execution.

---

# Execution Context

Examples include:

- Workflow
- Automation
- Execution ID
- Correlation ID
- Timestamp

Execution Context explains why AI execution occurs.

---

# Historical Context

Examples include:

- Previous AI Results
- Relevant Activity
- Previous Decisions
- Previous Recommendations

Historical Context should remain selective.

Only relevant information should be included.

---

# Security Context

Examples include:

- Permissions
- Tenant Isolation
- Access Policies
- Data Visibility

Security Context guarantees AI respects platform rules.

---

# Context Builder

The Context Builder is responsible for:

- collecting information;
- filtering irrelevant data;
- protecting sensitive information;
- assembling structured context;
- minimizing context size;
- optimizing execution.

The Context Builder belongs exclusively to the AI Platform.

---

# Context Independence

Context remains independent from:

- providers;
- models;
- prompts;
- cloud vendors.

Context belongs to Life Community OS.

---

# Data Minimization

Only information required for execution should be included.

More information does not necessarily produce better intelligence.

The platform minimizes unnecessary exposure.

---

# Context Freshness

Context should always reflect the current platform state.

Stale context reduces execution quality.

Only relevant and current information should be included.

---

# Security

Context respects:

- tenant isolation;
- permissions;
- privacy;
- data ownership;
- security policies.

Unauthorized information must never become part of AI Context.

---

# Observability

Every Context construction should record:

- context sources;
- context version;
- execution identifier;
- duration;
- provider;
- result.

Context generation remains observable.

---

# Product Rules

Context is explicit.

Context is structured.

Context is platform-owned.

Business Domains provide information.

The Context Builder assembles Context.

Providers consume Context.

Artificial Intelligence never builds Context.

---

# Relationship With AI Services

AI Services request Context.

The Context Builder assembles Context.

---

# Relationship With AI Capability Layer

Capabilities consume Context.

Capabilities never generate Context.

---

# Relationship With AI Memory

Context exists only during execution.

Memory survives across executions.

Context may consume Memory.

Memory never automatically becomes Context.

---

# Relationship With Automation

Automation determines whether AI Context should be created.

Artificial Intelligence never requests Context independently.

Automation remains the entry point.

---

# Governance

Future Context capabilities should:

- remain structured;
- preserve provider independence;
- respect tenant isolation;
- remain observable;
- preserve the Automation-First philosophy.

Major Context changes require ADR documentation.

---

# Future Evolution

Future versions may introduce:

- adaptive context;
- semantic context assembly;
- context compression;
- predictive context selection;
- intelligent context optimization.

These capabilities should preserve architectural simplicity.

---

# Success Criteria

AI Context is successful when:

- Artificial Intelligence receives only relevant information;
- hallucinations are minimized;
- unnecessary context is eliminated;
- providers remain replaceable;
- deterministic execution remains the default.

---

# Conclusion

AI Context provides structured information required for intelligent execution.

The platform builds Context.

Automation decides whether Context is required.

Artificial Intelligence consumes Context.

Business behaviour always remains deterministic.

---

*"Context belongs to the platform. Artificial Intelligence only consumes it."*