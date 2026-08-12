# Life Community OS
# IA Ownership Map (H1)

> Internal product map for the approved direction **H1/H4**.  
> Not a route migration. Not an implementation authorization for FASE 2 full reorg.  
> Housing (**D13**) remains unassigned.

Tenant note: **Life Panoramica** is the current tenant pack, not a platform module.

---

## Surfaces (bottom nav — locked)

| Surface | Job | Owns (primary) | Does not own |
|---------|-----|----------------|--------------|
| **Inicio** | Today briefing | Moments summary; light doors | Full sitemap |
| **Comunidad** | Belong | People/plaza, groups, participate/propose, official entry | Operate portals, Life directory, Housing |
| **+ Crear** | Action | Contribution sheet by owner job | Durable IA section |
| **Servicios** | Operate | Resources/reservas entry, marketplace, service categories | Social plaza, Housing (D13) |
| **Perfil** | Me | Identity shortcuts, mis reservas, guardados, calendario | Fake sub-pages without screens |

---

## Belong — Comunidad

| Capability | Primary owner | Notes |
|------------|---------------|-------|
| Personas / plaza / publicaciones | Comunidad | |
| Grupos | Comunidad | |
| Participación / propuestas | Comunidad | One decide surface target; **D5** timing pending |
| Oficial / canales entry | Comunidad → `/official/*` | |
| Conversación (chat) | Capability | ConversationExperience — not a section |
| “Conversaciones” area (feed discussions) | Comunidad content | Rename/fold **D6** pending |

**Target visible layers (future, not forced this slice):** Ahora · Grupos · Proponer · Oficial  

**Current hub still has 8 area ids** for deep-link compatibility.

---

## Operate — Servicios

| Capability | Primary owner | Notes |
|------------|---------------|-------|
| Profesionales, trabajo, ayuda, movilidad, recomendaciones | Servicios | |
| Marketplace / compra-venta | Servicios | Label **D7** pending |
| Resources discovery + reserve | Servicios | Entry `/resources`; vocabulary **D1** pending |
| Mis reservas (list) | Perfil + Servicios adjacency | Personal list under Perfil |

---

## Life (secondary — not a bottom-nav module)

| Capability | Primary owner | Notes |
|------------|---------------|-------|
| Experiencias | Life / Planes | |
| Actividades | Life / Planes family | Nesting **D4** pending |
| Discover / Near / Cerca | Life / Cerca | **D2/D3** pending |

Life Panoramica ≠ Life surface. Life Panoramica is the **tenant**.

---

## Housing / Living

| | |
|--|--|
| Status | **D13 PENDIENTE DE DECISIÓN** |
| Ownership | **Not assigned** |
| Interim | No Community Explorar peer; `/housing` compatibility redirect only |

---

## Cross-cutting

| Capability | Rule |
|------------|------|
| ConversationExperience | Transversal only |
| Notifications | Header / Perfil shortcuts |
| Create sheet | Mirrors Comunidad / Planes / Resolver owners |

---

*Updated when Phase 2+ slices land. Source of truth for decisions: `IA_DECISION.md`.*
