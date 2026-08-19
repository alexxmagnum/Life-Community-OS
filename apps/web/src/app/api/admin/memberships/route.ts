import { NextResponse } from "next/server";
import { coerceMembershipRole } from "@life-community-os/types";
import {
  listFileMembershipDirectory,
  updateFileMembershipRole,
} from "@/lib/auth/membership-store";
import {
  requireAdministrator,
  resolveRequestActor,
} from "@/lib/auth/request-actor";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const tenantSlug = actor.tenantSlug;
  const directory = await listFileMembershipDirectory(tenantSlug);
  return NextResponse.json({
    tenantSlug,
    members: directory.map(({ membership, identity }) => ({
      membershipId: membership.id,
      personId: membership.personId,
      role: membership.role,
      status: membership.status,
      email: identity?.email ?? null,
      displayName: identity?.displayName ?? null,
      updatedAt: membership.updatedAt,
    })),
  });
}

export async function PATCH(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { personId?: string; role?: string };
  try {
    body = (await request.json()) as { personId?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const personId = body.personId?.trim();
  if (!personId || !body.role) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const tenantSlug = actor.tenantSlug;
  const updated = await updateFileMembershipRole({
    tenantSlug,
    personId,
    role: coerceMembershipRole(body.role),
  });
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ membership: updated });
}
