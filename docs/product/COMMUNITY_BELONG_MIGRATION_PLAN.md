# Community Belong Migration Plan

> Planning only. **No code. No route changes. No UI implementation. No commits.**  
> Bases: `IA_DECISION.md` (H1), `CURRENT_INFORMATION_ARCHITECTURE.md`,  
> `COMMUNITY_BELONG_MAPPING.md`, `IA_IMPLEMENTATION_PLAN.md`.

Tenant reference: **Life Panoramica**. Product: **Life Community OS**.

---

## Objetivo

Planificar la migración incremental de la **Comunidad actual** (6 capas scroll + 8 `?tab=` + rutas detalle/conversación) hacia la estructura **Belong H1**:

```
Comunidad (Belong)
├── Ahora
├── Grupos
├── Proponer
└── Oficial
```

Sin romper enlaces existentes. Sin reescritura completa. Sin decidir elementos marcados **pendiente**.

---

## Estado actual

| Dimensión | Realidad |
|-----------|----------|
| Ruta hub | Una sola: `/community` |
| UI | 6 capas scroll vertical (no tab bar persistente) |
| Modelo canónico | 8 area ids en `community-hub.ts` |
| Deep links | `/community?tab={areaId}` → scroll a sección |
| Detalle | `/community/content/[id]`, `/community/groups/[id]` |
| Chat | ConversationExperience en rutas `…/conversation` y `/official/…` |
| Explorar | Portal interno hacia Experiencias / Espacios / Servicios / Mascotas / Vivienda (gated) |
| Nav | Bottom **Comunidad** → `/community`; hamburger leaves → `?tab=` |

### Capas UI actuales

1. Ahora mismo  
2. En la plaza  
3. Grupos  
4. Decidir juntos  
5. Información oficial  
6. Explorar  

### Area ids actuales

`actualidad` · `grupos` · `conversaciones` · `canales` · `propuestas` · `participacion` · `espacios` · `mascotas`

---

## Destino H1

| Capa Belong | Rol |
|-------------|-----|
| **Ahora** | Qué afecta hoy (alerts; urgencias de decide según decisión futura) |
| **Grupos** | Pertenencia organizada + entrada a grupo / chat de grupo |
| **Proponer** | Superficie única de decide (propuestas) |
| **Oficial** | Entidades, avisos oficiales, canales como entrada |

**Fuera de Belong como dueño primario:** puertas Operate (Espacios, Servicios) y Life (Experiencias).  
**Nunca capa Belong:** ConversationExperience (capability).  
**No decidir aquí:** En la plaza (ubicación exacta), D5, D6, D13, Mascotas.

---

## Mapeo

### FASE 1 — Inventario de superficies actuales

| Superficie actual | Ruta | Estado | Responsabilidad | Destino H1 |
|-------------------|------|--------|-----------------|------------|
| Hub Comunidad | `/community` | activo | Plaza digital / scroll Belong | Comunidad (contenedor) |
| Ahora mismo | `/community` + `#plaza-important` | activo | Alerts + peek propuestas closing | **Ahora** |
| `?tab=actualidad` | `/community?tab=actualidad` | activo | Deep link → Ahora mismo | **Ahora** |
| En la plaza | `/community` + `#plaza-activity` | activo | Feed vecinal (no oficial, no proposal) | **Pendiente** (caso plaza) |
| `?tab=conversaciones` | `/community?tab=conversaciones` | activo | Deep link → plaza feed (no inbox chat) | **Pendiente** (D6 + plaza) |
| Grupos (capa) | `/community` + `#plaza-people` | activo | Rail de grupos | **Grupos** |
| `?tab=grupos` | `/community?tab=grupos` | activo | Deep link → Grupos | **Grupos** |
| Decidir juntos | `/community` + `#plaza-participate` | activo | Propuestas abiertas / closing | **Proponer** |
| `?tab=propuestas` | `/community?tab=propuestas` | activo | Deep link → Decidir | **Proponer** |
| `?tab=participacion` | `/community?tab=participacion` | activo (mismo land) | Alias funcional hacia propuestas | **Pendiente** (D5) |
| Información oficial | `/community` + `#plaza-official` | activo | Entidades / avisos / canales | **Oficial** |
| `?tab=canales` | `/community?tab=canales` | activo | Deep link → Oficial | **Oficial** |
| Explorar | `/community` + `#plaza-explore` | activo | Portal cross-module | **Fuera Belong** (mover ownership) |
| `?tab=espacios` | `/community?tab=espacios` | activo → Explorar | Atajo a Espacios/Operate | Operate (conceptual) |
| `?tab=mascotas` | `/community?tab=mascotas` | activo → Explorar | Panel temático | **Pendiente** |
| Tile Experiencias | desde Explorar → `/experiences` | activo | Puerta Life | Life / Planes |
| Tile Espacios | desde Explorar → `/resources` | activo | Puerta Operate | Operate / Servicios |
| Tile Servicios | desde Explorar → `/services` | activo | Puerta Operate | Operate / Servicios |
| Tile / panel Mascotas | on-hub | activo | Filtro / lugares | **Pendiente** |
| Tile Vivienda | gated | no visible | Housing | **Pendiente** (D13) |
| Content detail | `/community/content/[id]` | activo | Publicación / propuesta / aviso | Belong (según tipo) |
| Group detail | `/community/groups/[id]` | activo | Ficha de grupo | **Grupos** |
| Group conversation | `/community/groups/[id]/conversation` | activo | Chat de grupo | Capability + Grupos |
| Neighbour conversation | `/community/neighbours/…/conversation` | activo | Chat vecino | Capability |
| Official entity | `/official/[slug]` (+ `/conversation`) | activo | Autoridad / chat oficial | **Oficial** + capability |

