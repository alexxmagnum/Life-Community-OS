import { NextResponse } from "next/server";
import { PRODUCT_CAPABILITY_KEYS } from "@life-community-os/types";
import {
  actorCanAccessSection,
  actorCanUpdateTenantSettings,
} from "@/lib/admin/permissions";
import {
  getTenantOperationsSettingsServer,
  recordAdminAudit,
  upsertTenantOperationsSettingsServer,
} from "@/lib/admin/server-admin-repository";
import { resolveTenantContract } from "@/lib/tenant/admin-tenant";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanAccessSection(actor, "settings")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const contract = resolveTenantContract(bound.tenantId);
  const overlay = await getTenantOperationsSettingsServer(bound.tenantId, scope);
  return NextResponse.json({
    contract: {
      slug: contract.slug,
      name: contract.name,
      branding: contract.branding,
      locale: overlay?.locale ?? contract.locale,
      timezone: overlay?.timezone ?? contract.timezone,
      capabilities: {
        ...contract.capabilities,
        ...overlay?.capabilities,
      },
      contactEmail: overlay?.contactEmail ?? null,
      contactPhone: overlay?.contactPhone ?? null,
    },
    overlay,
    capabilityKeys: PRODUCT_CAPABILITY_KEYS,
  });
}

export async function PATCH(request: Request) {
  const { requireAdministratorMutation } = await import("@/lib/auth/mutation-gate");
  const gated = await requireAdministratorMutation(request);
  if ("error" in gated) return gated.error;
  if (!actorCanUpdateTenantSettings(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    brandingName?: string;
    tagline?: string;
    primaryColor?: string;
    locale?: string;
    timezone?: string;
    contactEmail?: string;
    contactPhone?: string;
    capabilities?: Record<string, boolean>;
    slug?: string;
    name?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.slug || body.name) {
    return NextResponse.json({ error: "identity_immutable" }, { status: 403 });
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
  const settings = await upsertTenantOperationsSettingsServer({
    tenantId: bound.tenantId,
    actor: gated.actor,
    patch: {
      brandingName: body.brandingName,
      tagline: body.tagline,
      primaryColor: body.primaryColor,
      locale: body.locale,
      timezone: body.timezone,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      capabilities: body.capabilities,
    },
    scope,
  });
  await recordAdminAudit({
    actor: gated.actor,
    action: "settings.update",
    entityType: "tenant_settings",
    entityId: bound.tenantId,
    scope,
  });
  return NextResponse.json({ settings });
}
