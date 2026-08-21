import { NextResponse } from "next/server";
import {
  deleteMediaServer,
  getMediaAssetServer,
} from "@/lib/media/server-media-repository";
import { mediaErrorResponse } from "@/lib/media/http";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const { id } = await context.params;
  const url = new URL(request.url);
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: url.searchParams.get("tenantId"),
    actorTenantSlug: actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  try {
    const result = await getMediaAssetServer({
      tenantId: bound.tenantId,
      actor,
      mediaId: id,
      scope,
    });
    return NextResponse.json({
      asset: result.asset,
      references: result.references,
      url: result.url,
    });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const { id } = await context.params;
  let body: {
    tenantId?: string;
    entityType?: string;
    entityId?: string;
    purpose?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.entityType || !body.entityId || !body.purpose) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  try {
    const { linkMediaReferenceServer } = await import(
      "@/lib/media/server-media-repository"
    );
    const reference = await linkMediaReferenceServer({
      tenantId: bound.tenantId,
      actor: gated.actor,
      mediaId: id,
      entityType: body.entityType,
      entityId: body.entityId,
      purpose: body.purpose,
      scope,
    });
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const { id } = await context.params;
  let bodyTenantId: string | undefined;
  try {
    const body = (await request.json()) as { tenantId?: string };
    bodyTenantId = body.tenantId;
  } catch {
    bodyTenantId = undefined;
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  try {
    const asset = await deleteMediaServer({
      tenantId: bound.tenantId,
      actor: gated.actor,
      mediaId: id,
      scope,
    });
    return NextResponse.json({ asset });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
