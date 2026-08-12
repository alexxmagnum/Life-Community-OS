# Life Community OS
# D13 — Housing / Living (Decision Brief)

> Status: **PENDIENTE DE DECISIÓN**  
> Does **not** approve ownership. Does **not** authorize routes or implementation.  
> Related: `IA_DECISION.md`, `IA_IMPLEMENTATION_PLAN.md`, current dead link `/housing` from Community Explorar “Vivienda”.

---

## Estado

**PENDIENTE DE DECISIÓN**

---

## Descripción

Definir **ownership del módulo residencial** (“Housing / Living”) dentro de la gramática IA aprobada:

- Belong (Comunidad)
- Operate (Servicios)
- Life (Planes + Cerca)
- Profile

### Alcance previsto

- alquiler de viviendas  
- compra / venta inmobiliaria  
- terrenos  
- locales  
- servicios relacionados con vivienda  

### Restricciones (obligatorias)

- no romper arquitectura multi-tenant  
- no mezclar con marketplace general (compra-venta entre vecinos de objetos/servicios puntuales)  
- mantener escalabilidad SaaS  
- reutilizar patrones existentes (hubs, list/detail, ConversationExperience contextual, module flags)  

### Hecho actual en repo (contexto)

- Community Explorar muestra tile **Vivienda** → `/housing`  
- **No existe** `page.tsx` para `/housing`  
- `IA_DECISION.md` already states Housing must **not** remain a Community Explorar peer  
- FASE 1 plan: gate the dead entry until ownership + route exist  

---

## Opciones a evaluar

### A) Housing dentro de Operate / Servicios

**Idea:** Residencial es un job de “resolver / transaccionar” junto a profesionales, marketplace y reservas—pero como **línea Operate distinta**, no como listing genérico del mercadillo.

| | |
|--|--|
| Encaje gramatical | Operate = “necesito resolver algo” (alquilar, comprar, gestionar local) |
| Reutilización | Patrón Services hub + category door; detail + optional ConversationExperience |
| Separación vs marketplace | Requiere regla dura: Housing ≠ `marketplace` module; own module id / hub |
| Multi-tenant | Module `housing` (or similar) enablement per tenant |
| Riesgo | Contaminar Servicios con un dominio pesado; usuarios confunden con Compra y venta |

**Pros:** Bottom-nav Servicios already exists; strong for transactional intent.  
**Contras:** Scope (compraventa + terrenos + locales) may overwhelm Operate; lifestyle “descubrir vivir aquí” fits worse.

---

### B) Housing dentro de Life / Discover

**Idea:** Residencial es “vida en el territorio / explorar el lugar” — discovery of living options near Cerca / Discover.

| | |
|--|--|
| Encaje gramatical | Life = territory life beyond plaza; Cerca = local directory |
| Reutilización | Near/Discover list patterns; place-like cards |
| Separación vs marketplace | Natural if framed as places/listings directory, not neighbour garage-sale |
| Multi-tenant | Life overflow + module flag; some territories may omit entirely |
| Riesgo | Dilutes Cerca (restaurants vs property); weak for heavy transaction flows (offers, agents) |

**Pros:** Keeps Operate focused on daily resolver jobs; discovery-first UX.  
**Contras:** Purchase/rent workflows are Operate-shaped; stuffing them into Discover may recreate “portal” sprawl inside Life.

---

### C) Housing como dominio propio del territorio

**Idea:** Housing is a **first-class domain surface** (own module family / hub), not a child of Servicios nor of Discover—configured per tenant, entered from Life overflow and/or Operate door without owning the parent concept.

| | |
|--|--|
| Encaje gramatical | New primary owner under product grammar: still maps to a surface entry (overflow or Operate door) but **module ownership is Housing**, not Marketplace/Near |
| Reutilización | Same list/detail/chat patterns; own routes under e.g. `/housing*` when built |
| Separación vs marketplace | Strongest — dedicated domain boundary |
| Multi-tenant | Best: territories with real estate enable module; others hide completely |
| Riesgo | Tipo C later (routes/hub); must avoid becoming a sixth mental “app” without nav discipline |

**Pros:** Clearest SaaS scalability; matches large commercial scope; avoids marketplace mix.  
**Contras:** More product surface to teach; needs explicit entry rule (where does the user tap?).

---

## Comparativa rápida (no decisión)

| Criterio | A — Operate/Servicios | B — Life/Discover | C — Dominio propio |
|----------|----------------------:|------------------:|-------------------:|
| Separación vs marketplace general | Media (si se disciplina) | Alta | Alta |
| Escalabilidad SaaS / opt-in tenant | Alta | Alta | Muy alta |
| Reuso de patrones actuales | Alta | Alta | Alta (con hub propio) |
| Encaje “alquiler/compra” transaccional | Alta | Media | Alta |
| Encaje “descubrir vivir aquí” | Media | Alta | Alta |
| Riesgo de mezclar con Comunidad Explorar | Baja si no vuelve al portal | Media | Baja si entry is owned |
| Impacto técnico futuro | Medio | Medio | Medio→Alto (hub/routes) |
| Alineación con H1 (no 6º tab) | Alta (bajo Servicios o overflow) | Alta (bajo Life) | Alta si entry es door/overflow, no bottom tab |

**Nota:** Ninguna opción debe recolocar Housing como peer dentro de **Comunidad Explorar** (ya prohibido por `IA_DECISION.md`).

---

## Implicaciones mientras sigue pendiente

1. **No implementar** `/housing` flows ni ownership inventado.  
2. **Sí** (cuando se autorice FASE 1): gate/hide Community tile “Vivienda” to avoid 404.  
3. Core adapters that mention housing (if any) remain dormant until D13 closes.  
4. ConversationExperience may attach later as **contextual** chat (agent/listing)—still not a Housing “Conversaciones” section.

---

## Preguntas para cerrar D13

1. ¿El job principal del vecino es **transaccionar** (A/C) o **descubrir** (B/C)?  
2. ¿Housing debe poder apagarse por tenant sin afectar marketplace? (esperado: sí)  
3. ¿La entrada UX preferida es door bajo Servicios, leaf bajo Life, o ambos (owner único + shortcut)?  
4. ¿Compra/venta inmobiliaria y alquiler comparten el mismo hub o sub-áreas?  
5. ¿“Servicios relacionados con vivienda” viven en Housing o en Operate profesionales?

---

## Relación con otras pendientes

| ID | Relación |
|----|----------|
| D7 | Marketplace naming — Housing must stay outside that vocabulary |
| D2/D3 | If B chosen, Cerca/Discover structure absorbs Housing discovery |
| D1 | Booking vocabulary is community resources — not Housing rentals unless explicitly unified later |

---

*No option selected. D13 remains PENDIENTE DE DECISIÓN.*
