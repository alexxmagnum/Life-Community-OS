# Community Belong Mapping

> Preparation only for future Comunidad reshape under **H1 / Belong**.  
> **No UI changes. No route changes. No tab deletions. No implementation.**  
> Sources: `IA_DECISION.md`, `IA_OWNERSHIP_MAP.md`, `IA_PHASE2_PROGRESS_REPORT.md`,  
> `CommunityScreen.tsx`, `community-hub.ts`, `CommunityHubSurfaces.tsx`.

Tenant in view: **Life Panoramica** (content pack). Product: **Life Community OS**.

---

## Objetivo

Map **what Community is today** onto the **future Belong layers**:

```
Comunidad
├── Ahora
├── Grupos
├── Proponer
└── Oficial
```

without redesigning or moving code in this document.

Legend for each element:

| Tag | Meaning |
|-----|---------|
| **mantener** | Stays under Comunidad / Belong |
| **mover conceptualmente** | Still exists, but primary owner is another surface (Operate / Life / capability) |
| **pendiente** | Needs a human decision (D5/D6/D13/…) before mapping is final |

---

## ACTUAL — Inventory

Note: Community is **not** a multi-route tab bar. It is **one route** (`/community`) with **six scroll layers** plus **`?tab=` deep links** into those layers. Hamburger “Comunidad” leaves are shortcuts to the same page.

### Layer 1 — Ahora mismo

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “Ahora mismo” (not a separate route) |
| **Section id** | `plaza-important` (+ `#plaza-avisos`) |
| **Deep link** | `/community?tab=actualidad` |
| **Responsabilidad** | What affects me today — alerts + closing proposals peek |
| **Componentes UI** | `HomeSection`, `HubAttentionCard`, `HubProposalCard` |
| **Data sources** | `listActiveCommunityAlerts()`, `listParticipacionContent()` (closing_soon filter), `CommunityInteractionProvider` / `getContent` for live titles |
| **Ruta detalle** | Alerts → `alert.href` or stay on hub; proposals → `/community/content/[id]` |

---

### Layer 2 — En la plaza

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “En la plaza” |
| **Section id** | `plaza-activity` |
| **Deep link** | `/community?tab=conversaciones` |
| **Responsabilidad** | Neighbour social feed (non-official, non-proposal publications) |
| **Componentes UI** | `HomeSection`, `HubDoorCard`, `EmptyState`, `Button` (create post) |
| **Data sources** | `useCommunityInteractions().feedItems` filtered; `formatContentWhen` |
| **Ruta detalle** | `/community/content/[id]`; create via `CreatePostSheet` / `lcos:open-post` |

---

### Layer 3 — Grupos

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “Grupos” |
| **Section id** | `plaza-people` |
| **Deep link** | `/community?tab=grupos` |
| **Responsabilidad** | Organised neighbour groups |
| **Componentes UI** | `HomeSection`, `HubRail`, `HubRailCard` |
| **Data sources** | `listGroups()` |
| **Ruta detalle** | Primary CTA → `/community/groups/[id]/conversation` (also `/community/groups/[id]` exists) |

---

### Layer 4 — Decidir juntos

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “Decidir juntos” |
| **Section id** | `plaza-participate` |
| **Deep links** | `/community?tab=propuestas`, `/community?tab=participacion` (same landing) |
| **Responsabilidad** | Open / closing community proposals |
| **Componentes UI** | `HomeSection`, `HubProposalCard`, `EmptyState` |
| **Data sources** | `listParticipacionContent()` (+ live overlay via `getContent`) |
| **Ruta detalle** | `/community/content/[id]` |

---

### Layer 5 — Información oficial

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “Información oficial” |
| **Section id** | `plaza-official` |
| **Deep link** | `/community?tab=canales` |
| **Responsabilidad** | Official entities, official notices, accessible channels |
| **Componentes UI** | `HomeSection`, `HubRow` |
| **Data sources** | `listOfficialEntities()`, `listOfficialContent()`, `listAccessibleChannels()` |
| **Ruta detalle** | `/official/[slug]`; notice → `/community/content/[id]`; channel → often `/official/[slug]` |

---

### Layer 6 — Explorar

| Field | Value |
|-------|--------|
| **Tab/pantalla** | Scroll layer “Explorar” |
| **Section id** | `plaza-explore` |
| **Deep links** | `/community?tab=espacios`, `/community?tab=mascotas` (land here) |
| **Responsabilidad** | **Doors to other capabilities** (not Belong core) |
| **Componentes UI** | `HomeSection`, `HubTileGrid`, `HubTile`, `HubPanel`, `HubRow` |
| **Data / tiles** | Experiencias → `/experiences`; Espacios → `/resources`; Servicios → `/services`; Mascotas panel (places/work/groups); Vivienda **gated** |
| **Data sources** | `listDiscoverableExperiences`, `listEspaciosComunitarios`, `listMascotasHubItems` |

