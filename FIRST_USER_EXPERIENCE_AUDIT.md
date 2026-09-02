# FIRST USER EXPERIENCE AUDIT

**Phase:** 18O  
**Date:** 2026-09-02  
**Scope:** Documentation only — no code, features, or architecture changes  
**Basis:** Product surfaces after 18L-FIX-A/B/C, 18M-FIX-A, 18N

---

## Product hypothesis

> “Una persona nueva puede descubrir LIFE, crear una cuenta, unirse a una comunidad y realizar una acción útil sin necesitar explicación.”

**Verdict:** Partially validated.

| Criterion | Result |
|-----------|--------|
| Understand LIFE without explanation | **Weak** — positioning lands; job-to-be-done weak when territory is quiet |
| Create account in &lt; 1 minute | **Yes** — email + password + confirm only |
| Join without confusion | **No** — pending-from-register vs “join later” conflict |
| Create something useful | **Yes** for active members — Magic Plus → experience works |
| Another person can participate | **Yes** if they are active members and the experience is visible |
| Feels like a living community vs empty app | **Depends on seed** — empty territory reads as empty app |

---

## Executive summary

### Mayor fricción actual

**Estado de pertenencia confuso después del registro.**  
El registro crea membresía `pending` automáticamente, mientras el copy dice “únete cuando quieras” y `JoinCommunityPanel` pide código. El usuario no sabe si ya pidió acceso, si falta un código, o si puede explorar.

### Mejor loop actual

**Magic Plus → Crear experiencia → Participar** (para miembros activos).  
Crear → detalle → “Participar” / “Unirme” es el loop más claro y alineado con el modelo territorio → personas → acciones.

### Bloqueo P0

1. Unificar **Account ≠ Membership** en comportamiento y copy (pending automático vs join explícito).  
2. Colapsar el **stack de CTAs del Home visitante** (múltiples “Crear cuenta” / “Únete” / paneles de activación).  
3. Clarificar **estado en `/me`**: ¿necesita código, está pendiente, o ya es miembro?

### Próximo paso recomendado

**Phase 18O-FIX-A — First-user clarity:**  
una sola historia de join, un CTA primario en Home visitante, Discover como camino de valor antes de conversión, y menos campos en la primera experiencia.

---

## Recorrido completo (conceptual)

```
VISITOR
  Home (territorio + anti-red-social)
  Discover / Cerca / Life Place / Servicios   ← valor público
  Profile → Crear cuenta
       ↓
CREAR CUENTA
  Email * · Contraseña * · Confirmar *
  Sesión automática (cookies)
       ↓
/me + JoinCommunityPanel
  Código comunidad  |  Aceptar invitación
       ↓
registered / pending / active
       ↓
EXPLORAR (Home · Comunidad · Servicios · Life Place)
       ↓
Magic Plus → primera acción (experiencia / aviso / ayuda / …)
       ↓
OTRO USUARIO descubre → participa
```

### Capturas conceptuales (viewport mental)

**1. Visitor Home (territorio vacío)**  
Hero: “Bienvenido a {lugar}” + “Life conecta vecinos…”  
Debajo: tarjeta “Únete a tu comunidad” + empty “La comunidad empieza contigo” + “Explorar comunidad” + “Crear cuenta” + `CommunityActivationPanel` + puertas Help/Services.  
→ *Sensación: muchas puertas, poca prueba de vida.*

**2. Registro**  
“Crear cuenta” / “Únete a LIFE y descubre tu comunidad”  
Tres campos + CTA. Sin código comunidad.  
→ *Rápido. Subtítulo suena a membership.*

**3. Post-registro `/me`**  
“Únete a tu comunidad” + JoinCommunityPanel + posible banner shell “pendiente”.  
→ *Siguiente paso existe, pero el estado mental no.*

**4. Miembro activo — Magic Plus**  
FAB “Crear” → “¿Qué quieres crear?” → Experiencia / Aviso / …  
→ *Claro para quien ya pertenece.*

**5. Crear experiencia**  
Título, descripción, fecha, hora, lugar, capacidad → “Publicar experiencia”.  
→ *Útil pero largo para el primer momento.*

---

## Escenario 1 — Primera entrada como visitante

**Recorrido:** Home → Discover → Life Place → Services → Profile

### Qué funciona

