import type {
  Address,
  Property,
  PropertyPersonRelationship,
  ResidencyVerification,
  ResidencyVerificationEvidence,
} from "@life-community-os/types";
import {
  deriveCommunityAreaIdsFromResidencies,
  hasVerifiedResidencyInArea,
  resolveResidencyAccessAreas,
} from "@life-community-os/types";

import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_AREA_ZONA_VERDE,
  DEMO_PERSON_JOHN,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_MARTA,
  DEMO_PERSON_OWNER_ALDEA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";

/**
 * Residency demo graph (ADR-037 / ADR-038).
 * Claim never grants access — only active verified relationships do.
 */

export const demoAddressCatalog: Address[] = [
  {
    id: "addr-aldea-14b",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    line1: "Aldea Golf Unit 14B",
    locality: "Panoramica Golf",
  },
  {
    id: "addr-aldea-2a",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    line1: "Aldea Golf Unit 2A",
    locality: "Panoramica Golf",
  },
  {
    id: "addr-zona-verde-8",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ZONA_VERDE,
    line1: "Zona Verde Unit 8",
    locality: "Panoramica Golf",
  },
];

export const demoPropertyCatalog: Property[] = [
  {
    id: "prop-aldea-14b",
    addressId: "addr-aldea-14b",
    unitLabel: "14B",
    name: "Aldea Golf Unit 14B",
  },
  {
    id: "prop-aldea-2a",
    addressId: "addr-aldea-2a",
    unitLabel: "2A",
    name: "Aldea Golf Unit 2A",
  },
  {
    id: "prop-zona-verde-8",
    addressId: "addr-zona-verde-8",
    unitLabel: "8",
    name: "Zona Verde Unit 8",
  },
];

const verifiedAt = "2026-01-15T10:00:00.000Z";

/**
 * Property ↔ Person relationships.
 * - Marta: active verified resident Aldea Golf (access)
 * - John: pending_verification claim Aldea Golf (NO access)
 * - Lucia: active verified resident Zona Verde (access there only)
 * - Owner: active owner Aldea 2A (can invite)
 */
export const demoRelationshipCatalog: PropertyPersonRelationship[] = [
  {
    id: "rel-marta-aldea-14b",
    propertyId: "prop-aldea-14b",
    personId: DEMO_PERSON_MARTA,
    relationshipType: "resident",
    validFrom: "2026-01-01",
    status: "active",
    verifiedAt,
    verificationId: "rv-marta-aldea",
  },
  {
    id: "rel-john-aldea-14b-claim",
    propertyId: "prop-aldea-14b",
    personId: DEMO_PERSON_JOHN,
    relationshipType: "tenant",
    validFrom: "2026-08-01",
    status: "pending_verification",
    verificationId: "rv-john-pending",
  },
  {
    id: "rel-lucia-zona-verde",
    propertyId: "prop-zona-verde-8",
    personId: DEMO_PERSON_LUCIA,
    relationshipType: "resident",
    validFrom: "2025-06-01",
    status: "active",
    verifiedAt: "2025-06-10T12:00:00.000Z",
    verificationId: "rv-lucia-zona",
  },
  {
    id: "rel-owner-aldea-2a",
    propertyId: "prop-aldea-2a",
    personId: DEMO_PERSON_OWNER_ALDEA,
    relationshipType: "owner",
    validFrom: "2020-01-01",
    status: "active",
    verifiedAt: "2020-01-05T09:00:00.000Z",
    verificationId: "rv-owner-aldea",
  },
];

