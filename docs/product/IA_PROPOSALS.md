# Life Community OS
# Information Architecture Proposals

> Document status: **proposals for review only**.  
> Source of current state: `docs/product/CURRENT_INFORMATION_ARCHITECTURE.md`  
> This document does **not** approve a direction, replace the live architecture, or authorize implementation.

Rules respected:

- No code changes implied as approved work.
- No feature deletion required by any proposal.
- Preserve ConversationExperience as the universal chat shell.
- Preserve multi-tenant / module / capability gating patterns.
- Progressive evolution preferred over big-bang rewrites.

---

## Contexto

Life Community OS is a multi-tenant SaaS. Life Panoramica is the current reference tenant.

Today’s shell (from the current IA inventory):

- Bottom nav: **Inicio · Comunidad · Crear (+) · Servicios · Perfil**
- Hamburger: full product directory (Comunidad areas, Actividades, Experiencias, Reservas, Servicios, Cerca de ti, Oficial, Mi perfil)
- Community Hub: 8 canonical areas + 6 scroll layers + Explorar tiles into other modules
- Cross-module chat via `ConversationExperience`
- Routes largely stay as they are; IA issues are mostly **ownership, naming, and entry-point density**

Goal of this phase: compare coherent reorganization options so a later **IA Decision Document** can choose.

---

## Problemas actuales

Extracted from `CURRENT_INFORMATION_ARCHITECTURE.md` (duplicities, incoherences, open problems).

### P1 — Multiple entry points for the same job

**Problema:** Local life, experiences, services, and spaces can be reached from Home, Community Explorar, hamburger, Discover, and/or Create.  
**Dónde aparece:** Home rails/intents; `/community` Explorar; hamburger categories; `/discover`; Create sheet.  
**Impacto usuario:** “Where should I tap?” — especially for new and older neighbours.  
**Impacto producto:** Diluted analytics, inconsistent mental model, hard to teach onboarding.

### P2 — Community Hub model ≠ Community UI

**Problema:** 8 canonical areas (`actualidad` … `mascotas`) map onto 6 scroll sections; several tabs share one section.  
**Dónde aparece:** `community-hub.ts` vs `CommunityScreen` section mapping; hamburger Comunidad leaves.  
**Impacto usuario:** Menu promises distinct places; UI delivers scroll jumps on one page.  
**Impacto producto:** Deep links feel precise but experience is not.

### P3 — Community contains a global Explorar portal

**Problema:** Community Explorar tiles jump to Experiencias, Espacios/Resources, Servicios, Mascotas, Vivienda.  
**Dónde aparece:** `/community` layer “Explorar”.  
**Impacto usuario:** Comunidad feels like a second app menu.  
**Impacto producto:** Blurs Community vs Services vs Experiences boundaries.

### P4 — Bottom nav active state lies for secondary routes

**Problema:** `/experiences`, `/discover`, `/near`, `/official`, `/activities`, etc. highlight **Inicio**.  
**Dónde aparece:** `MemberShell.activeFromPath`.  
**Impacto usuario:** Orientation loss (“I left Inicio but Inicio is still selected”).  
**Impacto producto:** Weakens trust in primary navigation.

### P5 — Hamburger duplicates primary tabs and expands into a full sitemap

**Problema:** Comunidad / Servicios / Perfil appear in both bottom nav and hamburger; hamburger also hosts everything else.  
**Dónde aparece:** `navigation-projector.ts` + `MemberShell`.  
**Impacto usuario:** Two competing “maps of the app”.  
**Impacto producto:** Hard to keep nav projection and bottom nav in sync across tenants.

### P6 — Actividades vs Experiencias coexistence without a single story

**Problema:** Separate hamburger categories and surfaces; Discover mixes “Experiencias y actividades”.  
**Dónde aparece:** `/activities/[slug]`, `/experiences*`, Discover section, Home “Planes”.  
**Impacto usuario:** Ambiguity: permanent interest vs joinable moment.  
**Impacto producto:** Duplicate catalog framing; tenant config complexity.

### P7 — Propuestas vs Participación; Conversaciones vs chat

**Problema:** Two community areas with overlapping/proposal-derived data; “Conversaciones” names a feed filter while chat is `ConversationExperience`.  
**Dónde aparece:** Community areas + content filters + conversation routes.  
**Impacto usuario:** Expectation of an inbox or separate decision spaces that are not really separate.  
**Impacto producto:** Naming debt around Communication Core.

