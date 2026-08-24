import { NextResponse } from "next/server";
import { actorCanUploadMedia } from "@/lib/media/permissions";
import { uploadMediaServer } from "@/lib/media/server-media-repository";
import { mediaErrorResponse } from "@/lib/media/http";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanUploadMedia(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let filename = "file";
  let mimeType = "application/octet-stream";
  let bytes: Uint8Array = new Uint8Array();
  let type: string | undefined;
  let tenantId: string | undefined;
  let storageKeyFromClient: string | null = null;
  let entityType: string | undefined;
  let entityId: string | undefined;
  let purpose: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    filename = file.name || "file";
    mimeType = file.type || "application/octet-stream";
    bytes = new Uint8Array(await file.arrayBuffer());
    type = String(form.get("type") ?? "") || undefined;
    tenantId = String(form.get("tenantId") ?? "") || undefined;
    storageKeyFromClient = String(form.get("storageKey") ?? "") || null;
    entityType = String(form.get("entityType") ?? "") || undefined;
    entityId = String(form.get("entityId") ?? "") || undefined;
    purpose = String(form.get("purpose") ?? "") || undefined;
  } else {
    return NextResponse.json({ error: "multipart_required" }, { status: 415 });
  }

  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);

  try {
    const result = await uploadMediaServer({
      tenantId: bound.tenantId,
      actor: gated.actor,
      filename,
      mimeType,
      bytes,
      type,
      storageKeyFromClient,
      entityType,
      entityId,
      purpose,
      scope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
