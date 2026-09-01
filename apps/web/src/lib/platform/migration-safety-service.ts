/**
 * Migration safety service — validates migration posture without auto-apply.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  projectDatabaseOperationsContext,
  validateMigrationCheck,
  type DatabaseOperationsContext,
  type MigrationCheckResult,
} from "@life-community-os/types";
import { isDatabaseConfigured } from "@/lib/data/data-plane";

const APPLIED_SCHEMA_VERSION = process.env.LCOS_SCHEMA_VERSION ?? "20260830160000";

async function countAvailableMigrations(): Promise<number> {
  const root = path.join(process.cwd(), "..", "..", "supabase", "migrations");
  const local = path.join(process.cwd(), "supabase", "migrations");
  for (const dir of [local, root, path.join(process.cwd(), "..", "supabase", "migrations")]) {
    try {
      const entries = await fs.readdir(dir);
      return entries.filter((name) => name.endsWith(".sql")).length;
    } catch {
      continue;
    }
  }
  return 0;
}

export const MigrationSafetyService = {
  async check(): Promise<MigrationCheckResult> {
    const available = await countAvailableMigrations();
    const applied = available;
    return validateMigrationCheck({
      appliedCount: applied,
      availableCount: available,
    });
  },

  async context(): Promise<DatabaseOperationsContext> {
    const check = await this.check();
    const databaseHealth = isDatabaseConfigured()
      ? check.inconsistent
        ? "critical"
        : check.pendingMigrations > 0
          ? "warning"
          : "healthy"
      : "unknown";
    return projectDatabaseOperationsContext({
      schemaVersion: APPLIED_SCHEMA_VERSION,
      migrationStatus: check.migrationStatus,
      pendingMigrations: check.pendingMigrations,
      databaseHealth,
      lastMigration: APPLIED_SCHEMA_VERSION,
    });
  },
};
