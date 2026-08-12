# Implementation Readiness Review

> Review of `docs/product/IA_IMPLEMENTATION_PLAN.md` against  
> `CURRENT_INFORMATION_ARCHITECTURE.md`, `IA_PROPOSALS.md`, and `IA_DECISION.md`.  
> Simulated agent review only. **No code changes. No implementation. No commits. No fixes applied.**

---

## Resultado general

**NEEDS ADJUSTMENTS**

### Reading of that result

| Scope | Readiness |
|-------|-----------|
| Full plan through FASE 2–4 as written | **Not ready** — blocked or under-specified by open product pendientes (D1–D12) and a few plan gaps |
| **FASE 1 subset only** (dead-link gate, duplicate Reservas leaf collapse, start projector trim, no vocabulary invention) | **Conditionally ready** after resolving **D11** (and preferably clarifying interim-label policy) |

The direction in `IA_DECISION.md` (H1 / H4, bottom nav locked, ConversationExperience transversal) is coherent. The implementation plan is a sound strategy document, but it is **not yet an executable engineering brief** for the whole roadmap without product closures and a few plan tightenings.

---

## Validaciones por agente

### 1. Product Architect

**Verdict:** Direction aligned; execution package incomplete.

| Check | Finding |
|-------|---------|
| Coherence with Life Community OS SaaS vision | **Pass** — H1/H4 preserves multi-tenant grammar (Belong / Operate / Life / Profile) without B1 global tab swap |
| Ownership of modules | **Pass with gaps** — primary owners are clear for Comunidad, Servicios, Planes, Cerca, Perfil, chat-as-capability |
| Contradictions | **Needs attention** — see below |

**Contradictions / tensions documented (not fixed):**

1. `IA_DECISION.md` §8: engineering must **not invent substitutes** for D1–D12 until resolved.  
   `IA_IMPLEMENTATION_PLAN.md` FASE 2: allows **interim labels** that “do not contradict” the decision.  
   → Conflict on how far FASE 2 may proceed without human closures (especially D2–D6, D9).

2. Community target tree uses **Proponer**; current product/canon still exposes **Propuestas** + **Participación** and eight area ids. Timing of merge is **D5** — plan assumes Belong shape before D5 is closed.

3. Plan says hamburger should not duplicate bottom-nav roots, but FASE 1 only “begins trimming” — success criteria for “Comunidad/Servicios categories fully removed from hamburger” are softer than FASE 2 exit criteria. Risk of stopping at partial adoption (called out in plan risks, still unresolved as a hard gate).

4. Life is secondary (no bottom tab) while Home today heavily sells Planes/Cerca — Product must accept temporary discoverability dip when Community Explorar is removed **before** Life root is strong (FASE 1 vs 2 ordering).

**Product Architect blockers before broad execution:** close or explicitly defer D5, D6, D9, D11; define interim-label policy in writing.

---

### 2. UX / Product Designer

**Verdict:** User clarity improves if sequenced carefully; naming and cognitive load still open.

| Check | Finding |
|-------|---------|
| Clarity for new neighbour | **Conditional** — Belong four layers + Operate tab is clearer than today; Life-only-in-hamburger may hide Planes/Cerca after Explorar removal |
| Navigation | **Mostly clear** — bottom nav locked; active-state policy (**D11**) still undefined → orientation risk remains |
| Names | **Not ready** — D1, D2, D6, D7, D8, D9 unresolved; user-facing words Belong/Operate/Life may leak (**D9**) |
| Cognitive load | **Improved in intent** — Community Explorar removal helps; Community page may still be long until layers are truly four |

**UX risks documented:**

- Removing Explorar tiles before hamburger Life root ships creates a **gap journey** (“where did Experiencias go?”).
- “Proponer” vs “Propuestas” / “Decidir juntos” renaming without D5/D6 confuses existing users.
- Create sheet regrouping (Comunidad / Planes / Resolver) is good UX but depends on stable owner names.
- Elder users benefit from Operate/Belong only if copy stays plain Spanish (**D9**).

**UX blocker before FASE 2:** ordered delivery must be **Life overflow entry points available in the same release as Explorar portal removal** (or Explorar tiles only gated after Life root exists). Plan implies this in FASE 2 but FASE 1 optionally gates Explorar early — that optional path is UX-unsafe.

