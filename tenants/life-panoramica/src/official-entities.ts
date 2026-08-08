import type { Channel, VerificationLevel } from "@life-community-os/types";

import {
  DEMO_AUTHORITY_ADMIN_ID,
  DEMO_AUTHORITY_MUNICIPALITY_ID,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import { listChannels } from "./channels";
import {
  listPublishedCommunityContent,
  type CommunityContent,
} from "./community-content";

/**
 * Official Entity profiles for Panoramica demo (ADR-016).
 * Territory Authority (product alias) = Panoramica Administration.
 * Not businesses — territorial / municipal responsibility.
 */

export type OfficialEntityKind =
  | "territory_authority"
  | "municipality"
  | "public_service"
  | "other_official";

export type OfficialEntityContact = {
  email?: string;
  phone?: string;
  website?: string;
  hours?: string;
};

export type OfficialEntityProfile = {
  id: string;
  tenantId: string;
  territoryId: string;
  /** URL segment for /official/[slug] */
  slug: string;
  kind: OfficialEntityKind;
  name: string;
  description: string;
  verificationLevel: VerificationLevel;
  imageUrl?: string;
  /** Demo contact surface — maps to metadata in persistence. */
  contact?: OfficialEntityContact;
};

export const officialEntityCatalog: OfficialEntityProfile[] = [
  {
    id: DEMO_AUTHORITY_ADMIN_ID,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    slug: "panoramica-administration",
    kind: "territory_authority",
    name: "Administración Panorámica",
    description:
      "Entidad responsable de la gestión de la comunidad: avisos oficiales, recursos del territorio y verificación de residencia.",
    verificationLevel: "official_verified",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    contact: {
      email: "administracion@lifepanoramica.demo",
      phone: "+34 900 000 100",
      website: "https://lifepanoramica.demo/administracion",
      hours: "Lun–Vie · 9:00–14:00",
    },
  },
  {
    id: DEMO_AUTHORITY_MUNICIPALITY_ID,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    slug: "municipality",
    kind: "municipality",
    name: "Ayuntamiento",
    description:
      "Entidad municipal de referencia para avisos públicos del entorno. Demostración — no es una integración gubernamental real.",
    verificationLevel: "official_verified",
    imageUrl:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    contact: {
      email: "ayuntamiento@municipio.demo",
      phone: "+34 900 000 200",
      website: "https://municipio.demo",
      hours: "Lun–Vie · 8:30–14:00",
    },
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

export function getOfficialEntityBySlug(
  slug: string,
): OfficialEntityProfile | undefined {
  return officialEntityCatalog.find((e) => e.slug === slug);
}

export function officialEntityKindLabel(kind: OfficialEntityKind): string {
  switch (kind) {
    case "territory_authority":
      return "Administración del territorio";
    case "municipality":
      return "Ayuntamiento";
    case "public_service":
      return "Servicio público";
    case "other_official":
      return "Entidad oficial";
    default:
      return "Entidad oficial";
  }
}

/** Explorer / hamburger leaf label for an entity. */
export function officialEntityNavLabel(entity: OfficialEntityProfile): string {
  switch (entity.kind) {
    case "territory_authority":
      return "Administración";
    case "municipality":
      return "Ayuntamiento";
    case "public_service":
      return entity.name;
    case "other_official":
      return entity.name;
    default:
      return entity.name;
  }
}

export function officialEntityNavIcon(
  entity: OfficialEntityProfile,
): "admin" | "city" | "security" | "info" {
  switch (entity.kind) {
    case "territory_authority":
      return "admin";
    case "municipality":
      return "city";
    case "public_service":
      return "security";
    default:
      return "info";
  }
}

export function listChannelsForOfficialEntity(entityId: string): Channel[] {
  return listChannels().filter(
    (c) => c.ownerKind === "official_entity" && c.ownerId === entityId,
  );
}

/**
 * Official nav / listings — only entities whose module flag is on.
 * Security / municipality stay hidden until explicitly enabled.
 */
export function listVisibleOfficialEntities(flags: {
  officialChannels?: boolean;
  municipalServices?: boolean;
  securityModule?: boolean;
}): OfficialEntityProfile[] {
  return listOfficialEntities().filter((entity) => {
    if (entity.kind === "municipality") {
      return Boolean(flags.municipalServices);
    }
    if (entity.kind === "public_service" || entity.kind === "other_official") {
      // Future security / public-service entities ride on securityModule.
      return Boolean(flags.securityModule);
    }
    // territory_authority (Administración)
    return Boolean(flags.officialChannels);
  });
}

export function listContentForOfficialEntity(
  entityId: string,
): CommunityContent[] {
  return listPublishedCommunityContent().filter(
    (c) => c.isOfficial && c.officialEntityId === entityId,
  );
}
