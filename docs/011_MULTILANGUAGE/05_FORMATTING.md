# 05_FORMATTING

Version: 1.0
Status: Draft
Document Type: Language Architecture
Priority: High

---

# Purpose

This document defines the Formatting Architecture of Life Community OS.

Formatting adapts how information is presented according to the user's language and regional preferences.

Formatting belongs to the Language Platform.

Every Business Domain consumes Formatting Services.

---

# Question this document answers

> How does Life Community OS present dates, times, numbers and currencies consistently across different regions?

---

# Scope

This document defines:

- formatting architecture;
- formatting services;
- formatting rules;
- presentation adaptation;
- formatting governance.

It does not define:

- translations;
- localization workflow;
- infrastructure;
- implementation details.

---

# Definition

Formatting is the capability of adapting the visual representation of values without modifying the underlying business data.

Formatting changes presentation.

It never changes stored values.

---

# Objectives

Formatting exists to:

- improve readability;
- support international users;
- centralize formatting logic;
- eliminate duplicated formatting;
- preserve consistency.

---

# Formatting Philosophy

One value.

Many representations.

Business truth remains identical.

Presentation adapts to the user.

---

# Formatting Architecture

Business Data

↓

Formatting Service

↓

Localized Representation

↓

Presentation

Formatting remains centralized.

---

# Formatting Responsibilities

Formatting is responsible for presenting:

Dates

Times

Currencies

Numbers

Percentages

Measurements

Durations

Relative Time

Future Formatting Types

---

# Business Independence

Business Domains never format values.

Business Domains expose raw values.

Formatting belongs to the Language Platform.

---

# Date Formatting

Dates should follow user preferences.

Examples:

2027-08-15

↓

15/08/2027

↓

08/15/2027

↓

15 Aug 2027

The stored value never changes.

---

# Time Formatting

Time presentation may include:

24-hour format

↓

18:45

12-hour format

↓

6:45 PM

Business logic remains identical.

---

# Number Formatting

Numbers may vary by locale.

Examples:

1,234.56

↓

1.234,56

↓

1 234,56

Only presentation changes.

---

# Currency Formatting

Currency presentation may include:

€

$

£

R$

CHF

Currency formatting never changes stored monetary values.

Currency conversion belongs to other platform services.

Formatting only presents values.

---

# Percentage Formatting

Examples:

15%

15,0%

15.00%

Formatting follows regional conventions.

---

# Measurement Formatting

Future versions may support:

Distance

Weight

Temperature

Volume

Area

Formatting remains presentation-only.

---

# Relative Time

Examples:

Now

5 minutes ago

Yesterday

Last week

Relative time improves user experience.

---

# Null Values

Formatting should consistently represent:

Empty

Unknown

Unavailable

Not Applicable

Presentation remains consistent.

---

# Formatting Context

Formatting may use:

Language

Timezone

Currency

Regional Preferences

User Preferences

Tenant Preferences

Formatting remains contextual.

---

# Artificial Intelligence

Formatting never requires Artificial Intelligence.

Formatting remains deterministic.

---

# Automation

Automation consumes Formatting Services.

Notifications should automatically format values correctly.

---

# Security

Formatting never bypasses Security.

Sensitive values follow Security policies before presentation.

---

# Performance

Formatting should be lightweight.

Repeated formatting may reuse cached results when appropriate.

---

# Observability

Formatting should expose:

selected format;

regional configuration;

formatting failures;

fallback execution.

Formatting remains observable.

---

# Product Rules

Formatting belongs to the Language Platform.

Formatting changes presentation only.

Business Domains never format values.

Artificial Intelligence remains optional.

Formatting remains deterministic.

---

# Relationship With Localization

Localization determines the user experience.

Formatting provides localized value presentation.

---

# Relationship With Translations

Translations localize text.

Formatting localizes values.

Responsibilities remain separated.

---

# Relationship With Timezones

Timezones determine local time.

Formatting determines how that time is displayed.

---

# Governance

Future Formatting capabilities should preserve:

- centralized architecture;
- deterministic behaviour;
- consistency;
- architectural simplicity.

Major architectural changes require ADR documentation.

---

# Future Evolution

Future versions may introduce:

adaptive formatting;

user-defined formats;

accessibility formatting;

regional personalization;

intelligent formatting recommendations.

These capabilities should preserve Formatting architecture.

---

# Success Criteria

Formatting is successful when:

presentation remains consistent;

business values remain unchanged;

regional adaptation becomes automatic;

architecture remains stable.

---

# Conclusion

Formatting provides one centralized presentation layer for values inside Life Community OS.

Business truth never changes.

Presentation adapts automatically.

---

*"Store once. Present everywhere."*