- Propuesta anti-red-social visible: *“Life conecta vecinos, lugares y actividades reales — no es una red social.”*
- Hero territorial: *“Descubre el territorio, ve qué ocurre cerca y únete cuando quieras participar.”*
- Life Place: info pública + actividades visibles; acciones de miembro → conversión (“Únete para participar”, “Regístrate para reservar”).
- Servicios: se pueden explorar; contacto/publicación piden cuenta.
- Profile visitante: “Bienvenido a LIFE…”, CTAs Crear cuenta / Iniciar sesión.
- FAB Magic Plus oculto para visitante puro (evita falso “crear”).

### Fricciones / bloqueos / confusión

| Problema | Detalle |
|----------|---------|
| Entender LIFE en 10s | Posicionamiento sí; *qué hacer ahora* no, si no hay actividad |
| Valor antes de registrarse | Lugares / Discover / Servicios sí; momentos vivos a menudo vacíos |
| Ruido visual | Stack: join card + empty living + activation panel + doors |
| CTAs confusos | Varios “Crear cuenta” / “Únete”; “Explorar comunidad” → preview, no Discover |
| Discover fuera del thumb | Bottom nav = Inicio · Comunidad · Servicios · Perfil — Discover no está |
| Pantallas vacías | “Información importante aparecerá aquí.”; preview de grupos/ayuda vacío |
| Lenguaje técnico | Preview Magic Plus habla de “Magic Plus” / membresía |

**Respuesta esperada del usuario:**  
*“LIFE es donde mi comunidad organiza cosas y participa.”*  
**Realidad:** suele quedar más cerca de *“parece una app de comunidad vacía a la que me piden unirme”*.

### Oportunidades

- Un CTA primario de conversión + un camino de exploración (Discover).  
- Mostrar 1–2 lugares/actividades públicas antes de la conversión.  
- Alinear “Explorar” con Discover, no solo Community preview.

### Prioridad

- **P0** — Colapsar stack de CTAs en Home visitante.  
- **P1** — Discover-first para visitantes.  
- **P2** — Suavizar/ocultar strips vacíos (avisos) para visitantes.

---

## Escenario 2 — Crear cuenta

**Recorrido:** Crear cuenta → Email → Password → Confirmación → Cuenta creada

### Qué funciona

- Solo Email *, Contraseña *, Confirmar *.  
- **No** hay código de comunidad en registro → Account ≠ Membership en el formulario.  
- Validaciones claras: email inválido, password débil, no coinciden, email existente.  
- Login automático vía cookies de sesión cuando el proveedor devuelve session.  
- Redirect a `/me` (no a `/` vacío).  
- UX móvil: inputs 48px, autofocus, `inputMode="email"`, layouts safe-area.

### Fricciones

- Subtítulo *“Únete a LIFE y descubre tu comunidad”* mezcla cuenta con pertenencia.  
- Si hace falta confirmar email: *“Revisa tu email…”* — callejón sin retorno al join.  
- Backend crea membership `pending` al registrar → contradice “join later”.

### Validación Account ≠ Membership

| Capa | Estado |
|------|--------|
| Formulario registro | ✅ Separado |
| Copy registro | ⚠️ Ambiguo |
| API registro | ❌ Auto-pending |
| Join en `/me` | ✅ Separado en UI |

### Prioridad

- **P0** — Alinear comportamiento y copy (no pending silencioso + “cuando quieras”).  
- **P1** — Subtítulo explícito: cuenta primero, comunidad después.  
- **P2** — Deep-link post-confirmación email → `/me`.

---

## Escenario 3 — Post registro

**Recorrido:** Cuenta creada → sesión activa → `/me` → JoinCommunityPanel

### Qué funciona

- Destino `/me` explícito.  
- `JoinCommunityPanel` visible si autenticado y sin membresía activa.  
- Banner shell registered: *“Aún no perteneces a esta comunidad. Unirme…”*  
- Banner pending: *“Tu solicitud está pendiente… puedes explorar el territorio.”*  
- Puede explorar Home/Discover/Servicios sin ser miembro activo.

### Fricciones / riesgo de vacío

- `/me` se siente pobre: título “Únete a tu comunidad” + panel + poco scaffolding de exploración.  
- Home trata `!hasMembership` como visitante → mismo ruido de conversión.  
- Si ya está `pending` por registro, el panel sigue pidiendo código → sensación de bloqueo.

**Debe evitar:** Cuenta creada → pantalla vacía.  
**Hoy:** No es vacío total, pero **sí es confuso** (peor que vacío en claridad).

### Prioridad

- **P0** — Una máquina de estados visible en `/me`.  
- **P1** — CTA “Explorar territorio” post-registro.  
- **P2** — No reutilizar paneles de activación de visitante para autenticados.

---

## Escenario 4 — Unirse a comunidad

