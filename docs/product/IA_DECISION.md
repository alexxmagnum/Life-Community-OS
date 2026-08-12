# Life Community OS
# Information Architecture Decision

> Document status: **product architecture decision record**.  
> Does **not** authorize code execution, route creation, screen migration, or feature deletion.  
> Sources:  
> - `docs/product/CURRENT_INFORMATION_ARCHITECTURE.md`  
> - `docs/product/IA_PROPOSALS.md`  
> - `docs/product/IA_DECISION_PREPARATION.md`

---

## 1. Contexto

### Estado actual

As documented in `CURRENT_INFORMATION_ARCHITECTURE.md`:

- Bottom navigation: **Inicio · Comunidad · Crear (+) · Servicios · Perfil**
- Hamburger menu acts as a near-complete product sitemap (Comunidad areas, Actividades, Experiencias, Reservas, Servicios, Cerca de ti, Oficial, Mi perfil)
- Community Hub defines **8** canonical areas but renders **6** scroll layers plus an **Explorar** portal into other modules
- Experiences, Discover, Near, Official, and Activities are reachable from multiple surfaces; many secondary routes still highlight **Inicio** in the bottom nav
- Chat is already unified via **ConversationExperience** across context screens
- Life Panoramica is the current reference tenant of a multi-tenant SaaS platform

### Problemas encontrados

From the current IA inventory and proposals (summary):

- Multiple entry points for the same job (local life, experiences, services, spaces)
- Community model ≠ Community UI; Explorar turns Comunidad into a second global menu
- Hamburger duplicates primary tabs and expands into a full directory
- Actividades vs Experiencias without a single product story
- Propuestas vs Participación overlap; “Conversaciones” naming collides with chat
- Reservas / Recursos / Espacios vocabulary triangle
- Discover / Cerca without clear primary-nav ownership
- Hollow or misleading destinations (`/housing`; several profile leaves → `/me`)
- Colliding label “Servicios” (hub vs near category)

### Objetivo de la reorganización

Order the experience so that:

1. Each capability has a **single primary owner**
2. Bottom nav and hamburger stop competing as two full maps
3. Comunidad, Servicios, Experiencias/Planes, Cerca, and Perfil are coherent for neighbours and portable across tenants
4. Change happens **incrementally** on the existing architecture (routes, ConversationExperience, module gating preserved)

---

## 2. Principios que mandan

The selected direction must respect:

| Principle | Implication |
|-----------|-------------|
| Life Community OS as **SaaS multi-tenant** | IA rules must work beyond Life Panoramica; tenant packs configure modules, not reinvent navigation grammar |
| **Evolution** on existing architecture | Prefer ownership, labels, projector content, and hub composition over new route trees |
| **Reuse** of current components and screens | No requirement to rebuild Home, Community, Services, or chat shells |
| **ConversationExperience** as universal chat | Conversation is a capability, never a primary bottom-nav section |
| Separation of **capabilities** vs **surfaces** | Surfaces own entry; capabilities (chat, create, notify) attach contextually |
| **Do not duplicate** functionalities | One primary door per job; secondary links allowed only as shortcuts that do not redefine ownership |
| **No feature deletion** in this decision | Reorganization of entry points and ownership, not removal of product capabilities |

---

## 3. Alternativas consideradas

Exact names from `IA_PROPOSALS.md` / `IA_DECISION_PREPARATION.md`.

### Propuesta A — Clarify Ownership (minimal IA)

- **Qué resuelve:** Single primary owner per job; trims hamburger duplicates; reduces Community Explorar portal; improves active-state honesty; lowest breakage.
- **Qué problemas tiene:** May under-serve Discover/Experiences visibility; Community can remain dense; weak on Actividades/Experiencias nesting and Discover ownership.
- **Impacto:** **Bajo** (edges toward Medio): labels, order, ownership, projector, Explorar gating, `activeFromPath`.

### Propuesta B — Job Tabs (Planes as first-class, hamburger as overflow)

- **Qué resuelve:** Makes Planes a first-class job; teaches Experiencias+Actividades as one family; forces hamburger overflow (especially **B1**).
- **Qué problemas tiene:** **B1** demotes Servicios from the tab bar—may regress “Resolver” for territories where that is the daily job; needs tenant fallbacks; larger communication change.
- **Impacto:** **Medio** (shell/nav composition; routes reusable).

### Propuesta C — Two Surfaces: Belong (Comunidad) + Operate (Servicios+), Life Directory secondary

