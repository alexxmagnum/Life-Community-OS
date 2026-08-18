# Life Community OS — Informe de auditoría completa

> **Modo:** análisis (lectura + síntesis)  
> **Fecha:** 2026-08-18  
> **Alcance:** monorepo completo (`apps/`, `packages/`, `tenants/`, `docs/`)  
> **Fuentes:** exploración monorepo · stack Life Map · tenant Life Panorámica · rutas `apps/web` · `AUDIT_REPORT.md` (2026-08-14) · `docs/audit/tenant-isolation-report.md` · canvas [repo-full-audit](file:///C:/Users/PruebaAdmin/.cursor/projects/c-Users-PruebaAdmin-Desktop-Life-Community-OS/canvases/repo-full-audit.canvas.tsx)  
> **Acciones:** ninguna sobre código de producto en esta entrega de informe

---

## 1. Veredicto ejecutivo

**Demo Panorámica fuerte. Spine de plataforma real. No es SaaS production-ready.**

| Dimensión | Nota |
|-----------|------|
| Estado general | **6.5 / 10** como pilot comercial demo · **3 / 10** como SaaS multi-tenant |
| SoT operativo | Catálogos tenant + `localStorage` / `sessionStorage` |
| Auth / RBAC | Teatro client-side (`setRole`, sin middleware de sesión) |
| Life Map | Dirección correcta: MapLibre self-hosted + GeoJSON propio + Three overlay de lugares |
| Bloqueadores de “producto” | Persistencia, auth real, dualidad Location↔LocalEntity, leaks de marca, docs stale, tests casi nulos |

El monorepo tiene arquitectura de plataforma (packages / apps / tenants, Module Registry, TenantConfiguration, dominios en `@life-community-os/types`). La realidad operativa sigue siendo una **reference app single-tenant** cableada a Life Panorámica.

---

## 2. Inventario del monorepo

| Elemento | Cantidad / estado |
|----------|-------------------|
| App | 1 (`apps/web`, Next 15) |
| Packages | ~13 |
| Tenant packs | 1 (`tenants/life-panoramica`) |
| Rutas member | ~46 |
| Screens | ~47 |
| Test files | ~2 |
| SQL migrations | ~19 (RLS iniciada; UI no cableada a Supabase como SoT) |
| Docs `.md` | ~419 (muchos aspiracionales / desfasados) |

### Madurez por capa (0–100, cualitativo)

| Capa | Demo-ready | Production-ready |
|------|------------|------------------|
| Demo UX | 88 | 40 |
| Mapa | 72 | 45 |
| Location | 70 | 35 |
| Dominios | 80 | 55 |
| Persistencia | 25 | 20 |
| Auth | 15 | 10 |
| Tests | 8 | 5 |
| Docs vivos | 35 | 25 |

---

## 3. Qué funciona hoy (demo)

| Superficie | Ruta | Estado |
|------------|------|--------|
| Home premium | `/` | OK |
| Comunidad | `/community` | OK (hub con huecos) |
| Life Map híbrido | `/map` | OK (self-hosted) |
| Registro negocio → mapa | `/business/register` | OK |
| Ficha Location | `/locations/[id]` | OK |
| Housing | `/housing` | OK (seed en web + localStorage) |
| Marketplace | `/marketplace` | OK (tipos en tenant, no en platform) |
| Experiencias / recursos | `/experiences`, `/resources` | OK |
| Near / LocalEntity | `/near/*` | Paralelo a Location (deuda) |
| Trades profesionales | `/services/.../[trade]` | Stub |
| Auth real | — | Stub |
| Supabase como SoT de UI | — | No cableado |

Validación visual reciente (artefactos): `docs/audit/map-ux-validation.png`, `ficha-validation.png`, `home-validation.png`, `register-validation.png`.

---

## 4. KEEP / FIX / REMOVE / BUILD

### KEEP

- Monorepo `apps` / `packages` / `tenants`
- Module Registry + TenantConfiguration
- **Location** como SoT de mapa / negocios geocodificados
- **MapLibre self-hosted** + GeoJSON territorial Panorámica (roads / buildings / water / green)
- Three como **overlay de lugares** (no como mundo completo)
- Experience resolver + proxy `/api/geocode`
- Migraciones RLS iniciadas (foundation)

### FIX (P0)

1. Congelar contrato demo: catalogs + localStorage (explicitar límites, no fingir prod)
2. Estabilizar epic mapa/location WIP como unidad shippable
3. Quitar branding Panorámica / Motans de `packages/ui`
4. Rate-limit / proteger `/api/geocode` (hoy público → Nominatim)
5. Alinear `docs/product` con `/housing` + `/map` reales

### REMOVE / cuarentena

- Motor Three **full** como path de producto (`life-map-renderer-three` vía `ENGINE=three`)
- Alias de estilo EARTH / demotiles comerciales como dependencia de producto
- Seed con **offsets inventados** tratados como verdad geográfica
- Docs de producto que niegan Housing/Map
- Círculos GIS en hybrid (mantener ocultos)

### BUILD (P1–P2)

- Persistencia real (1–2 verticales → Supabase + RLS)
- Auth + middleware; eliminar `setRole` productivo
- Unificar Location ↔ LocalEntity
- glTF reales en asset registry
- Glyphs self-hosted; extrusiones Catastro opcionales

---

## 5. Critical issues (P0)

### 5.1 Demo catalogs + localStorage como SoT

Experiencias, resources, marketplace, conversaciones, housing CRUD, reservas, **locations** viven en `tenants/life-panoramica` y/o storage del browser.

**Riesgo:** confusión “demo = producción”; sin RLS ni multi-dispositivo.

### 5.2 Auth / identidad client-side

`TenantProvider` expone `setRole` / `setDemoPersonId`; capabilities en cliente; `packages/auth` stub; sin middleware de sesión.

**Riesgo:** cualquier “permiso” es UI theater. Severidad: **crítica**.

### 5.3 Feature flags AND-coupled

En `packages/types` (`tenant-configuration`), un módulo con varias flags exige **todas** ON. Apagar `work` o `calendar` puede apagar módulos enteros.

**Riesgo:** enablement incorrecto para futuros tenants.

### 5.4 Filtraciones de Panorámica en packages compartidos

| Sitio | Problema |
|-------|----------|
| `packages/ui` HomePremium | Defaults de glyphs bajo `/tenants/life-panoramica/...` |
| `CommunityAppChrome` | Placeholder “Buscar en Life Panoramica” |
| Chrome / home / logo | Hex Motans hardcodeados (`#00D8E8`, `#B7F22A`, …) |
| `packages/assets` | Resolve tenant-scoped sin `tenant` puede servir branding Panorámica |

Detalle: `docs/audit/tenant-isolation-report.md` (clases A ≈ 8 grupos).

### 5.5 Marketplace sin contrato de dominio en platform

`MarketplaceListing` vive en el tenant pack; platform asume el concepto sin tipo compartido limpio.

---

## 6. High priority

1. **`apps/web` hard-wired** a un solo tenant (OK como pilot; no es shell multi-tenant).
2. **Assets SoT invertido** — registry generado desde `apps/web/public/assets/3d/manifest.json`; branding tenant en registry “platform”.
3. **Services / Work incompletos** — sin `ServiceRequest` / professional profile de dominio; trades stub.
4. **Housing ownership confusa** — seed `platform_demo` en web + Unsplash + localStorage; tenant pack sin listings demo; docs IA/D13 todavía pueden negar `/housing`.
5. **Orquestación AuthZ duplicada** — ~6 helpers `*-conversation-access.ts` + fallbacks `DEMO_TENANT_ID`.
6. **Spatial keys** — tenant content referencia keys no registradas → `MissingAssetError` al resolver; naming drift `place.*` vs `places.*`.
7. **Docs Housing / IA contradictorias** vs rutas reales.
8. **Sin ADR de Life Map** pese a contratos, `/map`, content y varios packages de renderer.
9. **Dualidad Location vs LocalEntity** — mapa/fichas vs `/near` (dos sistemas de “lugar”).

---

## 7. Medium / Low (resumen)

**Medium:** layer IDs Life Map inconsistentes; taxonomías de assets solapadas; stubs `Entity`/`Place`; flags huérfanas (`communityPulse`, `incidents`, `intelligentDiffusion`); caps namespace mixto; `community.pets` siempre ON; `packages/types` = DTOs + behaviour; nav duplicada (`explorer-nav` vs `navigation-projector`); UI exports muertos; locale/currency ES/EUR en core.

**Low:** alias `Resource`; CSS en uso; casi 0 `TODO`/`console` en app product; packages no dependen de apps (salvo generación assets).

---

## 8. Deuda estructural (dualidades)

| Dualidad | Evidencia | Riesgo |
|----------|-----------|--------|
| Location vs LocalEntity | map SoT vs `/near` catalogs | Alto |
| MapLibre+hybrid vs Three full | `life-map-dev` / `ENGINE=three` | Medio |
| Nav explorers duplicados | explorer-nav vs navigation-projector | Medio |
| Housing ownership | screens OK · seed en web · docs viejos | Medio |
| AuthZ teatro | TenantProvider · sin middleware | Alto |
| Docs vs código | ~419 md · IA product desfasada | Medio |

### Otras duplicaciones

| Área | Duplicación |
|------|-------------|
| Conversation access | 6× `*-conversation-access.ts` |
| Home types | HomePremium tones/glyphs UI + tenant |
| Spatial categories | `AssetSpatialCategory` vs `SpatialLibraryCategory` |
| Experiences ↔ Activities | un tipo, dos módulos/flags |

---

## 9. Life Map — estado actual (actualizado 2026-08-18)

### Dirección correcta (KEEP)

- Basemap **self-hosted**: estilo propio + GeoJSON territorial (sin Mapbox / MapTiler / ESRI como dependencia).
- Three **solo overlay** de lugares / acentos procedurales.
- Location sigue siendo SoT de negocios en el mapa.
- Spine: `premium-style` · `base-layer-binder` · proyección Location · datos Panorámica `territory/data/{roads,buildings,water,green}/v1/`.

### Gaps (FIX)

- Persistencia Location en `localStorage`
- Seed demo con **offsets** respecto a geocode (no pins “verdad”)
- **0 glTF** reales en registry (meshes procedurales)
- Glyphs de MapLibre vía CDN demotiles (fonts; sin API key, pero no self-hosted)
- Hybrid descarta volúmenes 3D de territorio (MapLibre posee fabric)

### Siguiente (BUILD)

- Pins geocoded reales · modelos 3D · persistencia Location · fonts self-hosted · opcional Catastro extrusions

### Nota histórica

La auditoría del 14/08 decía “Three no cableado a `/map`”. Eso cambió: hoy `/map` es **híbrido MapLibre + capa 3D**. El path Three *full-world* debe quedar en **cuarentena**, no como producto.

---

## 10. Seguridad / privacidad

| Riesgo | Detalle | Severidad |
|--------|---------|-----------|
| Auth teatro | Rol/persona demos en cliente; sin session middleware | Crítico |
| localStorage SoT | Locations, reservas, housing overrides, chats | Alto |
| Geocode abierto | `/api/geocode` → Nominatim sin auth | Medio |
| Tenant leaks | UI compartida con defaults Panorámica/Motans | Medio |
| Service role en `.env.example` | Documentado; no debe llegar al browser | Bajo |

---

## 11. Packages — madurez

| Package | Rol | Madurez |
|---------|-----|---------|
| `types` | Dominio + registry | Alta |
| `ui` / `design-tokens` | Chrome + marca | Media (leaks) |
| `life-map-renderer*` | Contrato + MapLibre + 3D layer | Activo |
| `address-geocoder` | Nominatim | Usable |
| `assets` | Registry 3D (sin GLB) | Hueco |
| `auth` | Stub | Stub |
| `database` | Cliente Supabase | Foundation |
| `life-map-provider-osm` | Frontier OSM | Early |
| `life-map-renderer-three` | Legacy full Three | Cuarentena |

---

## 12. Código muerto e inconsistencias de naming

**Muerto / poco usado:** exports UI sin consumidores (`CategoryDoorCard`, `AssetCard`, `LifeLogo`, …); stubs `Entity`/`Place`; `ParticipationTrust`; flag `intelligentDiffusion` sin gate; Three full renderer no como path producto.

**Naming:** `object` / `scene` / `place` significan cosas distintas en UI vs spatial vs LifeMap; `Property` vs `HousingProperty`; Activities vs Experiences; caps `community.*` vs `incidents.request.create`; package `types` no es solo types.

---

## 13. Riesgos futuros

1. Segundo tenant imposible sin extraer branding UI, resolver de tenant, y SoT real (DB + RLS).
2. Tratar seed offsets + procedural 3D como “mapa de producto” en demos comerciales sin matizar.
3. AND-flags sorprenderán al primer tenant que apague solo `work` o `mobility`.
4. Docs stale → decisiones erróneas (“Housing no existe”).
5. Crecimiento de `packages/ui` con Motans embebido → white-label falso.
6. Housing Unsplash + localStorage → branding/compliance.
7. Sin ADR Life Map → reescritura de fronteras renderer/content/registry.
8. Dual Location/LocalEntity → UX y datos divergentes.

---

## 14. Roadmap recomendado

### P0 — ahora

1. Congelar contrato demo y no fingir AuthZ de producción  
2. Cerrar epic mapa/location como unidad shippable  
3. Aislar branding Panorámica fuera de `packages/ui` (ver tenant-isolation Phase 1)  
4. Proteger `/api/geocode` + alinear docs con código  

### P1 — siguiente

1. Persistencia real 1–2 verticales (Supabase + RLS)  
2. Auth real + unificar Location/LocalEntity  
3. glTF + pins geocoded reales + glyphs self-hosted  

### P2 — después

1. Trades / Decide / Security reales **o** apagar flags  
2. Shell multi-tenant + harness de tests  
3. Gobernanza docs: archivar aspiracional  

### Orden de limpieza técnico (detalle)

1. Docs sync + ADR Life Map  
2. Tenant leakage en UI  
3. Feature flag semantics (AND → documentar o cambiar)  
4. Domain gaps (MarketplaceListing en types; Services/Work)  
5. Housing ownership única  
6. Conversation access consolidado  
7. Life Map hygiene (layers, keys, no resolver hasta registry)  
8. Assets generation desacoplada  
9. Auth real  
10. UI dead exports  
11. Solo entonces evolucionar renderer 3D de producto (no reactivar full Three como default)

---

## 15. Checklist por área

| Área | Veredicto |
|------|-----------|
| 1. Arquitectura general | Deps OK en dirección; fugas UI/assets; app single-tenant |
| 2. Domain model | Housing/Location/Life Map sólidos; Marketplace/Services incompletos |
| 3. Multi-tenant | Pack isolation OK en papel; platform contaminada; app hard-wired |
| 4. Module system | Registry útil; AND flags peligrosas; caps/flags huérfanas |
| 5. Asset system | Registry UI maduro; spatial vacío; 0 glTF; naming drift |
| 6. Life Map | Self-hosted híbrido OK; gaps persistencia/assets/glyphs; Three full cuarentena |
| 7. UI / DS | Hub/home 2ª gen; exports legacy; Motans en shared |
| 8. Clean code | Casi sin TODO/console en app; deuda = demo SoT + dead exports |
| 9. Documentación | Housing/IA stale; falta ADR; exceso de md aspiracional |
| 10. Producción | No listo SaaS; pilot/demo sí; AuthZ client-side |

---

## 16. Bottom line

**Life Panorámica es un community OS demo-completo** con mapa self-hosted usable y fichas/registro de negocio conectados a Location.

Los **packages son scaffolding real** de plataforma.

Lo que bloquea llamar a esto “producto SaaS”:

1. Persistencia real  
2. Auth real  
3. Dualidad de lugares (Location vs LocalEntity)  
4. Leaks de marca en UI compartida  
5. Docs viejos / sin gobernanza  
6. Casi sin tests  

**Contrato honesto hoy:** pilot comercial single-tenant con límites explícitos de demo — no multi-tenant production.

---

## Anexos

- Canvas visual: `canvases/repo-full-audit.canvas.tsx` (en el proyecto Cursor del workspace)  
- Aislamiento tenant (detalle Phase 1): `docs/audit/tenant-isolation-report.md`  
- Capturas UX: `docs/audit/*-validation.png`  

*Informe consolidado 2026-08-18. Sustituye el veredicto de mapa del informe 2026-08-14 (Three “no cableado”) por el estado híbrido self-hosted actual.*
