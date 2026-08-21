# Spatial Asset Pipeline — Auditoría (Fase 12)

**Fecha:** 21 agosto 2026  
**Alcance:** biblioteca GLB profesional + registry. No se modifica MapLibre, TerritoryObject contract, Location SoT ni dominios de negocio.

---

## 1. Qué había

| Pieza | Estado |
|---|---|
| `packages/assets` UI registry | 48 webp (cards/scenes/symbols) — UI, no twin |
| `spatial-catalog.ts` | Claves semánticas (`place.restaurant.spatial_object`…) **sin `modelPath`** |
| `spatial-library.ts` | Taxonomía SaaS, sin binarios |
| TerritoryObject.asset | `{ key, format, path? }` — referencia vacía de GLB |
| `gltf-asset.ts` | Loader + cache, pero **cero GLB reales** |
| Three overlay | Procedural / apagado a zoom bajo |

### Reutilizable

- Contrato TerritoryObject (no se toca).
- Spatial library keys como alias.
- GLTFLoader, dispose, cache de plantillas.
- LOD de cámara MapLibre (Phase 11).
- Pivot `bottom` ya previsto en metadata espacial.

### Basura / no usar como twin

- Webp de escenas (`*.scene`) y personajes (hand-wave, heart-community).
- Previews reutilizados de sports/marketplace para “restaurant” o “house”.
- Árboles / avatares en la taxonomía (`SpatialAvatarSubtype`) — **no se generan**.

### Faltaba

- 12 GLB arquitectónicos en metros reales.
- `SpatialAsset` + `SpatialAssetRegistry`.
- LOD0/1/2 por asset.
- Lazy load + no cargar invisibles.
- Asignación admin TerritoryObject.type → asset.

### Escala / rendimiento (antes)

- Sin escala real (no había mesh).
- Riesgo de cargar el mismo Group Three en varios markers (grafo compartido).
- Compresión Draco innecesaria con 0 triángulos reales.

---

## 2–6. Entregado en esta fase

Ver `packages/assets/src/spatial-asset.ts` (contrato), `spatial-asset-registry.ts`, `spatial-asset-library.ts` (12 assets), `scripts/generate-spatial-glb.mjs` (GLB), `spatial-asset-assignment.ts` (admin), `spatial-asset-pipeline.ts` (LOD/zoom).

GLB en:

`apps/web/public/assets/3d/platform/spatial/{category}/{name}/lod{0|1|2}/{name}.glb`

Estilo: piedra, cerámica, cristal, plástico premium. Pivot suelo, unidades metros, scale 1.

---

## 7. Tests

`packages/assets` `spatial-asset.test.ts` — TEST 1–6 de la fase.

---

## 8. Riesgos

- Los GLB son massing arquitectónico (hospitality), no un scan fotogramétrico.
- Draco queda **preparado** (`compression: "none"`) — no se sirve decoder hasta que el tri-count lo justifique.
- Three sigue gated por el overlay híbrido de Life Map; el pipeline está listo cuando el overlay pide modelPath.
- Lago/golf son landmarks, no el recinto entero (eso sigue en GeoJSON MapLibre).
