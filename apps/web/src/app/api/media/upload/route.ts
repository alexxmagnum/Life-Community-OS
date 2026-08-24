import { NextResponse } from "next/server";
import { actorCanUploadMedia } from "@/lib/media/permissions";
import { uploadMediaServer } from "@/lib/media/server-media-repository";
import { mediaErrorResponse } from "@/lib/media/http";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

async function bytesFromBase64(contentBase64: string): Promise<Uint8Array> {
  return Uint8Array.from(Buffer.from(contentBase64, "base64"));
}

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
    let body: {
      filename?: string;
      mimeType?: string;
      type?: string;
      contentBase64?: string;
      tenantId?: string;
      storageKey?: string;
      entityType?: string;
      entityId?: string;
      purpose?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
    if (!body.contentBase64) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    filename = body.filename ?? "file";
    mimeType = body.mimeType ?? "application/octet-stream";
    bytes = await bytesFromBase64(body.contentBase64);
    type = body.type;
    tenantId = body.tenantId;
    storageKeyFromClient = body.storageKey ?? null;
    entityType = body.entityType;
    entityId = body.entityId;
    purpose = body.purpose;
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
