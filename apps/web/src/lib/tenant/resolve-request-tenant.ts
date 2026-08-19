/**
 * Resolve active tenant slug from request headers / host.
 * Only registered product tenants — never an arbitrary filesystem path.
 */

import {
  LIFE_PANORAMICA_TENANT_SLUG,
  sanitizeTenantSlug,
} from "./ids";

export function resolveRequestTenantSlug(
  request: Request,
  fallback: string = LIFE_PANORAMICA_TENANT_SLUG,
): string {
  const header = sanitizeTenantSlug(
    request.headers.get("x-tenant-slug") ||
      request.headers.get("x-life-tenant"),
  );
  if (header) return header;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieTenant = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lcos-tenant-slug="))
    ?.slice("lcos-tenant-slug=".length);
  if (cookieTenant) {
    try {
      const fromCookie = sanitizeTenantSlug(
        decodeURIComponent(cookieTenant),
      );
      if (fromCookie) return fromCookie;
    } catch {
      const fromCookie = sanitizeTenantSlug(cookieTenant);
      if (fromCookie) return fromCookie;
    }
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host.startsWith("life-valley.") || host.includes("life-valley")) {
    return "life-valley";
  }
  if (host.startsWith("life-panoramica.") || host.includes("panoramica")) {
    return LIFE_PANORAMICA_TENANT_SLUG;
  }

  const fromEnv = sanitizeTenantSlug(
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG,
  );
  if (fromEnv) return fromEnv;

  return sanitizeTenantSlug(fallback) ?? LIFE_PANORAMICA_TENANT_SLUG;
}
