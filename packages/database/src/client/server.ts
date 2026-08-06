import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getPublicDatabaseEnv,
  getServiceDatabaseEnv,
} from "../env";
import type { Database } from "../schema";

export type ServerDatabaseClient = SupabaseClient<Database>;
export type ServiceDatabaseClient = SupabaseClient<Database>;

/**
 * Server Supabase client using the public anon key.
 * Suitable for request-scoped server usage without elevated privileges.
 * Do not import this module from browser bundles for service operations.
 */
export function createServerDatabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): ServerDatabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicDatabaseEnv(env);

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Privileged server client using the service-role key.
 * Connection boundary: server-only. Never expose to the browser.
 * Bypasses RLS — use only for controlled platform operations.
 */
export function createServiceDatabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): ServiceDatabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = getServiceDatabaseEnv(env);

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
