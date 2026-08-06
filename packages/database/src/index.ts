/**
 * Database package public surface.
 *
 * Architecture boundary:
 * - This package is replaceable infrastructure.
 * - Domain behaviour must not depend on Supabase-specific APIs outside adapters.
 * - Prefer importing domain types from @life-community-os/types.
 */

export {
  getPublicDatabaseEnv,
  getServiceDatabaseEnv,
  type PublicDatabaseEnv,
  type ServiceDatabaseEnv,
} from "./env";

export type {
  Database,
  TenantRow,
  TerritoryRow,
  PersonRow,
  IdentityRow,
  MembershipRow,
} from "./schema";

export {
  createBrowserDatabaseClient,
  type BrowserDatabaseClient,
} from "./client/browser";

export {
  createServerDatabaseClient,
  createServiceDatabaseClient,
  type ServerDatabaseClient,
  type ServiceDatabaseClient,
} from "./client/server";

export {
  mapTenantRow,
  mapTerritoryRow,
  mapPersonRow,
  mapIdentityRow,
  mapMembershipRow,
} from "./mappers";
