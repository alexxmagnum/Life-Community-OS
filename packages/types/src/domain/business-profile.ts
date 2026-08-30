/**
 * Business Profile — commercial identity of a member-owned business.
 *
 * Business = who you are.
 * Location = where you are (map Source of Truth).
 *
 * Coordinates never live here. Presence is `locationId` → Location.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

export type BusinessProfileStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "suspended"
  | "archived";

export const BUSINESS_PROFILE_STATUSES: readonly BusinessProfileStatus[] = [
  "draft",
  "pending_review",
  "published",
  "suspended",
  "archived",
] as const;

export type BusinessProfile = {
  id: DomainId;
  tenantId: DomainId;
  /** Inherited from Location when omitted. Additive — tenantId remains. */
  territoryId?: DomainId;
  ownerPersonId: DomainId;
  locationId: DomainId;
  name: string;
  category: string;
  description: string;
  contact?: string;
  hours?: string;
  imageUrl?: string;
  status: BusinessProfileStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type BusinessProfileIssueCode =
  | "missing_id"
  | "missing_tenant"
  | "missing_owner"
  | "missing_location"
  | "missing_name"
  | "missing_category"
  | "invalid_status";

export type BusinessProfileIssue = {
  code: BusinessProfileIssueCode;
  message: string;
};

export function isBusinessProfileStatus(
  value: string,
): value is BusinessProfileStatus {
  return (BUSINESS_PROFILE_STATUSES as readonly string[]).includes(value);
}

export function validateBusinessProfile(
  input: BusinessProfile,
): BusinessProfileIssue[] {
  const issues: BusinessProfileIssue[] = [];
  if (!input.id?.trim()) {
    issues.push({ code: "missing_id", message: "id is required" });
  }
  if (!input.tenantId?.trim()) {
    issues.push({ code: "missing_tenant", message: "tenantId is required" });
  }
  if (!input.ownerPersonId?.trim()) {
    issues.push({ code: "missing_owner", message: "ownerPersonId is required" });
  }
  if (!input.locationId?.trim()) {
    issues.push({
      code: "missing_location",
      message: "locationId is required",
    });
  }
  if (!input.name?.trim()) {
    issues.push({ code: "missing_name", message: "name is required" });
  }
  if (!input.category?.trim()) {
    issues.push({
      code: "missing_category",
      message: "category is required",
    });
  }
  if (!isBusinessProfileStatus(input.status)) {
    issues.push({
      code: "invalid_status",
      message: `Unknown status: ${input.status}`,
    });
  }
  return issues;
}

export type CreateBusinessProfileInput = {
  tenantId: DomainId;
  ownerPersonId: DomainId;
  locationId: DomainId;
  name: string;
  category: string;
  description?: string;
  contact?: string;
  hours?: string;
  imageUrl?: string;
  status?: BusinessProfileStatus;
  territoryId?: DomainId;
  id?: DomainId;
};

export function createBusinessProfile(
  input: CreateBusinessProfileInput,
): BusinessProfile {
  const now = new Date().toISOString();
  const contact = input.contact?.trim();
  const hours = input.hours?.trim();
  const imageUrl = input.imageUrl?.trim();
  const profile: BusinessProfile = {
    id: input.id?.trim() || `biz-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    ownerPersonId: input.ownerPersonId.trim(),
    locationId: input.locationId.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() ?? "",
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    ...(contact ? { contact } : {}),
    ...(hours ? { hours } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(input.territoryId?.trim()
      ? { territoryId: input.territoryId.trim() }
      : {}),
  };
  const issues = validateBusinessProfile(profile);
  if (issues.length > 0) {
    throw new Error(
      `Invalid BusinessProfile: ${issues.map((item) => item.code).join(", ")}`,
    );
  }
  return profile;
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