---

### FASE 2 — Mapeado hacia H1 (decisiones planificadas)

Leyenda de migración:

| Tipo | Significado |
|------|-------------|
| **migra directamente** | Misma responsabilidad → capa H1 con retítulo / reorden mínimo |
| **se absorbe** | Contenido se pliega dentro de otra capa H1 |
| **queda como alias** | Id / deep link sigue resolviendo; no es capa visible primaria |
| **queda pendiente** | Bloqueado por D5 / D6 / D13 / caso plaza — **no decidir aquí** |

| Elemento | Decisión de migración |
|----------|------------------------|
| Capa Ahora mismo (alerts) | **migra directamente** → Ahora |
| Capa Grupos + `tab=grupos` | **migra directamente** → Grupos |
| Capa Decidir juntos + `tab=propuestas` | **migra directamente** → Proponer (rename copy) |
| Capa Información oficial + `tab=canales` | **migra directamente** → Oficial |
| `tab=actualidad` | **queda como alias** de Ahora (id puede permanecer) |
| Closing proposals peek en Ahora | **queda pendiente** (dual peek vs solo Proponer) |
| Capa En la plaza | **queda pendiente** — ver FASE 5 |
| `tab=conversaciones` | **queda pendiente** (D6) |
| `tab=participacion` | **queda pendiente** (D5); mientras tanto tratar como **alias** operativo hacia Proponer *sin cerrar D5* |
| Explorar Experiencias / Espacios / Servicios | **se absorbe** ownership fuera de Comunidad (Life / Operate); UI portal se retira en fase visual posterior |
| `tab=espacios` | **queda como alias** (scroll/compat); ownership Operate |
| `tab=mascotas` | **queda pendiente** |
| Vivienda / D13 | **queda pendiente** |
| Rutas content / groups / official / conversation | **migra directamente** (sin cambio de path) |
| ConversationExperience | **migra directamente** como capability (sin capa Belong) |

**No se decide en este plan:** plaza location, D5 merge definitivo, D6 naming, D13 Housing, Mascotas placement, dual peek de propuestas.

---

## Rutas

### FASE 3 — Rutas y compatibilidad

**Objetivo:** no romper enlaces existentes (bookmarks, hamburger histórico, notificaciones, shares).

#### Mantener (paths estables)

| Ruta | Motivo |
|------|--------|
| `/community` | Hub Belong permanente |
| `/community/content/[id]` | Detalle de contenido Belong |
| `/community/groups/[id]` | Detalle grupo |
| `/community/groups/[id]/conversation` | Chat grupo |
| `/community/neighbours/[personId]/conversation` | Chat vecino |
| `/official/[slug]` (+ conversation) | Oficial |

#### Alias (resolver siempre; no eliminar ids)

| Entrada | Comportamiento planificado |
|---------|----------------------------|
| `?tab=actualidad` | Alias → capa Ahora |
| `?tab=grupos` | Alias → capa Grupos |
| `?tab=propuestas` | Alias → capa Proponer |
| `?tab=canales` | Alias → capa Oficial |
| `?tab=participacion` | Alias → mismo land que Proponer **hasta D5** (sin borrar id) |
| `?tab=conversaciones` | Alias → land plaza actual **hasta D6 / decisión plaza** |
| `?tab=espacios` | Alias compat → hoy Explorar; luego puede landear Operate o soft-landing en hub sin portal |
| `?tab=mascotas` | Alias **hasta decisión Mascotas** |
| Legacy aliases ya en `community-hub.ts` | Conservar mapa legacy |

