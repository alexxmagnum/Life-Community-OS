# PILOT READINESS AUDIT

**Phase:** 18P  
**Date:** 2026-09-02  
**Scope:** Documentation only — no code, features, or redesign  
**Basis:** Product after 18N, 18O, 18O-FIX-A (plus 18L-FIX-A/B/C, 18M-FIX-A)

---

## Hipótesis principal

> “Una comunidad real puede pasar de descubrir LIFE a crear actividad y participar sin necesitar explicación manual.”

**Flujo objetivo**

```
VISITOR → DESCUBRE TERRITORIO → CREA CUENTA → SE UNE →
CREA UNA ACCIÓN → OTRAS PERSONAS PARTICIPAN → VIDA COMUNITARIA
```

**Veredicto de hipótesis:** Parcialmente sostenida en producto; **no lista para piloto abierto** hasta resolver 2 bloqueadores reales.

---

## Estado actual (resumen)

| Área | Estado |
|------|--------|
| Onboarding móvil / registro lean | Listo |
| Claridad visual Account vs Membership (copy + estados) | Mejorado (18O-FIX-A) |
| Coherencia comportamiento registro → pending | **Rota** |
| Discover-first para visitantes | Mejorado |
| Loop crear → participar (miembros activos) | Funciona |
| Avisos oficiales vs contenido comunitario | Funciona |
| Ayuda ≠ Servicios | Funciona |
| Negocios (draft → published) | Funciona |
| Admin checklist + métricas de actividad | Funciona |
| Territorio con vida al primer login | **Depende de seed manual** |

---

## Escenario piloto — Panorámica Golf (simulación)

**No se crean usuarios reales.** Solo capacidad.

| Rol | Cantidad | Capacidad del producto |
|-----|----------|------------------------|
| Administrador | 1 | Checklist de lanzamiento, avisos, aprobación membership, review negocios |
| Vecinos activos (creadores) | 3 | Magic Plus → experiencias / avisos / ayuda |
| Vecinos participantes | 5 | Descubrir → Participar (si hay contenido y membership activa) |
| Negocio local | 1 | Registro → revisión → published visible en territorio |

**Condición operativa:** El piloto solo tiene sentido si el admin **pre-siembra** actividad real (lugares ya existen; experiencias/avisos no) **antes** de invitar a los 5 participantes.

---

## Recorrido piloto

### Journey 1 — Nuevo vecino

**Persona:** Nunca conoce LIFE.

```
Entrada → Home → Discover → Registro → sesión automática → /me (welcome) → Unirse
```

| Pregunta | Evaluación |
|----------|------------|
| ¿Entiende LIFE? | **Parcial** — “vecinos, lugares, actividades reales; no red social” sí; job-to-be-done débil si Home vacío |
| ¿Sabe qué hacer? | **Mejorado** — un CTA “Únete a LIFE” + Explorar lugares / Ver servicios |
| ¿Sabe qué es una comunidad? | **Parcial** — territorio + pertenencia; join pide código |
| ¿Confusión? | **Sí** — tras registro: “Solicitud enviada” + formulario de código a la vez |

**Resultado esperado:** “Quiero formar parte”  
**Realidad:** Quiere unirse, pero **no sabe si ya pidió acceso o si falta el código**.

---

### Journey 2 — Primer creador

```
+ → Experiencia → Formulario → Lugar → Fecha → Publicar
```

| Pregunta | Evaluación |
|----------|------------|
| ¿Minutos? | **Sí**, si ya es miembro activo |
| ¿Campos con sentido? | **Sí**, pero densos (título, descripción, fecha, hora, punto, capacidad) |
| ¿Acción clara? | **Sí** — Magic Plus → Experiencia |

**Resultado esperado:** “He creado algo para mi comunidad” — **alcanzable** para activos.

---

### Journey 3 — Participante

```
Home → Community → Experience → Participar
```

| Pregunta | Evaluación |
|----------|------------|
| ¿Puede encontrarla? | **Sí** si hay experiencias publicadas y membership activa |
| ¿Puede unirse? | **Sí** (Participar / Unirme) |
| ¿Qué ocurre después? | Confirmación de participación — loop claro |

**Resultado:** Crear → Participar **funciona** entre miembros activos.  
**Fallo típico del piloto:** participante invitados a un Home vacío → abandona.

---

### Journey 4 — Comunicación (admin)

Ejemplos: mantenimiento piscina, reunión, información importante.

| Pregunta | Evaluación |
|----------|------------|
| ¿Llega? | **Sí** — avisos en Home / Comunidad |
| ¿≠ post? | **Sí** — anuncio estructurado; categorías oficiales restringidas |
| ¿Contexto? | **Sí** — territorio / oficial vs comunidad |

**Resultado:** Comunicación estructurada — **lista**.

---

### Journey 5 — Economía local

Negocio: restaurante / profesional.

| Pregunta | Evaluación |
|----------|------------|
| ¿Aparece correctamente? | Solo si `published` tras review |
| ¿Separado de experiencia? | **Sí** |
| ¿Genera actividad? | Visibilidad territorial + contacto; no es feed social |

**Resultado:** Negocio como parte del territorio — **lista** (con ciclo de confianza).

---

### Journey 6 — Ayuda

| Pregunta | Evaluación |
|----------|------------|
| ¿Ayuda vecinal ≠ servicio profesional? | **Sí** (boundary 18L-FIX-B) |

