# @life-community-os/assets

Product-level 3D asset registry for Life Community OS (SaaS).

Life Panoramica is **one tenant**, not the owner of this package.

One registry serves:

- **UI** — `card` / `scene` / `symbol` / `object` / `hero` / `branding` (AssetPad, hubs)
- **Life Map** — `spatial_object` / `terrain` / `building` / `avatar` via `LifeMapObject.asset3DKey`

## Spatial Asset Library

Platform vocabulary (no binaries) for reusable twin objects:

Categories: `terrain` · `building` · `place` · `mobility` · `community` · `recreation` · `nature` · `avatar` · `utility`

```ts
import {
  buildSpatialAssetKey,
  defineSpatialLibraryEntry,
  SPATIAL_LIBRARY_CATEGORIES,
} from "@life-community-os/assets";

buildSpatialAssetKey({ category: "place", id: "restaurant" });
// → "place.restaurant.spatial_object"

defineSpatialLibraryEntry({
  category: "recreation",
  id: "golf",
  subtype: "golf",
  behaviour: "static",
  interaction: "open",
});
```

Keys are designed for `LifeMapObject.asset3DKey`. Optional `spatial` metadata on registry entries may include category, subtype, behaviour, interaction, scale, anchor, LOD, future `modelPath`.

## Usage

```ts
import {
  asset,
  getAsset,
  hasAsset,
  listAssets,
  listSpatialAssets,
  resolveLifeMapAsset3DKey,
  isSpatialAssetType,
} from "@life-community-os/assets";

asset("professionals.electrician.scene");
// → "/assets/3d/platform/professionals/electrician/scene/electrician.webp"

getAsset("community.jobs.card");
hasAsset("sports.football.card");
listAssets(); // all runtime metadata (dev browsers, tooling)
listSpatialAssets(); // spatial twin keys (empty until catalog ships)
```

Tenant context (optional):

```ts
asset("professionals.electrician.scene", { tenant: "life-panoramica" });
// still resolves the GLOBAL electrician

asset("branding.life-panoramica-symbol.branding.symbol", {
  tenant: "life-panoramica",
});
// tenant branding — never served to another tenant
```

## After SYNC

```bash
pnpm assets:generate
pnpm assets:validate
pnpm assets:test
```

Source of truth for runtime paths: `apps/web/public/assets/3d/manifest.json`  
Do not import the external LIFE_ASSET_LIBRARY catalog at runtime.