export const demoVerificationCatalog: ResidencyVerification[] = [
  {
    id: "rv-marta-aldea",
    relationshipId: "rel-marta-aldea-14b",
    personId: DEMO_PERSON_MARTA,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    method: "administration_approval",
    status: "approved",
    reviewedByPersonId: DEMO_PERSON_OWNER_ALDEA,
    decidedAt: verifiedAt,
    submittedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "rv-john-pending",
    relationshipId: "rel-john-aldea-14b-claim",
    personId: DEMO_PERSON_JOHN,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    method: "residency_certificate",
    status: "under_review",
    submittedAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "rv-lucia-zona",
    relationshipId: "rel-lucia-zona-verde",
    personId: DEMO_PERSON_LUCIA,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ZONA_VERDE,
    method: "owner_invitation",
    status: "approved",
    decidedAt: "2025-06-10T12:00:00.000Z",
    submittedAt: "2025-06-05T12:00:00.000Z",
  },
  {
    id: "rv-owner-aldea",
    relationshipId: "rel-owner-aldea-2a",
    personId: DEMO_PERSON_OWNER_ALDEA,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    method: "approved_documentation",
    status: "approved",
    decidedAt: "2020-01-05T09:00:00.000Z",
  },
];

/** Evidence uses Core Files ids — never stored on Person (ADR-038). */
export const demoVerificationEvidenceCatalog: ResidencyVerificationEvidence[] =
  [
    {
      id: "rve-john-cert",
      verificationId: "rv-john-pending",
      kind: "certificate_file",
      fileId: "file-demo-residency-cert-john",
    },
    {
      id: "rve-owner-docs",
      verificationId: "rv-owner-aldea",
      kind: "supporting_document_file",
      fileId: "file-demo-deed-owner-aldea",
    },
    {
      id: "rve-lucia-invite",
      verificationId: "rv-lucia-zona",
      kind: "owner_invitation_reference",
      externalReference: "invite-zona-verde-lucia-2025",
    },
  ];

function residencyContext() {
  return {
    relationships: demoRelationshipCatalog,
    propertiesById: new Map(
      demoPropertyCatalog.map((p) => [p.id, p] as const),
    ),
    addressesById: new Map(demoAddressCatalog.map((a) => [a.id, a] as const)),
  };
}

/** Derived Community Area ids for a Person — pending claims contribute nothing. */
export function getVerifiedCommunityAreaIdsForPerson(
  personId: string,
): string[] {
  return deriveCommunityAreaIdsFromResidencies(personId, residencyContext());
}

export function getResidencyAccessSnapshot(personId: string) {
  return resolveResidencyAccessAreas(personId, residencyContext());
}

export function personHasVerifiedResidencyInArea(
  personId: string,
  communityAreaId: string,
): boolean {
  return hasVerifiedResidencyInArea(
    personId,
    communityAreaId,
    residencyContext(),
  );
}

/**
 * Demo narrative helpers for review / future UI.
 * Claim never grants access (John pending → empty areas).
 */
export const residencyDemoNarratives = {
  marta: {
    personId: DEMO_PERSON_MARTA,
    summary:
      "Active verified resident of Aldea Golf Unit 14B — may reserve Aldea-scoped resources and join Aldea private channel.",
    communityAreaIds: () =>
      getVerifiedCommunityAreaIdsForPerson(DEMO_PERSON_MARTA),
  },
  john: {
    personId: DEMO_PERSON_JOHN,
    summary:
      "Claimed Aldea Golf Unit 14B with pending_verification — must NOT access restricted resources or private channels until approved.",
    communityAreaIds: () =>
      getVerifiedCommunityAreaIdsForPerson(DEMO_PERSON_JOHN),
  },
  lucia: {
    personId: DEMO_PERSON_LUCIA,
    summary:
      "Active verified resident of Zona Verde — may see Aldea public resource info but cannot reserve Aldea-only courts.",
    communityAreaIds: () =>
      getVerifiedCommunityAreaIdsForPerson(DEMO_PERSON_LUCIA),
  },
  owner: {
    personId: DEMO_PERSON_OWNER_ALDEA,
    summary:
      "Active verified owner of Aldea Golf Unit 2A — property context only; ownership is not community administration.",
    communityAreaIds: () =>
      getVerifiedCommunityAreaIdsForPerson(DEMO_PERSON_OWNER_ALDEA),
  },
} as const;
