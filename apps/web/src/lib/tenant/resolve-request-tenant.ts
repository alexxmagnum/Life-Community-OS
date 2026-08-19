/**
 * Host / header / cookie → registered tenant slug.
 * Host matching uses the tenant manifest (no per-tenant if trees).
 */

import { resolveHostHintToSlug } from "@life-community-os/types";
import { defaultTenantSlug, TENANT_MANIFEST } from "./manifest";
import { sanitizeTenantSlug } from "./ids";

export function resolveRequestTenantSlug(
  request: Request,
  fallback: string = defaultTenantSlug(),
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
      const fromCookie = sanitizeTenantSlug(decodeURIComponent(cookieTenant));
      if (fromCookie) return fromCookie;
    } catch {
      const fromCookie = sanitizeTenantSlug(cookieTenant);
      if (fromCookie) return fromCookie;
    }
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const fromHost = sanitizeTenantSlug(
    resolveHostHintToSlug(host, TENANT_MANIFEST),
  );
  if (fromHost) return fromHost;

  const fromEnv = sanitizeTenantSlug(
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG,
  );
  if (fromEnv) return fromEnv;

  return sanitizeTenantSlug(fallback) ?? defaultTenantSlug();
}
