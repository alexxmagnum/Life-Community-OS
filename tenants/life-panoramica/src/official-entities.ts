import type { VerificationLevel } from "@life-community-os/types";

import {
  DEMO_AUTHORITY_ADMIN_ID,
  DEMO_AUTHORITY_MUNICIPALITY_ID,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";

/**
 * Official Entity profiles for Panoramica demo (ADR-016).
 * Territory Authority (product alias) = Panoramica Administration.
 */

export type OfficialEntityKind =
  | "territory_authority"
  | "municipality"
  | "public_service";

export type OfficialEntityProfile = {
  id: string;
  tenantId: string;
  territoryId: string;
  kind: OfficialEntityKind;
  name: string;
  description: string;
  verificationLevel: VerificationLevel;
  imageUrl?: string;
};

export const officialEntityCatalog: OfficialEntityProfile[] = [
  {
    id: DEMO_AUTHORITY_ADMIN_ID,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    kind: "territory_authority",
    name: "Panoramica Golf Administration",
    description:
      "Territory Authority for Panoramica Golf: official communication, territorial resources, and residency verification.",
    verificationLevel: "official_verified",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: DEMO_AUTHORITY_MUNICIPALITY_ID,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    kind: "municipality",
    name: "Municipality (demo)",
    description:
      "Demo municipal official entity for public notices. Not a production government integration.",
    verificationLevel: "official_verified",
    imageUrl:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
  },
];

/** Product alias: Territory Authority for this demo territory. */
export function getTerritoryAuthority(): OfficialEntityProfile {
  return officialEntityCatalog[0]!;
}

export function listOfficialEntities(): OfficialEntityProfile[] {
  return officialEntityCatalog;
}

export function getOfficialEntityById(
  id: string,
): OfficialEntityProfile | undefined {
  return officialEntityCatalog.find((e) => e.id === id);
}
