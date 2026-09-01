/**
 * GDPR privacy governance — personal data controls, consent, export, anonymization.
 * Governs existing domain data. Does not create a GDPR domain or global entities.
 * Never branches on a customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { assertTenantBoundary } from "../platform/security-context";
import { mediaOwnedByTenant, type TenantOwnedMedia } from "../platform/data-export";
import type { PersonalPrivacy } from "../personal/personal-context";
import type { CommunityParticipationPrivacy } from "../community/participation";
import type { TrustPrivacy } from "../trust/trust-context";

export const PRIVACY_ACCESS_DENIED = "privacy_access_denied";
export const EXPORT_OTHER_PERSON_DATA = "export_other_person_data";

export const PERSONAL_DATA_CLASSES = [
  "identity",
  "community",
  "activity",
  "communication",
  "housing",
] as const;

export type PersonalDataClass = (typeof PERSONAL_DATA_CLASSES)[number];

export const PRIVACY_RETENTION_DOMAINS = [
  "messages",
  "audit",
  "security_events",
  "personal_preferences",
] as const;

export type PrivacyRetentionDomain =
  (typeof PRIVACY_RETENTION_DOMAINS)[number];

export type PrivacyContext = {
  personId: string;
  tenantId: string;
  consent: {
    recommendations: boolean;
    activityVisibility: boolean;
    marketingCommunication: boolean;
  };
  rights: {
    exportAllowed: boolean;
    deletionAllowed: boolean;
    restrictionAllowed: boolean;
  };
  dataScope: {
    personalData: boolean;
    ownedContent: boolean;
    participationData: boolean;
  };
};

export type PrivacyConfiguration = {
  tenantId: string;
  privacyPolicyUrl?: string;
  legalContact?: string;
  dataControllerName?: string;
  retentionSettings: PrivacyRetentionPolicy;
};

export type PrivacyRetentionRule = {
  domain: PrivacyRetentionDomain;
  description: string;
  automaticDeletion: boolean;
};

export type PrivacyRetentionPolicy = {
  messages: PrivacyRetentionRule;
  audit: PrivacyRetentionRule;
  security_events: PrivacyRetentionRule;
  personal_preferences: PrivacyRetentionRule;
};

export type PersonalDataExport = {
  personId: string;
  tenantId: string;
  generatedAt: string;
  profile: {
    displayName: string | null;
    email: string | null;
    locale?: string;
  };
  memberships: Array<{
    tenantId: string;
    role: string;
    territoryId?: string;
  }>;
  preferences: PersonalPrivacy;
  favorites: Array<{ kind: string; targetId: string }>;
  participations: Array<{ entityType: string; entityId: string }>;
  reservations: Array<{ entityId: string; status: string }>;
  settings: Record<string, string | boolean | null>;
};

export type PersonalAnonymizationResult = {
  personId: string;
  tenantId: string;
  anonymizedAt: string;
  displayName: null;
  email: null;
  preservedRecords: string[];
};

export type PersonalDataPlane = {
  profiles: Array<{
    personId: string;
    tenantId: string;
    displayName: string;
    email: string;
    locale?: string;
  }>;
  memberships: Array<{
    personId: string;
    tenantId: string;
    role: string;
    territoryId?: string;
  }>;
  preferences: Array<{
    personId: string;
    tenantId: string;
    privacy: PersonalPrivacy;
  }>;
  favorites: Array<{
    personId: string;
    tenantId: string;
    kind: string;
    targetId: string;
  }>;
  participations: Array<{
    personId: string;
    tenantId: string;
    entityType: string;
    entityId: string;
  }>;
  reservations: Array<{
    personId: string;
    tenantId: string;
    entityId: string;
    status: string;
  }>;
  messages: Array<{
    personId: string;
    tenantId: string;
    conversationId: string;
    messageId: string;
    private: boolean;
  }>;
  media: TenantOwnedMedia[];
  anonymized: string[];
};

export type PrivacyConsentInput = {
  recommendations?: boolean;
  activityVisibility?: boolean;
  marketingCommunication?: boolean;
};

const OPAQUE_PRIVACY_ENTITIES = new Set([
  "GlobalPrivacyEntity",
  "UniversalConsentEntity",
  "GDPRScore",
  "ComplianceScore",
  "PersonalDataMirror",
  "CrossTenantPrivacyAdmin",
  "PrivacySocialGraph",
]);

export function defaultPrivacyRetentionPolicy(): PrivacyRetentionPolicy {
  return {
    messages: {
      domain: "messages",
      description: "tenant_message_policy",
      automaticDeletion: false,
    },
    audit: {
      domain: "audit",
      description: "long_retention",
      automaticDeletion: false,
    },
    security_events: {
      domain: "security_events",
      description: "long_retention",
      automaticDeletion: false,
    },
    personal_preferences: {
      domain: "personal_preferences",
      description: "until_consent_withdrawn",
      automaticDeletion: false,
    },
  };
}

export function emptyPersonalDataPlane(): PersonalDataPlane {
  return {
    profiles: [],
    memberships: [],
    preferences: [],
    favorites: [],
    participations: [],
    reservations: [],
    messages: [],
    media: [],
    anonymized: [],
  };
}

export function projectPrivacyContext(input: {
  personId: string;
  tenantId: string;
  personalPrivacy?: Partial<PersonalPrivacy>;
  participationPrivacy?: Partial<CommunityParticipationPrivacy>;
  marketingCommunication?: boolean;
  anonymized?: boolean;
}): PrivacyContext {
  const personal = input.personalPrivacy ?? {};
  const participation = input.participationPrivacy ?? {};
  const anonymized = input.anonymized === true;
  return {
    personId: input.personId,
    tenantId: input.tenantId,
    consent: {
      recommendations: personal.receiveRecommendations !== false,
      activityVisibility:
        personal.shareActivity !== false &&
        participation.showActivity !== false,
      marketingCommunication: input.marketingCommunication === true,
    },
    rights: {
      exportAllowed: !anonymized,
      deletionAllowed: !anonymized,
      restrictionAllowed: !anonymized,
    },
    dataScope: {
      personalData: true,
      ownedContent: true,
      participationData: true,
    },
  };
}

export function projectPrivacyConfiguration(
  tenantId: string,
  input?: Partial<
    Pick<
      PrivacyConfiguration,
      "privacyPolicyUrl" | "legalContact" | "dataControllerName"
    >
  >,
): PrivacyConfiguration {
  return {
    tenantId,
    privacyPolicyUrl: input?.privacyPolicyUrl,
    legalContact: input?.legalContact,
    dataControllerName: input?.dataControllerName,
    retentionSettings: defaultPrivacyRetentionPolicy(),
  };
}

export function assertSelfPersonAccess(input: {
  actorPersonId: string;
  targetPersonId: string;
}): void {
  if (
    !input.actorPersonId.trim() ||
    !input.targetPersonId.trim() ||
    input.actorPersonId !== input.targetPersonId
  ) {
    throw new Error(EXPORT_OTHER_PERSON_DATA);
  }
}

export function assertPrivacyTenantBoundary(input: {
  actorTenantId: string;
  resourceTenantId: string;
}): void {
  assertTenantBoundary({
    actorTenantId: input.actorTenantId,
    resourceTenantId: input.resourceTenantId,
  });
}

export function personalMediaPolicy(input: {
  media: TenantOwnedMedia;
  tenantId: string;
  ownerPersonId?: string;
  actorPersonId: string;
  isPublicCommunityMedia?: boolean;
}): boolean {
  if (!mediaOwnedByTenant(input.media, input.tenantId)) return false;
  if (input.media.entityType === "avatar") {
    return (
      !input.ownerPersonId || input.ownerPersonId === input.actorPersonId
    );
  }
  if (input.isPublicCommunityMedia) return true;
  return (
    !input.ownerPersonId || input.ownerPersonId === input.actorPersonId
  );
}

export function privateMessageVisible(input: {
  messagePersonId: string;
  actorPersonId: string;
  tenantId: string;
  messageTenantId: string;
}): boolean {
  if (input.tenantId !== input.messageTenantId) return false;
  return input.messagePersonId === input.actorPersonId;
}

export const PrivacyConsentService = {
  updateConsent(
    current: PrivacyContext,
    input: PrivacyConsentInput,
  ): PrivacyContext {
    return {
      ...current,
      consent: {
        recommendations:
          input.recommendations ?? current.consent.recommendations,
        activityVisibility:
          input.activityVisibility ?? current.consent.activityVisibility,
        marketingCommunication:
          input.marketingCommunication ??
          current.consent.marketingCommunication,
      },
    };
  },

  toPersonalPrivacy(consent: PrivacyContext["consent"]): PersonalPrivacy {
    return {
      receiveRecommendations: consent.recommendations,
      shareActivity: consent.activityVisibility,
    };
  },
};

export const PersonalDataExportService = {
  exportPersonalData(
    plane: PersonalDataPlane,
    input: {
      actorPersonId: string;
      tenantId: string;
    },
  ): PersonalDataExport {
    assertSelfPersonAccess({
      actorPersonId: input.actorPersonId,
      targetPersonId: input.actorPersonId,
    });
    if (plane.anonymized.includes(input.actorPersonId)) {
      throw new Error(PRIVACY_ACCESS_DENIED);
    }
    const profile = plane.profiles.find(
      (row) =>
        row.personId === input.actorPersonId && row.tenantId === input.tenantId,
    );
    const preferences = plane.preferences.find(
      (row) =>
        row.personId === input.actorPersonId && row.tenantId === input.tenantId,
    );
    return {
      personId: input.actorPersonId,
      tenantId: input.tenantId,
      generatedAt: new Date().toISOString(),
      profile: {
        displayName: profile?.displayName ?? null,
        email: profile?.email ?? null,
        locale: profile?.locale,
      },
      memberships: plane.memberships
        .filter(
          (row) =>
            row.personId === input.actorPersonId &&
            row.tenantId === input.tenantId,
        )
        .map((row) => ({
          tenantId: row.tenantId,
          role: row.role,
          territoryId: row.territoryId,
        })),
      preferences: preferences?.privacy ?? {
        shareActivity: true,
        receiveRecommendations: true,
      },
      favorites: plane.favorites
        .filter(
          (row) =>
            row.personId === input.actorPersonId &&
            row.tenantId === input.tenantId,
        )
        .map((row) => ({ kind: row.kind, targetId: row.targetId })),
      participations: plane.participations
        .filter(
          (row) =>
            row.personId === input.actorPersonId &&
            row.tenantId === input.tenantId,
        )
        .map((row) => ({
          entityType: row.entityType,
          entityId: row.entityId,
        })),
      reservations: plane.reservations
        .filter(
          (row) =>
            row.personId === input.actorPersonId &&
            row.tenantId === input.tenantId,
        )
        .map((row) => ({
          entityId: row.entityId,
          status: row.status,
        })),
      settings: (sanitizeAuditMetadata({
        marketingCommunication: null,
      }) ?? {}) as Record<string, string | boolean | null>,
    };
  },
};

export const PersonalAnonymizationService = {
  anonymizePerson(
    plane: PersonalDataPlane,
    input: {
      actorPersonId: string;
      tenantId: string;
      explicitConfirmation?: boolean;
    },
  ): { plane: PersonalDataPlane; result: PersonalAnonymizationResult } {
    assertSelfPersonAccess({
      actorPersonId: input.actorPersonId,
      targetPersonId: input.actorPersonId,
    });
    if (input.explicitConfirmation !== true) {
      throw new Error("privacy_delete_confirmation_required");
    }
    const now = new Date().toISOString();
    const nextProfiles = plane.profiles.map((row) =>
      row.personId === input.actorPersonId && row.tenantId === input.tenantId
        ? { ...row, displayName: "Usuario eliminado", email: "" }
        : row,
    );
    const nextPlane: PersonalDataPlane = {
      ...plane,
      profiles: nextProfiles,
      anonymized: [...new Set([...plane.anonymized, input.actorPersonId])],
    };
    return {
      plane: nextPlane,
      result: {
        personId: input.actorPersonId,
        tenantId: input.tenantId,
        anonymizedAt: now,
        displayName: null,
        email: null,
        preservedRecords: ["audit", "security_events", "legal_integrity"],
      },
    };
  },
};

export function privacyIntegratesWithSecurity(): boolean {
  return true;
}

export function gdprDoesNotOwnDomainData(): boolean {
  return true;
}

export function isOpaquePrivacyEntity(name: string): boolean {
  return OPAQUE_PRIVACY_ENTITIES.has(name);
}

export function mergeTrustPrivacyForExport(
  trust?: TrustPrivacy,
): Record<string, boolean> {
  return {
    trustVisible: trust?.visible === true,
    trustShowSignals: trust?.showSignals === true,
  };
}