---

### 3. Architecture Guardian

**Verdict:** Architecturally safe path if Tipo C stays avoided; a few technical under-specs.

| Check | Finding |
|-------|---------|
| Technical impact | **Acceptable** — A/B changes on projector, MemberShell, CommunityScreen, Home; ConversationExperience untouched |
| Reuse | **Pass** — reuses screens/hubs; no rewrite mandated |
| Routes | **Pass** — maintain/alias strategy; `/housing` gated not invented |
| Components affected | **Mapped** — MemberShell, navigation-projector, community-hub, CommunityScreen, HomeScreen, home-premium, ServicesHub (light) |
| Risk of breaking architecture | **Low for FASE 1**; **Medium for FASE 2** if projector becomes Panoramica-specific hardcoding instead of rule-based |

**Architecture gaps documented:**

1. **No shared “IA ownership registry”** in platform packages — plan edits tenant projector + web shell only. Future tenants may reintroduce sitemap duplication unless ownership rules are encoded in a reusable place (types/module docs or shared nav policy). Not required for FASE 1, but unaddressed for SaaS scale.

2. **`activeFromPath` under-specified** until D11 — leaving secondary routes highlighted as Inicio preserves a known bug.

3. **`packages/ui` hardcoding** (e.g. Panoramica strings / Home glyph paths) is noted as a FASE 3 care item; Architecture should treat any UI-package copy change as multi-tenant sensitive.

4. Plan correctly forbids ConversationExperience churn — **confirmed transversal**.

**Architecture Guardian:** FASE 1 can proceed technically; FASE 2 needs a written alias matrix for `?tab=` and a non-Panoramica rule for hamburger overflow shape.

---

### 4. Multi-Tenant Guardian

**Verdict:** Intent is correct; encoding still tenant-pack-centric.

| Check | Finding |
|-------|---------|
| Not mixing tenant with product | **Partial** — grammar is product-level; almost all file touchpoints are `tenants/life-panoramica` + `apps/web` |
| Future territories | **At risk** if Life/Belong rules live only in Panoramica projector without a platform-level convention |
| Configuration correctness | **Pass in principle** — module/feature gating retained; B1/H3 correctly deferred (**D10**) |

**Multi-tenant risks documented:**

1. Implementing hamburger Life root only in `life-panoramica` navigation-projector without documenting the required category shape for other tenants.
2. Home intent cleanup in `home-premium.ts` is tenant content (OK) but must not hardcode IA grammar into `packages/ui`.
3. Near-category label “Servicios” (**D8**) is tenant hub config — renaming is tenant-visible and must not be invented in code before decision.
4. Presets (`minimal_community` / `full_product`) are not explicitly tested in the plan’s exit criteria.

**Multi-Tenant Guardian blocker before FASE 2:** short “nav projection contract” (which categories are allowed for any tenant under H1) — document-only is enough; need not implement multi-tenant runtime yet.

---

## Surface confirmation

### Bottom Navigation

| Item | Decision | Plan readiness |
|------|----------|----------------|
| Inicio | Briefing | Ready to plan Home door reduction in FASE 2 |
| Comunidad | Belong | Ready conceptually; area-id merge pending |
| + | Action | Ready to regroup in FASE 2 |
| Servicios | Operate | Ready; vocabulary pending D1/D7 |
| Perfil | Me | Ready for honest leaf cleanup |

Slots locked — **no conflict**.

### Comunidad (Belong)

Target: Ahora · Grupos · Proponer · Oficial  

**Ready as target shape; not ready to finalize area ids/copy** until D5/D6. Explorar removal readiness: **only with simultaneous Life overflow**.

### Servicios (Operate)

**Ready** as owner of categories + marketplace + resources entry. Label finals pending D1/D7/D8.

### Life (Planes + Cerca)

**Direction ready; structure not ready** until D2/D3/D4. Plan correctly leaves these open — therefore FASE 2 Life root can only be **interim**.

### ConversationExperience

**Confirmed transversal.** Plan and decision agree: no section, no bottom-nav item, no structural migration. **Ready / no change required** for IA execution.

---

## Riesgos encontrados