### P8 — Reservas / Recursos / Espacios label triangle

**Problema:** Different labels converge on `/resources` or `/reservations`.  
**Dónde aparece:** Hamburger Reservas (two leaves → `/resources`), Services, Community Explorar, Profile.  
**Impacto usuario:** Unclear vocabulary for booking shared spaces.  
**Impacto producto:** Module `reservations` vs route `/resources` mismatch in language.

### P9 — Discover / Cerca without primary-nav ownership

**Problema:** Strong screen (“Descubrir”) and near hubs exist, but no bottom-nav slot; Home and hamburger also sell “cerca”.  
**Dónde aparece:** `/discover`, `/near/*`, Home nearby, hamburger “Cerca de ti”.  
**Impacto usuario:** Local exploration feels important but “homeless” in the primary bar.  
**Impacto producto:** Unclear whether Discover is a hub or a temporary aggregator.

### P10 — Dead / hollow destinations

**Problema:** `/housing` linked without page; several profile hamburger leaves all go to `/me`.  
**Dónde aparece:** Community Explorar Vivienda; Mi perfil leaves.  
**Impacto usuario:** Dead ends or false specificity.  
**Impacto producto:** Trust and QA noise.

### P11 — Colliding “Servicios” label

**Problema:** Bottom-nav/services hub and `/near/services` share the same word.  
**Dónde aparece:** Servicios tab vs Cerca category.  
**Impacto usuario:** Two different jobs, one name.  
**Impacto producto:** i18n/tenant labeling hazards.

---

## Analysis notes (areas of attention — not decisions)

### Comunidad — concepts to compare later

| Concept | Meaning (study only) |
|---------|----------------------|
| Plaza social | Feed + groups + neighbour life; official and explore elsewhere |
| Centro comunitario | Broader hub including decide + official + light explore |
| Sistema por capas | Keep scroll layers but align 1:1 with fewer named areas |

### Experiencias / Actividades

Options under study (not chosen):

- Keep both as peer nav categories  
- Activities as hubs **inside** Experiences  
- Experiences as moments **inside** Activity interests  
- Rename for clarity without merging routes yet  

### Servicios

Options under study:

- Keep marketplace + resources under Servicios umbrella (today’s gravity)  
- Treat Reservas as sibling of Servicios in secondary nav only  
- Unify vocabulary: one public name for resource booking  

### Discover / Explorar / Cerca

Options under study:

- Discover as secondary aggregator fed from Home  
- Discover as the single “local directory” owner (`/near` as children)  
- Fold Discover responsibilities back into Home + Near, deprecate Discover as hub  

### Hamburger

Options under study:

- Full sitemap (today)  
- Secondary only (what bottom nav cannot hold)  
- Account + overflow only  

---

## Propuesta A

### Nombre de la propuesta

**A — Clarify Ownership (minimal IA)**

### Principio principal

Keep the current bottom nav and route map. Reduce confusion by **assigning a single primary owner per job** and demoting duplicate entries (menu copy, scroll targets, active-state rules)—without inventing new primary tabs.

### Árbol de navegación propuesto

```
Bottom nav (unchanged slots)
├── Inicio (/)
├── Comunidad (/community)
├── + Crear (sheet)
├── Servicios (/services)
└── Perfil (/me)

Hamburger (secondary / overflow — still present, trimmed of pure duplicates)
├── Planes
│   ├── Experiencias → /experiences
│   └── Actividades → /activities/*   (or nested under Experiencias as hubs)
├── Cerca → /discover and/or /near/*
├── Oficial → /official/*
├── Reservas → /resources (+ Mis reservas → /reservations under Perfil only)
└── Cuenta → /me, /calendar, /notifications   (no fake sub-pages)

Comunidad (same route; clearer internal layers)
├── Ahora / Plaza
├── Grupos
├── Decidir
└── Oficial (entry)
    └── (no Explorar tiles to Servicios/Experiencias — those stay in their owners)

Inicio
├── Hoy (moments)
├── Teaser → Comunidad
└── Limited doors (e.g. Planes, Cerca, Resolver) — not a second sitemap
```

### Qué cambia respecto a hoy

