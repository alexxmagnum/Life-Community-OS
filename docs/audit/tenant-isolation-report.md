# Phase 1 — Tenant Isolation Hardening

> **Mode:** analysis only (no code changes)  
> **Date:** 2026-08-14  
> **Scope:** `packages/ui`, `packages/assets`, `packages/types`, `apps/web` shared shell (`components/`, `providers/TenantProvider`, `app/layout`)  
> **Goal:** classify tenant leaks so Phase 1 fixes can be prepared without behaviour change yet

## Classification legend

| Class | Meaning |
|-------|---------|
| **A** | Architectural error — must leave platform/shared defaults; inject via props/context/tenant pack |
| **B** | Allowed — configuration received by props/context, or expected composition-root wiring for the reference app |
| **C** | False positive — comments, docs, isolation tests, or “no Panoramica” statements |

---

## Summary

| Class | Count (approx.) |
|-------|-----------------|
| A | 8 issue groups |
| B | 5 issue groups |
| C | 6 issue groups |

Highest Phase 1 targets: **`HomePremium` glyph defaults**, **`CommunityAppChrome` search default**, **Motans hex in shared UI**, **`LifeLogo` Motans lockup**, **assets tenant resolve without tenant context**.

---

## A — Error arquitectónico (debe salir de platform)

### 1. HomePremium — default glyph URLs under `/tenants/life-panoramica/`

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/home/HomePremium.tsx` |
| **Problema** | `HOME_GLYPH_3D` hardcodes 9 paths to `/tenants/life-panoramica/glyphs|intents/...`. Shared UI package ships Panoramica binaries as defaults. |
| **Impacto** | Cualquier tenant que use HomePremium sin override carga assets de Panoramica. Viola white-label / LAW multi-tenant. |
| **Solución propuesta** | Eliminar mapa default; exigir `glyphImageUrl` / asset map desde app o theme.imagery. Fallbacks neutros (vacío / token icon) si falta. |
| **Prioridad** | P0 |
| **Clase** | A |

---

### 2. CommunityAppChrome — copy default “Life Panoramica”

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/layout/CommunityAppChrome.tsx` |
| **Problema** | Comentario “Life Panoramica Community Explorer”; prop default `searchPlaceholder = "Buscar en Life Panoramica"`. |
| **Impacto** | Shell compartido muestra nombre de un tenant concreto si el caller no pasa placeholder. |
| **Solución propuesta** | Default genérico (`"Buscar"` / `"Search"`) o **sin default** (required prop). Nombre de territorio solo desde `theme.identity` en la app. |
| **Prioridad** | P0 |
| **Clase** | A |

---

### 3. CommunityAppChrome / HomePremium / TerritoryHome — Motans hex hardcoded

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/layout/CommunityAppChrome.tsx`, `packages/ui/src/home/HomePremium.tsx`, `packages/ui/src/territory/TerritoryHome.tsx` |
| **Problema** | Colores Motans (`#00D8E8`, `#B7F22A`, `#001219`, `#E4F224`) en classNames en lugar de CSS vars / design-tokens. |
| **Impacto** | Identidad visual de un brand embebida en platform UI; segundo tenant no puede re-skin completo sin fork. |
| **Solución propuesta** | Sustituir por `var(--color-accent-cyan)`, `var(--color-accent-lime)`, `var(--color-text-on-action)`, etc. (ya existen en theme night). Sin cambiar look del pilot si el theme Panoramica define los mismos valores. |
| **Prioridad** | P0–P1 |
| **Clase** | A |

---

### 4. LifeLogo — Motans geometry + gradient hardcoded

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/brand/LifeLogo.tsx` |
| **Problema** | Documentado como “Life Panorámica / Motans”; gradient stops `#00D8E8` / `#B7F22A` fijos; wordmark asume lockup LIFE / PANORÁMICA. |
| **Impacto** | Componente “shared brand” no es tenant-agnostic. Hoy poco usado por apps (splash usa `theme.imagery`), pero exportado desde `@life-community-os/ui`. |
| **Solución propuesta** | Mover a tenant pack **o** aceptar `gradientStops` / `markSvg` por props y defaults neutros. Preferible: no exportar Motans como platform logo. |
| **Prioridad** | P1 |
| **Clase** | A |

---

### 5. packages/assets — resolve tenant-scoped sin `tenant` option

| Field | Content |
|-------|---------|
| **Archivo** | `packages/assets/src/resolve.ts` |
| **Problema** | Assets `scope: "tenant"` se sirven si **no** se pasa `options.tenant`; solo fallan si se pide **otro** tenant. |
| **Impacto** | Branding Panoramica (`branding.life-panoramica-*`) puede filtrarse a callers “agnósticos”. |
| **Solución propuesta** | Fail closed: tenant-scoped requiere `tenant` matching; o exigir tenant context en API. Comportamiento de product UI no cambia si callers pasan tenant (preparar wiring). |
| **Prioridad** | P0 |
| **Clase** | A |

---

### 6. packages/assets — generación acoplada a `apps/web` + keys Panoramica en registry platform

