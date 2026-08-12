# Community Belong C.1 Review

> Audit only. **No code changes. No C.2 implementation.**  
> Sources: `COMMUNITY_BELONG_PHASE_C1_REPORT.md`, `COMMUNITY_BELONG_MAPPING.md`,  
> `COMMUNITY_BELONG_MIGRATION_PLAN.md` + current `CommunityScreen.tsx` / `community-hub.ts`.  
> Base freeze: `2dfb11d`. C.1 work still **uncommitted** on `main` (ahead 1 + local edits).

---

## Resultado

**READY**

C.1 cumple el objetivo: navegación interna Belong visible (Ahora · Grupos · Proponer · Oficial), cableada a adapters FASE B, sin romper `?tab=`, rutas, ConversationExperience ni bottom nav. Los hallazgos siguientes son mejoras o riesgos conocidos, no fallos de aceptación de C.1.

---

## 1. UX

| Check | Veredicto | Notas |
|-------|-----------|-------|
| Chip row Belong | OK | `FilterChipRow` bajo el header Comunidad; reusa patrón existente (Marketplace / Experiences) |
| Labels Ahora / Grupos / Proponer / Oficial | OK | Coinciden con `communityBelongLayers` y con retítulos de sección |
| Jerarquía visual | OK con matiz | H1 de página sigue siendo **Comunidad**; chips son sub-navegación; secciones retituladas |
| Coherencia con Comunidad | OK con matiz | Aún conviven **En la plaza** + **Explorar** como capas scroll (esperado C.1 / C.2) |

**Hallazgo UX-1 (no bloqueante):** Con 4 chips Belong y 6 bloques scroll, la gramática H1 se lee incompleta en pantalla. Documentado a propósito (plaza pendiente; Explorar → C.2).

**Hallazgo UX-2 (no bloqueante):** Si no hay avisos/closing proposals, `Ahora` solo deja un ancla vacía; el chip “Ahora” aterriza junto a **En la plaza**, lo que puede sentirse como “Ahora = feed”. Preexistente en estructura; el rename agrava la percepción.

---

## 2. Funcionalidad

Revisión estática del cableado (click → `communityHubHref(primaryAreaId)` → `?tab=` → `communityHubSectionIdForArea` → `scrollIntoView`):

| Entrada | `?tab=` escrito | Sección DOM | Contenido esperado |
|---------|-----------------|-------------|-------------------|
| Ahora | `actualidad` | `plaza-important` | Alerts + peek closing proposals (o ancla vacía) |
| Grupos | `grupos` | `plaza-people` | Rail / lista grupos → `/conversation` |
| Proponer | `propuestas` | `plaza-participate` | `HubProposalCard` list |
| Oficial | `canales` | `plaza-official` | Entities / notices / channels |

Highlight:

- `/community` sin tab → chip **Ahora**
- `participacion` → soft **Proponer**
- `conversaciones` / `espacios` / `mascotas` → sin chip Belong forzado

**Hallazgo FN-1 (preexistente):** Si `groupItems.length === 0` o `!showOfficial`, la sección no se monta; el scroll a `plaza-people` / `plaza-official` puede no-op. No introducido por C.1; afecta deep links antiguos igual.

---

## 3. Compatibilidad

| Contrato | Estado |
|----------|--------|
| 8 area ids | Conservados |
| `?tab=` canónicos + legacy (`feed`, `groups`, `decide`, …) | Resolver intacto |
| Aliases H1 `ahora` / `proponer` / `oficial` | En `LEGACY_TAB_MAP` + resolve Belong |
| DOM `plaza-*` / `#plaza-avisos` | Sin rename |
| Rutas content / groups / neighbours / official | Sin cambio de path |
| ConversationExperience | No tocada (entradas grupo siguen a conversation routes) |
| Bottom nav | Intacta |

---

## 4. Arquitectura

| Check | Estado |
|-------|--------|
| Adapters centralizados | OK — `communityBelongLayers`, section map, ownership, resolve en `community-hub.ts` |
| Sin pantallas duplicadas | OK — un solo `CommunityHubScreen` |
| HubSurfaces | Sin fork; cards reutilizadas |
| Tenant | Labels Belong viven en pack Life Panoramica (correcto para tenant content IA) |
| Platform vs tenant | Nav UI en `apps/web`; modelo en tenant — alineado al patrón actual del hub |

**Hallazgo AR-1 (menor):** `goToBelongLayer` hace `.find` en lugar de `communityBelongLayerDefinition` (helper ya exportado). Duplicación mínima, no incorrecta.

**Hallazgo AR-2 (proceso):** C.1 no está commitado; solo FASE B (`2dfb11d`) está en historial local ahead of origin.

---

## Hallazgos (resumen)

1. Cuatro chips vs seis capas visibles (plaza + Explorar) — esperado, diluye H1 hasta C.2 / decisión plaza.  
2. Ahora vacío → aterrizaje visual cerca del feed plaza.  
3. Anclas ausentes si Grupos/Oficial no renderizan (preexistente).  
4. Micro-duplicación `.find` vs `communityBelongLayerDefinition`.  
5. Trabajo C.1 uncommitted.

---

## Cambios recomendados

Antes o al abrir C.2 (no obligatorios para cerrar C.1):

1. **Commit de seguridad C.1** (código + `COMMUNITY_BELONG_PHASE_C1_REPORT.md` + este review) antes de tocar Explorar.  
2. Empty / stub visible mínimo en **Ahora** cuando no hay atención (copy quiet), para que el chip no “desaparezca” en el feed.  
3. Anclas DOM estables para Grupos/Oficial aunque la lista esté vacía (mejora deep link).  
4. Usar `communityBelongLayerDefinition` en el handler de chips.  
5. No decidir plaza aquí; encapsulación actual es correcta.

---

## Bloqueos para C.2

| Ítem | ¿Bloquea C.2? | Nota |
|------|---------------|------|
| Decisión “En la plaza” (A/B) | **No** | C.2 = Explorar ownership; plaza puede seguir encapsulada |
| D5 / D6 / D13 / Mascotas | **No** para gate Explorar | Seguir pending |
| Commit C.1 | **Recomendado sí** | Congelar C.1 antes de retirar portal |
| Operate / Life doors suficientes | **Sí (producto)** | No retirar Explorar si Experiencias/Espacios/Servicios no tienen puerta clara fuera de Comunidad |
| ConversationExperience / bottom nav | N/A | Fuera de alcance C.2 también |

**C.2 puede planearse** con C.1 en **READY**, tras commit de seguridad y con criterio explícito de gate Explorar (no big-bang delete sin owners Operate/Life).

---

## Explicit non-actions (esta revisión)

- No se modificó código  
- No se implementó C.2  
- No se ejecutó commit  

---

*End of Community Belong C.1 Review.*