- Primary **owner** declared for: Plaza (Comunidad), Resolver (Servicios), Planes (Experiencias±Actividades), Cerca (Discover/Near), Oficial (Comunidad entry + `/official`).
- Community **Explorar** cross-module portal reduced or emptied (tiles become links from their owners only).
- Hamburger stops repeating identical bottom-nav roots as peer “apps”; focuses on overflow.
- Active-state mapping adjusted so secondary routes do not always pretend to be Inicio (even if they remain non-tab routes).
- Naming cleanup candidates: Propuestas/Participación → one surface; Conversaciones area vs chat vocabulary; Reservas vocabulary; near “Servicios” label collision.
- Hollow leaves (`/housing`, multi-`/me` labels) gated or labeled honestly.

### Qué se mantiene

- Bottom nav five slots and labels.
- Existing routes and screens.
- Create sheet pattern.
- ConversationExperience contexts.
- Module/feature/capability gating.
- Tenant navigation projector mechanism (content of projection changes, not the system).

### Ventajas

- Lowest product risk; easiest to explain as “cleanup”.
- Fast path to clearer teaching (“Comunidad = people/plaza”).
- Compatible with current Home Premium investment.
- Good first step before any tab-bar redesign.

### Riesgos

- May feel insufficient if users already expect Discover/Experiences in the tab bar.
- Without UI changes beyond nav/copy, Community page may still feel long.
- Temptation to “clarify” only in docs while UI still shows old tiles.

### Impacto técnico aproximado

**Low–medium.** Mostly: navigation projector leaves, Community Explorar section, `activeFromPath`, copy/labels, deep-link area list alignment. Little or no new routing.

### Evaluación (1–5, higher = better for that criterion)

| Criterio | Score | Note |
|----------|------:|------|
| Facilidad vecino nuevo | 3 | Clearer, but overflow still in hamburger |
| Claridad usuarios mayores | 3 | Fewer false doors; Community still dense |
| Escalabilidad SaaS | 4 | Ownership rules travel well per tenant modules |
| Coherencia Life Community OS | 4 | Matches “shell + modules” without inventing IA |
| Impacto arquitectura existente | 5 | Minimal structural pressure |
| Complejidad migración | 5 | Incremental, reversible |

---

## Propuesta B

### Nombre de la propuesta

**B — Job Tabs (Planes as first-class, hamburger as overflow)**

### Principio principal

Organize the primary shell around **user jobs**, not around historical module bags. Keep five bottom slots, but reinterpret one slot’s job so “pointarse a algo / vida del territorio” is not only a Home intent + hamburger category.

### Árbol de navegación propuesto

```
Bottom nav (same count, one job reinterpretation)
├── Inicio (/)                    → “Qué pasa hoy” (summary only)
├── Comunidad (/community)        → plaza social + decidir + oficial entry
├── + Crear
├── Vida / Planes                 → primary owner for /experiences (+ activities as hubs)
│                                  OR keep label “Servicios” and move Planes into a
│                                  dedicated slot by swapping Servicios to hamburger-primary
│                                  ***variant B1 vs B2 below***
└── Perfil (/me)

Variant B1 — replace Servicios in bottom nav with Planes:
├── Inicio | Comunidad | + | Planes | Perfil
└── Servicios lives primarily in hamburger + Create “Resolver”

Variant B2 — keep Servicios in bottom nav; elevate Planes via Inicio + single hamburger root
└── (closer to A; included as soft variant — prefer stating B1 as the distinctive B)

Canonical B (B1) tree:

Inicio
├── Hoy
└── Short links: Comunidad · Cerca

Comunidad
├── Plaza
├── Grupos
├── Decidir
└── Oficial

Planes (bottom)
├── /experiences
├── /activities/* as interest hubs under Planes
└── calendar cross-link

Hamburger (overflow only)
├── Servicios (full category tree + marketplace + resources)
├── Cerca / Descubrir
├── Oficial (optional duplicate of community entry)
└── Cuenta

Servicios (not bottom, still full product)
├── Profesionales, Trabajo, Ayuda, Movilidad, Recomendaciones
├── Compra y venta
└── Reservas / espacios (/resources, /reservations)
```

### Qué cambia respecto a hoy

- Bottom nav job mix changes (B1): **Planes** becomes primary; **Servicios** becomes secondary/overflow.
- Experiencias + Actividades presented as **one family** (hubs vs moments) under Planes.
- Discover/Cerca remains secondary but with a single overflow owner.
- Community loses global Explorar portal.
- Create sheet sections align to jobs: Comunidad / Planes / Resolver.

### Qué se mantiene

- Route paths (`/experiences`, `/services`, `/community`, etc.).
- ConversationExperience.
- Services hub screen and marketplace/resources flows.
- Module registry enablement (which tenants show Planes vs Servicios in the bar can remain configurable later).

