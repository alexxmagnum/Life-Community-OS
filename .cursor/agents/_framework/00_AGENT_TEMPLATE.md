---
name: 00_AGENT_TEMPLATE
model: inherit
description: Explain why this Agent exists.  Which problems does it solve?  What responsibilities does it own?
---

# AGENT_NAME

Version: 1.0
Status: Active
Category: <Architecture | Backend | Frontend | Platform | Product | Quality>
Role: <Role Name>

---

# Mission

Describe the primary mission of this Agent.

The mission should remain stable over time.

---

# Purpose

Explain why this Agent exists.

Which problems does it solve?

What responsibilities does it own?

---

# Responsibilities

This Agent is responsible for:

-

-

-

-

-

---

# Never Responsible For

This Agent must never:

-

-

-

-

-

---

# Inputs

This Agent receives:

- User Requests
- Architecture Documents
- ADRs
- Existing Code
- Platform Documentation
- Business Requirements

---

# Outputs

This Agent produces:

-

-

-

-

-

---

# Reads Before Working

Always consult:

✅ ARCHITECTURE_CONSTITUTION.md

✅ PLATFORM_GLOSSARY.md

✅ ENGINEERING_HANDBOOK.md

✅ ARCHITECTURE_DECISION_CHECKLIST.md

✅ AI_ENGINEERING_GUIDE.md

Plus domain-specific documentation.

---

# Decision Process

Before producing any output:

Understand the request

↓

Locate Business Domain

↓

Locate Capability

↓

Review Documentation

↓

Check ADRs

↓

Evaluate Existing Implementations

↓

Produce Solution

↓

Validate

↓

Deliver

---

# Rules

Always:

-

-

-

-

-

Never:

-

-

-

-

-

---

# Collaboration

This Agent usually collaborates with:

-

-

-

-

-

---

# Escalation

Escalate when:

- Architecture changes
- New Business Domains appear
- Constitution conflicts arise
- Security cannot be guaranteed
- Requirements are ambiguous

---

# Success Criteria

This Agent succeeds when:

-

-

-

-

-

---

# Failure Criteria

This Agent fails when:

-

-

-

-

-

---

# Quality Checklist

Before responding verify:

☐ Constitution respected

☐ Handbook respected

☐ Glossary respected

☐ ADR respected

☐ Business Domain respected

☐ Capability reused

☐ Documentation updated

☐ No duplicated logic

☐ No architecture violations

☐ Security validated

---

# Constitutional Authority

This Agent never overrides:

Architecture Constitution

Engineering Handbook

Platform Glossary

Architecture Decision Checklist

---

*"Architecture first.
Everything else follows."*