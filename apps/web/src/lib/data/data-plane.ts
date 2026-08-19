/**
 * Production data plane vs development fixtures.
 *
 * Postgres is the source of truth when configured.
 * `.data/` JSON is allowed only as a local fixture (never production).
 */

export type DataPlaneEnv = Record<string, string | undefined>;

function readEnv(): DataPlaneEnv {
  return (globalThis as { process?: { env?: DataPlaneEnv } }).process?.env ?? {};
}

export function isDatabaseConfigured(env: DataPlaneEnv = readEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function isProductionDataPlane(env: DataPlaneEnv = readEnv()): boolean {
  return (
    env.NODE_ENV === "production" ||
    env.LCOS_AUTH_REQUIRED === "1" ||
    env.LCOS_AUTH_REQUIRED === "true"
  );
}

/**
 * File stores under apps/web/.data may be used only as development fixtures.
 */
export function isFilePersistenceAllowed(env: DataPlaneEnv = readEnv()): boolean {
  return !isProductionDataPlane(env);
}

export class PersistenceUnavailableError extends Error {
  readonly code = "persistence_unavailable";

  constructor(message = "Database is required for this data plane") {
    super(message);
    this.name = "PersistenceUnavailableError";
  }
}

export function assertDatabaseOrFixture(env: DataPlaneEnv = readEnv()): void {
  if (isDatabaseConfigured(env)) return;
  if (isFilePersistenceAllowed(env)) return;
  throw new PersistenceUnavailableError();
}
