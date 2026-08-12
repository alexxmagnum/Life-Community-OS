# Community Belong C.3.1 Report

> Explore gate — visual separation of Belong from non-Community portals.  
> Base: `c6c24d2` (C.1) · `f61b12b` (C.2).  
> Readiness: `COMMUNITY_BELONG_C3_READINESS.md`.  
> **No commit. No C.3.2.**

---

## Auditoría previa

| Pregunta | Hallazgo |
|----------|----------|
| ¿Dónde se renderiza Explorar? | Solo `CommunityScreen.tsx` → sección `#plaza-explore` |
| ¿Componentes? | `HomeSection`, `HubTileGrid`, `HubTile`, `HubPanel`, `HubRow` |
| ¿Rutas que abría el portal? | `/experiences`, `/resources`, `/services`, `/housing` (gated), `/near/place/*`, `/services/work/*`, group conversation |
| ¿Deep links? | `?tab=espacios`, `?tab=mascotas` → `communityHubSectionIdForArea` → `plaza-explore` |

Nada más en el shell montaba Explorar como peer Belong.

---

## Cambios realizados

1. `explorePortalReady = false` — portal **oculto** (no peer Belong).
2. Lógica de tiles **conservada** detrás del flag (rollback / C.3.2; no borrado de funcionalidad).
3. `#plaza-explore` **siempre montado** — aliases `espacios` / `mascotas` siguen haciendo scroll.
4. Copy sr-only cuando gated: apunta a Servicios / Planes (sin mover ownership aún).
5. **No movidos** Experiencias / Servicios / Espacios a otras pantallas (solo dejan de mostrarse *dentro* de Comunidad).

Visible Belong permanece:

```
Comunidad → Ahora · Grupos · Proponer · Oficial
(+ En la plaza encapsulada)
```

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `apps/web/src/screens/CommunityScreen.tsx` | Gate visual Explorar |
| `docs/product/COMMUNITY_BELONG_C3_1_REPORT.md` | Este reporte |

Sin cambios: `community-hub.ts`, ConversationExperience, bottom nav, plaza, housing gate, D5/D6.

---

## Compatibilidad

| Contrato | Estado |
|----------|--------|
| Bottom nav | Intacta |
| Rutas públicas | Intactas (`/experiences`, `/services`, `/resources`, …) |
| 8 `?tab=` + legacy | Intactos |
| `#plaza-explore` | Presente (contenido portal gated) |
| Plaza | Intacta |
| ConversationExperience | Intacta |
| Housing | Sigue gated |

---

## Validación

| Check | Resultado |
|-------|-----------|
| `pnpm -r typecheck` | **PASS** |
| `pnpm lint` | **PASS** (warning preexistente `ServicesCategoryScreen` img) |

---

## Pendientes (C.3.2+)

- Soft-land `?tab=espacios` → Operate entry (sin borrar id)
- Comunicar / reforzar puertas Life (Experiencias) fuera de Comunidad
- Mascotas placement
- Decisión plaza / D5 / D6 / D13
- Retirar código muerto del portal tras periodo de alias estable (no en C.3.1)

---

## Explicit non-actions

- No commit  
- No C.3.2  
- No move de Experiencias/Servicios/Espacios  
- No cambios de rutas / CE / bottom nav  

---

*End of Community Belong C.3.1 Report.*