### Ventajas

- Matches high-frequency “quiero apuntarme / qué hay que hacer” better than burying Planes.
- Makes Actividades/Experiencias relationship teachable.
- Forces hamburger into a true overflow role.
- Still five-tab mobile pattern.

### Riesgos

- Life Panoramica may rely on Servicios as a daily tab; demoting it could feel like a regression for “resolver”.
- Renaming/reinterpretation of a bottom slot is a **product communication** change, not just IA docs.
- Active-state and create-sheet IA must be redesigned carefully.
- Tenants without experiences module need a fallback bottom-nav projector rule.

### Impacto técnico aproximado

**Medium.** Bottom nav builder + activeFromPath + possibly tenant nav presets + Community Explorar + hamburger projection + Create section grouping. Screens stay; shell composition changes.

### Evaluación

| Criterio | Score | Note |
|----------|------:|------|
| Facilidad vecino nuevo | 4 | Clear “Planes” job |
| Claridad usuarios mayores | 4 | If labels stay plain (“Planes”, “Comunidad”) |
| Escalabilidad SaaS | 4 | Job slots mappable per tenant modules |
| Coherencia Life Community OS | 3 | Requires agreeing jobs are the shell primitive |
| Impacto arquitectura existente | 3 | Shell/nav changes; routes kept |
| Complejidad migración | 3 | Needs copy, QA, tenant preset rules |

---

## Propuesta C

### Nombre de la propuesta

**C — Two Surfaces: Belong (Comunidad) + Operate (Servicios+), Life Directory secondary**

### Principio principal

Split the product into two strong primary surfaces — **Belong** (social/civic life) and **Operate** (get something done) — with Inicio as a thin “today” briefing. Local directory (Discover/Near) and Planes become **structured secondary systems** with one owner each, not parallel roots fighting the tab bar.

### Árbol de navegación propuesto

```
Bottom nav
├── Inicio (/)                 → briefing only (today + 2 doors)
├── Comunidad (/community)     → Belong
├── + Crear
├── Servicios (/services)      → Operate (includes reservas + marketplace explicitly)
└── Perfil (/me)

Belong — Comunidad
├── Capa 1: Ahora (avisos + señales)
├── Capa 2: Plaza (publicaciones / discusiones como contenido, no “app Conversaciones”)
├── Capa 3: Grupos
├── Capa 4: Decidir (single proposals surface)
└── Capa 5: Oficial (canales + entities → /official)

Operate — Servicios (hub language: “Resolver”)
├── Profesionales / Trabajo / Ayuda / Movilidad / Recomendaciones
├── Compra y venta (/marketplace)
└── Espacios y reservas (/resources, /reservations)

Life — secondary (single overflow root “Vida en el territorio”)
├── Planes (/experiences)
│   └── Intereses / Actividades (/activities/*) as child hubs
└── Cerca (/discover as shell OR /near as categories; one public name)

Hamburger
├── Vida en el territorio (Planes + Cerca)
├── Oficial (shortcut)
└── Cuenta
    └── (no duplicate Comunidad/Servicios category trees)
```

### Qué cambia respecto a hoy

- Explicit **Belong vs Operate** product story.
- Community reduced to civic/social layers; no Servicios/Experiencias tiles inside Comunidad.
- Servicios publicly owns booking + marketplace (vocabulary standardized under Operate).
- Experiencias/Actividades nested under one secondary “Vida/Planes” root.
- Discover and Near collapse to **one** secondary local-directory story.
- Hamburger becomes account + life directory — not a clone of the whole IA.
- Stronger alignment of Community area list to visible layers (fewer area ids, or 1:1 layers).

### Qué se mantiene

- Existing route inventory (paths can remain; IA ownership changes).
- Bottom nav slot count and Create action pattern.
- ConversationExperience and permission/capability model.
- Official entity routes and services category routes.

### Ventajas

- Strongest clarity for SaaS storytelling and future tenant presets (`minimal_community` vs `full_product`).
- Best separation of “people/civic” vs “transactions/ops”.
- Reduces hamburger to a manageable size.
- Scales when new modules appear: they must declare Belong / Operate / Life / Profile.

### Riesgos

- Largest conceptual shift for users who learned the current hamburger sitemap.
- Planes not in bottom nav may under-emphasize experiences for lifestyle tenants (unless Inicio doors are strong).
- Requires disciplined content pruning on Home and Community (still no feature deletion, but entry-point deletion).
- More design/IA work before engineering; higher chance of partial adoption.