- **Qué resuelve:** Strongest SaaS grammar (Belong / Operate / Life / Profile); clearest older-user story; best long-term module placement rules; strongest Discover ownership.
- **Qué problemas tiene:** Largest conceptual shift; Planes not in bottom nav; higher migration complexity; risk of partial adoption.
- **Impacto:** **Medio → Alto (IA/shell)**; **Bajo–Medio (routes)** if paths stay.

### Híbridos relevantes (from IA_DECISION_PREPARATION.md)

| Hybrid | Summary | Impacto |
|--------|---------|---------|
| **H1 — A + selected elements of C** | Keep current bottom-nav slots; adopt Belong/Operate/Life/Profile as grammar; Life directory as single secondary root; Community Explorar removed as global portal | **Bajo → Medio** |
| **H2 — A + selected elements of B (B2 spirit)** | Keep Servicios in bar; Planes family in hamburger/Inicio; Create grouped by jobs | **Bajo → Medio** |
| **H3 — C + B1 preset** | C grammar globally; optional tenant preset swapping Servicios ↔ Planes | **Alto** |
| **H4 — Phased path A → H1 → (optional B1/C presets)** | Sequence rather than single cut | **Bajo then Medio** (accrues by phase) |

---

## 4. Decisión de arquitectura

### Dirección seleccionada

**Selected direction: Hybrid H1 (A — Clarify Ownership + selected elements of C), delivered as path H4.**

Interpretation:

1. **Phase 1 (near-term):** Execute the cleanup and ownership rules of **A**.
2. **Phase 2:** Adopt **C**’s surface grammar (**Belong / Operate / Life / Profile**) and the single secondary **Life** root (Planes + Cerca), without changing bottom-nav slot labels.
3. **Later (optional):** Revisit **B1** / **H3** only if product validates that Planes must be a bottom-nav job for specific tenants.

This matches the “Recomendación para revisión” in `IA_DECISION_PREPARATION.md` and is hereby recorded as the product IA direction—not as an engineering ticket.

**Not selected as global default:** pure B1 (Planes replacing Servicios in the tab bar), pure C as a single big-bang cut, or H3 presets in phase 1.

---

### Navegación principal acordada

Bottom navigation remains:

```
Inicio | Comunidad | + (Crear) | Servicios | Perfil
```

Hamburger role: **overflow / secondary + account** — not a second full copy of the bottom nav.

Create (+) remains an **action**, not a section.

---

### Responsabilidad de cada área

#### Inicio

**Responsabilidad:** Briefing of “qué está pasando hoy” in the territory.  
**Owns:** Today moments summary; light teasers into Comunidad / Planes / Cerca / Resolver.  
**Does not own:** Full product sitemap, full local directory, full services catalog, full community plaza.

#### Comunidad (Belong)

**Responsabilidad:** Social and civic life among neighbours.  
**Owns (primary):** Plaza / actualidad, groups, decide (proposals), official **entry** into `/official/*`.  
**Does not own:** Global Explorar portal into Servicios, Experiencias, or booking as peer “apps inside Comunidad”.  
**Capability note:** Feed discussions are content inside Plaza—not a separate “Conversaciones app”.

#### Servicios (Operate)

**Responsabilidad:** “Necesito resolver algo.”  
**Owns (primary):** Service categories (profesionales, trabajo, ayuda, movilidad, recomendaciones), marketplace / compra-venta, shared spaces booking entry (`/resources`) and the operate-side vocabulary for reservas.  
**Does not own:** Social plaza, experience discovery as a lifestyle hub, local restaurant browsing as its primary job.

#### Experiencias / Explorar / Cerca (Life — secondary)

**Responsabilidad:** Territory life beyond plaza and resolver—**Planes** and **Cerca** under one secondary Life directory.  
**Owns (primary):**

- **Planes:** `/experiences` as primary moments surface; `/activities/*` as interest hubs related to Planes (**nesting detail:** see pendientes)
- **Cerca:** local directory story (`/discover` and/or `/near/*` under one public ownership rule — **PENDIENTE DE DECISIÓN** on exact public name and whether Discover remains a hub shell)

**Does not own:** Bottom-nav slot in phase 1–2; Operate transactions; Community plaza.

#### Perfil

**Responsabilidad:** “Yo en la comunidad.”  
**Owns (primary):** Identity / hogar presentation, personal shortcuts (calendar, mis reservas, guardados, notificaciones, ajustes).  
**Does not own:** Duplicate fake sub-destinations that all resolve to `/me` without distinct screens (those leaves must be honest or deferred).

#### + Crear

