# 07_CURRENCIES

Version: 1.0
Status: Draft
Document Type: Language Architecture
Priority: High

---

# Purpose

This document defines the Currency Presentation Architecture of Life Community OS.

Currency Services provide consistent monetary presentation across different languages and regions while preserving one canonical business value.

Currency presentation belongs to the Language Platform.

Every Business Domain consumes Currency Services.

---

# Question this document answers

> How does Life Community OS present monetary values across different regions?

---

# Scope

This document defines:

- currency presentation;
- currency formatting;
- currency context;
- monetary presentation;
- currency governance.

It does not define:

- exchange rates;
- currency conversion;
- payment processing;
- financial calculations.

---

# Definition

Currency Services adapt the presentation of monetary values according to regional conventions.

Currency presentation changes appearance.

It never changes stored values.

---

# Objectives

Currency Services exist to:

- improve readability;
- support international users;
- centralize currency presentation;
- preserve consistency;
- eliminate duplicated formatting logic.

---

# Currency Philosophy

One monetary value.

Many visual representations.

Business values remain identical.

Presentation adapts to the user.

---

# Currency Architecture

Business Value

↓

Currency Service

↓

Currency Formatting

↓

Presentation

Currency presentation remains centralized.

---

# Canonical Monetary Value

Business values should always be stored independently from presentation.

Example:

Amount

1234.56

Currency

EUR

Presentation never affects storage.

---

# Currency Presentation

Examples:

€1,234.56

1.234,56 €

1 234,56 €

£1,234.56

$1,234.56

Only presentation changes.

---

# Business Independence

Business Domains never:

format currencies;

select symbols;

manage separators;

position currency symbols.

Business Domains expose raw monetary values.

---

# Currency Context

Currency presentation may use:

Currency Code

↓

User Language

↓

Regional Preferences

↓

Formatting Rules

Presentation remains contextual.

---

# Currency Symbols

Examples include:

€

$

£

CHF

R$

¥

Future currencies remain extensible.

---

# Currency Codes

Currency identity should always use ISO currency codes.

Examples:

EUR

USD

GBP

JPY

CHF

BRL

Stored values remain language-independent.

---

# Currency Formatting

Currency formatting may adapt:

symbol position;

decimal separator;

thousand separator;

decimal precision;

spacing rules.

Business value remains unchanged.

---

# Currency Conversion

Currency conversion is outside the responsibility of the Language Platform.

Conversion belongs to future Financial Services.

The Language Platform only presents monetary values.

---

# Artificial Intelligence

Currency presentation never requires Artificial Intelligence.

Formatting remains deterministic.

---

# Automation

Automation consumes Currency Services.

Notifications automatically present monetary values correctly.

---

# Security

Currency presentation never modifies stored financial information.

Security remains responsible for protecting financial data.

---

# Performance

Currency formatting should remain lightweight.

Frequently used formatting rules may be cached.

---

# Observability

Currency Services should expose:

currency code;

formatting rules;

presentation format;

fallback formatting;

formatting failures.

Currency presentation remains observable.

---

# Product Rules

Currency Services belong to the Language Platform.

Business values remain unchanged.

Currency presentation remains centralized.

Business Domains never perform formatting.

Artificial Intelligence remains optional.

---

# Relationship With Formatting

Formatting formats values.

Currency Services specialize monetary presentation.

Responsibilities remain separated.

---

# Relationship With Localization

Localization selects the regional experience.

Currency Services present monetary values accordingly.

---

# Relationship With Financial Services

Financial Services calculate values.

Currency Services present values.

Responsibilities remain separated.

---

# Governance

Future Currency capabilities should preserve:

- centralized architecture;
- deterministic behaviour;
- consistency;
- architectural simplicity.

Major architectural changes require ADR documentation.

---

# Future Evolution

Future versions may introduce:

multi-currency presentation;

currency preferences;

exchange-rate services;

business currency profiles;

regional financial presentation.

These capabilities should preserve Currency architecture.

---

# Success Criteria

Currency Services are successful when:

monetary values remain consistent;

presentation adapts automatically;

Business Domains remain currency-independent;

architecture remains stable.

---

# Conclusion

Currency Services provide centralized monetary presentation across Life Community OS.

Business values remain identical.

Presentation adapts to the user.

Currency formatting belongs to the Language Platform.

---

*"Store the value. Localize the presentation."*