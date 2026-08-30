/**
 * Server-side permission resolution from membership role + tenant configuration.
 * UI may hide actions; this matrix is what APIs enforce.
 * Tenant packs never define or grant permissions.
 */

import {
  CAPABILITIES,
  resolveEffectivePermissions,
  type CapabilityKey,
} from "@life-community-os/types";
import type { MembershipRole } from "@life-community-os/types";
import { getTenantPack } from "@/lib/tenant/registry";

export function permissionsForRole(
  role: MembershipRole | null,
  tenantSlug?: string | null,
): readonly string[] {
  if (!role) return [];
  const pack = tenantSlug ? getTenantPack(tenantSlug) : null;
  return resolveEffectivePermissions({
    role,
    features: pack?.features,
    productCapabilities: pack?.productCapabilities,
  });
}

export function actorHasCapability(
  permissions: readonly string[],
  capability: CapabilityKey | string,
): boolean {
  return permissions.includes(capability);
}

export { CAPABILITIES };
export type { CapabilityKey };
