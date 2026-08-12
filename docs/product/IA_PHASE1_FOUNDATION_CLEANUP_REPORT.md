# Life Community OS
# IA Phase 1 — Foundation Cleanup Report

> Execution of the **acotada FASE 1** from `IA_IMPLEMENTATION_PLAN.md`,  
> constrained by `IA_IMPLEMENTATION_READINESS.md`.  
> **No commit.** **No FASE 2.**

Decision context: `IA_DECISION.md` (H1/H4). Housing domain analysis: `D13_HOUSING_LIVING_BUSINESS_MODEL.md` (ownership still pending).

---

## Scope executed

| In scope | Out of scope (not touched) |
|----------|----------------------------|
| Orphan `/housing` UX + compatibility | Bottom navigation slots/labels |
| Obvious Reservas hamburger duplicate | Full Comunidad Belong reshape |
| | Servicios / Life / Discover reorg |
| | `activeFromPath` (D11 still pending) |
| | Explorar tiles Experiencias/Servicios/Espacios |
| | D1 vocabulary invention |

---

## Problemas encontrados

### 1. Housing door → missing product surface

| | |
|--|--|
| **Problema** | Community Explorar could render tile **Vivienda** → `router.push("/housing")` while no product screen existed. Module `housing` is fail-closed today (unknown id → false), but the door was still a landmine if enabled later. |
| **Dónde** | `apps/web/src/screens/CommunityScreen.tsx` |
| **Impacto** | Potential 404; contradicts D13 “no inventar ownership” / “not a Community Explorar peer” until decided. |

### 2. Duplicate Reservas leaves (same href)

| | |
|--|--|
| **Problema** | Hamburger category **Reservas** had two children — **Instalaciones** and **Espacios comunes** — both navigating to `/resources`. |
| **Dónde** | `tenants/life-panoramica/src/navigation-projector.ts` |
| **Impacto** | False specificity; user believes two destinations exist. |

### 3. Audit of other orphan static targets

| | |
|--|--|
| **Problema** | Broader static `router.push` / `href` audit against App Router pages. |
| **Resultado** | No additional missing static app targets found in web + tenant pack sources beyond the known `/housing` case (addressed below). |
| **Nota** | Community Explorar **Espacios** → `/resources` and Services hub → `/resources` are **intentional multi-entry** (different surfaces), not identical duplicate leaves — left unchanged (FASE 2 / ownership, not Phase 1). |

---

## Soluciones aplicadas

### Housing

1. **Gate the UI door:** `housingSurfaceReady = false` — tile never shows until a real surface ships (even if module flag appears). Comment references D13.  
2. **Compatibility route:** `apps/web/src/app/(member)/housing/page.tsx` redirects to `/community`. Prevents hard 404 for manual/legacy `/housing` hits. **Does not** establish Housing ownership.

### Reservas duplicate

- Removed leaf `res-sports` / **Instalaciones**.  
- Kept single leaf `res-common` / **Espacios comunes** → `/resources` (existing label; **D1** vocabulary not invented).

---

## Archivos modificados

| File | Change |
|------|--------|
| `apps/web/src/screens/CommunityScreen.tsx` | Housing surface gate |
| `apps/web/src/app/(member)/housing/page.tsx` | **Created** — redirect shim |
| `tenants/life-panoramica/src/navigation-projector.ts` | Collapse Reservas children to one leaf |
| `docs/product/IA_IMPLEMENTATION_PLAN.md` | FASE 1 status note |
| `docs/product/IA_PHASE1_FOUNDATION_CLEANUP_REPORT.md` | This report |

---

## Riesgos

| Riesgo | Nivel | Mitigación / note |
|--------|-------|-------------------|
| Redirect `/housing` → `/community` may surprise if users expected Housing | Bajo | No product existed; D13 still open |
| Keeping label “Espacios comunes” vs future D1 name | Bajo | Explicit interim; D1 pending |
| `res-sports` id removed — any external bookmark of menu state by id | Muy bajo | Menu is projected, not URL-deep for that leaf |
| FASE 2 still blocked by readiness gates | — | Intentional |

---

## Validaciones

| Check | Result |
|-------|--------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` (web) | **PASS** (pre-existing `<img>` warning in `ServicesCategoryScreen.tsx`, unrelated) |
| Bottom nav unchanged | **Yes** |
| ConversationExperience untouched | **Yes** |
| D13 ownership not invented | **Yes** |
| FASE 2 not started | **Yes** |

### Manual verification suggested (not automated here)

1. Open hamburguesa → Reservas → only **Espacios comunes** → `/resources`.  
2. Comunidad Explorar → no **Vivienda** tile.  
3. Visit `/housing` → lands on `/community` (redirect).  
4. Bottom nav still Inicio · Comunidad · + · Servicios · Perfil.

---

## Tenant impact

- Change is in **life-panoramica** navigation projector (Reservas leaves) + shared web Community screen gate + web compatibility page.  
- Multi-tenant: redirect page is product-safe (fail closed to Comunidad); Housing still opt-in by future module + `housingSurfaceReady`.  
- No preset / module-registry enablement of Housing added.

---

## Next (not authorized by this report)

- Do **not** start FASE 2 until readiness gate 0 (D11, interim labels, Explorar/Life sequencing).  
- Close or defer D13 before building a real Housing surface.  
- Commit only after human review.

---

*End of Phase 1 foundation cleanup report.*
