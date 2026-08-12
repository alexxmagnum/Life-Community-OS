# Life Community OS
# IA Decision Preparation

> Document status: **preparation for a future decision**.  
> Does **not** approve an architecture.  
> Does **not** authorize implementation.  
> Sources: `docs/product/CURRENT_INFORMATION_ARCHITECTURE.md`, `docs/product/IA_PROPOSALS.md`.

---

## Contexto

Life Community OS is a multi-tenant SaaS. The live product shell (current IA) uses:

- Bottom nav: **Inicio · Comunidad · Crear (+) · Servicios · Perfil**
- Hamburger as a near-full product directory
- Community Hub with 8 canonical areas rendered as 6 scroll layers plus Explorar tiles into other modules
- Universal chat via **ConversationExperience**
- Module / feature / capability gating via the tenant navigation projector

`IA_PROPOSALS.md` defined three non-approved alternatives:

| Code | Exact name in IA_PROPOSALS.md |
|------|-------------------------------|
| A | **A — Clarify Ownership (minimal IA)** |
| B | **B — Job Tabs (Planes as first-class, hamburger as overflow)** |
| C | **C — Two Surfaces: Belong (Comunidad) + Operate (Servicios+), Life Directory secondary** |

This preparation document summarizes those proposals, evaluates them against product principles, explores hybrids, and offers a **recommendation for review** only.

---

## Propuestas evaluadas

Terminology below matches `IA_PROPOSALS.md`.

---

### A — Clarify Ownership (minimal IA)

**Objetivo principal**  
Reduce confusion by assigning a **single primary owner per job** and demoting duplicate entries—without inventing new primary tabs.

**Filosofía**  
Keep the current bottom nav and route map. Clarify ownership, menu overflow, Community layers, and active-state honesty on top of what already ships.

**Fortalezas**

- Lowest product risk; framed as cleanup.
- Fast path to teaching “Comunidad = people/plaza”.
- Compatible with current Home Premium investment.
- Ownership rules travel well for SaaS tenants.
- Incremental and reversible.

**Debilidades**

- May feel insufficient if users expect Discover/Experiences in the tab bar.
- Community page can remain cognitively long if only nav/copy change.
- Risk of “docs clarity” without removing Explorar tiles in UI.
- Weakest force on Actividades vs Experiencias and Discover ownership.

**Impacto**

- Technical (from proposals): **Low–medium**
- Migration complexity score in proposals: **5 / 5** (easiest)
- Impact on existing architecture score: **5 / 5** (least breakage)

---

### B — Job Tabs (Planes as first-class, hamburger as overflow)

**Objetivo principal**  
Organize the primary shell around **user jobs**, elevating “apuntarse / vida del territorio” so it is not only a Home intent + hamburger category.

**Filosofía**  
Keep five bottom slots, but reinterpret one slot’s job. Distinctive variant **B1** replaces Servicios in the bottom nav with **Planes**; Servicios becomes hamburger + Create “Resolver”. Soft variant **B2** keeps Servicios in the bar and only elevates Planes via Inicio + hamburger (closer to A).

**Fortalezas**

- Strong fit for “quiero apuntarme / qué hay que hacer”.
- Makes Actividades/Experiencias teachable as one **Planes** family.
- Forces hamburger into a true overflow role.
- Still a five-tab mobile pattern.

**Debilidades**

- B1 may feel like a regression if Servicios/Resolver is the daily job for the territory.
- Reinterpreting a bottom slot is a product communication change, not only IA docs.
- Tenants without experiences need a fallback bottom-nav rule.
- Coherence with “historical module bags” is weaker until jobs are agreed as the shell primitive.

**Impacto**

- Technical (from proposals): **Medium**
- Migration complexity score: **3 / 5**
- Impact on existing architecture score: **3 / 5**
- B1 changes bottom-nav labels/jobs; routes can remain.

---

### C — Two Surfaces: Belong (Comunidad) + Operate (Servicios+), Life Directory secondary