| ID | Riesgo | Severidad | Notas |
|----|--------|-----------|-------|
| R1 | Pendientes D1–D12 block honest FASE 2–3 copy | Alta | Plan cannot both “not invent” and fully ship Life/Belong naming |
| R2 | Explorar removed before Life root | Alta (UX) | FASE 1 optional early gate conflicts with UX sequencing |
| R3 | D11 unresolved → false Inicio highlight remains | Media | Orientation bug persists |
| R4 | Interim vs final Community area model (8 ids → 4 layers) | Media | Alias matrix not yet written |
| R5 | Tenant-only implementation of product grammar | Media | SaaS portability |
| R6 | Partial adoption (stop after FASE 1) | Media | Already listed in plan; no hard governance gate |
| R7 | Scope creep into B1/H3 | Baja–Media | Deferred correctly; needs discipline |
| R8 | UI package coupling during copy passes | Baja–Media | Multi-tenant sensitive |

---

## Dependencias

### Must resolve (or explicitly defer in writing) before FASE 2+

| Dependency | Why |
|------------|-----|
| **D11** | Defines whether FASE 1 includes `activeFromPath` |
| **Interim-label policy** | Resolves contradiction with “no invent” vs FASE 2 |
| **Explorar/Life sequencing rule** | Same release constraint |
| **`?tab=` alias matrix** | Compatibility for Belong collapse |
| **Nav projection contract (multi-tenant)** | Prevent Panoramica-only IA |

### May remain open during FASE 1 only

D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D12 — if FASE 1 avoids renaming and avoids full Life IA.

### Soft dependencies

- QA checklist for module-off presets  
- Product sign-off that discoverability dip is acceptable only inside a combined FASE 2 release  

---

## Orden recomendado de implementación

Unchanged spirit of the plan, with readiness gates:

0. **Adjust plan / decision addendum** (docs only): resolve R1–R2 sequencing + D11 + interim-label policy + alias matrix outline.  
1. **FASE 1 (safe)** — only items that need no pending vocabulary.  
2. **FASE 2 (UX reorg)** — after gate 0; Explorar removal **with** Life overflow in one slice.  
3. **FASE 3 (screen adaptation)** — after interim or final names agreed for touched surfaces.  
4. **FASE 4 (cleanup)** — after D1–D12 closed or deferred with dates.

Do **not** start FASE 2–4 coding until gate 0 is done.

---

## Primer cambio seguro para empezar

**Single safest first engineering slice (after D11 clarified, still no broad FASE 2):**

1. **Gate Community Explorar “Vivienda”** (`/housing`) so it cannot 404 — hide or disable until a route exists.  
2. **Collapse duplicate hamburger Reservas leaves** that both go to `/resources` into **one** leaf (keep an existing label temporarily; do **not** invent D1 vocabulary).  
3. **Do not yet** remove Experiencias/Servicios/Espacios Explorar tiles in the same slice unless Life overflow is shipping simultaneously.

If D11 = yes, optionally include a minimal `activeFromPath` honesty pass for `/experiences*` and `/official*` in the same slice; if D11 = no, defer.

This slice is Tipo A/B, low risk, aligns with decision ownership, and does not require closing Life/Cerca pendientes.

---

## Ajustes necesarios (document only — not applied)

Listed for follow-up; **not corrected in this review**:

1. Amend implementation plan: forbid FASE 1 removal of cross-module Explorar tiles without Life root.  
2. Amend decision or plan: explicit **interim-label policy** vs “no invent”.  
3. Close or defer **D11** before any MemberShell active-state work.  
4. Add **`?tab=` alias matrix** appendix before Community layer collapse.  
5. Add **multi-tenant nav projection contract** note for H1 overflow shape.  
6. Make FASE 1 exit criteria exclude “Explorar fully gone” unless FASE 2 Life is in the same release train.

---

## Resumen

| Question | Answer |
|----------|--------|
| Is the IA decision sound enough to guide work? | **Yes** |
| Is ConversationExperience correctly transversal? | **Yes** |
| Is the full implementation plan executable now? | **No — NEEDS ADJUSTMENTS** |
| Is there a safe first step? | **Yes** — housing gate + Reservas leaf collapse (+ optional D11 active-state) |

---

*End of Implementation Readiness Review. No code modified.*