---

### Related routes (outside the six layers, still “community product”)

| Ruta | Pantalla | Rol actual |
|------|----------|------------|
| `/community` | `CommunityHubScreen` | Hub |
| `/community/content/[id]` | `CommunityContentDetailScreen` | Publication / proposal / notice detail |
| `/community/groups/[id]` | `GroupDetailScreen` | Group detail |
| `/community/groups/[id]/conversation` | `GroupConversationScreen` | Group chat (ConversationExperience) |
| `/community/neighbours/[personId]/conversation` | `NeighbourConversationScreen` | Neighbour chat (ConversationExperience) |
| `/official/[slug]` (+ `/conversation`) | Official screens | Authority detail / chat |

### Canonical area ids (`community-hub.ts`) — not UI tabs

`actualidad` · `grupos` · `conversaciones` · `canales` · `propuestas` · `participacion` · `espacios` · `mascotas`

### Shared UI kit

`packages/ui/src/community/CommunityHubSurfaces.tsx`:  
`HubAttentionCard`, `HubDoorCard`, `HubProposalCard`, `HubRail`, `HubRailCard`, `HubRow`, `HubTile`, `HubTileGrid`, `HubPanel`, …

Plus `HomeSection`, `MobileScreen`, `EmptyState`, `Button` from UI package.

### Shell entry points

| Entry | Behaviour |
|-------|-----------|
| Bottom nav **Comunidad** | `/community` |
| Hamburger Comunidad leaves | `/community?tab=…` (Participación / Espacios comunitarios omitted from menu in Phase 2 start; deep links still resolve) |
| Header / Create | Post into plaza |

---

## FUTURO H1 — Belong layers

### Ahora

**Qué contiene (target):**

- Territory / community alerts (“what affects me today”)  
- Urgent decide signals that belong in “now” (e.g. closing proposals) — or only alerts if Proponer owns all proposals (**pendiente** product nuance)  
- Optional short pulse into plaza (teaser), not the full feed dump  

**Mapped from today:**

| Elemento actual | Destino H1 | Acción |
|-----------------|------------|--------|
| Layer “Ahora mismo” alerts | Ahora | **mantener** |
| Closing proposals in Ahora | Ahora and/or Proponer | **pendiente** (keep dual peek vs Proponer-only) |
| `tab=actualidad` | Ahora | **mantener** (alias OK) |

---

### Grupos

**Qué contiene (target):**

- Group discovery / belonging rail  
- Entry to group detail and **group conversation** (chat remains ConversationExperience capability)  

**Mapped from today:**

| Elemento actual | Destino H1 | Acción |
|-----------------|------------|--------|
| Layer “Grupos” | Grupos | **mantener** |
| `listGroups` + HubRail cards | Grupos | **mantener** |
| `/community/groups/*` | Grupos | **mantener** |
| `tab=grupos` | Grupos | **mantener** |

---

### Proponer

**Qué contiene (target):**

- Open / closing / closed proposals (single decide surface)  
- Detail at `/community/content/[id]` for proposal-type content  

**Mapped from today:**

| Elemento actual | Destino H1 | Acción |
|-----------------|------------|--------|
| Layer “Decidir juntos” | Proponer | **mantener** (rename later) |
| `tab=propuestas` | Proponer | **mantener** |
| `tab=participacion` | Proponer | **pendiente** (D5 — merge vs alias-only) |
| Hamburger “Propuestas” | Proponer | **mantener** |
| Hamburger “Participación” (removed from menu) | — | Already menu-trimmed; area id **pendiente** D5 |

---

### Oficial

**Qué contiene (target):**

- Official entities entry → `/official/[slug]`  
- Official notices  
- Channels as organisation of official/community info (entry, not a second app)  

**Mapped from today:**

| Elemento actual | Destino H1 | Acción |
|-----------------|------------|--------|
| Layer “Información oficial” | Oficial | **mantener** |
| Entities / notices / channels rows | Oficial | **mantener** |
| `tab=canales` | Oficial | **mantener** (label may later say Oficial — **pendiente** copy) |
| `/official/*` + conversation | Oficial + capability | **mantener** |

---

## Elements outside the four Belong layers