**Objetivo principal**  
Split the product into two strong primary surfaces — **Belong** (social/civic) and **Operate** (get something done) — with Inicio as a thin “today” briefing and Life (Planes + Cerca) as a structured secondary system.

**Filosofía**  
Long-term SaaS clarity: every module declares Belong / Operate / Life / Profile. Community is civic/social only; Servicios owns marketplace + reservas under Operate; Experiencias/Actividades and Discover/Near nest under one secondary Life root.

**Fortalezas**

- Strongest SaaS storytelling and preset story (`minimal_community` vs `full_product`).
- Best separation of people/civic vs transactions/ops.
- Plain language for older users (Belong vs Resolver).
- Clear placement rules when new modules appear.
- Strongest resolution of Discover ownership and entry-point sprawl.

**Debilidades**

- Largest conceptual shift vs today’s hamburger sitemap.
- Planes not in bottom nav may under-emphasize experiences unless Inicio doors are strong.
- Requires disciplined entry-point pruning (not feature deletion).
- Higher chance of partial adoption; more IA/design work before engineering.

**Impacto**

- Technical (from proposals): **Medium–high (IA/shell), low–medium (routes)**
- Migration complexity score: **2 / 5** (hardest)
- Impact on existing architecture score: **2 / 5** (most rewiring of shell/hub models)

---

## Comparativa

### Scores from IA_PROPOSALS.md (1–5, higher = better)

| Criterio | A — Clarify Ownership | B — Job Tabs (Planes primary) | C — Belong / Operate |
|----------|----------------------:|------------------------------:|---------------------:|
| Facilidad vecino nuevo | 3 | 4 | 4 |
| Claridad usuarios mayores | 3 | 4 | 5 |
| Escalabilidad SaaS | 4 | 4 | 5 |
| Coherencia Life Community OS | 4 | 3 | 5 |
| Impacto bajo en arquitectura existente | 5 | 3 | 2 |
| Baja complejidad de migración | 5 | 3 | 2 |

### Evaluation against product principles

#### Facilidad usuario nuevo — ¿un vecino entiende dónde entrar?

| Propuesta | Lectura |
|-----------|---------|
| **A** | Improves “one owner per job”, but Planes/Cerca remain secondary; new users may still hunt in hamburger. |
| **B (B1)** | Stronger: Planes is a primary door for joining life; Resolver is less visible. |
| **C** | Strong: two big doors (Comunidad / Servicios) + thin Inicio; Life is learned as overflow. |

#### Usuarios mayores — ¿reduce carga cognitiva?

| Propuesta | Lectura |
|-----------|---------|
| **A** | Fewer false doors; Community can still feel long. |
| **B** | Clear if labels stay plain (“Planes”, “Comunidad”); B1 asks them to relearn where Resolver lives. |
| **C** | Best principle fit: Belong vs Operate is plain; Life directory is secondary by design. |

#### Escalabilidad SaaS — ¿permite múltiples territorios?

| Propuesta | Lectura |
|-----------|---------|
| **A** | Ownership rules port well; bottom-nav contract stays fixed for all tenants. |
| **B** | Job slots can be module-mapped per tenant; needs presets for territories without Planes or without heavy Servicios. |
| **C** | Strongest: Belong / Operate / Life / Profile as placement grammar for any tenant pack. |

#### Arquitectura actual — ¿cuánto rompe? ¿puede evolucionar encima?

| Propuesta | Rompe | Evoluciona encima |
|-----------|-------|-------------------|
| **A** | Little (projector, Explorar, `activeFromPath`, labels) | Yes — natural first layer on current shell |
| **B** | Medium (bottom nav job, active state, create grouping) | Yes — routes/screens kept; shell composition changes |
| **C** | Higher on hub models + Home rules + nav projection | Yes on routes; more IA rewiring before it feels complete |

#### Coherencia producto — Comunidad · Servicios · Experiencias · Perfil

