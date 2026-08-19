import { NextResponse } from "next/server";
import {
  requireAdministrator,
  resolveRequestActor,
} from "@/lib/auth/request-actor";
import { listTenantAdminSnapshots } from "@/lib/tenant/admin-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ tenants: listTenantAdminSnapshots() });
}
