# Life Community OS
# IA Phase 2 — Progress Report (H1 start)

> Continues approved direction **H1/H4** after Phase 1 foundation cleanup.  
> **No commit.** Bottom nav unchanged. ConversationExperience untouched.  
> Tenant in focus: **Life Panoramica** (tenant pack — not a platform module named “Life”).

Sources: `IA_DECISION.md`, `IA_IMPLEMENTATION_PLAN.md`, `IA_IMPLEMENTATION_READINESS.md`, `IA_PHASE1_FOUNDATION_CLEANUP_REPORT.md`, `IA_OWNERSHIP_MAP.md`.

---

## Auditoría realizada (FASE 0)

### Navegación actual (post–Phase 1)

| Layer | State |
|-------|--------|
| Bottom nav | Inicio · Comunidad · + · Servicios · Perfil — **locked** |
| Hamburger | Still a broad sitemap (Comunidad, Actividades, Experiencias, Reservas, Servicios, Cerca, Oficial, Mi perfil) |
| Community UI | 6 scroll layers + Explorar tiles (Experiencias, Espacios, Servicios, Mascotas; Vivienda gated) |
| Community areas | 8 canonical ids via `?tab=` |
| Chat | ConversationExperience on 7 context routes — transversal |

### Archivos que H1 afectaría (mapa)

| Área | Archivos | Seguro ahora? | Necesita decisión? |
|------|----------|---------------|-------------------|
| Bottom nav | `MemberShell.tsx` `buildNav` | Slots stay — no change | D11 for `activeFromPath` |
| Hamburger | `navigation-projector.ts` | Partial leaf cleanup **yes** | Full Life overflow reshape later |
| Community model | `community-hub.ts` | Comments / compatibility **yes** | D5/D6 area merge/rename |
| Community UI | `CommunityScreen.tsx` | Explorar portal removal **no** (needs Life root) | Sequencing gate |
| Home | `HomeScreen.tsx`, `home-premium.ts` | Briefing trim **later** | — |
| Services | `ServicesHubScreen.tsx` | Label-only later | D1/D7 |
| Life | experiences/activities/discover/near | Entry reorg **later** | D2/D3/D4 |
| Housing | `/housing` shim only | Already Phase 1 | **D13** |
| Ownership docs | `IA_OWNERSHIP_MAP.md` | **yes** | — |

### Cambios seguros (este slice)

- Document ownership map  
- Remove confirmed false hamburger leaves (same destination / wrong owner)  
- Collapse profile `/me`-only duplicates  
- Annotate Belong target without rewriting Community UI  

### Cambios que necesitan decisión (no hechos)

- D1–D13 (esp. D2–D6, D11, D13)  
- Remove Community Explorar cross-module tiles  
- Merge Actividades + Experiencias into Life root  
- Strip hamburger Comunidad/Servicios categories entirely  
- Bottom-nav active-state policy  

---

## Ownership map (FASE 1)

Created: `docs/product/IA_OWNERSHIP_MAP.md`

| Domain | Responsibility |
|--------|----------------|
| **COMUNIDAD** | Belong — personas/plaza, grupos, participación/propuestas, oficial |
| **SERVICIOS** | Operate — recursos/reservas, soluciones, marketplace |
| **Life (surface)** | Secondary Planes + Cerca — **not** a technical module named Life Panoramica |
| **Life Panoramica** | Current **tenant** only |
| **HOUSING** | **D13 pending** — no ownership assigned |

---

## Community preparation (FASE 2 analysis — no rewrite)

### Target (future)

```
Comunidad
├── Ahora
├── Grupos
├── Proponer
└── Oficial
```

### Current (kept)

| Layer (UI) | Section id | Area ids that scroll here |
|------------|------------|---------------------------|
| Ahora mismo | `plaza-important` | actualidad |
| En la plaza | `plaza-activity` | conversaciones |
| Grupos | `plaza-people` | grupos |
| Decidir juntos | `plaza-participate` | propuestas, participacion |
| Información oficial | `plaza-official` | canales |
| Explorar | `plaza-explore` | espacios, mascotas (+ tiles) |

### Reusable components

- `CommunityHubSurfaces` / Hub tiles & rows  
- Content + group + official screens  
- `?tab=` resolver + `LEGACY_TAB_MAP`  
- ConversationExperience for group/neighbour/official  

### Minimal changes identified (not all applied)

