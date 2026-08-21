# Life Map Digital Twin — Auditoría y arquitectura (Fase 11)

**Fecha:** 21 agosto 2026  
**Alcance:** convertir Life Map en la comunidad vista desde arriba — territorio real + datos reales + objetos reales + experiencias reales.

MapLibre es el mapa. Three/WebGL es un acento opcional a zoom alto. Location sigue siendo Source of Truth para negocios, recursos y vivienda pública.

---

## 1. Auditoría — qué existía

### Qué existe (reutilizable)

| Pieza | Rol |
|---|---|
| `packages/life-map-renderer-maplibre` | Renderer MapLibre, estilo propio sin API keys, binder de GeoJSON territorial (roads / buildings / water / green) |
| `packages/life-map-renderer` | Escena, cámara, telemetría, panel de contexto |
| `packages/life-map-renderer-3d-layer` + `life-map-renderer-three` | Overlay Three (ya no es el mapa por defecto) |
| `tenants/life-panoramica/territory/data` | GeoJSON propio (OSM/Catastro) — agua, verde, golf, calles, edificios |
| `apps/web` Location SoT | Business / Housing / Resource → Location → LifeMapObject |
| Spatial Asset Library | Claves `asset3DKey` → registro; `modelPath` GLB opcional |
| Cámara cinematográfica | Territorio → comunidad → zona |

### Qué era falso o dañaba el producto

- Recorte a 12 objetos 3D (diorama, no comunidad).
- Cámara de entrada centrada en un “héroe” (IKON / restaurante / piscina).
- Pins de Location visibles desde zoom bajo (mapa administrativo / GIS).
- Objetos de pack `decoration` mezclados con Location SoT.
- Frontier de territorio escrito pero **no conectado** al renderer.
- Arrays de layout Panorámica **sin contrato** `TerritoryObject`.
- Three como motor opcional (`NEXT_PUBLIC_LIFE_MAP_ENGINE=three`) — se mantiene solo como legado, no como default.
- Cards con Unsplash de demo como imagen de ficha.

### Qué se elimina / se deja de usar

- `basemap-provider.ts` (Esri World Imagery incluso en dev — dependencia comercial).
- `premium-terrain.ts` duplicado (tokens ya viven en `premium-style.ts`).
- Procedural Three de venues / buildings como capa principal (`shouldShowGrounded3dAccents` exige GLB real + zoom alto).
- Escenas 3D completas, personajes, props decorativos sin coordenadas.

---

## 2. Arquitectura Digital Twin

```
Capa 1  Base map     MapLibre style propio + GeoJSON territorial
Capa 2  Territory    TerritoryObject (gate, golf, lake, green, …)
Capa 3  Location     Location SoT → negocios / servicios / recursos
Capa 4  Property     densidad residencial pública (sin propietarios)
Capa 5  Activity     preparado (eventos/reservas); no se llena de iconos
```

**Protagonista:** MapLibre.  
**Enhancement:** GLB arquitectónico a zoom ≥ 17.75, lazy, nunca 100 modelos al entrar.

**Proveedores:** sin Mapbox / MapTiler / Google / ESRI obligatorios. Sin tokens para arrancar.

---

## 3. Modelo TerritoryObject

Contrato en `packages/types/src/domain/life-map-territory-object.ts`:

```
id, tenantId, type, location, geometry, asset, visibility
```

Tipos: `gate | security | parking | pool | sports | clubhouse | golf | lake | green | building`.

Regla dura: **sin WGS84 (location o geometry) → no aparece**.  
Aislamiento: `filterRenderableTerritoryObjects(objects, tenantId)` — Valley no ve Panorámica.

Panorámica proyecta el layout local (metros → origen OSM/Catastro) a este contrato. No es un array suelto en el renderer.

---

## 4. Pipeline 3D

```
Asset key (GLB/glTF)
  → Spatial registry
  → TerritoryObject.asset
  → Renderer (MapLibre pin/fill primero)
  → Three overlay solo si zoom alto + modelPath .glb/.gltf + clave arquitectónica
```

Permitido: garita, barrera, piscina, pista, clubhouse, parking, golf.  
Prohibido: escenas, personajes, props decorativos.

Implementación: `apps/web/src/lib/life-map/territory-asset-pipeline.ts`.

---

## 5. Capas implementadas

| LOD | Zoom | Qué se ve |
|---|---|---|
| Bajo | < 14.85 | Territorio: golf, lagos, verdes, zonas. Sin pins de negocio |
| Medio | 14.85–16.45 | Landmarks: acceso, garita, parking, clubhouse, pistas |
| Alto | ≥ 16.45 | Location SoT (cluster + pins): negocios, recursos, servicios |
| 3D | ≥ 17.75 | GLB arquitectónico opcional |

Cámara de entrada: overview (zoom ~13.3) → comunidad (~14.6) → zona viva (~15.3). No aterriza sobre un objeto.

---

## 6. Datos conectados

| Dominio | Cómo llega al mapa |
|---|---|
| Business | Location SoT (`type: business`) → pin → ficha `/locations/:id` |
| Housing | Location pública (no `private`) → pin vivienda; tap = información pública. Sin propietarios/residentes |
| Resource | Location `facility` o ref `resources` → `/resources/:id/reserve` |
| Reservation / Activity | Capa preparada; no se satura de iconos |
| Media | `preferEntityMediaUrl` descarta Unsplash/data/blob en la ficha |

Objetos de pack sin coordenadas o `decoration`/`territory` no se mezclan con Location.

---

## 7. Tests

`packages/types` — TerritoryObject (posición, sin posición, aislamiento tenant).  
`apps/web/src/lib/life-map/digital-twin.test.ts` — 7 criterios de aceptación:

1. Territorio con coordenadas → aparece  
2. Sin posición → no aparece  
3. Location en lat/lng SoT  
4. Business abre ficha  
5. Resource abre reserva  
6. Valley no ve territorio Panorámica  
7. Zoom bajo no carga GLB  

---

## 8. Riesgos pendientes

- Los GLB arquitectónicos reales aún no están en el Spatial Catalog (`modelPath` opcional). El overlay Three permanece apagado hasta que existan.
- El GeoJSON de amenities Panorámica es elipses/rectángulos anclados al origen territorial, no un levantamiento topográfico milimétrico.
- Clustering MapLibre no hidrata clusters server-side; es client-only.
- La ficha de vivienda usa la ruta pública `/housing/:id` — hay que seguir sin filtrar PII en esa pantalla.
- Ocean Hills no tiene pack territorial; el mapa queda vacío a propósito (fail-closed).
- `pnpm -r typecheck` puede seguir fallando en paquetes ajenos a Life Map; la validación de esta fase es types + web + isolation.

---

## 9. Criterios de aceptación

- [x] Life Map representa la comunidad (territorio + Location)
- [x] MapLibre es protagonista
- [x] Three solo mejora detalle (GLB + zoom alto)
- [x] Sin objetos flotantes (filtro de posición)
- [x] TerritoryObject con contrato
- [x] Locations de datos reales
- [x] Pipeline de assets
- [x] LOD por zoom
- [x] Sin dependencia comercial obligatoria
- [x] Tests de la fase
