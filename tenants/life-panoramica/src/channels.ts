import type { Channel } from "@life-community-os/types";
import { assertChannelBoundaries } from "@life-community-os/types";

import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_AREA_ZONA_VERDE,
  DEMO_AUTHORITY_ADMIN_ID,
  DEMO_AUTHORITY_MUNICIPALITY_ID,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";

/**
 * Community Channels demo catalog (ADR-035).
 * Organization layer — not chat rooms.
 */

export const channelCatalog: Channel[] = [
  {
    id: "ch-admin-official",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "official",
    slug: "administration",
    name: "Canal oficial",
    description: "Avisos oficiales de la Administración Panorámica.",
    ownerKind: "official_entity",
    ownerId: DEMO_AUTHORITY_ADMIN_ID,
    status: "active",
    verificationLevel: "official_verified",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-municipality-official",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "official",
    slug: "municipality",
    name: "Canal municipal",
    description: "Comunicaciones oficiales del ayuntamiento (demo).",
    ownerKind: "official_entity",
    ownerId: DEMO_AUTHORITY_MUNICIPALITY_ID,
    status: "active",
    verificationLevel: "official_verified",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-neighbours",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "community",
    slug: "neighbours",
    name: "Neighbours",
    description: "General neighbour community channel.",
    ownerKind: "platform",
    ownerId: DEMO_TENANT_ID,
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-aldea-private",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "community",
    slug: "aldea-golf-neighbours",
    name: "Aldea Golf Neighbours",
    description:
      "Private area channel. Requires active verified residency in Aldea Golf (ADR-038).",
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    ownerKind: "official_entity",
    ownerId: DEMO_AUTHORITY_ADMIN_ID,
    status: "active",
    requiresVerifiedResidency: true,
  },
  {
    id: "ch-zona-verde-private",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "community",
    slug: "zona-verde-neighbours",
    name: "Zona Verde Neighbours",
    description:
      "Private area channel. Requires active verified residency in Zona Verde.",
    communityAreaId: DEMO_AREA_ZONA_VERDE,
    ownerKind: "official_entity",
    ownerId: DEMO_AUTHORITY_ADMIN_ID,
    status: "active",
    requiresVerifiedResidency: true,
  },
  {
    id: "ch-padel",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "interest",
    slug: "padel",
    name: "Padel",
    description: "Padel interest channel — structured activities, not chat chaos.",
    ownerKind: "group",
    ownerId: "g-padel",
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-golf",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "interest",
    slug: "golf",
    name: "Golf",
    description: "Golf interest channel for meetups and course notes.",
    ownerKind: "group",
    ownerId: "g-golf",
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-events",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "community",
    slug: "events",
    name: "Events",
    description: "Community events and gatherings.",
    ownerKind: "platform",
    ownerId: DEMO_TENANT_ID,
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-marketplace",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "marketplace",
    slug: "marketplace",
    name: "Marketplace",
    description: "Buy / sell organization surface.",
    ownerKind: "platform",
    ownerId: DEMO_TENANT_ID,
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-mobility",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "mobility",
    slug: "mobility",
    name: "Mobility",
    description: "Car sharing and mobility offers organization surface.",
    ownerKind: "platform",
    ownerId: DEMO_TENANT_ID,
    status: "active",
    requiresVerifiedResidency: false,
  },
  {
    id: "ch-services",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    type: "service",
    slug: "services",
    name: "Services",
    description: "Local professionals and services.",
    ownerKind: "platform",
    ownerId: DEMO_TENANT_ID,
    status: "active",
    verificationLevel: "business_verified",
    requiresVerifiedResidency: false,
  },
];

/** Validates all demo channels against ADR-035 boundaries (throws if invalid). */
export function assertDemoChannelCatalog(): void {
  const areaMap = new Map<string, string>([
    [DEMO_AREA_ALDEA_GOLF, DEMO_TERRITORY_ID],
    [DEMO_AREA_ZONA_VERDE, DEMO_TERRITORY_ID],
  ]);
  for (const channel of channelCatalog) {
    assertChannelBoundaries(channel, {
      communityAreaTerritoryIdByAreaId: areaMap,
    });
  }
}

export function listChannels(): Channel[] {
  return channelCatalog;
}

export function getChannelById(id: string): Channel | undefined {
  return channelCatalog.find((c) => c.id === id);
}

export function listChannelsByType(
  type: Channel["type"],
): Channel[] {
  return channelCatalog.filter((c) => c.type === type);
}
