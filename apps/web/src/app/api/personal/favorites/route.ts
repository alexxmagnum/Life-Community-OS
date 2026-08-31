import { NextResponse } from "next/server";
import { isPersonalFavoriteKind } from "@life-community-os/types";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import {
  listPersonalFavoritesServer,
  togglePersonalFavoriteServer,
} from "@/lib/personal/server-personal-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanReadCommunityExperienceFeed(actor) || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  if (url.searchParams.get("personId") && url.searchParams.get("personId") !== actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const favorites = await listPersonalFavoritesServer({
    tenantId: bound.tenantId,
    personId: actor.personId,
  });
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    kind?: string;
    targetId?: string;
    personId?: string;
    createdBy?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy || body.ownerId || body.personId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  if (!isPersonalFavoriteKind(body.kind ?? "") || !body.targetId?.trim()) {
    return NextResponse.json({ error: "invalid_favorite" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const result = await togglePersonalFavoriteServer({
    tenantId: bound.tenantId,
    personId: gated.actor.personId!,
    kind: body.kind!,
    targetId: body.targetId,
  });
  return NextResponse.json(result);
}
