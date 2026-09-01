/**
 * Production readiness in-memory store — incidents, launch, backup verification.
 * Operational metadata only. Not domain content.
 */

import type {
  BackupVerificationContext,
  PlatformIncidentContext,
  TenantLaunchChecklist,
} from "@life-community-os/types";

export type ProductionReadinessStore = {
  incidents: PlatformIncidentContext[];
  launchChecklists: TenantLaunchChecklist[];
  backupVerifications: BackupVerificationContext[];
};

function emptyStore(): ProductionReadinessStore {
  return {
    incidents: [],
    launchChecklists: [],
    backupVerifications: [],
  };
}

let store: ProductionReadinessStore = emptyStore();

export function replaceProductionReadinessStoreForTests(
  next: ProductionReadinessStore = emptyStore(),
): void {
  store = next;
}

export function listProductionIncidents(): PlatformIncidentContext[] {
  return [...store.incidents];
}

export function saveProductionIncident(incident: PlatformIncidentContext): void {
  store.incidents = [
    incident,
    ...store.incidents.filter((row) => row.id !== incident.id),
  ];
}

export function listLaunchChecklists(): TenantLaunchChecklist[] {
  return [...store.launchChecklists];
}

export function saveLaunchChecklist(checklist: TenantLaunchChecklist): void {
  store.launchChecklists = [
    checklist,
    ...store.launchChecklists.filter((row) => row.tenantId !== checklist.tenantId),
  ];
}

export function listBackupVerifications(): BackupVerificationContext[] {
  return [...store.backupVerifications];
}

export function saveBackupVerification(
  verification: BackupVerificationContext,
): void {
  store.backupVerifications = [
    verification,
    ...store.backupVerifications.filter(
      (row) => row.backupId !== verification.backupId,
    ),
  ];
}
