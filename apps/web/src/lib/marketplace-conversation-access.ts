import type {
  MarketplaceConversationSnapshot,
  TenantConfiguration,
} from "@life-community-os/types";
import { createMarketplaceConversationAdapter } from "@life-community-os/types";
import {
  getMarketplaceInterestedPersonIds,
  type MarketplaceListing,
} from "@life-community-os/tenant-life-panoramica";

/**
 * Gate for Marketplace Listing Conversation UI (Phase 1 trust repair).
 * Fail closed when marketplace module OFF or adapter denies open.
 */
export function canOpenMarketplaceConversation(input: {
  listing: MarketplaceListing;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("marketplace")) return false;
  if (!input.listing.authorPersonId) return false;

  const adapter = createMarketplaceConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const snapshot: MarketplaceConversationSnapshot = {
    id: input.listing.id,
    title: input.listing.title,
    authorPersonId: input.listing.authorPersonId,
    interestedPersonIds: getMarketplaceInterestedPersonIds(input.listing.id),
    status: "open",
  };

  const context = {
    id: `ctx-marketplace-${snapshot.id}`,
    contextType: "marketplace" as const,
    contextId: snapshot.id,
    tenantId: input.configuration.tenantId,
    territoryId: (input.configuration.territory?.territoryId ?? input.configuration.tenantId),
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}

/**
 * Whether the current person may view the listing conversation (author or interested).
 */
export function canViewMarketplaceConversation(input: {
  listing: MarketplaceListing;
  personId: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!canOpenMarketplaceConversation(input)) return false;
  if (!input.listing.authorPersonId) return false;

  const adapter = createMarketplaceConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };

  const snapshot: MarketplaceConversationSnapshot = {
    id: input.listing.id,
    title: input.listing.title,
    authorPersonId: input.listing.authorPersonId,
    interestedPersonIds: getMarketplaceInterestedPersonIds(input.listing.id),
    status: "open",
  };

  const context = {
    id: `ctx-marketplace-${snapshot.id}`,
    contextType: "marketplace" as const,
    contextId: snapshot.id,
    tenantId: input.configuration.tenantId,
    territoryId: (input.configuration.territory?.territoryId ?? input.configuration.tenantId),
    moduleId: adapter.getModuleId(),
  };

  return adapter.canView(context, input.personId, env, snapshot);
}