**Responsabilidad:** Contribution action sheet.  
**Owns:** Grouping actions by destination job (Comunidad / Planes / Resolver)—without becoming a navigation map.  
**Does not own:** Any durable information architecture section.

#### Conversation (cross-cutting capability)

**Responsabilidad:** Contextual messaging via ConversationExperience.  
**Owns:** No primary nav section.  
**Attaches to:** group, neighbour, marketplace, place, work, experience, official contexts.

---

### Ownership de módulos (primary owner)

| Capability / module family | Primary surface owner | Notes |
|----------------------------|-----------------------|-------|
| Community feed / publications | Comunidad | |
| Groups | Comunidad | |
| Proposals / decide | Comunidad | Merge vs keep Participación: **PENDIENTE DE DECISIÓN** (rule: one decide surface) |
| Official entities / channels entry | Comunidad → `/official/*` | |
| Services categories | Servicios | |
| Marketplace | Servicios | Public label Mercado vs Compra y venta: **PENDIENTE DE DECISIÓN** |
| Resources discovery + reserve flow | Servicios (Operate) | Public booking name: **PENDIENTE DE DECISIÓN** |
| My reservations list | Perfil (personal) + Servicios (operate entry) | List is personal; booking catalog is Operate |
| Experiences list/create/join | Life / Planes | |
| Activity hubs | Life / Planes family | Peer vs nested: **PENDIENTE DE DECISIÓN** |
| Discover + Near | Life / Cerca | Exact structure: **PENDIENTE DE DECISIÓN** |
| Calendar / saved | Perfil (+ Planes content) | |
| Report incident | Create → Resolver adjacency; not a primary tab | |
| Notifications | Header / Perfil shortcuts | |
| Chat | Capability (ConversationExperience) | Never a bottom-nav item |
| Housing tile `/housing` | — | Dead link today; **not** a Community Explorar peer. Module ownership: **D13 — PENDIENTE DE DECISIÓN** (see `docs/product/D13_HOUSING_LIVING.md`) |

---

## 5. Reglas de ownership

### Universal rules

1. **One primary owner per capability.** Secondary links may exist (Home door, Create action, Profile shortcut) but must not redefine ownership.
2. **Capabilities ≠ sections.** Chat, create, notify, search attach to contexts; they are not peer bottom-nav destinations.
3. **Surfaces declare jobs.** Inicio = today briefing; Comunidad = Belong; Servicios = Operate; Life = Planes + Cerca; Perfil = me.
4. **Hamburger does not duplicate bottom-nav roots** as parallel “apps”. It completes what the bar cannot hold (Life directory, account, optional Oficial shortcut).
5. **Community Explorar must not be a global module portal.** Cross-module jumps belong to their owners (or a single Life root), not inside Comunidad.
6. **Naming collisions are ownership bugs.** Example: near-category “Servicios” must not share undifferentiated public naming with Operate Servicios (**PENDIENTE DE DECISIÓN** on replacement label).
7. **Tenant packs enable modules; they do not invent a second IA grammar.** Presets may hide modules; they should not create a third competing map.
8. **ConversationExperience remains the only chat composition model** for member contexts listed in the current IA.

### Explicit capability rules

| Capability | Rule |
|------------|------|
| **Conversación** | Not a section. Transversal capability via ConversationExperience. Community “Conversaciones” as an area/tab metaphor must be renamed or folded into Plaza content so it never implies a global inbox. Exact rename: **PENDIENTE DE DECISIÓN**. |
| **Reservas** | Single operate-side owner: **Servicios**. Personal list may live under Perfil. Duplicate hamburger leaves to the same `/resources` are not allowed. Public vocabulary: **PENDIENTE DE DECISIÓN**. |
| **Experiencias** | Clear owner: **Life / Planes** (secondary in phases 1–2). Not owned by Comunidad Explorar. |
| **Actividades** | Belong to the Planes family. Whether nested under Experiencias or labeled as interest hubs: **PENDIENTE DE DECISIÓN**. |
| **Discover / Cerca** | Single Life / Cerca ownership. Must not remain four parallel “cerca” stories without a primary. |
| **Oficial** | Entered from Comunidad (Belong); detail/chat on `/official/*`. Whether also a hamburger shortcut: allowed; must not create a second competing “official app” inside Explorar. |
| **Crear** | Action sheet only; sections mirror owners (Comunidad / Planes / Resolver). |

---

## 6. Impacto técnico

No implementation in this document. Expected future change bands if/when engineering is authorized:

