/**
 * Supabase production hardening readiness — configuration posture only.
 * Never exposes service_role keys, secrets or tokens.
 */

import type { PlatformHealthStatus } from "./health";

export const API_PROTECTION_STATUSES = [
  "protected",
  "review_needed",
  "unknown",
] as const;

export type ApiProtectionStatus = (typeof API_PROTECTION_STATUSES)[number];

export type SupabaseSecurityReadinessContext = {
  authConfigured: boolean;
  storagePoliciesConfigured: boolean;
  rlsValidated: boolean;
  apiProtectionStatus: ApiProtectionStatus;
  overall: PlatformHealthStatus;
  checkedAt: string;
};

export function projectSupabaseSecurityReadiness(input: {
  authConfigured?: boolean;
  storagePoliciesConfigured?: boolean;
  rlsValidated?: boolean;
  apiProtectionStatus?: ApiProtectionStatus;
  checkedAt?: string;
}): SupabaseSecurityReadinessContext {
  const authConfigured = input.authConfigured === true;
  const storagePoliciesConfigured = input.storagePoliciesConfigured === true;
  const rlsValidated = input.rlsValidated === true;
  const apiProtectionStatus = input.apiProtectionStatus ?? "unknown";
  const ready =
    authConfigured && storagePoliciesConfigured && rlsValidated &&
    apiProtectionStatus === "protected";
  const partial =
    authConfigured || storagePoliciesConfigured || rlsValidated;
  const overall: PlatformHealthStatus = ready
    ? "healthy"
    : partial
      ? "warning"
      : "unknown";
  return {
    authConfigured,
    storagePoliciesConfigured,
    rlsValidated,
    apiProtectionStatus,
    overall,
    checkedAt: input.checkedAt ?? new Date().toISOString(),
  };
}

export function supabaseReadinessExposesSecrets(
  context: SupabaseSecurityReadinessContext,
): boolean {
  const raw = JSON.stringify(context).toLowerCase();
  return (
    raw.includes("service_role") ||
    raw.includes("api_key") ||
    raw.includes("secret") ||
    raw.includes("password")
  );
}
