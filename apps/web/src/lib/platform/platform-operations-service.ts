/**
 * Platform Operations runtime — SaaS aggregates only.
 * Does not load community users, messages, or domain content.
 */

import {
  projectPlatformAudit,
  projectPlatformOperationsContext,
  projectTenantHealth,
  projectTenantSubscription,
  provisioningStatusFromTenant,
  type PlatformOperationsContext,
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

  subscription(tenantId: string): TenantSubscription | null {
    return projectTenantSubscription(TenantFactoryRuntime.snapshot(), tenantId);
  },

  provisioning(tenantId: string): TenantProvisioningStatus | null {
    const tenant = TenantFactoryRuntime.list().find((row) => row.id === tenantId);
    if (!tenant) return null;
    return provisioningStatusFromTenant(tenant.status);
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
