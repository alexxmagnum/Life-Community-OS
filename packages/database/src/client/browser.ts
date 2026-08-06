import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicDatabaseEnv } from "../env";
import type { Database } from "../schema";

export type BrowserDatabaseClient = SupabaseClient<Database>;

/**
 * Browser-safe Supabase client.
 * Uses anon key only. Never accepts service-role credentials.
 * Auth flows are intentionally not configured here.
 */
export function createBrowserDatabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): BrowserDatabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicDatabaseEnv(env);

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
