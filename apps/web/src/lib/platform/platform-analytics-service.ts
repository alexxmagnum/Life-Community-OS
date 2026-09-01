/**
 * Platform analytics & business intelligence runtime.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  analyticsInsightsForCustomerSuccess,
  canAccessPlatformAdmin,
  projectPlatformBusinessIntelligence,
  projectPlatformReport,
  projectTenantAnalytics,
  rejectAnalyticsClientSpoof,
  type PlatformReportKind,
} from "@life-community-os/types";
import {
  customerOperationsSnapshot,
  customerSuccessSnapshot,
} from "@/lib/platform/customer-operations-service";
import {
  recordInvalidPermission,
  recordPlatformAudit,
} from "@/lib/platform/platform-operations-store";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";

function requireOperator(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new TenantFactoryDeniedError("unauthorized");
  }
  if (
    !canAccessPlatformAdmin({
      personId: actor.personId,
      operators: TenantFactoryRuntime.snapshot().operators,
    })
  ) {
    recordInvalidPermission({
      tenantId: actor.tenantSlug,
      actorPersonId: actor.personId,
      action: "security.permission.denied",
    });
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

function analyticsInput() {
  return {
    snapshot: TenantFactoryRuntime.snapshot(),
    customerPlane: customerOperationsSnapshot(),
    successPlane: customerSuccessSnapshot(),
  };
}

export const PlatformAnalyticsRuntime = {
  overview(actor: RequestActor) {
    const personId = requireOperator(actor);
    const context = projectPlatformBusinessIntelligence(analyticsInput());
    recordPlatformAudit({
      tenantId: "platform",
      actorPersonId: personId,
      action: "platform.analytics.viewed",
      entityType: "tenant",
      entityId: "platform",
      metadata: { scope: "overview" },
    });
    return context;
  },

  listTenants(actor: RequestActor) {
    requireOperator(actor);
    const input = analyticsInput();
    return input.snapshot.tenants
      .map((tenant) =>
        projectTenantAnalytics({ ...input, tenantId: tenant.id }),
      )
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  },

  getTenant(actor: RequestActor, tenantId: string) {
    requireOperator(actor);
    return projectTenantAnalytics({ ...analyticsInput(), tenantId });
  },

  generateReport(input: {
    actor: RequestActor;
    kind: PlatformReportKind;
    body?: Record<string, unknown>;
  }) {
    const personId = requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectAnalyticsClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const report = projectPlatformReport({
      ...analyticsInput(),
      kind: input.kind,
    });
    recordPlatformAudit({
      tenantId: "platform",
      actorPersonId: personId,
      action: "platform.report.generated",
      entityType: "tenant",
      entityId: "platform",
      metadata: { kind: input.kind },
    });
    return report;
  },

  exportReport(input: {
    actor: RequestActor;
    kind: PlatformReportKind;
    body?: Record<string, unknown>;
  }) {
    const personId = requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectAnalyticsClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const report = this.generateReport(input);
    recordPlatformAudit({
      tenantId: "platform",
      actorPersonId: personId,
      action: "platform.analytics.exported",
      entityType: "tenant",
      entityId: "platform",
      metadata: { kind: input.kind },
    });
    return report;
  },

  customerSuccessInsights(actor: RequestActor) {
    requireOperator(actor);
    return analyticsInsightsForCustomerSuccess(analyticsInput());
  },
};
