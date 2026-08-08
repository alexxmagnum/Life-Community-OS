import type { DomainId, IsoDateTimeString } from "./ids";
import type { VerificationLevel } from "./verification";

/**
 * Community Channel — organization layer for structured communication (ADR-035).
 * Not a Tenant, security boundary, chat room, or replacement for Group / Experience / Resource.
 */

export type ChannelType =
  | "official"
  | "community"
  | "interest"
  | "business"
  | "service"
  | "marketplace"
  | "mobility";

export type ChannelOwnerKind =
  | "official_entity"
  | "group"
  | "business_profile"
  | "platform";

export type ChannelStatus = "draft" | "active" | "archived";

export type Channel = {
  id: DomainId;
  tenantId: DomainId;
  territoryId: DomainId;
  type: ChannelType;
  /** Stable English slug for APIs; display name is localized in product UI. */
  slug: string;
  /** Catalog / default display name; product surfaces should prefer i18n. */
  name: string;
  description?: string;
  /** Optional Community Area scope (ADR-005) — organization only, not isolation. */
  communityAreaId?: DomainId;
  ownerKind: ChannelOwnerKind;
  ownerId: DomainId;
  status: ChannelStatus;
  verificationLevel?: VerificationLevel;
  /**
   * When true, participation in this channel requires an active verified
   * residency (ADR-038), typically matching communityAreaId when set.
   */
  requiresVerifiedResidency?: boolean;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type ChannelBoundaryIssueCode =
  | "missing_tenant"
  | "missing_territory"
  | "missing_slug"
  | "missing_name"
  | "invalid_type"
  | "missing_owner"
  | "incompatible_owner_for_type"
  | "invalid_status"
  | "area_territory_mismatch";

export type ChannelBoundaryIssue = {
  code: ChannelBoundaryIssueCode;
  message: string;
};

export type ChannelValidationContext = {
  /**
   * When validating an optional communityAreaId, map Area → Territory.
   * If omitted and communityAreaId is set, area ownership is not checked yet.
   */
  communityAreaTerritoryIdByAreaId?: ReadonlyMap<DomainId, DomainId>;
};

const CHANNEL_TYPES: ReadonlySet<ChannelType> = new Set([
  "official",
  "community",
  "interest",
  "business",
  "service",
  "marketplace",
  "mobility",
]);

const CHANNEL_STATUSES: ReadonlySet<ChannelStatus> = new Set([
  "draft",
  "active",
  "archived",
]);

/** Owner kinds allowed per channel type (ADR-035). */
export const CHANNEL_OWNER_COMPATIBILITY: Record<
  ChannelType,
  ReadonlySet<ChannelOwnerKind>
> = {
  official: new Set(["official_entity"]),
  community: new Set(["platform", "official_entity"]),
  interest: new Set(["group", "platform", "official_entity"]),
  business: new Set(["business_profile"]),
  service: new Set(["business_profile"]),
  marketplace: new Set(["platform", "official_entity"]),
  mobility: new Set(["platform", "official_entity"]),
};

/**
 * Validates Channel aggregate boundaries before persistence (ADR-035).
 * Pure domain rules — no I/O.
 */
export function validateChannelBoundaries(
  channel: Channel,
  context: ChannelValidationContext = {},
): ChannelBoundaryIssue[] {
  const issues: ChannelBoundaryIssue[] = [];

  if (!channel.tenantId) {
    issues.push({
      code: "missing_tenant",
      message: "Channel requires tenantId (Tenant security context).",
    });
  }
  if (!channel.territoryId) {
    issues.push({
      code: "missing_territory",
      message: "Channel requires territoryId.",
    });
  }
  if (!channel.slug?.trim()) {
    issues.push({ code: "missing_slug", message: "Channel requires slug." });
  }
  if (!channel.name?.trim()) {
    issues.push({ code: "missing_name", message: "Channel requires name." });
  }
  if (!CHANNEL_TYPES.has(channel.type)) {
    issues.push({
      code: "invalid_type",
      message: `Unknown Channel type: ${String(channel.type)}.`,
    });
  }
  if (!channel.ownerKind || !channel.ownerId) {
    issues.push({
      code: "missing_owner",
      message: "Channel requires ownerKind and ownerId.",
    });
  } else if (CHANNEL_TYPES.has(channel.type)) {
    const allowed = CHANNEL_OWNER_COMPATIBILITY[channel.type];
    if (!allowed.has(channel.ownerKind)) {
      issues.push({
        code: "incompatible_owner_for_type",
        message: `Channel type "${channel.type}" cannot be owned by "${channel.ownerKind}".`,
      });
    }
  }
  if (!CHANNEL_STATUSES.has(channel.status)) {
    issues.push({
      code: "invalid_status",
      message: `Unknown Channel status: ${String(channel.status)}.`,
    });
  }

  if (channel.communityAreaId && context.communityAreaTerritoryIdByAreaId) {
    const areaTerritory =
      context.communityAreaTerritoryIdByAreaId.get(channel.communityAreaId);
    if (areaTerritory && areaTerritory !== channel.territoryId) {
      issues.push({
        code: "area_territory_mismatch",
        message:
          "communityAreaId must belong to the same Territory as the Channel.",
      });
    }
  }

  return issues;
}

export function assertChannelBoundaries(
  channel: Channel,
  context?: ChannelValidationContext,
): void {
  const issues = validateChannelBoundaries(channel, context);
  if (issues.length > 0) {
    throw new Error(
      `Channel boundary validation failed: ${issues.map((i) => i.code).join(", ")}`,
    );
  }
}