### Impacto técnico aproximado

**Medium–high (IA/shell), low–medium (routes).** Heaviest on navigation projection, Community hub area model, Home composition rules, Discover/Near positioning, copy system. Avoids mandatory route renames if ownership is enforced in nav only.

### Evaluación

| Criterio | Score | Note |
|----------|------:|------|
| Facilidad vecino nuevo | 4 | Two big doors + thin Home |
| Claridad usuarios mayores | 5 | Belong vs Resolver is plain language |
| Escalabilidad SaaS | 5 | Clear module placement rules |
| Coherencia Life Community OS | 5 | Matches platform vs tenant thinking |
| Impacto arquitectura existente | 2 | More IA rewiring in shell/hub models |
| Complejidad migración | 2 | Multi-step; needs decision doc + phased plan |

---

## Comparativa

Scores from sections above (1–5). Higher is better for that criterion.

| Criterio | Propuesta A — Clarify Ownership | Propuesta B — Job Tabs (Planes primary) | Propuesta C — Belong / Operate |
|----------|--------------------------------:|----------------------------------------:|-------------------------------:|
| Facilidad vecino nuevo | 3 | 4 | 4 |
| Claridad usuarios mayores | 3 | 4 | 5 |
| Escalabilidad SaaS | 4 | 4 | 5 |
| Coherencia Life Community OS | 4 | 3 | 5 |
| Impacto bajo en arquitectura existente | 5 | 3 | 2 |
| Baja complejidad de migración | 5 | 3 | 2 |
| Preserva bottom-nav labels hoy | Alta | Media (cambia un slot en B1) | Alta (slots), media (significados) |
| Resuelve P1 entry-point sprawl | Parcial | Fuerte en Planes | Fuerte en boundaries |
| Resuelve P3 Community Explorar | Sí (regla) | Sí | Sí |
| Resuelve P5 hamburger duplication | Parcial–fuerte | Fuerte | Fuerte |
| Resuelve P6 Actividades/Experiencias | Débil–media | Fuerte (familia Planes) | Fuerte (anidación Life) |
| Resuelve P9 Discover ownership | Débil–media | Media | Fuerte (un root Cerca) |

### Qualitative summary (non-decisive)

- **A** optimizes for speed and safety: clean ownership on top of today’s shell.  
- **B** optimizes for lifestyle engagement: makes Planes a primary job (at the cost of demoting Servicios in B1).  
- **C** optimizes for long-term SaaS clarity: Belong vs Operate + secondary Life directory.

No proposal is selected here.

---

## Preguntas abiertas

For the future **IA Decision Document** (answers not given here):

1. Is the bottom-nav contract fixed at **Inicio · Comunidad · + · Servicios · Perfil**, or may one slot’s job be reinterpreted (as in B1)?
2. Should **Experiencias** be primary for Life Panoramica, or is **Servicios/Resolver** the more frequent daily job?
3. Are **Actividades** permanent interest hubs under Experiences, or a separate product surface that must stay peer-level?
4. Is **Comunidad** allowed to include Oficial as a core layer, or must Oficial be only a secondary root?
5. What is the single public name for booking: **Reservas**, **Espacios**, or **Recursos**?
6. What is the single public name for local directory: **Descubrir**, **Cerca de ti**, or another label?
7. Should **Discover** remain a route, become a redirect shell over `/near`, or be demoted to a Home section?
8. How should **Conversaciones** be named so it never collides with `ConversationExperience` chat?
9. Do we merge **Propuestas** and **Participación** into one area id before or after UI cleanup?
10. For SaaS presets: which modules are allowed in bottom nav vs hamburger-only vs Create-only?
11. Must all current deep links (`?tab=`, hamburger hrefs) keep working via redirects/aliases during any transition?
12. Is fixing **activeFromPath** in scope of the first IA decision, independent of choosing A/B/C?

---

## Out of scope (explicit)

- Approving Proposal A, B, or C  
- Route renames or screen moves  
- Feature removal  
- Visual redesign  
- Implementation sequencing (belongs after decision)

---

## Next document

`docs/product/IA_DECISION.md` (to be created in a later phase) should:

1. Choose or hybridize among A / B / C  
2. Answer the open questions  
3. Define non-negotiables and migration phases  
4. Only then authorize implementation work

---

*End of proposals. No decision implied.*
