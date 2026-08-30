/**
 * Platform permission resolution.
 * Session + membership role + tenant configuration → effective permissions.
 * Packs cannot grant actions the role does not already have.
 */

export {
  capabilitiesForRole,
  resolveEffectivePermissions,
  isCapabilityEnabledForTenant,
} from "@life-community-os/types";

export type { EffectivePermissionInput } from "@life-community-os/types";