| Elemento actual | H1 reading | Acción |
|-----------------|------------|--------|
| Layer “En la plaza” feed | Part of Belong social life — likely under **Ahora** (extended) or a plaza sub-block inside Ahora/Comunidad | **mantener** under Comunidad; exact parent label **pendiente** (whether “Ahora” absorbs plaza or stays sibling inside Belong) |
| `tab=conversaciones` | Feed discussions — **not** ConversationExperience inbox | **pendiente** D6 (rename/fold into plaza) |
| Explorar → Experiencias | Life / Planes | **mover conceptualmente** |
| Explorar → Espacios → `/resources` | Operate / Servicios | **mover conceptualmente** |
| Explorar → Servicios | Operate / Servicios | **mover conceptualmente** |
| Explorar → Mascotas panel | Thematic filter / secondary | **pendiente** (stay Belong accessory vs Life) |
| Explorar → Vivienda | Housing | **pendiente** D13 (gated; not Belong peer) |
| `tab=espacios` | Operate | **mover conceptualmente** (deep link may alias later) |
| `tab=mascotas` | Secondary | **pendiente** |
| Neighbour conversation routes | Capability | **mantener** (not a Belong “section”) |
| Group conversation | Capability attached to Grupos | **mantener** |

**Important unresolved product nuance (document only):**  
IA_DECISION four layers are Ahora · Grupos · Proponer · Oficial. Today’s “En la plaza” is core Belong content but not named in that quartet. Mapping options for a later decision:

1. Fold plaza feed into **Ahora** as “now + neighbour life”, or  
2. Keep plaza as an internal Belong block without a fifth bottom concept, still under `/community`.  

Tagged **pendiente** — do not invent in code yet.

---

## Component reuse map (for a future reshape)

| UI building block | Likely reuse in |
|-------------------|-----------------|
| `HubAttentionCard` | Ahora |
| `HubDoorCard` | Plaza / Ahora social |
| `HubProposalCard` | Proponer |
| `HubRail` / `HubRailCard` | Grupos |
| `HubRow` | Oficial |
| `HubTile` / `HubTileGrid` | **Not** for Operate/Life doors inside Comunidad long-term |
| `HubPanel` | Optional Mascotas / secondary panels |
| `HomeSection` | All Belong layers |
| `MobileScreen` | Hub chrome |
| ConversationExperience | Unchanged capability |

---

## Data source ownership (conceptual)

| Source | Today used in | Future owner |
|--------|---------------|--------------|
| `listActiveCommunityAlerts` | Ahora | Belong / Ahora — **mantener** |
| Feed / `CommunityInteractionProvider` | Plaza | Belong — **mantener** |
| `listGroups` | Grupos | Belong — **mantener** |
| `listParticipacionContent` / proposals | Decidir (+ Ahora peek) | Belong / Proponer — **mantener** |
| `listOfficialEntities` / `listOfficialContent` / channels | Oficial | Belong / Oficial — **mantener** |
| `listEspaciosComunitarios` | Explorar | Operate — **mover conceptualmente** |
| `listDiscoverableExperiences` (count) | Explorar | Life — **mover conceptualmente** |
| `listMascotasHubItems` | Explorar | **pendiente** |

---

## Route compatibility (no changes now)

| Route | Future note |
|-------|-------------|
| `/community` | Remains Belong hub |
| `/community?tab=actualidad\|grupos\|propuestas\|canales\|…` | Keep resolving; aliases when layers rename |
| `/community?tab=conversaciones\|participacion\|espacios\|mascotas` | Keep until D5/D6/placement decisions |
| Content / groups / official / conversations | Remain; ownership as above |

---

## Summary matrix

| Future layer | Primary content from today | Gaps / pending |
|--------------|----------------------------|----------------|
| **Ahora** | Alerts (+ optional proposal urgency) | Relation to full plaza feed |
| **Grupos** | Groups layer + group routes | — |
| **Proponer** | Decidir layer | D5 participacion merge; naming “Proponer” vs “Decidir” |
| **Oficial** | Oficial layer + `/official/*` | Optional rename of `canales` deep link label |
| _(Leave Comunidad)_ | Explorar Operate/Life tiles | Move conceptually when Life overflow + Operate doors are enough |
| _(Unassigned)_ | Housing tile | D13 |
| _(Capability)_ | All `…/conversation` | Never a Belong section |

---

## Explicit non-actions

This document does **not**:

- redesign Community UI  
- change routes or delete tabs/area ids  
- remove Explorar tiles in code  
- close D5 / D6 / D13  
- implement Belong rename  

Next engineering step (when authorized): a separate implementation slice that only applies mappings marked **mantener** / agreed **mover conceptualmente**, after pending items are decided.

---

*End of Community Belong Mapping.*
