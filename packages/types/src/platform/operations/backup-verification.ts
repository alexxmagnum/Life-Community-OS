/**
 * Backup verification — restore test posture without cross-tenant restore.
 */

export const BACKUP_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "failed",
  "unknown",
] as const;

export type BackupVerificationStatus =
  (typeof BACKUP_VERIFICATION_STATUSES)[number];

export type BackupVerificationContext = {
  backupId: string;
  tenantId: string;
  verificationStatus: BackupVerificationStatus;
  restoreTested: boolean;
  lastVerification?: string;
  targetTenantId: string;
};

export function projectBackupVerificationContext(input: {
  backupId: string;
  tenantId: string;
  verificationStatus?: BackupVerificationStatus;
  restoreTested?: boolean;
  lastVerification?: string;
  targetTenantId?: string;
}): BackupVerificationContext {
  const targetTenantId = input.targetTenantId?.trim() || input.tenantId;
  return {
    backupId: input.backupId,
    tenantId: input.tenantId,
    verificationStatus: input.verificationStatus ?? "pending",
    restoreTested: input.restoreTested === true,
    targetTenantId,
    ...(input.lastVerification
      ? { lastVerification: input.lastVerification }
      : {}),
  };
}

export function backupVerificationRespectsTenantIsolation(input: {
  backupTenantId: string;
  targetTenantId: string;
}): boolean {
  return input.backupTenantId === input.targetTenantId;
}

export function backupVerificationFlowComplete(
  context: BackupVerificationContext,
): boolean {
  return (
    context.verificationStatus === "verified" &&
    context.restoreTested &&
    backupVerificationRespectsTenantIsolation({
      backupTenantId: context.tenantId,
      targetTenantId: context.targetTenantId,
    })
  );
}
