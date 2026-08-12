# Community Belong C.3 Readiness

> Readiness only. **No code. No implementation. No commit.**  
> After: `c6c24d2` (C.1 Belong nav) · `f61b12b` (C.2 content ownership).  
> Bases: `IA_DECISION.md`, `COMMUNITY_BELONG_MAPPING.md`, `COMMUNITY_BELONG_MIGRATION_PLAN.md`,  
> `COMMUNITY_BELONG_PHASE_C1_REPORT.md`, `COMMUNITY_BELONG_PHASE_C2_REPORT.md`.

---

## Contexto

C.1 y C.2 dejaron Comunidad con:

- Chip Belong: Ahora · Grupos · Proponer · Oficial  
- Contenido owned bajo esas capas  
- **En la plaza** encapsulada (sin decisión)  
- **Explorar** aún visible como portal cross-module (`plaza-explore`)

H1 / IA_DECISION: *Community Explorar must not be a global module portal.*  
C.3 es el candidato natural a **retirar o gatear** ese portal — solo si Operate / Life tienen puertas suficientes.

---

## 1. Explore dentro de Comunidad

Estado actual (tiles en `CommunityScreen` → Explorar):

| Tile | Destino hoy | Clasificación C.3 |
|------|-------------|-------------------|
| **Experiencias** | `/experiences` | **Mover futuro a otra superficie** → **Life / Planes** |
| **Servicios** | `/services` | **Mover futuro a Operate** → bottom nav Servicios |
| **Espacios** | `/resources` | **Mover futuro a Operate** → Servicios / Reservas (vocabulario D1 pendiente) |
| Mascotas (panel) | on-hub / near / work / groups | **Pendiente** (no cerrar en C.3) |
| Vivienda | gated (`housingSurfaceReady = false`) | **Pendiente** D13 — no reabrir |

### Resumen de clases pedidas

| Clase | Qué entra |
|-------|-----------|
| **Mantener en Comunidad** | Nada del portal Explorar como *peer Belong*. Belong ya posee Ahora/Grupos/Proponer/Oficial (+ plaza encapsulada). |
| **Mover futuro a Operate** | Servicios, Espacios (booking/resources) |
| **Mover futuro a otra superficie** | Experiencias → Life / Planes (hamburger overflow / directorio Life) |
| **Pendiente** | Mascotas, D13 Housing, D1 label booking |

**C.3 no inventa owners nuevos** — aplica la gramática ya decidida en IA_DECISION.

---

## 2. En la plaza — sin decidir

C.2 ya mete peeks de actividad en **Ahora**; el bloque **En la plaza** sigue con el feed completo. C.3 **no debe** absorber ni eliminar plaza.

### Opciones (abiertas)

| Opción | UX | Técnico |
|--------|----|---------|
| **A — Absorber en Ahora** | Un solo “arriba”; menos labels; riesgo de mezclar urgencia con ruido social | Fusionar/anidar `plaza-important` + `plaza-activity`; `conversaciones` → alias |
| **B — Superficie propia interna** | Separa alerta vs vida vecinal; H1 “4” se lee como 5 bloques | Mantener dos section ids / dos lands `?tab=` |

### Impacto si C.3 toca plaza por error

- UX: confunde peeks C.2 con ownership final  
- Técnico: rompe `?tab=conversaciones`, D6, anchors `#plaza-activity`  
- **Regla readiness:** C.3 **out of scope** para plaza.

---

## 3. Superficies legacy

| Superficie / contrato | Clasificación | Nota C.3 |
|----------------------|---------------|----------|
| Sección UI **Explorar** | **Ocultar** (preferido) o retirar visual | Gate flag / no render tiles Operate·Life; **no** borrar area ids |
| `?tab=espacios` | **Alias** | Seguir resolviendo; land puede quedar en ancla explore vacía o soft-scroll top — sin redirect obligatorio a `/resources` en C.3 temprano |
| `?tab=mascotas` | **Alias** + **Pendiente** | No eliminar id; panel puede quedar oculto con el portal |
| `?tab=conversaciones` | **Mantener** (alias plaza) | Fuera de C.3 |
| `?tab=participacion` | **Alias** → Proponer land | Fuera de C.3 (D5) |
| Area ids (8) | **Mantener** | D12 / compat |
| Labels “Decidir juntos” / “Información oficial” | Ya renombrados C.1 | N/A |
| Hamburger leaves `c-espacios` / `c-participacion` | Ya omitidos Phase 2 | **Mantener** omisión |
| `/housing` shim | **Mantener** | No peer Explorar |
| HubTile kit | **Mantener** en UI package | Dejar de usarlo como portal global en Comunidad |
| Conversation routes | **Mantener** | C.3 no toca |

