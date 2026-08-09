/**
 * Property & Residency Experience — My Home context (D.0.7.2.1).
 *
 * Presentation layer over Property + PropertyPersonRelationship catalogs.
 * Answers: "What is my place in this territory?"
 *
 * Does NOT:
 * - create a Housing module
 * - create marketplace / sale / rent listings
 * - grant community administration from ownership
 * - replace Membership or RBAC
 */

import type {
  Address,
  Property,
  PropertyPersonRelationship,
  PropertyPersonRelationshipStatus,
  PropertyPersonRelationshipType,
} from "@life-community-os/types";

import { getCommunityAreaById } from "./community-areas";
import { DEMO_TERRITORY_ID } from "./demo-ids";
import {
  demoAddressCatalog,
  demoPropertyCatalog,
  demoRelationshipCatalog,
  getResidencyAccessSnapshot,
} from "./residency-demo";

export type PropertyHomeEntry = {
  relationship: PropertyPersonRelationship;
  property: Property;
  address: Address;
  /** Localized relationship label (owner, resident, …). */
  relationshipLabel: string;
  /** Belonging headline — "Mi hogar", "Mi propiedad…", etc. */
  headline: string;
  /** Verification / lifecycle status for UI. */
  statusLabel: string;
  statusKind: "verified" | "pending" | "inactive" | "other";
  /** Community Area display name when known. */
  communityAreaLabel?: string;
  territoryLabel: string;
  /** True when this relationship grants residency-derived area eligibility. */
  grantsResidencyAccess: boolean;
};

export type MyHomeContext = {
  personId: string;
  /** Primary home for UX (prefer active verified; else first relationship). */
  primary: PropertyHomeEntry | null;
  homes: PropertyHomeEntry[];
  /** Community Area ids from verified active residencies only (ADR-037). */
  verifiedCommunityAreaIds: string[];
  /** Soft copy for empty / incomplete states. */
  emptyMessage: string;
};

const RELATIONSHIP_LABELS: Record<PropertyPersonRelationshipType, string> = {
  owner: "Propietario",
  resident: "Residente",
  tenant: "Inquilino",
  family_member: "Familiar",
  guest: "Invitado",
  staff: "Personal",
  authorized_person: "Autorizado",
  manager: "Gestor",
};

function statusPresentation(
  status: PropertyPersonRelationshipStatus,
): Pick<PropertyHomeEntry, "statusLabel" | "statusKind"> {
  switch (status) {
    case "active":
      return { statusLabel: "Verificado", statusKind: "verified" };
    case "pending_verification":
      return {
        statusLabel: "Verificación pendiente",
        statusKind: "pending",
      };
    case "inactive":
    case "ended":
    case "archived":
      return { statusLabel: "Relación inactiva", statusKind: "inactive" };
    case "rejected":
      return { statusLabel: "Verificación rechazada", statusKind: "other" };
    default:
      return { statusLabel: "Estado desconocido", statusKind: "other" };
  }
}

function headlineFor(
  type: PropertyPersonRelationshipType,
  territoryLabel: string,
  unitLabel?: string,
): string {
  const place = unitLabel ? ` · ${unitLabel}` : "";
  switch (type) {
    case "owner":
      return `Mi propiedad en ${territoryLabel}${place}`;
    case "tenant":
      return `Mi hogar actual${place}`;
    case "guest":
      return `Estancia en ${territoryLabel}${place}`;
    case "manager":
      return `Gestión de propiedad${place}`;
    case "authorized_person":
      return `Acceso autorizado${place}`;
    case "family_member":
      return `Mi hogar familiar${place}`;
    case "staff":
      return `Asignación en ${territoryLabel}${place}`;
    case "resident":
    default:
      return `Mi hogar${place}`;
  }
}

function toEntry(
  relationship: PropertyPersonRelationship,
): PropertyHomeEntry | null {
  const property = demoPropertyCatalog.find(
    (p) => p.id === relationship.propertyId,
  );
  if (!property) return null;
  const address = demoAddressCatalog.find((a) => a.id === property.addressId);
  if (!address) return null;

  const area = address.communityAreaId
    ? getCommunityAreaById(address.communityAreaId)
    : undefined;
  const territoryLabel = address.locality ?? "tu zona";
  const { statusLabel, statusKind } = statusPresentation(relationship.status);
  const grantsResidencyAccess =
    relationship.status === "active" && Boolean(relationship.verifiedAt);

  return {
    relationship,
    property,
    address,
    relationshipLabel:
      RELATIONSHIP_LABELS[relationship.relationshipType] ??
      relationship.relationshipType,
    headline: headlineFor(
      relationship.relationshipType,
      territoryLabel,
      property.unitLabel ?? property.name,
    ),
    statusLabel,
    statusKind,
    communityAreaLabel: area?.name,
    territoryLabel,
    grantsResidencyAccess,
  };
}

function rankHome(entry: PropertyHomeEntry): number {
  if (entry.statusKind === "verified") return 0;
  if (entry.statusKind === "pending") return 1;
  return 2;
}

/**
 * Resolves My Home context for a Person from PropertyPersonRelationship.
 * Ownership here is property context — never community administration.
 */
export function getMyHomeContext(personId: string): MyHomeContext {
  const homes = demoRelationshipCatalog
    .filter((rel) => rel.personId === personId)
    .map(toEntry)
    .filter((entry): entry is PropertyHomeEntry => entry !== null)
    .sort((a, b) => rankHome(a) - rankHome(b));

  const access = getResidencyAccessSnapshot(personId);

  return {
    personId,
    primary: homes[0] ?? null,
    homes,
    verifiedCommunityAreaIds: access.communityAreaIds,
    emptyMessage:
      "Aún no tienes un hogar vinculado. Cuando verifiques tu zona, aquí verás tu lugar en la comunidad.",
  };
}

/** Territory id used by the demo residency graph (tenant-neutral helper). */
export function getDemoHomeTerritoryId(): string {
  return DEMO_TERRITORY_ID;
}

export function propertyRelationshipLabel(
  type: PropertyPersonRelationshipType,
): string {
  return RELATIONSHIP_LABELS[type] ?? type;
}
