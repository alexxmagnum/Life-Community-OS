/**
 * Platform Operations runtime — SaaS aggregates only.
 * Does not load community users, messages, or domain content.
 */

import {
  projectPlatformAudit,
  projectPlatformOperationsContext,
  projectTenantFeatureObservabilityList,
  projectTenantHealth,
  projectTenantHealthList,
  projectTenantSubscription,
  provisioningStatusFromTenant,
  type PlatformOperationsContext,
  type TenantFeatureObservability,
  type TenantHealthContext,
  type TenantSubscription,
  type TenantProvisioningStatus,
} from "@life-community-os/types";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";
import {
  listPlatformAudit,
  listPlatformSecurityEvents,
} from "@/lib/platform/platform-operations-store";

export const PlatformOperationsRuntime = {
  context(): PlatformOperationsContext {
    return projectPlatformOperationsContext({
      snapshot: TenantFactoryRuntime.snapshot(),
      audit: listPlatformAudit(),
      securityEvents: listPlatformSecurityEvents(),
    });
  },

  health(tenantId: string): TenantHealthContext | null {
    const tenant = TenantFactoryRuntime.list().find((row) => row.id === tenantId);
    if (!tenant) return null;
    return projectTenantHealth(
      TenantFactoryRuntime.snapshot(),
      tenant,
      listPlatformAudit(),
    );
  },

  healthList(): TenantHealthContext[] {
    return projectTenantHealthList(
      TenantFactoryRuntime.snapshot(),
      listPlatformAudit(),
    );
  },

  features(): TenantFeatureObservability[] {
    return projectTenantFeatureObservabilityList(
      TenantFactoryRuntime.snapshot(),
    );
  },

  subscription(tenantId: string): TenantSubscription | null {
    return projectTenantSubscription(TenantFactoryRuntime.snapshot(), tenantId);
  },

  subscriptions(): TenantSubscription[] {
    return TenantFactoryRuntime.list().flatMap((row) => {
      const sub = projectTenantSubscription(
        TenantFactoryRuntime.snapshot(),
        row.id,
      );
      return sub ? [sub] : [];
    });
  },

  provisioning(tenantId: string): TenantProvisioningStatus | null {
    const tenant = TenantFactoryRuntime.list().find((row) => row.id === tenantId);
    if (!tenant) return null;
    return provisioningStatusFromTenant(tenant.status);
  },

  provisioningList(): Array<{
    tenantId: string;
    status: TenantProvisioningStatus;
  }> {
    return TenantFactoryRuntime.list().map((row) => ({
      tenantId: row.id,
      status: provisioningStatusFromTenant(row.status),
    }));
  },

  audit() {
    return listPlatformAudit().map(projectPlatformAudit);
  },

  security() {
    return listPlatformSecurityEvents();
  },

  territories() {
    return TenantFactoryRuntime.snapshot().territories.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      slug: row.slug,
    }));
  },
};
