import type { CommunityArea } from "@life-community-os/types";

import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_AREA_CENTRO,
  DEMO_AREA_ZONA_VERDE,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";

/**
 * Panoramica Golf Community Areas (Micro Areas) — ADR-005.
 * Organizational geography only — not security boundaries.
 */
export const communityAreaCatalog: CommunityArea[] = [
  {
    id: DEMO_AREA_ALDEA_GOLF,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    name: "Aldea Golf",
  },
  {
    id: DEMO_AREA_ZONA_VERDE,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    name: "Zona Verde",
  },
  {
    id: DEMO_AREA_CENTRO,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    name: "Centro",
  },
];

export function listCommunityAreas(): CommunityArea[] {
  return communityAreaCatalog;
}

export function getCommunityAreaById(id: string): CommunityArea | undefined {
  return communityAreaCatalog.find((a) => a.id === id);
}