**Resultado:** Comunidad ayuda / profesionales resuelven — **lista**.

---

## Auditoría de primera sesión

### Primeros 5 minutos

| Momento | Qué ocurre |
|---------|------------|
| Entiende | Lugar + anti-red-social |
| Toca | Discover / lugares / Únete a LIFE |
| Duda | Tras registro: ¿pending o código? |
| Abandona | Si no hay actividad visible ni claridad de join |

### Primer día

| | |
|--|--|
| ¿Participa? | Solo si hay experiencias y membership **active** |
| ¿Crea? | Solo creadores activos con Magic Plus |
| ¿Vuelve? | Depende de haber visto vida real el día 1 |

### Primera semana

| | |
|--|--|
| ¿Movimiento? | Solo si 3 creadores publican y admin opera |
| ¿Valor? | Sí: experiencias + avisos + ayuda + negocios — si hay seed |

---

## Métricas de piloto

**No medir:** likes, seguidores, tiempo en app, engagement, ranking.

**Medir (actividad real)** — ya modeladas en `community_activation_metrics`:

| Métrica | Uso en piloto |
|---------|---------------|
| `experiencesCreated` | Creación |
| `experiencesParticipants` | Participación |
| `announcementsPublished` | Comunicación |
| `businessesPublished` | Economía local |
| `servicesAvailable` | Oferta profesional |
| `reservationsCompleted` | Uso de espacios |
| `helpRequestsCreated` | Ayuda vecinal |
| `helpRequestsCompleted` | Ayuda resuelta |

**Ops adicionales (no engagement):**

- registrados → unidos (active)
- tiempo hasta primera experiencia (creadores)
- % participantes que completan “Participar”

---

## Criterios para piloto

| Criterio | Resultado |
|----------|-----------|
| Visitante entiende propuesta | **PARTIAL** |
| Registro funciona | **PASS** |
| Membership funciona sin confusión | **FAIL** |
| Crear experiencia funciona | **PASS** (activos) |
| Participar funciona | **PASS** (activos + contenido) |
| Avisos funcionan | **PASS** |
| Servicios no confunden | **PASS** |
| Negocios tienen sentido | **PASS** |
| Admin puede operar lo básico | **PASS** |

---

## Bloqueadores piloto

| Bloqueador | Impacto | Prioridad |
|-----------|---------|-----------|
| Registro crea membership `pending` mientras UI muestra “Solicitud enviada” **y** pide código/invitación | Usuario no sabe si esperar, introducir código o ya solicitó | **P0** |
| Territorio sin experiencias/avisos al invitar vecinos | Home vacío → hipótesis de piloto falla; nadie participa | **P0** |
| Formulario de experiencia largo + CTA “Publicar” | Ralentiza primera creación | **P1** |
| Discover fuera del bottom nav | Exploración menos natural | **P1** |
| Confirmación de email sin sesión | Callejón sin retorno al join | **P1** |
| Toda activación depende de aprobación admin | Cuello de botella con 8 vecinos | **P1** |
| Capacidad / ID de invitación técnicos | Fricción menor | **P2** |

---

## Riesgos

| Riesgo | Severidad | Nota |
|--------|-----------|------|
| Contenido vacío inicial | **Alta** | Lugares ≠ vida; momentos/avisos vacíos |
| Dificultad de activación | **Alta** | Pending + código + approve |
| Dependencia del administrador | **Alta** | Seed, approve, publish negocio, primer aviso |
| Falta de usuarios iniciales | **Alta** | 5 participantes sin 3 creadores activos = silencio |
| Confusión de módulos | **Media-baja** | Help/Services OK; Magic Plus muchas intenciones |

---

## Requisitos mínimos antes de usuarios reales

1. **Coherencia Account ≠ Membership**  
   Pending solo tras join explícito (código/invitación), **o** UI de solo-espera si ya hay pending — nunca ambos relatos a la vez.

2. **Seed mínimo de vida (datos reales, no fake)**  
   Admin completa checklist:
   - ≥1 aviso oficial o comunitario real  
   - ≥1 experiencia real (fecha/lugar)  
   - 1 negocio en camino a published (opcional pero recomendado)  
   - Códigos/invitaciones listos para vecinos  

3. **Ensayo cerrado (dry run)**  
   Admin + 1 creador + 1 participante: registro → join → crear → participar → aviso.

4. **Métricas de actividad encendidas** en dashboard admin (ya existen).

---

## Decisión final

### Estado: **NOT READY**

**Bloqueadores reales (únicos):**

1. **Membership contradictoria post-registro** — pending automático vs join con código / “solicitud enviada”. Impide un primer usuario confiado.  
2. **Cold start sin vida** — invitar vecinos a un territorio sin experiencias/avisos reales convierte LIFE en app vacía.

Cuando ambos estén resueltos (coherencia de join + seed mínimo real), el producto es **viable para un piloto guiado** Panorámica Golf (1 admin · 3 creadores · 5 participantes · 1 negocio).

---

## Invariantes respetados

- Activity ≠ Engagement  
- Community ≠ Social Network  
- Account ≠ Membership  
- Seed ≠ Fake Content  
- Visitor ≠ Member  

**Phase 18P no modifica código.**

---

## FIN PHASE 18P
