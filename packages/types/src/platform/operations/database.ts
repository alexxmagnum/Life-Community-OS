/**
 * Database operations readiness — schema and migration posture.
 * Does not execute migrations automatically.
 */

import { PLATFORM_HEALTH_STATUSES, type PlatformHealthStatus } from "./health";

export const MIGRATION_STATUSES = [
  "up_to_date",
  "pending",
  "inconsistent",
  "unknown",
] as const;

export type MigrationStatus = (typeof MIGRATION_STATUSES)[number];

export type DatabaseOperationsContext = {
  schemaVersion: string;
  migrationStatus: MigrationStatus;
  lastMigration?: string;
  pendingMigrations: number;
  databaseHealth: PlatformHealthStatus;
  checkedAt: string;
};

export type MigrationCheckResult = {
  applicable: boolean;
  migrationStatus: MigrationStatus;
  pendingMigrations: number;
  lastMigration?: string;
  inconsistent: boolean;
  reason?: string;
};

export function projectDatabaseOperationsContext(input: {
  schemaVersion: string;
  migrationStatus: MigrationStatus;
  lastMigration?: string;
  pendingMigrations?: number;
  databaseHealth?: PlatformHealthStatus;
  checkedAt?: string;
}): DatabaseOperationsContext {
  return {
    schemaVersion: input.schemaVersion.trim() || "unknown",
    migrationStatus: input.migrationStatus,
    pendingMigrations: Math.max(0, input.pendingMigrations ?? 0),
    databaseHealth: input.databaseHealth ?? "unknown",
    checkedAt: input.checkedAt ?? new Date().toISOString(),
    ...(input.lastMigration ? { lastMigration: input.lastMigration } : {}),
  };
}

export function validateMigrationCheck(input: {
  appliedCount: number;
  availableCount: number;
}): MigrationCheckResult {
  const pending = Math.max(0, input.availableCount - input.appliedCount);
  const migrationStatus: MigrationStatus =
    pending === 0
      ? "up_to_date"
      : input.appliedCount === 0
        ? "unknown"
        : "pending";
  return {
    applicable: input.availableCount > 0,
    migrationStatus,
    pendingMigrations: pending,
    inconsistent: input.appliedCount > input.availableCount,
    ...(pending > 0
      ? { reason: `${pending} migration(s) pending review` }
      : {}),
  };
}

export function databaseHealthMetadataSanitized(
  metadata: Record<string, unknown>,
): boolean {
  const raw = JSON.stringify(metadata).toLowerCase();
  return (
    !raw.includes("password") &&
    !raw.includes("secret") &&
    !raw.includes("token") &&
    !raw.includes("api_key") &&
    !raw.includes("service_role")
  );
}