| Field | Content |
|-------|---------|
| **Archivo** | `packages/assets/scripts/generate.mjs`, `packages/assets/src/registry.generated.ts` |
| **Problema** | Manifest SoT en `apps/web/public/assets/3d/manifest.json`. Registry generado incluye entradas `tenant: "life-panoramica"`. |
| **Impacto** | Package “platform” conoce y empaqueta un tenant. Aceptable como *contenido indexado* si el resolve es fail-closed; hoy mezcla platform + tenant en un solo artefacto. |
| **Solución propuesta** | Fase 1: documentar + endurecer resolve (issue 5). Fase 2: split `platform` vs `tenant` manifests o generate multi-pack. No borrar branding Panoramica del disk — solo del default path de platform. |
| **Prioridad** | P1 (doc + resolve primero; split después) |
| **Clase** | A (acoplamiento) / parcialmente B (tenant assets en registry con scope correcto) |

---

### 7. apps/web `layout.tsx` — metadata Motans / Life Panoramica

| Field | Content |
|-------|---------|
| **Archivo** | `apps/web/src/app/layout.tsx` |
| **Problema** | `metadata.title` / `applicationName` hardcodeados a “Life Panoramica”; comentario Motans lockup. |
| **Impacto** | En un shell multi-tenant, SEO/PWA name deben venir del tenant activo. Como **reference app** es esperable; como shared platform shell es fuga. |
| **Solución propuesta** | Fase 1: clasificar app como “Panoramica reference host” (B) **o** leer de theme pack en generateMetadata. Para isolation hardening: mover strings a tenant theme / config. |
| **Prioridad** | P1 |
| **Clase** | A si se pretende shell multi-tenant; **B** si `apps/web` se declara oficialmente reference-only |

---

### 8. TenantProvider — hard-wire permanente a Life Panoramica

| Field | Content |
|-------|---------|
| **Archivo** | `apps/web/src/providers/TenantProvider.tsx` |
| **Problema** | `theme = lifePanoramicaTheme`, `features = lifePanoramicaFeatures`, `resolveLifePanoramicaTenantConfiguration()` fijo. |
| **Impacto** | No hay resolución de tenant. Toda la app es single-tenant en runtime. |
| **Solución propuesta** | Introducir `resolveTenant(slug)` / registry de packs; Phase 1 solo **extrae interfaz** sin cambiar el único pack registrado. Comportamiento idéntico hoy. |
| **Prioridad** | P1 |
| **Clase** | A (para multi-tenant); B como composition root del pilot actual |

---

## B — Permitido (props / context / composition)

### 9. Screens / libs importan `@life-community-os/tenant-life-panoramica`

| Field | Content |
|-------|---------|
| **Archivo** | `apps/web/src/screens/*`, `apps/web/src/lib/*-conversation-access.ts`, etc. |
| **Problema** | Imports directos del tenant pack. |
| **Impacto** | Acoplamiento fuerte, pero es el **host de referencia** consumiendo su pack. No es fuga dentro de `packages/*`. |
| **Solución propuesta** | Más adelante: ports/adapters; no es Phase 1 isolation de platform. |
| **Prioridad** | P2 |
| **Clase** | B |

---

### 10. MemberShell / Territory* components tipados al pack

| Field | Content |
|-------|---------|
| **Archivo** | `apps/web/src/components/MemberShell.tsx`, `TerritoryBelongingCard.tsx`, `TerritoryLocalLifeSection.tsx` |
| **Problema** | Importan tipos/helpers del tenant pack. |
| **Impacto** | Composition layer del reference app — permitido si no viven en `packages/ui`. |
| **Solución propuesta** | Mantener en `apps/web`. Evitar mover estos defaults a `packages/ui`. |
| **Prioridad** | P2 |
| **Clase** | B |

---

### 11. Profile / Marketplace fallbacks `"Life Panoramica"` desde theme

| Field | Content |
|-------|---------|
| **Archivo** | `apps/web/src/screens/ProfileScreen.tsx`, `MarketplaceComposerScreen.tsx` |
| **Problema** | Fallback string `"Life Panoramica"` si falta `theme.identity`. |
| **Impacto** | Bajo si theme siempre define identity (Panoramica pack sí). |
| **Solución propuesta** | Fallback genérico `"Community"` o throw en dev si falta identity. |
| **Prioridad** | P2 |
| **Clase** | B (app host) con olor a A si el fallback se copia a UI package |

---

### 12. Assets registry entries `tenant: "life-panoramica"` con `scope: "tenant"`

| Field | Content |
|-------|---------|
| **Archivo** | `packages/assets/src/registry.generated.ts` |
| **Problema** | Keys de branding con tenant slug. |
| **Impacto** | Correcto como **contenido tenant indexado**, si el resolve exige contexto (hoy no del todo — ver issue 5). |
| **Solución propuesta** | Conservar entradas; arreglar resolve fail-closed. |
| **Prioridad** | P0 ligado a issue 5 |
| **Clase** | B (contenido) + A (API resolve) |

---

### 13. Housing `defaultCurrency: "EUR"` en types

