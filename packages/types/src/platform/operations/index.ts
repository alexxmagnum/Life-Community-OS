/**
 * Production readiness — aggregate projection and guards.
 */

import type { BackupVerificationContext } from "./backup-verification";
import type { DatabaseOperationsContext } from "./database";
import type { ProductionEnvironmentContext } from "./environment";
import type { PlatformHealthContext } from "./health";
import type { PlatformIncidentContext } from "./incident";
import type { TenantLaunchChecklist } from "./launch";
import type { SupabaseSecurityReadinessContext } from "./supabase-readiness";

export type ProductionReadinessContext = {
  environment: ProductionEnvironmentContext;
  database: DatabaseOperationsContext;
  supabase: SupabaseSecurityReadinessContext;
  health: PlatformHealthContext;
  incidents: PlatformIncidentContext[];
  launchChecklists: TenantLaunchChecklist[];
  backupVerifications: BackupVerificationContext[];
};

export function projectProductionReadinessContext(input: {
  environment: ProductionEnvironmentContext;
  database: DatabaseOperationsContext;
  supabase: SupabaseSecurityReadinessContext;
  health: PlatformHealthContext;
  incidents?: readonly PlatformIncidentContext[];
  launchChecklists?: readonly TenantLaunchChecklist[];
  backupVerifications?: readonly BackupVerificationContext[];
}): ProductionReadinessContext {
  return {
    environment: input.environment,
    database: input.database,
    supabase: input.supabase,
    health: input.health,
    incidents: [...(input.incidents ?? [])],
    launchChecklists: [...(input.launchChecklists ?? [])],
    backupVerifications: [...(input.backupVerifications ?? [])],
  };
}

export function productionContextContainsDomainData(
  context: ProductionReadinessContext,
): boolean {
  const raw = JSON.stringify(context).toLowerCase();
  return (
    raw.includes('"messages"') ||
    raw.includes('"conversations"') ||
    raw.includes("engagement") ||
    raw.includes("follower")
  );
}

export function isOpaqueProductionReadinessEntity(name: string): boolean {
  return [
    "GlobalProductionEntity",
    "UniversalMonitoringEntity",
    "GlobalIncidentEntity",
    "PlatformContentStore",
    "CrossTenantOperations",
    "CustomerSpecificInfrastructure",
    "DeploymentUserEntity",
    "EnvironmentDataMirror",
    "GlobalSIEM",
    "TenantCloneMonitor",
  ].includes(name);
}

export * from "./environment";
export * from "./health";
export * from "./database";
export * from "./supabase-readiness";
export * from "./incident";
export * from "./launch";
export * from "./backup-verification";
