/**
 * Server-side permission resolution from membership role.
 * UI may hide actions; this matrix is what APIs enforce.
 */

import {
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "@life-community-os/tenant-life-panoramica";
import type { MembershipRole } from "@life-community-os/types";

export function permissionsForRole(
  role: MembershipRole | null,
): readonly string[] {
  if (!role) return [];
  return [...capabilitiesForRole(role as DemoRole)];
}

export function actorHasCapability(
  permissions: readonly string[],
  capability: CapabilityKey | string,
): boolean {
  return permissions.includes(capability);
}
