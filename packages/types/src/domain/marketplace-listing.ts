/**
 * Marketplace listing — neighbour goods exchange (platform domain).
 *
 * Distinct from Business Profile (commercial identity) and HelpRequest
 * (asks / offers of help or work). Coordinates live on Location when linked.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

export type MarketplaceListingType =
  | "sale"
  | "rent"
  | "giveaway"
  | "exchange";

export const MARKETPLACE_LISTING_TYPES: readonly MarketplaceListingType[] = [
  "sale",
  "rent",
  "giveaway",
  "exchange",
] as const;

export type MarketplaceListingStatus =
  | "draft"
  | "published"
  | "reserved"
  | "completed"
  | "archived";

export const MARKETPLACE_LISTING_STATUSES: readonly MarketplaceListingStatus[] =
  [
    "draft",
    "published",
    "reserved",
    "completed",
    "archived",
  ] as const;

export type MarketplaceListing = {
  id: DomainId;
  tenantId: DomainId;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  type: MarketplaceListingType;
  category: string;
  title: string;
  description: string;
  images: string[];
  price: number | null;
  status: MarketplaceListingStatus;
  locationId?: DomainId;
  authorDisplayName: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export function isMarketplaceListingType(
  value: string,
): value is MarketplaceListingType {
  return (MARKETPLACE_LISTING_TYPES as readonly string[]).includes(value);
}

export function isMarketplaceListingStatus(
  value: string,
): value is MarketplaceListingStatus {
  return (MARKETPLACE_LISTING_STATUSES as readonly string[]).includes(value);
}

export function marketplaceListingTypeLabel(
  type: MarketplaceListingType,
): string {
  switch (type) {
    case "sale":
      return "Vendo";
    case "rent":
      return "Alquilo";
    case "giveaway":
      return "Regalo";
    case "exchange":
      return "Intercambio";
  }
}

export type CreateMarketplaceListingInput = {
  tenantId: DomainId;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  type: MarketplaceListingType;
  category: string;
  title: string;
  description: string;
  images?: string[];
  price?: number | null;
  status?: MarketplaceListingStatus;
  locationId?: DomainId;
  authorDisplayName?: string;
  id?: DomainId;
};

export function createMarketplaceListingRecord(
  input: CreateMarketplaceListingInput,
): MarketplaceListing {
  const now = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim() || "general";
  if (!title || !description) {
    throw new Error("Invalid MarketplaceListing: missing_fields");
  }
  if (!isMarketplaceListingType(input.type)) {
    throw new Error("Invalid MarketplaceListing: invalid_type");
  }
  const status = input.status ?? "published";
  if (!isMarketplaceListingStatus(status)) {
    throw new Error("Invalid MarketplaceListing: invalid_status");
  }
  const images = (input.images ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const price =
    typeof input.price === "number" && Number.isFinite(input.price)
      ? input.price
      : null;
  return {
    id: input.id?.trim() || `mp-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    ownerPersonId: input.ownerPersonId.trim(),
    createdBy: input.createdBy.trim(),
    type: input.type,
    category,
    title,
    description,
    images,
    price,
    status,
    authorDisplayName: input.authorDisplayName?.trim() || "Vecino",
    createdAt: now,
    updatedAt: now,
    ...(input.locationId?.trim()
      ? { locationId: input.locationId.trim() }
      : {}),
  };
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