Policy relacionada: **D12** (`?tab=` forever) — no asumir borrado de query params en fases A–C.

#### Redirect

| Caso | Estrategia |
|------|------------|
| Nuevas rutas Belong | **No requeridas** en H1 default (`IA_IMPLEMENTATION_PLAN`) |
| `/housing` | Ya tratado fuera de este plan (shim / gate); no reabrir como peer Explorar |
| Cambio de `?tab=` a path segment | **No** en esta migración |

#### Deprecación futura (solo tras validación + D12)

| Elemento | Cuándo plantear |
|----------|-----------------|
| Área visible “Explorar” como portal global | Tras FASE C (cambio visual) + Life/Operate doors suficientes |
| `tab=espacios` / `tab=mascotas` como *roots* Belong | Soft-deprecate como roots; ids pueden vivir como alias |
| `tab=participacion` como leaf de menú | Ya omitido en menú Phase 2; id permanece hasta D5 |
| Labels “Decidir juntos” / “Canales” | Copy rename en FASE C; ids pueden quedar |

**No deprecar en migración Belong:** rutas de conversación ni ConversationExperience.

---

## Componentes

### FASE 4 — Componentes (sin reescritura completa)

#### `CommunityScreen` / `CommunityHubScreen`

| Acción | Detalle |
|--------|---------|
| **Mantener** | Shell `MobileScreen`, scroll sections, data wiring, `?tab=` scroll effect, create post CTA, capability gates |
| **Adaptar** | Títulos de capa → Ahora / Grupos / Proponer / Oficial; orden; gate/hide Explorar portal cuando Operate/Life estén listos |
| **Dividir** | Opcional más adelante: extractores por capa *solo si* el archivo crece; no obligatorio para H1 |
| **Dependerá de decisión futura** | Composición de “En la plaza”; peek de propuestas en Ahora; panel Mascotas |

#### `CommunityHubSurfaces` (`packages/ui`)

| Pieza | Acción |
|-------|--------|
| `HubAttentionCard` | **Mantener** → Ahora |
| `HubDoorCard` | **Mantener** → plaza / social |
| `HubProposalCard` | **Mantener** → Proponer (+ peek Ahora si permanece) |
| `HubRail` / `HubRailCard` | **Mantener** → Grupos |
| `HubRow` | **Mantener** → Oficial |
| `HubTile` / `HubTileGrid` | **Adaptar** uso: dejar de ser puertas Operate/Life *dentro* de Comunidad; kit puede vivir para otros hubs |
| `HubPanel` | **Dependerá** (Mascotas / secundarios) |
| Tokens CARD/ROW/PRESS | **Mantener** |

#### Componentes hijos / satélites

| Pieza | Acción |
|-------|--------|
| `HomeSection`, `EmptyState`, `Button` | **Mantener** |
| `CreatePostSheet` / create events | **Mantener** (entrada Belong) |
| Content / Group / Official screens | **Mantener** rutas; copy menor posible |
| ConversationExperience hosts | **Mantener** |
| `community-hub.ts` area model | **Adaptar** comentarios/ownership; **alias** ids; **no** borrar ids en fases tempranas |
| `navigation-projector` Comunidad leaves | **Adaptar** a capas Belong visibles; deep links conservados |

**Prohibido en este plan:** nuevo design system Community, fork completo de HubSurfaces, nuevas rutas de capa.

---

## Caso "En la plaza"

### FASE 5 — Análisis sin decisión

Hoy: capa 2, feed vecinal, `?tab=conversaciones`, `HubDoorCard`, create post.

No está nombrada en el cuarteto H1 (Ahora · Grupos · Proponer · Oficial). Sigue siendo contenido Belong central.

#### Opción A — Absorber en Ahora

Ahora = alerts + (opcional urgencias) + feed / pulse vecinal.

| Impacto UX | Impacto técnico |
|------------|-----------------|
| Un solo “arriba” emocional: “qué pasa ahora en la comunidad” | Fusionar o anidar secciones `plaza-important` + `plaza-activity` |
| Riesgo de scroll largo / mezcla alerta vs ruido social | Un deep link `actualidad` puede cubrir ambos; `conversaciones` queda alias |
| Mejor fit literal al nombre **Ahora** | Menos capas visibles (más cerca de 4) |
| Elder clarity: menos labels | Hay que definir peek vs feed completo |

#### Opción B — Superficie propia (interna, no quinto root de nav)