**Recorrido:** Código comunidad **o** Invitación

### Estados

| Scope | Significado | Acceso comunidad |
|-------|-------------|------------------|
| `visitor` | Sin cuenta | Preview / público |
| `registered` | Cuenta, sin pertenencia activa | Explorar, no mutar |
| `pending` | Solicitud / invitados en espera | Explorar, no mutar |
| `active` | Miembro | Crear / participar |

### Qué funciona

- Copy de intención: pertenencia territorial aparte de la cuenta.  
- Dos vías: código (ej. PANORAMICA) e invitación.  
- Mensajes de éxito distintos para pending vs active.  
- Labels de perfil: Visitante / Registrado / Pendiente / Miembro.

### Fricciones

- Botón *“Código comunidad”* no es lenguaje de acción.  
- *“ID de invitación”* es técnico.  
- No se explica **dónde conseguir el código**.  
- Double model: pending automático + “únete cuando quieras”.  
- El usuario **no siempre sabe “dónde estoy”**.

### Prioridad

- **P0** — Un estado canónico en UI.  
- **P1** — Copy de botones + “¿Dónde consigo el código?”.  
- **P2** — Invitación humana (enlace / email, no solo ID).

---

## Escenario 5 — Primera acción (miembro activo)

### Qué funciona

- Magic Plus: Experiencia, Aviso, Comprar/vender, Trabajo, Ayuda, Reserva.  
- Composer: *“¿Qué quieres crear?”*  
- Home vacío → “Crear experiencia”; `CommunityActivationPanel` (experiencia, aviso, negocio, invitar).

### Fricciones

- Territorio quieto: demasiadas puertas antes de una acción recomendada.  
- Preview FAB: *“Unirse para crear”* + sheet que nombra “Magic Plus” (jerga interna).

### Prioridad

- **P1** — Primera sesión: una acción recomendada (“Crear experiencia”).  
- **P2** — Quitar “Magic Plus” del copy de usuario.

---

## Escenario 6 — Crear primera experiencia

**Flujo:** Magic Plus → Experiencia → Título → Lugar → Fecha → Confirmar

### Campos (realidad)

**Obligatorios (cliente):** título, descripción, fecha, hora inicio, punto de encuentro, capacidad (≥2, default 8).  
**Opcionales:** actividad relacionada, hora fin, recurso.  
**Submit:** “Publicar experiencia” → `/experiences/{id}` con `publishToCommunity: true`.

### Qué funciona

- Entrada contextual (Home / Community / Life Place → Magic Plus intent).  
- Resultado: “He creado algo que puede ocurrir” — **sí**, si el formulario se completa.  
- Otros miembros: “Participar” / “Unirme” / “Ver”.

### Fricciones

- Formulario largo para el primer momento.  
- “Publicar” suena a red social; mejor “Crear experiencia”.  
- Capacidad fuerza una decisión temprana.

### Prioridad

- **P1** — Create progresivo (qué / cuándo / dónde primero).  
- **P2** — Renombrar CTA de submit.

---

## Escenario 7 — Segundo usuario

**Loop esperado:** Crear → Descubrir → Participar

### Qué funciona

- Experiencias en Home (momentos), Community, Life Place (“Próximas actividades” / “Actividades públicas”).  
- Detalle → Participar → confirmar.

### Dónde falla el loop

| Punto de fallo | Condición |
|----------------|-----------|
| Seed vacío | Usuario B ve el mismo Home vacío |
| Sin membresía activa | Ve público + CTAs de conversión, no “Participar” |
| Preview vs hub | Registered/pending no entran al hub completo de Comunidad |

### Prioridad

- **P1** — Asegurar visibilidad pública intencional de experiencias donde corresponda.  
- **P2** — Claridad en detalle para no-miembros (“puedes mirar, no unirte aún”).

---

## Escenario 8 — Experiencia móvil

### Qué funciona

- Login/Register: `max-w-lg`, safe-area, inputs 48px, teclado email/password.  
- Bottom nav + FAB 56px encima de la barra.  
- Life Place sheet con padding sobre nav.  
- Botones primarios ≥44–48px.

### Fricciones (una mano)

- Labels de nav ~9.5px (accesibilidad).  
- Discover fuera del alcance del pulgar.  
- Home visitante: scroll largo; CTA primario no sticky.  
- Visitante sin FAB → conversión solo por cards/perfil.

### Prioridad

- **P1** — CTA de conversión sticky en Home visitante.  
- **P2** — Labels nav más legibles; affordance Discover.

---

## Escenario 9 — Copy audit

### Lenguaje preferido (presente y bueno)

