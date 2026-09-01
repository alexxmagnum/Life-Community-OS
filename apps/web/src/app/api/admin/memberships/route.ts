import { NextResponse } from "next/server";
import {
  coerceMembershipRole,
  isMembershipRole,
  type MembershipRole,
} from "@life-community-os/types";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { canAssignMembershipRole } from "@/lib/admin/permissions";
import {
  listMembershipDirectory,
  updateMembershipRole,
  updateMembershipStatus,
} from "@/lib/auth/ensure-domain-membership";
import {
  requireAdministrator,
  resolveRequestActor,
} from "@/lib/auth/request-actor";
import { createMembershipInvitationServer } from "@/lib/admin/server-admin-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase();
  const directory = await listMembershipDirectory(actor.tenantSlug, {
    includeInactive: true,
  });
  const members = directory
    .filter((row) => {
      if (!q) return true;
      const hay = `${row.identity?.displayName ?? ""} ${row.identity?.email ?? ""} ${row.membership.personId}`.toLowerCase();
      return hay.includes(q);
    })
    .map(({ membership, identity }) => ({
      membershipId: membership.id,
      personId: membership.personId,
      role: membership.role,
      status: membership.status,
      email: identity?.email ?? null,
      displayName: identity?.displayName ?? null,
      updatedAt: membership.updatedAt,
    }));
  return NextResponse.json({ tenantSlug: actor.tenantSlug, members });
}

export async function PATCH(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { personId?: string; role?: string; status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const personId = body.personId?.trim();
  if (!personId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const directory = await listMembershipDirectory(actor.tenantSlug, {
    includeInactive: true,
  });
  const current = directory.find((row) => row.membership.personId === personId);
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (body.role) {
    if (!isMembershipRole(body.role)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }
    const toRole = coerceMembershipRole(body.role);
    if (
      !canAssignMembershipRole({
        actorRole: actor.role,
        fromRole: current.membership.role,
        toRole,
      })
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const updated = await updateMembershipRole({
      tenantSlug: actor.tenantSlug,
      personId,
      role: toRole,
    });
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await recordAdminAudit({
      actor,
      action: "membership.role_change",
      entityType: "membership",
      entityId: updated.id,
      metadata: { from: current.membership.role, to: toRole },
    });
    return NextResponse.json({ membership: updated });
  }

  if (
    body.status === "inactive" ||
    body.status === "ended" ||
    body.status === "active" ||
    body.status === "pending" ||
    body.status === "invited" ||
    body.status === "suspended" ||
    body.status === "removed"
  ) {
    const updated = await updateMembershipStatus({
      tenantSlug: actor.tenantSlug,
      personId,
      status: body.status,
    });
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await recordAdminAudit({
      actor,
      action: "membership.block",
      entityType: "membership",
      entityId: updated.id,
      metadata: { status: body.status },
    });
    return NextResponse.json({ membership: updated });
  }

  return NextResponse.json({ error: "invalid_body" }, { status: 400 });
}

export async function POST(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor) || !actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { email?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const role: MembershipRole =
    body.role && isMembershipRole(body.role) && body.role !== "administrator"
      ? body.role
      : "member";
  const invitation = await createMembershipInvitationServer({
    tenantId: actor.tenantSlug,
    email,
    role,
    invitedBy: actor.personId,
  });
  await recordAdminAudit({
    actor,
    action: "membership.invite",
    entityType: "person",
    entityId: invitation.id,
    metadata: { email, role },
  });
  return NextResponse.json({ invitation }, { status: 201 });
}
