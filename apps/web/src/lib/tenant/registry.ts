/**
 * Tenant pack registry — Platform hosts tenants; Panorámica is one pack.
 */

import type { TenantConfiguration } from "@life-community-os/types";
import type { TenantBrandTokens } from "@life-community-os/design-tokens";
import {
  CAPABILITIES,
  capabilitiesForRole,
  lifePanoramicaFeatures,
  lifePanoramicaTheme,
  resolveLifePanoramicaTenantConfiguration,
  type CapabilityKey,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";
import {
  LIFE_PANORAMICA_TENANT_SLUG,
  resolveTenantPublicId,
} from "./ids";

export type TenantPackRuntime = {
  slug: string;
  displayName: string;
  theme: TenantBrandTokens;
  features: TenantFeatureFlags;
  resolveConfiguration: () => TenantConfiguration;
  capabilitiesForRole: (role: DemoRole) => Set<CapabilityKey>;
};

const packs = new Map<string, TenantPackRuntime>();

function registerPack(pack: TenantPackRuntime): void {
  packs.set(pack.slug, pack);
}

registerPack({
  slug: LIFE_PANORAMICA_TENANT_SLUG,
  displayName: "Life Panorámica",
  theme: lifePanoramicaTheme,
  features: lifePanoramicaFeatures,
  resolveConfiguration: resolveLifePanoramicaTenantConfiguration,
  capabilitiesForRole,
});

export function listRegisteredTenantSlugs(): string[] {
  return [...packs.keys()];
}

export function getTenantPack(slugOrId: string): TenantPackRuntime | null {
  const slug = resolveTenantPublicId(slugOrId);
  return packs.get(slug) ?? null;
}

export function requireTenantPack(slugOrId: string): TenantPackRuntime {
  const pack = getTenantPack(slugOrId);
  if (!pack) {
    throw new Error(`Unknown tenant pack: ${slugOrId}`);
  }
  return pack;
}

export function resolveActiveTenantSlug(
  hint?: string | null,
): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim();
  const candidate = hint?.trim() || fromEnv || LIFE_PANORAMICA_TENANT_SLUG;
  const slug = resolveTenantPublicId(candidate);
  if (packs.has(slug)) return slug;
  return LIFE_PANORAMICA_TENANT_SLUG;
}

export { CAPABILITIES };
