/**
 * Resolve active tenant slug from request headers / host.
 * Panorámica is the default registered tenant — never the platform itself.
 */

import { LIFE_PANORAMICA_TENANT_SLUG } from "./ids";

export function resolveRequestTenantSlug(
  request: Request,
  fallback: string = LIFE_PANORAMICA_TENANT_SLUG,
): string {
  const header =
    request.headers.get("x-tenant-slug")?.trim().toLowerCase() ||
    request.headers.get("x-life-tenant")?.trim().toLowerCase();
  if (header) return header;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieTenant = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lcos-tenant-slug="))
    ?.slice("lcos-tenant-slug=".length);
  if (cookieTenant) {
    try {
      return decodeURIComponent(cookieTenant).toLowerCase();
    } catch {
      return cookieTenant.toLowerCase();
    }
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host.startsWith("life-valley.") || host.includes("life-valley")) {
    return "life-valley";
  }
  if (host.startsWith("life-panoramica.") || host.includes("panoramica")) {
    return LIFE_PANORAMICA_TENANT_SLUG;
  }

  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim().toLowerCase();
  if (fromEnv) return fromEnv;

  return fallback;
}
