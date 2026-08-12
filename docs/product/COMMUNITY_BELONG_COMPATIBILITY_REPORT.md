# Community Belong Compatibility Report

> FASE B — technical compatibility only.  
> **No visual redesign. No nav change. No public route change. No ConversationExperience touch. No FASE C. No commit.**  
> Sources: `COMMUNITY_BELONG_MAPPING.md`, `COMMUNITY_BELONG_MIGRATION_PLAN.md`, `IA_DECISION.md`.

---

## Objetivo

Preparar la compatibilidad técnica para migrar Community → Belong H1 (Ahora · Grupos · Proponer · Oficial) sin alterar la UI visible ni romper `?tab=` / deep links.

---

## FASE 1 — Audit de compatibilidad

| Elemento actual | Dependencias | Riesgo | Preparación necesaria |
|-----------------|--------------|--------|------------------------|
| `CommunityScreen` / hub scroll | Tenant lists, `CommunityInteractionProvider`, UI HubSurfaces, `?tab=` effect | Medio si el mapa sección↔tab se duplica | Centralizar section map (hecho) |
| `CommunityHubSurfaces` | Tokens UI; usado solo como presentational | Bajo | Ninguna en FASE B — reutilizar en FASE C |
| `?tab=` / `resolveCommunityHubArea` | `community-hub.ts`, projector leaves, bookmarks | Alto si se borran ids | Mantener 8 ids + legacy map; añadir aliases H1 (hecho) |
| Deep links hamburger | `navigation-projector` → `communityHubHref` | Bajo | Sin cambio de hrefs en FASE B |
| Group routes `/community/groups/*` | Group screens + ConversationExperience | Bajo si no se tocan paths | **Mantener** paths |
| Neighbour / official conversation | ConversationExperience | Alto si se “mueve” chat a capa Belong | **No tocar** |
| Content detail `/community/content/[id]` | Feed / proposals / notices | Bajo | **Mantener** |
| DOM ids `plaza-*` + `#plaza-avisos` | Alert hrefs, scrollIntoView | Medio si se renombran en C prematuro | Conservar ids hasta FASE C explícita |
| Explorar tiles | Experiences / resources / services | Medio (ownership Operate/Life) | Solo ownership doc/map; UI intacta |
| `participacion` / `conversaciones` | D5 / D6 / plaza | Producto | Marcados `pending` en ownership map |

---

## FASE 2 — Preparación H1 (sin UI)

Estructura añadida en `tenants/life-panoramica/src/community-hub.ts` (single source; sin duplicar pantallas):

| Artefacto | Rol |
|-----------|-----|
| `COMMUNITY_BELONG_LAYER_IDS` | Constantes Ahora / Grupos / Proponer / Oficial |
| `COMMUNITY_HUB_SECTION_IDS` | Landings DOM actuales (`plaza-*`) |
| `COMMUNITY_HUB_AREA_SECTION` | Area id → section id |
| `communityHubSectionIdForArea()` | Adapter usado por `CommunityScreen` |
| `COMMUNITY_HUB_AREA_BELONG` | Ownership conceptual Belong / pending / outside |
| `communityBelongOwnershipForArea()` | Lectura tipada del ownership |
| Legacy aliases `ahora` / `proponer` / `oficial` | `?tab=` H1 → areas canónicas existentes |

**No creado:** componentes nuevos, pantallas duplicadas, rutas nuevas, cambios de labels visibles.

`CommunityScreen` ahora importa `communityHubSectionIdForArea` en lugar del `Record` inline (mismo comportamiento de scroll).

---

## FASE 3 — Rutas (estrategia)

| Ruta actual | Destino futuro | Estrategia |
|-------------|----------------|------------|
| `/community` | Hub Belong | **Mantener** |
| `/community?tab=actualidad` | Ahora | **Mantener** (+ alias `?tab=ahora`) |
| `/community?tab=grupos` | Grupos | **Mantener** |
| `/community?tab=propuestas` | Proponer | **Mantener** (+ alias `?tab=proponer`) |
| `/community?tab=canales` | Oficial | **Mantener** (+ alias `?tab=oficial`) |
| `/community?tab=participacion` | Proponer (land hoy) | **Alias** hasta D5 |
| `/community?tab=conversaciones` | Plaza / D6 | **Alias** hasta decisión plaza |
| `/community?tab=espacios` | Operate | **Alias** compat; ownership outside |
| `/community?tab=mascotas` | Pendiente | **Alias** |
| Legacy `feed` / `groups` / `decide` / … | Areas canónicas | **Alias** (preexistente) |
| `/community/content/[id]` | Detalle Belong | **Mantener** |
| `/community/groups/[id]` (+ `/conversation`) | Grupos + capability | **Mantener** |
| `/community/neighbours/…/conversation` | Capability | **Mantener** |
| `/official/[slug]` (+ conversation) | Oficial + capability | **Mantener** |
| Nuevos paths `/community/ahora` etc. | — | **Redirect futuro** no requerido en H1; no implementar ahora |

---

## Cambios realizados

1. **`community-hub.ts`:** mapas Belong + section + ownership; aliases H1 en `LEGACY_TAB_MAP`; comentarios de compatibilidad.
2. **`CommunityScreen.tsx`:** scroll deep-link usa `communityHubSectionIdForArea` (sin cambio visual / de sección).
3. **Este reporte.**

### Archivos afectados

- `tenants/life-panoramica/src/community-hub.ts`
- `apps/web/src/screens/CommunityScreen.tsx`
- `docs/product/COMMUNITY_BELONG_COMPATIBILITY_REPORT.md` (nuevo)

### No afectados (explícito)

- `CommunityHubSurfaces.tsx` (sin editar)
- `navigation-projector.ts` (sin editar en esta fase)
- ConversationExperience / conversation routes
- Bottom nav / hamburger structure
- Public path tree

---

## Validación

| Check | Resultado |
|-------|-----------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` | **PASS** (warning preexistente en `ServicesCategoryScreen.tsx` — no relacionado) |

---

## Riesgos

| Riesgo | Estado |
|--------|--------|
| Aliases H1 (`ahora`/`proponer`/`oficial`) usados antes de FASE C copy | Bajo — resuelven a UI actual |
| Ownership `participacion` = pending mientras land = Proponer | Intencional (D5) |
| DOM `plaza-*` vs nombres Belong | Documentado; rename solo en FASE C |
| Partial adoption si FASE C no llega | Docs + maps listos; UI sigue 6 capas |

---

## Pendientes (no cerrados)

- Caso **En la plaza** (absorber en Ahora vs bloque propio)
- **D5** Propuestas / Participación
- **D6** Conversaciones naming
- **Mascotas** placement
- **D13** Housing
- Closing-proposals peek en Ahora vs solo Proponer
- FASE C: retítulos + gate Explorar
- D12: política forever de `?tab=`

---

## Exit criteria FASE B

- [x] Section map single-sourced  
- [x] Belong layer constants + ownership map  
- [x] Existing `?tab=` preserved  
- [x] H1 tab aliases resolve without new routes  
- [x] No UI / nav / ConversationExperience change  
- [x] Typecheck pass  
- [x] Lint pass  

---

*End of Community Belong Compatibility Report. STOP — no commit, no FASE C.*
