---
name: 07_AGENT_MEMORY_AND_CONTEXT
model: inherit
description: Defines how Life Community OS Agents use knowledge.  Documentation is memory.  Code is implementation.  Architecture is authority.
---

# AGENT_MEMORY_AND_CONTEXT

Version: 1.0
Status: Foundational
Document Type: Agent Governance
Priority: Constitutional

---

# Purpose

This document defines how Agents use knowledge.

Agents do not rely on private memory.

Agents operate from shared, authoritative context.

Knowledge belongs to the Platform.

---

# Core Doctrine

Documentation is memory.

Code is implementation.

Architecture is authority.

Agents may inspect code to understand implementation.

Agents may never treat code as a substitute for Architecture.

Agents may never treat conversation history as a substitute for documentation.

---

# Sources of Truth

Agents must use the following sources in order of authority for their respective concerns.

## 1. ARCHITECTURE_CONSTITUTION.md

Highest architectural authority.

Defines immutable architectural laws and constraints.

No Agent may contradict it.

## 2. ENGINEERING_HANDBOOK.md

Defines engineering standards and practices.

Governs how work is executed.

## 3. PLATFORM_GLOSSARY.md

Defines official vocabulary for Agents and engineering work.

One concept.

One name.

One meaning.

`PLATFORM_GLOSSARY.md` is the Agent OS vocabulary authority.

`docs/000_FOUNDATIONS/02_GLOSSARY.md` belongs to Foundations documentation and must remain aligned with `PLATFORM_GLOSSARY.md`.

When terminology conflicts, Agents follow `PLATFORM_GLOSSARY.md` and escalate the documentation conflict.

Agents must not maintain a third glossary.

## 4. ADR documents

Record significant architectural decisions.

ADRs explain why the Platform is the way it is.

Active ADRs constrain future work until superseded.

## 5. Domain documentation

Defines Business Domains, boundaries, behaviours and domain models.

Domain documentation owns business meaning.

## 6. Implementation

Code, schemas, APIs and runtime systems implement documentation.

Implementation is evidence.

Implementation is not authority.

When implementation and documentation diverge, the divergence is a defect to resolve, not a license to invent.

---

# Extended Context Stack

In addition to the six sources of truth, Agents must use relevant context from:

| Layer | Role |
|-------|------|
| Agent Framework (`_framework/`) | How Agents operate |
| Agent Governance (`_governance/`) | How Agents coordinate |
| Product Specification | What the product does |
| Platform Architecture docs | How the system is structured |
| Capability documentation | What reusable capabilities exist |
| Security / Performance / Automation docs | Cross-cutting strategies |
| Reference Implementations | Canonical validation examples |
| Observability signals | Runtime evidence |

Context is selected by relevance.

Context is never selected by convenience alone.

---

# Memory Rules

## Shared memory only

No Agent owns private Platform knowledge.

If knowledge matters, it must be written into Platform documentation.

## Conversation is temporary

Chat context helps execution.

Chat context is not durable memory.

Durable outcomes must be written to documents, ADRs or approved artefacts.

## Code is not memory

Code shows what currently runs.

Documentation states what must remain true.

Architecture states what is allowed.

## Gaps are explicit

When documentation is missing, Agents must declare the gap.

Agents must not silently fill gaps with undocumented invention.

---

# Context Loading Protocol

Before producing a solution, every Agent must:

1. Identify the task category and ownership.
2. Load Shared Context.
3. Load constitutional and handbook constraints.
4. Load glossary terms relevant to the task.
5. Load relevant ADRs.
6. Load relevant Domain and Capability documentation.
7. Inspect implementation only as needed to verify reality.
8. Record missing or conflicting sources.

Skipping context loading is forbidden for durable work.

---

# Conflict Resolution Between Sources

When sources conflict:

```
Constitution / Foundations
↓
Active ADRs
↓
Domain / Architecture documentation
↓
Engineering standards
↓
Implementation evidence
```

Higher authority wins.

Implementation may prove drift.

Implementation may not redefine authority.

Conflicts between authoritative documents escalate through Documentation Engineer, ADR Manager and Architecture Guardian.

---

# Knowledge Production Rules

When Agents create knowledge, they must place it in the correct authority layer:

- architectural decisions → ADR + Architecture docs;
- domain meaning → Domain documentation;
- product behaviour → Product Specification;
- engineering standards → Engineering Handbook / Engineering Rules;
- operational evidence → Observability and operational docs;
- glossary terms → Platform Glossary.

Knowledge placed in the wrong layer is documentation debt.

---

# Reference Implementations as Context

Reference Implementations validate the Platform.

They provide canonical examples.

They do not override Platform Architecture.

They do not replace Domain documentation.

If a reference implementation reveals a missing Platform capability, the capability must be promoted into Platform documentation.

---

# Agent Memory Anti-Patterns

Forbidden behaviours:

- designing from remembered assumptions when documents exist;
- copying patterns from implementation without checking Architecture;
- treating a previous chat as an ADR;
- encoding business rules only in code;
- creating parallel glossaries;
- using reference implementations as hidden product specifications;
- ignoring ADRs because they are inconvenient.

---

# Relationship to Shared Context

`_framework/01_SHARED_CONTEXT.md` defines what knowledge is shared.

This document defines how Agents must treat memory, authority and evidence.

Shared Context provides the knowledge map.

Memory and Context Governance provides the authority rules.

---

# Success Criteria

Memory and Context governance succeeds when:

- Agents read the same authoritative sources;
- documentation remains the Platform memory;
- code remains implementation evidence;
- Architecture remains the highest technical authority;
- knowledge accumulates without tribal dependency.

---

# Motto

Documentation is memory.

Code is implementation.

Architecture is authority.