**Eliminar en C.3:** solo la *presentación* del portal como menú global — no eliminar rutas, ids ni ConversationExperience.

---

## 4. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Romper `?tab=espacios\|mascotas` | Alta | Alias + ancla `plaza-explore` o stub id; no 404 |
| Quitar Explorar sin puerta Life clara | Alta | Dependencia: Experiencias alcanzable fuera (hamburger / Home / `/experiences`) |
| Vecinos pierden atajo Espacios/Servicios | Media | Bottom **Servicios** + Reservas/`/resources` ya existen |
| Partial adoption (docs vs UI) | Media | Exit criteria: portal no visible o flagged off |
| Tocar ConversationExperience | Alta (evitar) | **No tocar** hosts ni paths `…/conversation` |
| Bottom nav / rutas públicas | Alta (evitar) | C.3 = composición hub + opcional projector copy; no nuevos paths |
| Absorber plaza “de paso” | Media | Scope freeze plaza |
| Soft-redirect `espacios` → `/resources` | Media | Opcional **después** de gate UI; no mezclar con primer slice |

---

## Qué puede hacer C.3

1. **Gate / ocultar** la sección Explorar (Experiencias, Servicios, Espacios tiles) en Comunidad.  
2. Conservar `plaza-explore` (o stub) para deep links `espacios` / `mascotas`.  
3. Documentar ownership: Operate vs Life (sin nuevas rutas).  
4. Opcional menor: copy hamburger Life si ya hay overflow (solo si no abre scope Life rebuild).  
5. Flag tenant/feature para rollback rápido del portal.  
6. Report `COMMUNITY_BELONG_PHASE_C3_REPORT.md` + typecheck/lint.

---

## Qué no debe tocar C.3

- Bottom navigation  
- ConversationExperience y rutas de conversación  
- Decisión **En la plaza** / absorción en Ahora  
- D5, D6, D13, Mascotas product placement  
- Borrar area ids o `?tab=` legacy  
- Nuevas rutas públicas Belong  
- Rewrite de CommunityScreen / HubSurfaces  
- Reabrir tile Vivienda  

---

## Dependencias externas

| Dependencia | Para C.3 |
|-------------|----------|
| Bottom nav **Servicios** | Puerta Operate para Servicios (y Espacios vía hub servicios/reservas) |
| `/experiences` + entrada Life (Home intent / hamburger Experiencias) | Puerta Life sin portal Comunidad |
| `/resources` + leaf Reservas | Puerta Operate Espacios |
| Life overflow hamburger completo | **No bloquea** gate mínimo; mejora discoverability post-C.3 |
| D1 vocabulary | No bloquea gate; afecta labels Operate |
| D12 `?tab=` forever | Alias policy |

**Gate mínimo viable:** Servicios en tab bar + Experiencias URL/menu existentes + resources path — ya true en producto actual → C.3 **técnicamente desbloqueable** para *ocultar* Explorar.

**Gate producto fuerte:** Life directory hamburger coherente — recomendable antes de comunicar “Explorar ya no está”, no estrictamente antes de flag off.

---

## Orden recomendado

```
1. Confirmar puertas Operate/Life (checklist manual: /services, /experiences, /resources)
2. C.3a — Gate UI Explorar (flag); conservar ancla + ?tab= aliases
3. Validar deep links espacios/mascotas + Belong chips + typecheck/lint
4. Commit seguridad C.3
5. (Opcional) C.3b — soft-land espacios → Operate entry sin borrar tab id
6. NO mezclar con decisión plaza / D5 / D6
7. C.4+ o cleanup solo tras D12/plaza decisions
```

---

## Veredicto readiness

| Pregunta | Respuesta |
|----------|-----------|
| ¿C.3 puede planearse? | **Sí** |
| ¿C.3 puede implementarse ya (gate Explorar)? | **Sí, con scope estrecho** (ocultar portal + aliases) |
| ¿Bloqueado por plaza? | **No** |
| ¿Bloqueado por D5/D6/D13? | **No** para gate Explorar |
| Riesgo principal | Quitar portal sin comunicar puertas Life/Operate |

---

## Explicit non-actions (este documento)

- No código  
- No commit  
- No inicio de implementación C.3  

---

*End of Community Belong C.3 Readiness.*