### Bajo — labels / orden / ownership wiring

- Navigation projector leaf set (hamburger)
- Community Explorar tile removal or gating
- `activeFromPath` honesty for secondary routes
- Copy/labels for ownership clarity
- Honest profile leaves; gate dead `/housing` entry

### Medio — reorganización de pantallas existentes (entry composition)

- Home doors limited to briefing + few owned links
- Community layers aligned to Belong ownership (fewer false areas)
- Create sheet grouped by Comunidad / Planes / Resolver
- Life directory information architecture in hamburger (Planes + Cerca)
- Discover/Near presented under one Cerca story (without mandatory route rename)

### Alto — migraciones / nuevas estructuras

- **Not required** by the selected H1/H4 direction for phase 1–2
- Reserved for optional later work: B1 tab swap, H3 tenant bottom-nav presets, hard route renames, full Community area-id schema migration

---

## 7. Migración futura

Principles only (no schedule, no tickets):

1. **Incremental evolution** — prefer H4 sequencing: A cleanup → H1 Life/Operate grammar → optional presets later.
2. **Compatibility** — keep existing routes working; deep links (`/community?tab=…`, hamburger hrefs) should degrade gracefully via aliases where areas collapse.
3. **Do not break tenants** — module flags continue to show/hide capabilities; IA grammar stays stable even when modules are off.
4. **No feature deletion** as part of IA alignment — only entry-point and ownership alignment.
5. **ConversationExperience and permissions/capabilities remain untouched** as platform contracts.
6. **Measure clarity** before optional B1 — do not swap Servicios ↔ Planes globally without product validation.
7. **Document before code** — any engineering phase should reference this decision and list which pendientes were resolved.

---

## 8. Pendientes de decisión (humanas)

Marked explicitly — **not assumed**:

| ID | Topic | Status |
|----|-------|--------|
| D1 | Public booking vocabulary: Reservas vs Espacios vs Recursos | **PENDIENTE DE DECISIÓN** |
| D2 | Public local-directory name: Descubrir vs Cerca de ti (or other) | **PENDIENTE DE DECISIÓN** |
| D3 | Discover remains hub route vs shell over `/near` vs Home-only | **PENDIENTE DE DECISIÓN** |
| D4 | Actividades nested under Experiencias vs peer hubs under Planes | **PENDIENTE DE DECISIÓN** |
| D5 | Merge Propuestas + Participación into one area id timing | **PENDIENTE DE DECISIÓN** |
| D6 | Rename/fold Community “Conversaciones” vs chat vocabulary | **PENDIENTE DE DECISIÓN** |
| D7 | Marketplace public label: Mercado vs Compra y venta | **PENDIENTE DE DECISIÓN** |
| D8 | Near-category label collision with “Servicios” | **PENDIENTE DE DECISIÓN** |
| D9 | Whether Belong/Operate/Life are user-facing words or internal IA only | **PENDIENTE DE DECISIÓN** |
| D10 | Whether any tenant may later enable B1 (Planes in bottom nav) | **PENDIENTE DE DECISIÓN** |
| D11 | Phase 1 scope: is `activeFromPath` fix mandatory in first engineering slice? | **PENDIENTE DE DECISIÓN** |
| D12 | Deep-link compatibility strictness (must all legacy `?tab=` aliases remain forever?) | **PENDIENTE DE DECISIÓN** |
| D13 | Housing / Living ownership (Operate vs Life vs own domain); scope: rent/sale/land/premises/related services — must not mix with general marketplace | **PENDIENTE DE DECISIÓN** — briefs: `docs/product/D13_HOUSING_LIVING.md`, `docs/product/D13_HOUSING_LIVING_BUSINESS_MODEL.md` |

Until D1–D13 are resolved, engineering must not invent substitutes beyond the locked direction in §4–§5.

**Interim rule for Housing (non-decision):** keep gating the Community Explorar “Vivienda” → `/housing` dead end; do not place Housing under Comunidad; do not merge into general marketplace while D13 is open.

---

## 9. Resumen ejecutivo

| Item | Decision |
|------|----------|
| Selected direction | **H1**, delivered as **H4** (A then H1) |
| Bottom nav | **Inicio · Comunidad · + · Servicios · Perfil** (unchanged slots) |
| Grammar | **Belong / Operate / Life / Profile** |
| Chat | Capability only (ConversationExperience) |
| Not selected now | Global B1 tab swap; big-bang pure C; H3 presets in phase 1 |
| Execution | **Not authorized by this document** |

---

*End of Information Architecture Decision.*
