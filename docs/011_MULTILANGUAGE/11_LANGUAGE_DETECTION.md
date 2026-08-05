# 11_LANGUAGE_DETECTION

Version: 1.0
Status: Draft
Document Type: Language Architecture
Priority: High

---

# Purpose

This document defines the Language Detection Architecture of Life Community OS.

Language Detection automatically determines the most appropriate language for each user while preserving deterministic behaviour and allowing explicit user control.

Language Detection belongs to the Language Platform.

Every Business Domain consumes Language Detection Services.

---

# Question this document answers

> How does Life Community OS determine which language should be used?

---

# Scope

This document defines:

- language detection;
- language selection;
- fallback strategy;
- language preferences;
- detection governance.

It does not define:

- translations;
- localization;
- AI implementation;
- infrastructure.

---

# Definition

Language Detection determines the language used by the platform before localization occurs.

Detection selects language.

Localization adapts presentation.

---

# Objectives

Language Detection exists to:

- provide a localized experience automatically;
- respect user preferences;
- centralize language selection;
- simplify international usage;
- preserve deterministic behaviour.

---

# Detection Philosophy

Users should not repeatedly choose their language.

The platform should determine it automatically whenever possible.

Users always remain in control.

---

# Detection Architecture

```text
Request

↓

Language Detection

↓

Language Context

↓

Localization

↓

Presentation
```

Language Detection executes before Localization.

---

# Detection Priority

The platform should determine language using the following priority:

User Preference

↓

Tenant Default Language

↓

Browser Language

↓

Platform Default Language

The first available language becomes active.

---

# User Preference

If a user explicitly selects a language, it always has priority.

Example:

User

↓

Spanish

↓

Always use Spanish

Explicit user choice overrides automatic detection.

---

# Tenant Default

Each Tenant may define a default language.

Example:

Restaurant

↓

French

↓

Guests without preferences use French.

---

# Browser Language

If no user preference exists, the browser language may be used.

Example:

Accept-Language

↓

de

↓

German Interface

Browser detection remains automatic.

---

# Platform Default

If no other information is available, the platform default language is used.

Example:

English

Platform behaviour remains predictable.

---

# Supported Languages

Current official languages:

English

Spanish

French

German

Italian

Portuguese

Unsupported languages automatically fall back.

---

# Unsupported Languages

If a requested language is unavailable:

Requested Language

↓

Fallback Language

↓

Platform Default

Fallback behaviour remains deterministic.

---

# Language Persistence

The selected language should remain persistent across user sessions whenever possible.

Users should not repeatedly configure language preferences.

---

# Guest Users

Guest users may use:

Tenant Language

↓

Browser Language

↓

Platform Default

No authentication is required for language detection.

---

# Authenticated Users

Authenticated users always prioritize:

User Preference

↓

Tenant Default

↓

Browser Language

↓

Platform Default

User preference always wins.

---

# Artificial Intelligence

Language Detection never requires Artificial Intelligence.

Detection remains deterministic.

---

# Automation

Automation consumes Language Detection.

Notifications automatically use the recipient language.

---

# Security

Language Detection never bypasses:

Authentication

Authorization

Permissions

Privacy

Tenant Isolation

Security remains independent.

---

# Performance

Language Detection should execute with minimal overhead.

Frequently used preferences may be cached.

---

# Observability

Language Detection should expose:

detected language;

selection source;

fallback execution;

unsupported language;

final language.

Detection remains observable.

---

# Product Rules

Language Detection belongs to the Language Platform.

Detection remains deterministic.

User preference has highest priority.

Artificial Intelligence remains optional.

Business Domains never detect language.

---

# Relationship With Localization

Language Detection selects the language.

Localization applies it.

Responsibilities remain separated.

---

# Relationship With Translations

Translations provide localized content.

Language Detection determines which translation to use.

---

# Relationship With Automation

Automation consumes detected language.

Language Detection remains centralized.

---

# Governance

Future Language Detection capabilities should preserve:

- centralized architecture;
- deterministic behaviour;
- consistency;
- architectural simplicity.

Major architectural changes require ADR documentation.

---

# Future Evolution

Future versions may introduce:

automatic regional detection;

multi-language profiles;

temporary language switching;

visitor preferences;

device synchronization.

These capabilities should preserve Language Detection architecture.

---

# Success Criteria

Language Detection is successful when:

users automatically receive the correct language;

user preferences are respected;

fallback behaviour remains predictable;

architecture remains stable.

---

# Conclusion

Language Detection provides one centralized mechanism for determining the active language across Life Community OS.

Detection remains deterministic.

Users remain in control.

Localization adapts the experience.

---

*"Detect once. Localize everywhere."*