| Área | A | B | C |
|------|---|---|---|
| **Comunidad** | Plaza owner; Explorar portal removed | Same plaza focus | Belong surface (civic/social only) |
| **Servicios** | Remains bottom-nav Resolver owner | B1 demotes to overflow; B2 keeps in bar | Operate owner (includes reservas + marketplace) |
| **Experiencias** | Secondary under Planes overflow | B1 primary tab family with Actividades | Secondary Life / Planes root with Actividades nested |
| **Perfil** | Unchanged slot; honest account leaves | Unchanged slot | Unchanged slot |

---

## Combinaciones posibles

Hybrids are study options for the decision phase—not approved paths.

### Hybrid H1 — A + selected elements of C

**Qué se combinaría**

- Base: **A — Clarify Ownership** (keep bottom nav labels/slots).
- From **C**: Belong vs Operate language as *internal product grammar*; Community Explorar removal; Servicios explicitly owns marketplace + reservas vocabulary; Life directory as a **single hamburger root** (Planes + Cerca) without making Planes a bottom tab.

**Por qué**

- Captures C’s SaaS clarity without B1’s tab swap.
- Lets Panoramica keep Servicios primary while still nesting Experiencias/Actividades/Discover under one secondary story.
- Matches “evolve on existing architecture”.

**Riesgos**

- Planes may remain under-discovered vs B1.
- “Belong/Operate” might stay internal jargon if not reflected in UI copy.
- Partial adoption: ownership rules without UI pruning.

### Hybrid H2 — A + selected elements of B (closer to B2)

**Qué se combinaría**

- Base: **A**.
- From **B**: treat Experiencias + Actividades as one **Planes family** in hamburger/Inicio doors; Create sheet grouped by Comunidad / Planes / Resolver; do **not** replace Servicios in the bottom nav (i.e. prefer B2 spirit, not B1).

**Por qué**

- Fixes Actividades vs Experiencias ambiguity without demoting Resolver.
- Low–medium impact; good bridge if lifestyle content grows later toward B1.

**Riesgos**

- Still no primary tab for Planes; Home doors must carry weight.
- Easy to confuse with “full B” in stakeholder discussion—must specify **not B1**.

### Hybrid H3 — C structure with B1 emphasis for lifestyle tenants

**Qué se combinaría**

- Base: **C** Belong / Operate grammar.
- From **B1**: optional tenant preset where bottom nav swaps Servicios ↔ Planes when experiences are the territory’s primary daily job.

**Por qué**

- SaaS core stays C; Life Panoramica (or golf lifestyle tenants) could opt into Planes-primary via configuration rather than a global hard choice.

**Riesgos**

- Highest design/config complexity.
- Multiple bottom-nav presets increase QA and support cost.
- Premature if presets are not ready.

### Hybrid H4 — Phased path A → H1 → (optional B1 or C presets)

**Qué se combinaría**

- Phase sequencing rather than a single end-state: ship A cleanup first; then H1 Life root + Operate vocabulary; later decide whether any tenant needs B1.

**Por qué**

- Matches progressive evolution and reversible learning.
- Decision can approve a **path**, not only a final tree.

**Riesgos**

- Stakeholders may think “A is the decision” and stop before Life-directory consolidation.
- Requires explicit phase exit criteria in the future decision doc.

---

## Impacto por camino

Estimation bands requested for decision prep:

| Camino | Estimación | Qué implica en la práctica |
|--------|------------|----------------------------|
| **A — Clarify Ownership** | **Bajo** (with some **Medio** edges) | Mostly labels, orden, ownership rules, hamburger trim, Community Explorar gating, `activeFromPath`. Little/no new structures. |
| **B — Job Tabs (esp. B1)** | **Medio** | Reorganización de navegación shell y composición de entradas; pantallas/rutas existentes se reutilizan; no exige nuevas estructuras de dominio. |
| **C — Belong / Operate** | **Medio → Alto (IA)** / **Bajo–Medio (rutas)** | Nuevas reglas de superficies y hub models; rutas pueden quedarse; riesgo de “nueva estructura” si se alinean area ids 1:1 y se redefine Home. |
| **H1 (A+C)** | **Bajo → Medio** | A first, then Life root + vocabulary under Operate. |
| **H2 (A+B2)** | **Bajo → Medio** | Family Planes + Create grouping; tabs unchanged. |
| **H3 (C+B1 preset)** | **Alto** | C plus configurable bottom-nav presets. |
| **H4 (phased)** | **Bajo then Medio** | Impact accrues by phase; depends on how far the path is taken. |

