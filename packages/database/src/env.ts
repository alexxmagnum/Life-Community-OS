/**
 * Environment validation for Supabase connection boundaries.
 * Infrastructure is replaceable; Business Behaviour must not depend on these keys.
 */

export type PublicDatabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type ServiceDatabaseEnv = PublicDatabaseEnv & {
  supabaseServiceRoleKey: string;
};

function readRequired(
  name: string,
  value: string | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `@life-community-os/database: missing required environment variable ${name}`,
    );
  }
  return trimmed;
}

/**
 * Public client credentials (safe for browser when using anon key + RLS).
 */
export function getPublicDatabaseEnv(
  env: NodeJS.ProcessEnv = process.env,
): PublicDatabaseEnv {
  return {
    supabaseUrl: readRequired(
      "NEXT_PUBLIC_SUPABASE_URL",
      env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    supabaseAnonKey: readRequired(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/**
 * Privileged server credentials. Never expose to the browser.
 */
export function getServiceDatabaseEnv(
  env: NodeJS.ProcessEnv = process.env,
): ServiceDatabaseEnv {
  const publicEnv = getPublicDatabaseEnv(env);
  return {
    ...publicEnv,
    supabaseServiceRoleKey: readRequired(
      "SUPABASE_SERVICE_ROLE_KEY",
      env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
