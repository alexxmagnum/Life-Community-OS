/**
 * Tenant launch service — Platform Operator launch checklist only.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canAccessPlatformAdmin,
  deriveLaunchStatus,
  emptyLaunchChecklist,
  launchChecklistComplete,
  projectTenantLaunchChecklist,
  type TenantLaunchCheckItem,
  type TenantLaunchChecklist,
} from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import {
  listLaunchChecklists,
  saveLaunchChecklist,
} from "@/lib/platform/production-readiness-store";
import { recordPlatformAudit } from "@/lib/platform/platform-operations-store";

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
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

export const TenantLaunchService = {
  list(): TenantLaunchChecklist[] {
    const stored = listLaunchChecklists();
    const tenants = TenantFactoryRuntime.list();
    return tenants.map((tenant) => {
      const existing = stored.find((row) => row.tenantId === tenant.id);
      if (existing) return existing;
      const checklist = emptyLaunchChecklist(tenant.id);
      checklist.items.tenant_created = true;
      checklist.items.territory_configured =
        TenantFactoryRuntime.snapshot().territories.some(
          (row) => row.tenantId === tenant.id,
        );
      checklist.status = deriveLaunchStatus(checklist);
      return checklist;
    });
  },

  get(tenantId: string): TenantLaunchChecklist {
    return (
      this.list().find((row) => row.tenantId === tenantId) ??
      emptyLaunchChecklist(tenantId)
    );
  },

  updateItem(input: {
    actor: RequestActor;
    tenantId: string;
    item: TenantLaunchCheckItem;
    completed: boolean;
  }): TenantLaunchChecklist {
    const personId = requireOperator(input.actor);
    const current = this.get(input.tenantId);
    const checklist = projectTenantLaunchChecklist({
      tenantId: input.tenantId,
      items: { ...current.items, [input.item]: input.completed },
      launchedAt: current.launchedAt,
    });
    saveLaunchChecklist(checklist);
    return checklist;
  },

  approveLaunch(input: {
    actor: RequestActor;
    tenantId: string;
  }): TenantLaunchChecklist {
    const personId = requireOperator(input.actor);
    const current = this.get(input.tenantId);
    const checklist = projectTenantLaunchChecklist({
      tenantId: input.tenantId,
      items: { ...current.items, launch_approved: true },
      launchedAt: launchChecklistComplete(current) ? new Date().toISOString() : undefined,
    });
    if (!launchChecklistComplete(checklist)) {
      throw new TenantFactoryDeniedError("invalid");
    }
    const launched = projectTenantLaunchChecklist({
      tenantId: input.tenantId,
      items: checklist.items,
      launchedAt: new Date().toISOString(),
    });
    saveLaunchChecklist(launched);
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.launch.completed",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { status: launched.status },
    });
    return launched;
  },
};
