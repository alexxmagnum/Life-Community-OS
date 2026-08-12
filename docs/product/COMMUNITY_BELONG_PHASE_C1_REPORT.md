# Community Belong Phase C.1 Report

> First visual Belong layer on Community hub.  
> Checkpoint before work: `2dfb11d` (FASE B freeze).  
> **No commit in this phase. No FASE C.2. No ConversationExperience / bottom-nav changes.**

---

## Objetivo C.1

Hacer visibles las entradas Belong:

```
Comunidad
├── Ahora
├── Grupos
├── Proponer
└── Oficial
```

usando adapters FASE B, sin reescribir Community ni romper `?tab=`.

---

## Plan de archivos (pre-implementación)

| Archivo | Acción |
|---------|--------|
| `tenants/life-panoramica/src/community-hub.ts` | Extender defs Belong + resolve helpers |
| `apps/web/src/screens/CommunityScreen.tsx` | Nav interna + retítulos de capas |
| `packages/ui/.../CommunityHubSurfaces.tsx` | **Sin cambios** (reuso) |
| Conversation / bottom nav / public paths | **Sin cambios** |

---

## Cambios realizados

### 1. Adapters Belong (`community-hub.ts`)

- `communityBelongLayers` — label, purpose, `sectionId`, `primaryAreaId` por capa H1
- `communityBelongLayerDefinition()`
- `communityBelongLayerFromArea()` — highlight; `participacion` → Proponer (soft); plaza/outside → `null`
- `resolveCommunityBelongLayer()` — `?tab=` layer alias o area canónica/legacy

### 2. Superficie interna Belong (`CommunityScreen.tsx`)

- `FilterChipRow` bajo el header: **Ahora · Grupos · Proponer · Oficial**
- Click → `router.push(communityHubHref(primaryAreaId))` (canonical `?tab=`, scroll vía effect existente)
- Retítulos de sección:
  - Ahora mismo → **Ahora**
  - Grupos → **Grupos** (sin cambio)
  - Decidir juntos → **Proponer**
  - Información oficial → **Oficial**
- **En la plaza:** encapsulada sin decidir (comportamiento + título intactos)
- **Explorar:** intacto (C.2)

### 3. Documentación

- Este reporte

---

## Archivos modificados

- `tenants/life-panoramica/src/community-hub.ts`
- `apps/web/src/screens/CommunityScreen.tsx`
- `docs/product/COMMUNITY_BELONG_PHASE_C1_REPORT.md` (nuevo)

---

## Compatibilidad mantenida

| Contrato | Estado |
|----------|--------|
| 8 area ids | Conservados |
| `?tab=` canónicos + legacy | Siguen resolviendo / scroll |
| Aliases H1 `ahora` / `proponer` / `oficial` | Activos |
| DOM `plaza-*` + `#plaza-avisos` | Sin rename |
| Rutas `/community`, content, groups, official, conversation | Sin cambio |
| Bottom nav | Intacta |
| ConversationExperience | Intacta |
| Nav Belong escribe `primaryAreaId` (no borra areas) | Sí |

Highlight notes:

- `/community` sin tab → chip **Ahora**
- `?tab=conversaciones|espacios|mascotas` → sin chip Belong forzado
- `?tab=participacion` → soft-highlight **Proponer**

---

## Caso pendiente — En la plaza

**No decidido** (opción A absorber en Ahora vs B bloque propio).

C.1: se mantiene como capa scroll entre Ahora y Grupos; `?tab=conversaciones` sigue aterrizando ahí; no es root Belong en la chip row.

---

## Validación

| Check | Resultado |
|-------|-----------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` | **PASS** (warning preexistente `ServicesCategoryScreen` img) |

---

## Pendientes (fuera de C.1)

- Decisión plaza (A/B)
- D5 / D6 / Mascotas / D13
- FASE **C.2**: gate/retirar portal Explorar
- Soft-deprecate roots Operate dentro de Comunidad
- Rename DOM `plaza-*` (no en C.1)
- Commit de C.1 (esperar confirmación humana)

---

## Explicit non-actions

- No rewrite de Community  
- No FASE C.2  
- No commit  
- No push  

---

*End of Community Belong Phase C.1 Report.*