| Change | Applied now? |
|--------|--------------|
| Document Belong target in `community-hub.ts` | **Yes** |
| Stop advertising `espacios` / `participacion` in hamburger | **Yes** |
| Collapse UI to 4 named layers | **No** — needs D5/D6 + redesign pass |
| Remove Explorar portal tiles | **No** — readiness sequencing |

### Compatible routes (unchanged)

`/community`, `/community?tab=*`, `/community/content/[id]`, `/community/groups/*`, neighbour conversation, `/official/*`.

---

## Hamburger audit (FASE 3)

### Classification (proposal)

| Category | Role under H1 | This slice |
|----------|---------------|------------|
| Comunidad (area deep links) | Secondary shortcuts into Belong | Trimmed false leaves; category kept |
| Actividades | Life / Planes family | Unchanged (**D4**) |
| Experiencias | Life / Planes | Unchanged |
| Reservas | Operate entry | Already one leaf (Phase 1) |
| Servicios | Deeper Operate doors (duplicates tab root) | Kept — full strip is later |
| Cerca de ti | Life / Cerca | Unchanged (**D2/D3**) |
| Oficial | Belong shortcut | Unchanged |
| Mi perfil | Account | Collapsed `/me` duplicates |

### Navigation vs secondary

- **Primary navigation:** bottom nav only.  
- **Secondary:** hamburger overflow + Create + Home doors.  
- **Not done yet:** rebuild hamburger as Life + Cuenta only.

---

## Cambios hechos (FASE 4 — bajo riesgo)

| Change | Detail |
|--------|--------|
| Ownership map doc | `docs/product/IA_OWNERSHIP_MAP.md` |
| Community hub header | Belong target + D13 note; 8 ids kept |
| Hamburger Comunidad | Omit `c-participacion`, `c-espacios` from menu leaves |
| Hamburger Perfil | Single **Mi perfil** → `/me`; keep actividad / reservas / guardados / sign-out |
| Projector header comment | H1 duplicate-nav note |

### Not changed

- Bottom navigation  
- Community scroll structure / Explorar tiles  
- Servicios hub  
- Discover / Experiences / Activities structure  
- ConversationExperience  
- Permissions / Core / design tokens  
- D13 Housing ownership  

---

## Archivos afectados

| File | Action |
|------|--------|
| `docs/product/IA_OWNERSHIP_MAP.md` | Created |
| `docs/product/IA_PHASE2_PROGRESS_REPORT.md` | Created (this file) |
| `tenants/life-panoramica/src/community-hub.ts` | Comment update |
| `tenants/life-panoramica/src/navigation-projector.ts` | Safe leaf cleanup |

---

## Decisiones pendientes

Carried forward: **D1–D13** (see `IA_DECISION.md`). Especially blocking fuller Phase 2:

- D2/D3 Cerca/Discover  
- D4 Actividades nesting  
- D5/D6 Community area merge/rename  
- D11 `activeFromPath`  
- D13 Housing  

Plus readiness gate: do not remove Explorar cross-module tiles without Life overflow in the same release.

---

## Riesgos

| Riesgo | Nivel | Note |
|--------|-------|------|
| Users look for “Participación” / “Espacios comunitarios” in hamburger | Bajo | Deep links still work; Espacios via Reservas |
| Hamburger still duplicates Servicios/Comunidad roots | Medio | Intentional deferral |
| Partial adoption if work stops here | Medio | Documented |
| Confusion “Life” surface vs Life Panoramica tenant | Bajo | Clarified in ownership map |

---

## Validación

| Check | Result |
|-------|--------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` | **PASS** (pre-existing `<img>` warning unrelated) |
| Bottom nav unchanged | Yes |
| Conversaciones (chat) system untouched | Yes |
| Routes preserved | Yes (`?tab=participacion` / `espacios` still resolve) |

### Manual checks suggested

1. Bottom nav: Inicio / Comunidad / + / Servicios / Perfil  
2. Hamburger → Comunidad: no Participación / Espacios comunitarios  
3. Hamburger → Mi perfil: one Mi perfil + distinct activity/reservas/guardados  
4. Open a group or marketplace conversation — ConversationExperience still works  
5. `/community?tab=participacion` still scrolls to Decidir  

---

## Status

| Item | Status |
|------|--------|
| Phase 1 foundation | Done (prior) |
| Phase 2 start (prep + safe cleanup) | **Done this slice** |
| Phase 2 Community UI reshape | **Not started** |
| Phase 2 Life overflow hamburger | **Not started** |
| Commit | **Not created — await human review** |

---

*End of Phase 2 progress report.*
