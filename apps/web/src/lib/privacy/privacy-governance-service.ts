/**
 * GDPR privacy governance runtime — export, consent, anonymization.
 * Does not store domain content as a parallel GDPR domain.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  EXPORT_OTHER_PERSON_DATA,
  PRIVACY_ACCESS_DENIED,
  PersonalAnonymizationService,
  PersonalDataExportService,
  PrivacyConsentService,
  assertPrivacyTenantBoundary,
  assertSelfPersonAccess,
  canAccessPlatformAdmin,
  emptyPersonalDataPlane,
  projectPrivacyConfiguration,
  projectPrivacyContext,
  type PersonalDataExport,
  type PersonalDataPlane,
  type PrivacyConfiguration,
  type PrivacyConsentInput,
  type PrivacyContext,
} from "@life-community-os/types";
import {
  recordInvalidPermission,
  recordPlatformAudit,
} from "@/lib/platform/platform-operations-store";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";

let plane: PersonalDataPlane = emptyPersonalDataPlane();
const configurations = new Map<string, PrivacyConfiguration>();

function requireActor(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new Error("unauthorized");
  }
  return actor.personId;
}

export function replacePrivacyGovernanceStoreForTests(
  next: PersonalDataPlane = emptyPersonalDataPlane(),
): void {
  plane = next;
  configurations.clear();
}

export function seedPrivacyGovernanceForTests(input: PersonalDataPlane): void {
  plane = input;
}

export const PrivacyGovernanceRuntime = {
  context(actor: RequestActor, tenantId: string): PrivacyContext {
    const personId = requireActor(actor);
    assertPrivacyTenantBoundary({
      actorTenantId: actor.tenantSlug,
      resourceTenantId: tenantId,
    });
    const preferences = plane.preferences.find(
      (row) => row.personId === personId && row.tenantId === tenantId,
    );
    return projectPrivacyContext({
      personId,
      tenantId,
      personalPrivacy: preferences?.privacy,
      anonymized: plane.anonymized.includes(personId),
    });
  },

  updateConsent(input: {
    actor: RequestActor;
    tenantId: string;
    consent: PrivacyConsentInput;
  }): PrivacyContext {
    const personId = requireActor(input.actor);
    assertPrivacyTenantBoundary({
      actorTenantId: input.actor.tenantSlug,
      resourceTenantId: input.tenantId,
    });
    const current = this.context(input.actor, input.tenantId);
    const next = PrivacyConsentService.updateConsent(current, input.consent);
    const index = plane.preferences.findIndex(
      (row) => row.personId === personId && row.tenantId === input.tenantId,
    );
    const privacy = PrivacyConsentService.toPersonalPrivacy(next.consent);
    if (index >= 0) {
      plane.preferences[index] = { personId, tenantId: input.tenantId, privacy };
    } else {
      plane.preferences.push({ personId, tenantId: input.tenantId, privacy });
    }
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "privacy.consent.changed",
      entityType: "privacy",
      entityId: personId,
      metadata: {
        recommendations: next.consent.recommendations,
        activityVisibility: next.consent.activityVisibility,
        marketingCommunication: next.consent.marketingCommunication,
      },
    });
    return next;
  },

  exportPersonal(input: {
    actor: RequestActor;
    tenantId: string;
    targetPersonId?: string;
  }): PersonalDataExport {
    const personId = requireActor(input.actor);
    const target = input.targetPersonId ?? personId;
    try {
      assertSelfPersonAccess({ actorPersonId: personId, targetPersonId: target });
    } catch {
      recordPlatformAudit({
        tenantId: input.tenantId,
        actorPersonId: personId,
        action: "privacy.access.denied",
        entityType: "privacy",
        entityId: target,
        metadata: { reason: EXPORT_OTHER_PERSON_DATA },
      });
      throw new Error(PRIVACY_ACCESS_DENIED);
    }
    assertPrivacyTenantBoundary({
      actorTenantId: input.actor.tenantSlug,
      resourceTenantId: input.tenantId,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "privacy.export.requested",
      entityType: "privacy",
      entityId: personId,
    });
    const exported = PersonalDataExportService.exportPersonalData(plane, {
      actorPersonId: personId,
      tenantId: input.tenantId,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "privacy.export.completed",
      entityType: "privacy",
      entityId: personId,
    });
    return exported;
  },

  deleteAccount(input: {
    actor: RequestActor;
    tenantId: string;
    explicitConfirmation?: boolean;
  }) {
    const personId = requireActor(input.actor);
    assertPrivacyTenantBoundary({
      actorTenantId: input.actor.tenantSlug,
      resourceTenantId: input.tenantId,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "privacy.delete.requested",
      entityType: "privacy",
      entityId: personId,
    });
    const { plane: next, result } = PersonalAnonymizationService.anonymizePerson(
      plane,
      {
        actorPersonId: personId,
        tenantId: input.tenantId,
        explicitConfirmation: input.explicitConfirmation,
      },
    );
    plane = next;
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "privacy.delete.completed",
      entityType: "privacy",
      entityId: personId,
    });
    return result;
  },

  configuration(tenantId: string): PrivacyConfiguration {
    return (
      configurations.get(tenantId) ??
      projectPrivacyConfiguration(tenantId)
    );
  },

  saveConfiguration(input: {
    actor: RequestActor;
    tenantId: string;
    config: Partial<
      Pick<
        PrivacyConfiguration,
        "privacyPolicyUrl" | "legalContact" | "dataControllerName"
      >
    >;
    platformOperator?: boolean;
  }): PrivacyConfiguration {
    if (input.platformOperator) {
      if (
        !canAccessPlatformAdmin({
          personId: input.actor.personId ?? "",
          operators: TenantFactoryRuntime.snapshot().operators,
        })
      ) {
        recordInvalidPermission({
          tenantId: input.tenantId,
          actorPersonId: input.actor.personId ?? undefined,
          action: "privacy.access.denied",
        });
        throw new Error(PRIVACY_ACCESS_DENIED);
      }
    } else if (input.actor.role !== "administrator") {
      recordInvalidPermission({
        tenantId: input.tenantId,
        actorPersonId: input.actor.personId ?? undefined,
        action: "privacy.access.denied",
      });
      throw new Error(PRIVACY_ACCESS_DENIED);
    }
    const next = projectPrivacyConfiguration(input.tenantId, input.config);
    configurations.set(input.tenantId, next);
    return next;
  },

  listAuditPrivacy() {
    return plane.anonymized;
  },
};