Legend:

- **Bajo:** mostly labels/order/ownership  
- **Medio:** reorganization of existing screens’ entry points / shell  
- **Alto:** new IA structures / presets / multi-shell behaviour  

---

## Recomendación para revisión

**This is not an approval.**

### What appears most aligned (for review)

For Life Community OS as a **SaaS platform** that must grow beyond one territory, while respecting the **current shell and Home Premium investment**, the most aligned review candidate is:

**Hybrid H1 (A + selected elements of C), optionally delivered as path H4 (A first).**

Reasons for review (not ratification):

1. Preserves bottom nav **Inicio · Comunidad · + · Servicios · Perfil** (current contract).
2. Adopts C’s durable grammar (**Belong / Operate / Life / Profile**) without requiring an immediate tab swap.
3. Directly attacks the worst current-state issues: Community Explorar portal, hamburger duplication, ownership sprawl—using A’s low-breakage approach.
4. Leaves B1 available later as a **tenant preset** if product validates that Planes outranks Resolver for specific communities (see H3)—without forcing it globally now.

**Pure C** remains the strongest long-term conceptual fit if product is willing to invest in a larger IA migration up front.  
**Pure B1** remains the strongest lifestyle-engagement fit if Panoramica’s primary daily job is confirmed as Planes rather than Servicios.  
**Pure A** remains the safest start if the only approved step is cleanup.

### Doubts that remain

- Whether Servicios or Planes is the higher-frequency daily job for Life Panoramica.
- Whether Actividades must stay peer-level or may nest under Experiencias/Planes.
- Whether Oficial is a Community core layer or a secondary root only.
- How far Discover should remain a standalone hub vs a shell over `/near`.
- Whether bottom-nav presets (H3) are desirable in v1 of any decision or only later.

### What product must validate before an IA Decision Document

1. Bottom-nav contract: fixed labels vs allowed job reinterpretation (B1).  
2. Primary daily job for the reference tenant: **Servicios/Resolver** vs **Planes**.  
3. Public vocabulary: Reservas vs Espacios vs Recursos; Descubrir vs Cerca de ti.  
4. Actividades relationship to Experiencias.  
5. Whether Belong/Operate is user-facing copy or internal IA only.  
6. Phase appetite: single end-state vs path A → H1 → optional presets.  
7. Non-negotiables: ConversationExperience universality, deep-link compatibility, no feature deletion.

---

## Decisiones pendientes

To be answered in a future `IA_DECISION` document (names/answers not set here):

| # | Pending decision |
|---|------------------|
| 1 | Choose end-state: A, B (B1/B2), C, or hybrid (H1/H2/H3) |
| 2 | Choose delivery: single cut vs phased path (H4) |
| 3 | Lock or reopen bottom-nav slot jobs |
| 4 | Declare primary owners for Comunidad, Servicios, Experiencias/Planes, Cerca, Oficial, Perfil |
| 5 | Decide Actividades nesting vs peer status |
| 6 | Decide Discover’s ongoing role |
| 7 | Decide Community area list vs visible layers (merge Propuestas/Participación; Conversaciones naming vs chat) |
| 8 | Decide booking public name and Servicios ownership of reservas/marketplace |
| 9 | Decide hamburger role: overflow-only vs limited sitemap |
| 10 | Decide whether `activeFromPath` fix is in phase 1 regardless of A/B/C |
| 11 | Decide deep-link/`?tab=` compatibility requirements |
| 12 | Decide SaaS preset rules for bottom nav vs hamburger vs Create-only modules |

---

## Explicit non-outcomes of this document

- No architecture approved  
- No proposal rejected permanently  
- No code, routes, or navigation changes authorized  
- No migration plan committed  

Next intended artifact after product review: **IA Decision Document** (final choices + phases + non-negotiables).

---

*End of IA Decision Preparation.*
