# Product Experience Recovery Audit
## Life Community OS — Phase 18J

**Date:** 2026-09-02  
**Status:** Impact map — implementation follows this document  
**Scope:** UX, navigation, domain boundaries, creation routing, user states  
**Out of scope:** Tenant model, membership model, GDPR, security, authorization, new domains

---

## 1. Product principle (invariant)

```
Personas → crean acciones útiles → en su comunidad → usando lugares como contexto
```

| Rule | Meaning |
|------|---------|
| Person ≠ Membership | Identity and belonging are separate surfaces |
| Place ≠ Experience | Life Place is context, not a creation entry |
| Experience ≠ Post | Experiences live in Experience Domain |
| Magic Plus ≠ Content Feed | + routes intentions; it does not store content |
| Community ≠ Social Network | Community = personas; Discover = territorio |

---

## 2. Surface audit — before recovery

### 2.1 Bottom navigation (before)

| Tab | Route | Issue |
|-----|-------|-------|
| Inicio | `/` | OK |
| Mapa | `/map` | Wrong tier — territorial tool in primary bar |
| Descubrir | `/discover` | Wrong tier + content bleed from Community/Services |
| Comunidad | `/community` | OK |
| Servicios | `/services` | **Hidden when lifeMap on** — Operate job lost |
| Perfil | `/me` | OK |
| Magic Plus | FAB | Experience-only copy; flat action list |

### 2.2 Magic Plus (before)

- Title: "Crear experiencia"
- Flat list of all registry actions including `group_create`
- No intention grouping (Experiencia / Aviso / Marketplace / …)
- Missing explicit routes: reservation hub, work post, member aviso

### 2.3 Discover (before)

| Section | Domain owner | Verdict |
|---------|--------------|---------|
| Experiencias cerca | Home / Experience | **Remove** — duplicate Home |
| Planes próximos | Home / Experience | **Remove** |
| Lugares | Territory | **Keep** |
| Ayuda entre vecinos | Community / Services | **Remove** |
| Comunidades (grupos) | Community | **Remove** |
| Profesionales | Services | **Remove** |
| Negocios locales | Territory POI | **Keep** (territory context) |
| Footer "Crear experiencia" | Magic Plus | **Remove** |

### 2.4 Home (before)

- Strong "Hoy" feed — OK
- "Cómo puedo aportar" → Magic Plus — OK for members
- **Missing:** "Resolver algo" → Services teaser

### 2.5 Profile (before)

| State | Expected | Before |
|-------|----------|--------|
| Visitor | Acceso only | OK (18I-P2) |
| Registered | Cuenta + Unirse | OK |
| Active member | "Mi vida aquí" | Label was "Mi actividad" |
| Active member | No member copy for visitors | OK |

### 2.6 Life Place (before)

- Creation CTAs removed in 18I-P2 — **no regression**
- Empty copy: "Aún no hay experiencias en este lugar" — OK

### 2.7 Hamburger menu (before)

- No unified **Explorar territorio** category
- Map / Discover only reachable via bottom bar (being removed)

---

## 3. Target recovery map

### 3.1 Bottom navigation (after)

```
Inicio · Comunidad · [+] · Servicios · Perfil
```

- Map and Discover: **routes kept**, demoted to overflow
- Servicios: always when `services` module enabled

### 3.2 Magic Plus (after)

- Title: **"¿Qué quieres crear?"**
- Six intention sections routing to existing domains:

| Intention | Actions | Route |
|-----------|---------|-------|
| Experiencia | experience_create, event_create | `/experiences/create`, `/community/events/create` |
| Aviso | announcement_create | `/community/events/create?intent=announcement` |
| Comprar / vender | marketplace_listing | `/marketplace/create` |
| Trabajo / servicio | work_create, offer_service, business_create | `/services/work/create`, `/business/register` |
| Ayuda | help_request, help_offer | `/help/create` |
| Reserva | reservation_create | `/resources` |

- `group_create` excluded from universal engine (Community domain entry remains)

### 3.3 Discover (after)

Territory-only directory:

- Lugares (Life Place)
- Negocios del territorio (POI)
- Search: lugares / instalaciones
- Empty state → map / explore, not creation

### 3.4 Home (after)

- Add **Resolver algo** → `/services` when services module on

### 3.5 Profile (after)

- Active members: section title **Mi vida aquí** (was Mi actividad)
- Housing "Mis lugares" stays inside active-member gate

### 3.6 Hamburger (after)

New category **Explorar territorio**:

- Mapa → `/map`
- Descubrir → `/discover`
- Lugares → `/discover`
- Puntos de interés → `/map`

---

## 4. Files impacted

| File | Change |
|------|--------|
| `apps/web/src/components/MemberShell.tsx` | Nav, Magic Plus sections, copy |
| `apps/web/src/lib/community/magic-plus-sections.ts` | **New** — intention grouping |
| `packages/types/src/community/action-composer.ts` | announcement/work/reservation routes |
| `apps/web/src/lib/community/composer-glyphs.ts` | Glyphs for new actions |
| `tenants/life-panoramica/src/navigation-projector.ts` | Explorar territorio category |
| `apps/web/src/screens/DiscoverScreen.tsx` | Territory-only content |
| `apps/web/src/screens/HomeScreen.tsx` | Resolver algo teaser |
| `apps/web/src/screens/ProfileScreen.tsx` | Mi vida aquí label |
| `apps/web/src/lib/membership/product-experience-recovery-isolation.test.ts` | **New** — Phase 18J lock tests |
| `apps/web/src/lib/membership/experience-alignment-isolation.test.ts` | Update Magic Plus expectations |
| `apps/web/package.json` | Include new test file |

---

## 5. Test matrix (mandatory PASS)

| Test | Validates |
|------|-----------|
| Visitor no parece miembro | Profile Acceso; no Magic Plus FAB |
| Registered puede unirse | JoinCommunityPanel + scope registered |
| Active Member puede crear | Magic Plus FAB + sections |
| Magic Plus enruta correctamente | 6 intentions + registry routes |
| Life Place no crea contenido | No create CTAs (regression) |
| Discover no contiene Community | No help/groups/professionals/experience feed |
| Community no contiene Discover | Out of scope — Community screen unchanged |
| Services aparece | Bottom nav with lifeMap on |
| Assets correctos por dominio | Composer glyphs + location cards |
| Tenant isolation intact | Existing isolation tests green |

---

## 6. Branding

- **LIFE Panorámica** — never "Vida Panorámica"
- LIFE is not translated

---

## 7. Risk notes

- Discover data fetch simplified — fewer API calls; territory POI only
- `announcement_create` uses existing events composer with `intent=announcement` query — no new domain entity
- `reservation_create` routes to `/resources` — booking flow unchanged

---

*End of audit — Phase 18J implementation proceeds from this map.*
