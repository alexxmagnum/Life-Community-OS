/**
 * Demo identity (Marta, setRole, person switcher) is development-only.
 * Production builds never enable it, regardless of NEXT_PUBLIC flags.
 */

type EnvLike = Record<string, string | undefined>;

function readEnv(): EnvLike {
  return (globalThis as { process?: { env?: EnvLike } }).process?.env ?? {};
}

export function isDemoIdentityEnabled(env: EnvLike = readEnv()): boolean {
  if (env.NODE_ENV === "production") return false;
  return (
    env.NEXT_PUBLIC_LCOS_DEMO_ROLES === "1" ||
    env.NEXT_PUBLIC_LCOS_DEMO_ROLES === "true"
  );
}

/**
 * First membership in an empty tenant directory becomes administrator.
 * Re-join never changes an existing role. Client-supplied roles are ignored.
 */
export function resolveJoinRole(input: {
  existingRole: string | null;
  directoryEmpty: boolean;
}): "administrator" | "member" | string {
  if (input.existingRole) return input.existingRole;
  if (input.directoryEmpty) return "administrator";
  return "member";
}
