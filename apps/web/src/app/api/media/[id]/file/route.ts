import { NextResponse } from "next/server";
import { readMediaBytesServer } from "@/lib/media/server-media-repository";
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
    const result = await readMediaBytesServer({
      tenantId: bound.tenantId,
      actor,
      mediaId: id,
      scope,
    });
    return new NextResponse(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": result.asset.mimeType,
        "Content-Length": String(result.bytes.byteLength),
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${result.asset.filename}"`,
      },
    });
  } catch (error) {
    return mediaErrorResponse(error);
  }
}
