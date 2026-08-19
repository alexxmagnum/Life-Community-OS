import { NextResponse } from "next/server";
import {
  resolveAuthSession,
  sessionPayload,
} from "@/lib/auth/resolve-session";
import { AUTH_COOKIE, setAuthCookie } from "@/lib/auth/session-cookies";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await resolveAuthSession(request);
  const payload = sessionPayload(session);
  const response = NextResponse.json(payload);
  if (payload.tenantSlug) {
    setAuthCookie(response, AUTH_COOKIE.tenant, payload.tenantSlug, 60 * 60 * 24 * 30, false);
  }
  return response;
}
