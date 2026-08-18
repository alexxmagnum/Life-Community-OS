import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnforced, isAuthConfigured } from "@life-community-os/auth";
import { LIFE_PANORAMICA_TENANT_SLUG } from "@/lib/tenant/ids";

/**
 * Request gate — bind tenant slug; optionally require Supabase session.
 * Keep this Edge-safe: no tenant pack imports.
 */

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/geocode",
  "/api/auth",
  "/api/locations",
  "/_next",
  "/favicon",
  "/assets",
  "/tenants",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function resolveTenantSlug(request: NextRequest): string {
  const header = request.headers.get("x-tenant-slug")?.trim().toLowerCase();
  if (header) return header;
  const query = request.nextUrl.searchParams.get("tenant")?.trim().toLowerCase();
  if (query) return query;
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  return LIFE_PANORAMICA_TENANT_SLUG;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tenantSlug = resolveTenantSlug(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug);

  if (isPublicPath(pathname)) {
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.headers.set("x-tenant-slug", tenantSlug);
    return res;
  }

  if (isAuthEnforced() && isAuthConfigured()) {
    const accessToken = request.cookies.get("lcos-access-token")?.value;
    if (!accessToken) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-tenant-slug", tenantSlug);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