experiencia · aviso · actividad · comunidad · participación · vecinos · territorio · ayuda

### Remanentes / notas

| Término | Veredicto |
|---------|-----------|
| “No son seguidores.” / “No es un muro…” | Anti-social explícito — OK en perfil |
| “Publicar experiencia / trabajo / anuncio” | Suave tono social — sustituible |
| “Magic Plus” en sheet | Jerga interna — evitar en UI |
| `feed` en tipos/API | Interno — no en hero |
| like / followers / engagement | No como CTAs de producto |

### Prioridad

- **P1** — Renombrar Magic Plus visible; suavizar “Publicar”.  
- **P2** — Mantener disclaimers anti-social solo donde haya malentendido.

---

## Escenario 10 — Anti-friction audit

| Regla | Hallazgo |
|-------|----------|
| Primero valor, después información | Visitante a menudo ve conversión **antes** de prueba de vida |
| Demasiadas preguntas | Registro lean ✅; create experience pesado ⚠️ |
| Decidir demasiado pronto | Capacidad 8; pending al registrar; “dar vida” antes de ver vida |
| Datos antes de valor | Join pide código sin explicar valor local concreto |

### Prioridad

- **P0** — No inventar pending (o no decir “cuando quieras”).  
- **P1** — Menos campos en primera experiencia.  
- **P2** — Preferencias de perfil tras primera participación.

---

## Matriz final

| Paso | Estado | Fricción | Prioridad |
|------|--------|----------|-----------|
| Visitor | Posicionamiento OK; valor débil si vacío | Stack de CTAs; Discover oculto; empty noise | **P0** |
| Registro | Rápido y lean | Copy mezcla cuenta/comunidad; auto-pending | **P0** |
| Sesión | Persistente (cookies) | Confirm-email edge case | P1 |
| Join | Panel existe | Estado pending vs código confuso; ID técnico | **P0** |
| Magic Plus | Claro para activos | Jerga “Magic Plus”; muchas intenciones | P1 |
| Primera experiencia | Viable | Formulario largo; “Publicar” | P1 |
| Participación | Loop existe | Falla con seed vacío o no-miembro | P1 |
| Móvil | Base sólida | CTA no sticky; Discover no en nav | P1 |

---

## Respuestas a criterios de éxito

1. **¿Puede una persona entender LIFE sin explicación?**  
   Parcialmente. Entiende “comunidad real, no red social”; no siempre entiende el siguiente paso útil.

2. **¿Puede crear cuenta en menos de un minuto?**  
   Sí.

3. **¿Puede unirse sin confusión?**  
   No de forma fiable — conflicto pending / código / copy.

4. **¿Puede crear algo útil?**  
   Sí, como miembro activo vía Magic Plus → experiencia.

5. **¿Puede otra persona participar?**  
   Sí, si es miembro activo y la experiencia es visible.

6. **¿Parece una comunidad viva o una app vacía?**  
   Depende del territorio. Sin actividad real, la activación bien intencionada aún se lee como app vacía.

---

## Contradicciones de producto (inventario)

| Claim | Realidad | Superficie |
|-------|----------|------------|
| Account ≠ Membership; join later | Register crea `status: "pending"` | `register/route.ts` |
| “Únete cuando quieras” | Shell: “solicitud pendiente de aprobación” | Join panel + MemberShell |
| Discover first | Empty CTA → `/community`; Discover no en tabs | Home + MemberShell |
| “Visitor” en Home | A menudo = `!hasMembership` (incluye registered/pending) | HomeScreen |
| `hasMembership` | Solo `active` | domain membership |

---

## Backlog recomendado (sin implementar en 18O)

### P0 — First-user trust

1. Unificar Account vs Membership (comportamiento + copy + `/me` status).  
2. Un CTA primario en Home visitante + un explore path.  
3. Claridad de estado join (needs code / pending / active).

### P1 — Activation density with clarity

4. Discover-first para visitantes.  
5. Create experiencia progresivo.  
6. Sticky conversion móvil.  
7. Quitar “Magic Plus” del copy de usuario.

### P2 — Polish

8. Invitación humana.  
9. “Publicar” → “Crear”.  
10. Tipografía nav; ocultar chrome vacío de avisos para visitantes.

---

## Invariantes respetados en esta auditoría

- Activity ≠ Engagement  
- Community ≠ Social Network  
- Account ≠ Membership  
- Authentication ≠ Community  
- Visitor ≠ Member  
- Seed ≠ Fake Content  

**Phase 18O no modifica código.**

---

## FIN PHASE 18O
