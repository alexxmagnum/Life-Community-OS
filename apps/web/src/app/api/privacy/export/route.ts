import { NextResponse } from "next/server";
import { PRIVACY_ACCESS_DENIED } from "@life-community-os/types";
import { PrivacyGovernanceRuntime } from "@/lib/privacy/privacy-governance-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  if (url.searchParams.get("personId") && url.searchParams.get("personId") !== actor.personId) {
    return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  try {
    const exported = PrivacyGovernanceRuntime.exportPersonal({
      actor,
      tenantId: bound.tenantId,
    });
    return NextResponse.json({ export: exported });
  } catch (error) {
    if (error instanceof Error && error.message === PRIVACY_ACCESS_DENIED) {
      return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
    }
    throw error;
  }
}
