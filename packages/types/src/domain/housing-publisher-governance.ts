import type { DomainId, IsoDateTimeString } from "./ids";
import type {
  HousingPublisher,
  HousingPublisherApprovalStatus,
  HousingPublisherKind,
  HousingPublisherVerificationStatus,
  HousingPublishingConfig,
  HousingTenantModuleConfig,
} from "./housing";

/**
 * Housing professional publisher governance (contracts + pure rules).
 *
 * Not a CRM. Not onboarding UI. Not AuthZ engine — callers grant/revoke
 * `housing.publisher` via existing RBAC; this module defines *when* that
 * grant is allowed and whether a professional may publish.
 *
 * Relationship:
 *   Person (user) → HousingPublisherProfile → Organization (optional)
 *
 * Who may grant `housing.publisher`:
 *   Actors with `housing.manage` while the module is enabled and the tenant
 *   allows professionals (`publishing.professionalsEnabled`).
 */

/** Soft organization reference — not an agency CRM aggregate. */
export type HousingPublisherOrganizationRef = {
  id: DomainId;
  /** Public trade / agency / promoter name. */
  name: string;
};

/**
 * Durable publisher profile for a Person in a Tenant.
 * Distinct from listing-embedded `HousingPublisher` (display projection).
 */
export type HousingPublisherProfile = {
  id: DomainId;
  tenantId: DomainId;
  /** Always `professional` for governance profiles in this slice. */
  kind: Extract<HousingPublisherKind, "professional">;
  /** Linked Person (user / neighbour identity). */
  personId: DomainId;
  displayName?: string;
  organization?: HousingPublisherOrganizationRef;
  approvalStatus: HousingPublisherApprovalStatus;
  verificationStatus: HousingPublisherVerificationStatus;
  /**
   * Product hint that RBAC currently exposes `housing.publisher`.
   * Source of truth remains capability store — this mirrors for UX / audits.
   */
  publisherCapabilityGranted: boolean;
  grantedByPersonId?: DomainId;
  grantedAt?: IsoDateTimeString;
  revokedByPersonId?: DomainId;
  revokedAt?: IsoDateTimeString;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

/** Actor bag for grant / revoke decisions (capability booleans only). */
export type HousingPublisherGovernanceActor = {
  personId: DomainId;
  moduleEnabled: boolean;
  /** Resolved `housing.manage`. */
  manage: boolean;
};

export type HousingPublisherGovernanceAction =
  | "grant_publisher"
  | "revoke_publisher"
  | "set_approval_pending"
  | "approve"
  | "reject_approval"
  | "set_verification_pending"
  | "verify"
  | "reject_verification";

/** Target approval after a governance action (null = no approval change). */
export function housingPublisherApprovalAfterAction(
  action: HousingPublisherGovernanceAction,
): HousingPublisherApprovalStatus | null {
  switch (action) {
    case "set_approval_pending":
      return "pending";
    case "approve":
    case "grant_publisher":
      return "approved";
    case "reject_approval":
      return "none";
    case "revoke_publisher":
      return "revoked";
    default:
      return null;
  }
}

/** Target verification after a governance action (null = no change). */
export function housingPublisherVerificationAfterAction(
  action: HousingPublisherGovernanceAction,
): HousingPublisherVerificationStatus | null {
  switch (action) {
    case "set_verification_pending":
      return "pending";
    case "verify":
      return "verified";
    case "reject_verification":
      return "rejected";
    case "revoke_publisher":
      return "unverified";
    default:
      return null;
  }
}

/**
 * Who may grant `housing.publisher` (and related approve flows).
 * Requires tenant managers (`housing.manage`) + professionals enabled.
 */
export function canGrantHousingPublisherCapability(
  actor: HousingPublisherGovernanceActor,
  config: HousingTenantModuleConfig,
): boolean {
  if (!actor.moduleEnabled || !actor.manage) return false;
  return config.publishing.professionalsEnabled;
}

/** Who may withdraw professional publish access. */
export function canRevokeHousingPublisherCapability(
  actor: HousingPublisherGovernanceActor,
  _config: HousingTenantModuleConfig,
): boolean {
  return actor.moduleEnabled && actor.manage;
}

export function canPerformHousingPublisherGovernanceAction(
  actor: HousingPublisherGovernanceActor,
  config: HousingTenantModuleConfig,
  action: HousingPublisherGovernanceAction,
): boolean {
  switch (action) {
    case "grant_publisher":
    case "approve":
    case "set_approval_pending":
    case "reject_approval":
    case "set_verification_pending":
    case "verify":
    case "reject_verification":
      return canGrantHousingPublisherCapability(actor, config);
    case "revoke_publisher":
      return canRevokeHousingPublisherCapability(actor, config);
    default:
      return false;
  }
}

/**
 * Whether a professional profile is allowed to publish under tenant rules.
 * Does not grant capabilities — combine with `housing.publisher` at the host.
 */
export function isHousingProfessionalPublisherAuthorized(
  profile: HousingPublisherProfile,
  config: HousingTenantModuleConfig,
): boolean {
  const publishing = config.publishing;
  if (!publishing.professionalsEnabled) return false;
  if (profile.kind !== "professional") return false;
  if (profile.approvalStatus === "revoked") return false;

  if (publishing.professionalApprovalRequired) {
    if (profile.approvalStatus !== "approved") return false;
  }

  if (publishing.professionalVerificationRequired) {
    if (profile.verificationStatus !== "verified") return false;
  }

  return true;
}

/**
 * Project a durable profile into listing-attached publisher metadata.
 */
export function housingPublisherFromProfile(
  profile: HousingPublisherProfile,
): HousingPublisher {
  return {
    kind: profile.kind,
    personId: profile.personId,
    displayName: profile.displayName,
    organizationName: profile.organization?.name,
    organizationId: profile.organization?.id,
    approvalStatus: profile.approvalStatus,
    verificationStatus: profile.verificationStatus,
  };
}

/** Defaults for a newly requested professional profile (pending path). */
export function createPendingHousingPublisherProfile(input: {
  id: DomainId;
  tenantId: DomainId;
  personId: DomainId;
  displayName?: string;
  organization?: HousingPublisherOrganizationRef;
  now?: IsoDateTimeString;
}): HousingPublisherProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    tenantId: input.tenantId,
    kind: "professional",
    personId: input.personId,
    displayName: input.displayName?.trim() || undefined,
    organization: input.organization,
    approvalStatus: "pending",
    verificationStatus: "unverified",
    publisherCapabilityGranted: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Apply approve + capability-granted mirror (RBAC grant still host-owned). */
export function applyHousingPublisherGrant(input: {
  profile: HousingPublisherProfile;
  grantedByPersonId: DomainId;
  now?: IsoDateTimeString;
}): HousingPublisherProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    ...input.profile,
    approvalStatus: "approved",
    publisherCapabilityGranted: true,
    grantedByPersonId: input.grantedByPersonId,
    grantedAt: now,
    revokedAt: undefined,
    revokedByPersonId: undefined,
    updatedAt: now,
  };
}

/** Apply revoke — capability mirror cleared; approval → revoked. */
export function applyHousingPublisherRevoke(input: {
  profile: HousingPublisherProfile;
  revokedByPersonId: DomainId;
  now?: IsoDateTimeString;
}): HousingPublisherProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    ...input.profile,
    approvalStatus: "revoked",
    verificationStatus:
      input.profile.verificationStatus === "verified"
        ? "unverified"
        : input.profile.verificationStatus,
    publisherCapabilityGranted: false,
    revokedByPersonId: input.revokedByPersonId,
    revokedAt: now,
    updatedAt: now,
  };
}

/** Summarize tenant publishing governance knobs (read helper). */
export function housingProfessionalGovernancePolicy(
  publishing: HousingPublishingConfig,
): {
  professionalsAllowed: boolean;
  approvalRequired: boolean;
  verificationRequired: boolean;
} {
  return {
    professionalsAllowed: publishing.professionalsEnabled,
    approvalRequired: publishing.professionalApprovalRequired,
    verificationRequired: publishing.professionalVerificationRequired,
  };
}
