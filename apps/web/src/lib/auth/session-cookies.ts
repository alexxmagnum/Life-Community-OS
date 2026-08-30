/**
 * Auth cookie helpers — production cookies are Secure + HttpOnly.
 */

import type { NextResponse } from "next/server";

const isProd = () => process.env.NODE_ENV === "production";

export const AUTH_COOKIE = {
  access: "lcos-access-token",
  refresh: "lcos-refresh-token",
  localIdentity: "lcos-local-identity",
  tenant: "lcos-tenant-slug",
  territory: "lcos-territory-id",
} as const;

export function setAuthCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
  httpOnly = true,
): void {
  response.cookies.set(name, value, {
    httpOnly,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  for (const name of [
    AUTH_COOKIE.access,
    AUTH_COOKIE.refresh,
    AUTH_COOKIE.localIdentity,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
      path: "/",
      maxAge: 0,
    });
  }
}

export function selectedTerritoryIdFromRequest(request: Request): string | null {
  const header = request.headers.get("x-territory-id")?.trim();
  if (header) return header;
  return readCookie(request, AUTH_COOKIE.territory);
}

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return (
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}
