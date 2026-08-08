import type { DomainId } from "../../domain/ids";
import type { TenantConfiguration } from "../tenant-configuration";
import { isTenantModuleEnabled } from "../tenant-configuration";
import type { FileReference } from "./file-reference";
import { isFileReferenceReady } from "./file-reference";

/**
 * File / media access projection helpers (D.0.5c).
 *
 * Fail closed for tenant mismatch and module OFF.
 * Does not grant AuthZ — Capabilities remain separate.
 */

export type FileAccessEnv = {
  configuration: TenantConfiguration;
  /** Acting tenant — required for isolation checks. */
  tenantId: DomainId;
};

/**
 * Whether a FileReference may appear in UI / delivery for this tenant + modules.
 * Security module OFF ⇒ security-owned media hidden (no orphan access).
 */
export function shouldProjectFileReference(
  file: FileReference,
  env: FileAccessEnv,
): boolean {
  if (!file?.tenantId?.trim() || !env.tenantId?.trim()) return false;
  if (file.tenantId !== env.tenantId) return false;
  if (file.status === "deleted") return false;

  const moduleId = file.ownerContext?.moduleId;
  if (moduleId && !isTenantModuleEnabled(env.configuration, moduleId)) {
    return false;
  }

  return true;
}

/**
 * Delivery-ready projection: tenant + module ON + status ready (+ not expired).
 */
export function canDeliverFileReference(
  file: FileReference,
  env: FileAccessEnv,
  nowIso: string = new Date().toISOString(),
): boolean {
  if (!shouldProjectFileReference(file, env)) return false;
  if (!isFileReferenceReady(file)) return false;
  if (file.ephemeralExpiresAt && file.ephemeralExpiresAt <= nowIso) {
    return false;
  }
  return true;
}

/**
 * Retention-driven cleanup eligibility — rules live on RetentionPolicy /
 * ownerContext, not inside Message code.
 */
export function isFileEligibleForRetentionCleanup(
  file: FileReference,
  options: {
    cleanupMedia: boolean;
    nowIso?: string;
  },
): boolean {
  if (!options.cleanupMedia) return false;
  if (file.status === "deleted") return false;

  const now = options.nowIso ?? new Date().toISOString();
  if (file.ephemeralExpiresAt && file.ephemeralExpiresAt <= now) {
    return true;
  }
  if (file.status === "archived" || file.status === "temporary") {
    return true;
  }
  return false;
}
