import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnforced, isAuthConfigured } from "@life-community-os/auth";
import {
  LIFE_PANORAMICA_TENANT_SLUG,
  sanitizeTenantSlug,
} from "@/lib/tenant/ids";

/**
 * Request gate — bind allowlisted tenant slug; optionally require session.
 * Keep this Edge-safe: no tenant pack imports.
 */

const ALWAYS_PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth",
  "/_next",
  "/favicon",
  "/assets",
  "/tenants",
];

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
  const header = sanitizeTenantSlug(request.headers.get("x-tenant-slug"));
  if (header) return header;
  const cookie = sanitizeTenantSlug(
    request.cookies.get("lcos-tenant-slug")?.value,
  );
  if (cookie) return cookie;
  const query = sanitizeTenantSlug(request.nextUrl.searchParams.get("tenant"));
  if (query) return query;
  const fromEnv = sanitizeTenantSlug(process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG);
  if (fromEnv) return fromEnv;
  return LIFE_PANORAMICA_TENANT_SLUG;
}

function isJwtUnexpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return false;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now() + 5000;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/dev" || pathname.startsWith("/dev/"))
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

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
    if (!accessToken || !isJwtUnexpired(accessToken)) {
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
