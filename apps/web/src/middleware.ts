import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnforced, isAuthConfigured } from "@life-community-os/auth";
import { LIFE_PANORAMICA_TENANT_SLUG } from "@/lib/tenant/ids";

/**
 * Request gate — bind tenant slug; optionally require Supabase session.
 * Keep this Edge-safe: no tenant pack imports.
 */

/** Always reachable (auth UX + static). */
const ALWAYS_PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth",
  "/_next",
  "/favicon",
  "/assets",
  "/tenants",
];

/**
 * Pilot-only anonymous API surface.
 * When `LCOS_AUTH_REQUIRED=true`, these require a session (cutover).
 */
const PILOT_PUBLIC_API_PREFIXES = [
  "/api/geocode",
  "/api/locations",
  "/api/housing",
  "/api/durable",
  "/api/catalog",
];

function isAlwaysPublicPath(pathname: string): boolean {
  return ALWAYS_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPilotPublicApi(pathname: string): boolean {
  return PILOT_PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function resolveTenantSlug(request: NextRequest): string {
  const header = request.headers.get("x-tenant-slug")?.trim().toLowerCase();
  if (header) return header;
  const cookie = request.cookies.get("lcos-tenant-slug")?.value?.trim().toLowerCase();
  if (cookie) return cookie;
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

  const authEnforced = isAuthEnforced() && isAuthConfigured();
  const publicPath =
    isAlwaysPublicPath(pathname) ||
    (!authEnforced && isPilotPublicApi(pathname));

  if (publicPath) {
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.headers.set("x-tenant-slug", tenantSlug);
    return res;
  }

  if (authEnforced) {
    const accessToken = request.cookies.get("lcos-access-token")?.value;
    if (!accessToken) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
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
