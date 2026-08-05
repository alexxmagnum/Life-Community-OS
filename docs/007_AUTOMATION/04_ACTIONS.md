# 04_ACTIONS

Version: 1.0
Status: Draft
Document Type: Automation Architecture
Priority: Critical

---

# Purpose

This document defines Automation Actions within Life Community OS.

Actions represent the executable capabilities of the Automation Engine.

Actions perform work.

They never decide when work should occur.

---

# Question this document answers

> What can the Automation Engine do?

---

# Scope

This document defines:

- Action philosophy;
- Action responsibilities;
- Action categories;
- Action execution;
- Action lifecycle.

It does not define:

- Triggers;
- Conditions;
- Workflows;
- providers;
- implementation.

---

# Definition

An Action is an executable platform capability.

Actions perform work after a Workflow has been selected and all Conditions have been satisfied.

Actions execute.

They do not decide.

---

# Objectives

Actions exist to:

- perform reusable work;
- encapsulate execution;
- simplify automation;
- isolate providers;
- support scalability;
- encourage reuse.

---

# Action Philosophy

Actions should represent reusable platform capabilities.

Examples include:

- Send Notification
- Send Email
- Send Push Notification
- Generate QR Code
- Create Calendar Event
- Generate PDF
- Execute AI Task
- Publish Webhook
- Update Search Index

Actions describe capabilities.

Not business rules.

---

# Action Categories

Typical Action categories include:

## Communication

- Email
- SMS
- Push Notification
- WhatsApp
- In-App Notification

---

## Documents

- Generate PDF
- Export CSV
- Create Report

---

## Scheduling

- Schedule Reminder
- Schedule Workflow
- Cancel Schedule

---

## Integrations

- Webhook
- REST API
- GraphQL
- Third-party Providers

---

## Artificial Intelligence

- Summarize
- Translate
- Classify
- Recommend
- Generate Content

---

## Platform

- Update Search Index
- Refresh Cache
- Generate Audit Entry
- Create Activity Log

---

## Internal

- Execute Workflow
- Invoke Application Service
- Publish Domain Event
- Queue Background Job

---

# Action Independence

Actions should never depend directly upon:

- providers;
- infrastructure;
- cloud vendors;
- messaging services;
- AI vendors.

Actions expose platform capabilities.

Providers execute them.

---

# Single Responsibility

Every Action should perform one responsibility.

Large behaviours should be composed through Workflows.

Actions remain simple.

---

# Reusability

An Action should be reusable across:

- Hospitality;
- Community;
- Marketplace;
- Mobility;
- Administration;
- Future Modules.

Actions belong to the platform.

Not individual products.

---

# Idempotency

Whenever business requirements allow, Actions should support idempotent execution.

Repeated execution should not create unintended side effects.

---

# Retry Behaviour

Retry behaviour belongs to the Automation Engine.

Actions should expose whether retry is safe.

Actions do not control retry policy.

---

# Execution Context

Every Action executes inside an explicit context.

Context may include:

- Tenant;
- User;
- Workflow;
- Trigger;
- Permissions;
- Correlation ID.

Context should remain explicit.

---

# Failure Behaviour

Actions should communicate:

- success;
- failure;
- timeout;
- cancellation;
- retry recommendation.

Failures should remain observable.

---

# Security

Every Action executes with explicit authority.

Actions should respect:

- permissions;
- tenant isolation;
- security policies;
- audit requirements.

Actions must never bypass platform security.

---

# AI Actions

Artificial Intelligence should be exposed through Actions.

Examples include:

- Summarize Conversation
- Translate Content
- Detect Language
- Moderate Content
- Recommend Activities
- Generate Description

AI remains an Action.

Not a business rule.

---

# Provider Abstraction

An Action should remain identical regardless of execution provider.

Example:

Send Email

↓

Internal Provider

or

External Provider

or

Cloud Provider

The Action never changes.

---

# Product Rules

Actions execute work.

Actions never decide execution.

Actions remain reusable.

Actions remain provider-independent.

Actions remain observable.

Actions remain secure.

---

# Relationship With Triggers

Triggers start automation.

Actions execute automation.

---

# Relationship With Workflows

Workflows coordinate Actions.

Actions never coordinate themselves.

---

# Relationship With Automation Engine

The Automation Engine executes Actions.

Actions never execute independently.

---

# Relationship With Providers

Providers implement execution.

Actions define capabilities.

---

# Governance

Every new Action should:

- provide one responsibility;
- remain reusable;
- remain provider-independent;
- remain observable;
- support tenant isolation.

Duplicate Actions should be avoided.

---

# Future Evolution

Future versions may introduce:

- composite Actions;
- AI-generated Actions;
- autonomous Actions;
- adaptive Actions;
- marketplace Actions.

These additions should preserve Action simplicity.

---

# Success Criteria

Actions are successful when:

- they remain reusable;
- they remain simple;
- providers remain replaceable;
- workflows remain understandable;
- execution remains observable.

---

# Conclusion

Actions provide the executable capabilities of the Automation Engine.

They perform work.

They remain reusable.

They isolate execution technologies from business behaviour.

---

*"Actions execute capabilities. Workflows decide when those capabilities are used."*