| Field | Content |
|-------|---------|
| **Archivo** | `packages/types/src/domain/housing.ts` |
| **Problema** | Default EUR en config platform-neutral. |
| **Impacto** | Sesgo de mercado, no branding Panoramica literal. Override por tenant config existe. |
| **Solución propuesta** | Documentar como “pilot default”; tenants deben setear currency. Opcional: sin default / require explicit. |
| **Prioridad** | P3 |
| **Clase** | B (default de plataforma, no tenant id) |

---

## C — Falso positivo

### 14. Comentarios “No Life Panoramica” / “tenant-neutral” en types

| Field | Content |
|-------|---------|
| **Archivo** | `packages/types/src/domain/life-map.ts`, `housing.ts`, `life-map-objects.ts`, notifications, participation, etc. |
| **Problema** | Menciones del nombre en comentarios de diseño. |
| **Impacto** | Ninguno en runtime. |
| **Solución propuesta** | Ninguna (o suavizar wording). |
| **Prioridad** | — |
| **Clase** | C |

---

### 15. `packages/ui` conversation index / test-interaction

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/conversation/index.ts`, `packages/ui/scripts/test-interaction.mjs` |
| **Problema** | Afirman “No Panoramica” / assert no match `life-panoramica` en interaction modules. |
| **Impacto** | Positivo — protegen isolation en un subárbol; no detectan HomePremium/Chrome. |
| **Solución propuesta** | Extender el test a `HomePremium` / chrome defaults (futuro). |
| **Prioridad** | P2 (ampliar test) |
| **Clase** | C (menciones) / mejora B |

---

### 16. TerritoryHome / MobileExperience — ejemplos en JSDoc

| Field | Content |
|-------|---------|
| **Archivo** | `packages/ui/src/territory/TerritoryHome.tsx`, `packages/ui/src/layout/MobileExperience.tsx` |
| **Problema** | Ejemplos de copy (“Panorámica está viva hoy”, “e.g. Life Panoramica”) en comentarios de props. |
| **Impacto** | Ninguno si el valor real llega por props. |
| **Solución propuesta** | Opcional: ejemplos genéricos en docs. |
| **Prioridad** | P3 |
| **Clase** | C |

---

### 17. assets README / types example slug `"life-panoramica"`

| Field | Content |
|-------|---------|
| **Archivo** | `packages/assets/README.md`, `packages/assets/src/types.ts`, `spatial-library.ts` comments |
| **Problema** | Documentación usa el slug del pilot. |
| **Impacto** | Ninguno en runtime. |
| **Solución propuesta** | Usar `acme-community` en ejemplos docs. |
| **Prioridad** | P3 |
| **Clase** | C |

---

### 18. assets test-registry — asserts sobre tenant Panoramica

| Field | Content |
|-------|---------|
| **Archivo** | `packages/assets/scripts/test-registry.mjs` |
| **Problema** | Tests de aislamiento usan branding Panoramica como fixture. |
| **Impacto** | Correcto para el único tenant en el manifest. |
| **Solución propuesta** | Mantener; añadir caso “no tenant → TenantIsolationError” cuando se implemente fail-closed. |
| **Prioridad** | P1 (tras issue 5) |
| **Clase** | C / fixture B |

---

### 19. design-tokens comment “Motans turquoise”

| Field | Content |
|-------|---------|
| **Archivo** | `packages/design-tokens/src/semantic.ts` |
| **Problema** | Comentario de naming Motans en token semántico. |
| **Impacto** | El token es platform; el nombre Motans es herencia de brand del pilot. |
| **Solución propuesta** | Renombrar comentario a “brand mid-stop” sin Motans. |
| **Prioridad** | P3 |
| **Clase** | C (comentario) — el **hex en UI** sigue siendo A |

---

## Out of Phase 1 scope (noted)

| Item | Why |
|------|-----|
| Screens importing tenant pack catalogs | Reference host composition (B), not platform leak |
| `LifeMapScreen` calling `getLifePanoramicaLifeMapConfig` | App feature wiring; fix via TenantProvider ports later |
| `CommunityContentDetailScreen` comparing `areaLabel !== "Life Panoramica"` | App content logic smell; not packages/ui |
| Demo IDs in tenant pack | Correct location |

---

## Proposed Phase 1 fix order (no code in this pass)

1. **P0** — Remove `HOME_GLYPH_3D` Panoramica paths from `packages/ui` (require props).  
2. **P0** — Neutralize `searchPlaceholder` default in `CommunityAppChrome`.  
3. **P0** — Fail-closed tenant asset resolve in `packages/assets`.  
4. **P0–P1** — Replace Motans hex in UI with CSS variables (visual parity via Panoramica theme).  
5. **P1** — `LifeLogo` out of platform defaults or fully prop-driven.  
6. **P1** — `TenantProvider` interface extraction (same single pack behind it).  
7. **P1** — Extend UI isolation tests to HomePremium/Chrome.  
8. **P2+** — layout metadata / docs examples / currency defaults.

**Behaviour constraint:** Phase 1 implementation should keep Panoramica pilot looking the same by supplying today’s values from the tenant pack / theme, not from platform defaults.

---

## Validation

- Analysis only.  
- No product code modified.  
- No commit.

**STOP.**
