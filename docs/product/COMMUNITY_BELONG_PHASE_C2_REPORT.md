# Community Belong Phase C.2 Report

> Content ownership under Belong layers.  
> Checkpoint: `c6c24d2` (C.1 Belong navigation).  
> **No commit. No C.3. No ConversationExperience / bottom-nav / route changes.**

---

## Objetivo C.2

Organizar el **contenido existente** bajo:

```
Comunidad
├── Ahora
├── Grupos
├── Proponer
└── Oficial
```

Sin feed nuevo, sin votaciones inventadas, sin resolver pendientes (plaza / D5 / D6 / Mascotas / D13).

---

## Mapa de archivos afectados (pre-cambio)

| Archivo | Rol |
|---------|-----|
| `apps/web/src/screens/CommunityScreen.tsx` | Ownership visual + peeks Ahora; anclas Grupos/Oficial |
| `tenants/life-panoramica/src/community-hub.ts` | Sin cambio estructural C.2 (adapters C.1 reutilizados; `listActualidadContent` ya existía) |
| `packages/ui/.../CommunityHubSurfaces.tsx` | **Reuso, sin editar** |
| Conversation / bottom nav / paths | **Sin tocar** |
| Explorar tiles | **Intactos** (gate no es este C.2) |

### Componentes reutilizados

| Componente | Uso Belong |
|------------|------------|
| `FilterChipRow` | Nav C.1 (sin cambio de contrato) |
| `HomeSection` | Contenedor por capa |
| `HubAttentionCard` | Ahora — alerts + closing peek |
| `HubDoorCard` | Ahora peeks + plaza + grupos expand |
| `HubRail` / `HubRailCard` | Grupos |
| `HubProposalCard` | Proponer |
| `HubRow` | Oficial |
| `HubTile` / `HubTileGrid` / `HubPanel` | Explorar (sin ownership Belong) |
| `EmptyState` / `Button` | Vacíos / create |

Data reusada: `listActiveCommunityAlerts`, `listActualidadContent`, feed/`plazaItems`, `listGroups`, `listParticipacionContent`, `listOfficialEntities` / `listOfficialContent` / channels.

---

## Cambios realizados

### Ahora

- Sección **siempre** montada (`plaza-important`) con empty quiet si no hay cuerpo.
- Contiene:
  - **Alerts** (existentes)
  - **Closing proposals** peek (urgencia; lista completa sigue en Proponer)
  - **Actualidad** peek vía `listActualidadContent` + feed live
  - **Actividad reciente** peek vía `plazaItems` existentes (no feed nuevo; dedupe vs actualidad en la sección)

### Grupos

- Sección **siempre** montada (`plaza-people`) — deep link estable.
- Lista / rail existentes; CTA → `/community/groups/[id]/conversation`.
- EmptyState si no hay grupos.

### Proponer

- Misma fuente `listParticipacionContent` / `HubProposalCard`.
- Copy: apoyo y comentarios, **sin votaciones**.
- Empty copy alineado a “propuestas”.

### Oficial

- Sección **siempre** montada (`plaza-official`).
- Entidades + avisos (label) + canales.
- EmptyState si no hay superficie oficial.

### Encapsulado / no tocado

| Ítem | Estado |
|------|--------|
| En la plaza | Intacta (feed completo); no absorbida |
| Explorar | Intacta |
| D5 / D6 / Mascotas / D13 | Sin resolver |
| `?tab=` / rutas / CE / bottom nav | Compatibles |

### Micro-fix C.1 review

- `goToBelongLayer` usa `communityBelongLayerDefinition`.

---

## Archivos modificados

- `apps/web/src/screens/CommunityScreen.tsx`
- `docs/product/COMMUNITY_BELONG_PHASE_C2_REPORT.md` (nuevo)

---

## Compatibilidad

| Contrato | Estado |
|----------|--------|
| 8 area ids + legacy `?tab=` | Conservados |
| DOM `plaza-*` | Conservados; Grupos/Oficial siempre anclados |
| Paths content / groups / official / conversation | Sin cambio |
| Bottom nav / ConversationExperience | Intactos |

Nota: peeks en Ahora pueden solapar títulos con **En la plaza** (mismo feed). Intencional hasta decisión plaza; no es feed duplicado de backend.

---

## Validación

| Check | Resultado |
|-------|-----------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` | **PASS** (warning preexistente `ServicesCategoryScreen` img) |

---

## Pendientes

- Decisión **En la plaza** (A/B)
- D5 / D6 / Mascotas / D13
- Gate / ownership Explorar (Operate / Life) — posible C.3
- Dual peek closing proposals (Ahora + Proponer)
- Commit C.2 (confirmación humana)

---

## Explicit non-actions

- No commit  
- No C.3  
- No rewrite Community  
- No bottom-nav / route / CE changes  

---

*End of Community Belong Phase C.2 Report.*