Plaza permanece bloque interno bajo `/community`, sin ser bottom-nav ni quinto concepto de producto.

| Impacto UX | Impacto técnico |
|------------|-----------------|
| Conserva la separación alerta vs vida vecinal (clara hoy) | Mantener dos section ids / dos lands `?tab=` |
| H1 “4 capas” se lee como 5 bloques en pantalla | Copy: cuarteto H1 + plaza como sub-capa documentada |
| Menos riesgo de diluir urgencia de alerts | Menos refactor de scroll/deep links |
| Puede confundir vs diagrama Belong de 4 | Naming D6 sigue abierto |

**Este plan no elige A ni B.** Bloquea FASE C completa de “4 labels exactos” hasta decisión de producto.

---

## Riesgos

| Riesgo | Severidad | Mitigación planificada |
|--------|-----------|------------------------|
| Partial adoption (docs Belong, UI aún Explorar) | Alta | Exit criteria FASE C: portal Explorar no es menú global |
| Romper `?tab=` / bookmarks | Alta | Alias-first; D12; no borrar area ids en A–C |
| Decidir plaza demasiado pronto | Media | FASE 5 explícita; FASE C puede retitular 3 capas fijas primero |
| Confundir `conversaciones` con chat | Media | No tocar hasta D6; copy interim cuidadoso |
| Quitar Explorar antes de que Life/Operate tengan puertas claras | Media | Gate portal solo cuando overflow Life + Servicios cubran jobs |
| Reescritura de `CommunityScreen` | Media | Adaptar capas; no rewrite |
| Dual peek propuestas (Ahora + Proponer) | Baja–Media | Dejar pendiente; no inventar en código |
| Housing / Mascotas reaparecen como peers | Media | Seguir gate D13; Mascotas pendiente |

---

## Roadmap

### FASE A — Preparación

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Congelar ownership documental; alinear comentarios/maps (`community-hub`, ownership map, este plan); listar ids que serán alias; no cambiar UI visible Belong |
| **Riesgo** | Bajo — solo docs / metadata |
| **Validación** | Mapping + migration plan revisados; ningún area id eliminado; typecheck/lint sin cambios funcionales requeridos |

### FASE B — Compatibilidad

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Garantizar que todos los `?tab=` y deep links actuales siguen resolviendo al land correcto; hamburger leaves coherentes con Belong **sin** borrar aliases; projector no promete Explorar como área peer |
| **Riesgo** | Bajo–Medio — regresión de scroll targets |
| **Validación** | Matriz manual: 8 tabs + content/groups/official/conversation; bookmarks legacy; no 404 nuevos |

### FASE C — Cambio visual

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Retitular / reordenar capas Belong estables (**Grupos**, **Proponer**, **Oficial**, **Ahora** alerts); gate o retirar portal Explorar cuando Operate/Life lo permitan; **sin** cerrar plaza/D5/D6 si siguen abiertos (plaza puede quedar con label interim) |
| **Riesgo** | Medio — percepción de “menos puertas”; scroll length; copy |
| **Validación** | Comunidad no actúa como sitemap global; 3–4 capas Belong legibles; Explorar cross-module ausente o flagged; rutas detalle intactas |

### FASE D — Limpieza futura

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Tras decisiones D5/D6/plaza/D12/D13: soft-deprecate roots obsoletos; unificar copy; opcional extract de secciones; menú sin leaves huérfanos |
| **Riesgo** | Medio si se borran aliases demasiado pronto |
| **Validación** | Policy D12 respetada o explícitamente cerrada; analytics/deeplink audit; no rotura de ConversationExperience |

### Orden recomendado

```
A Preparación → B Compatibilidad → (decisión plaza / D5 / D6 según necesidad)
→ C Cambio visual (Explorar out + labels Belong)
→ D Limpieza futura
```

C puede empezar en las tres capas no bloqueadas (Grupos / Proponer / Oficial + alerts Ahora) **antes** de cerrar plaza, usando label interim para el feed.

---

## Resumen ejecutivo

| Qué | Plan |
|-----|------|
| Paths | Mantener |
| Area ids | Alias; no delete temprano |
| Capas claras | Ahora (alerts), Grupos, Proponer, Oficial → migración directa |
| Explorar Operate/Life | Mover ownership; retirar portal en FASE C |
| Plaza / D5 / D6 / Mascotas / D13 | Pendiente — no decidir en este documento |
| Componentes | Reusar HubSurfaces; adaptar CommunityScreen; no rewrite |
| Chat | Capability intacta |

---

*End of Community Belong Migration Plan. STOP — sin código, sin commit.*
