# @life-community-os/assets

Product-level 3D asset registry for Life Community OS (SaaS).

Life Panoramica is **one tenant**, not the owner of this package.

## Usage

```ts
import {
  asset,
  getAsset,
  hasAsset,
  listAssets,
} from "@life-community-os/assets";

asset("professionals.electrician.scene");
// → "/assets/3d/platform/professionals/electrician/scene/electrician.webp"

getAsset("community.jobs.card");
hasAsset("sports.football.card");
listAssets(); // all runtime metadata (dev browsers, tooling)
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
