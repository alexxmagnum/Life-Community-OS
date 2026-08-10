import type {
  PlaceConversationSnapshot,
  TenantConfiguration,
} from "@life-community-os/types";
import { createPlaceConversationAdapter } from "@life-community-os/types";
import {
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
  getLocalEntityById,
  getPlaceParticipantPersonIds,
} from "@life-community-os/tenant-life-panoramica";

/**
 * Gate for place-scoped Conversation UI (Phase 2.1).
 * Fail closed when nearby module OFF or adapter denies open.
 */
export function canOpenPlaceConversation(input: {
  placeId: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("nearby")) return false;
  const place = getLocalEntityById(input.placeId);
  if (!place) return false;

  const adapter = createPlaceConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const snapshot: PlaceConversationSnapshot = {
    id: place.id,
    name: place.name,
    participantPersonIds: getPlaceParticipantPersonIds(place.id),
    status: "open",
  };

  const context = {
    id: `ctx-place-${snapshot.id}`,
    contextType: "place" as const,
    contextId: snapshot.id,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}

export function canViewPlaceConversation(input: {
  placeId: string;
  personId: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!canOpenPlaceConversation(input)) return false;
  const place = getLocalEntityById(input.placeId);
  if (!place) return false;

  const adapter = createPlaceConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };

  const snapshot: PlaceConversationSnapshot = {
    id: place.id,
    name: place.name,
    participantPersonIds: getPlaceParticipantPersonIds(place.id),
    status: "open",
  };

  const context = {
    id: `ctx-place-${snapshot.id}`,
    contextType: "place" as const,
    contextId: snapshot.id,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canView(context, input.personId, env, snapshot);
}
