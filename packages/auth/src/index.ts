/**
 * Authentication foundation — Supabase Auth when configured.
 * Server never trusts client-declared roles.
 */

export type AuthSession = {
  userId: string;
  email: string | null;
  accessToken: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  displayName?: string;
};

type EnvLike = Record<string, string | undefined>;

function readEnv(): EnvLike {
  return (globalThis as { process?: { env?: EnvLike } }).process?.env ?? {};
}

export function isAuthConfigured(env: EnvLike = readEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * When true, member routes require a real session.
 * Default false until Supabase Auth is provisioned in the environment.
 */
export function isAuthEnforced(env: EnvLike = readEnv()): boolean {
  if (env.LCOS_AUTH_REQUIRED === "1" || env.LCOS_AUTH_REQUIRED === "true") {
    return true;
  }
  return false;
}

export type {
  ActingIdentityId,
  AuthenticationResult,
} from "@life-community-os/types";
