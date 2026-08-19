import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/lib/auth/mutation-gate";
import {
  bootstrapAllCatalogs,
  bootstrapTenantCatalog,
} from "@/lib/catalog/bootstrap-catalog";
import {
  CATALOG_DOMAINS,
  writeCatalog,
  type CatalogDomain,
} from "@/lib/catalog/server-catalog-repository";

export const runtime = "nodejs";

function isDomain(value: string): value is CatalogDomain {
  return (CATALOG_DOMAINS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;
  const domainParam = url.searchParams.get("domain");

  if (!domainParam || domainParam === "all") {
    const catalogs = await bootstrapAllCatalogs(tenantId);
    return NextResponse.json({ tenantId, catalogs });
  }

  if (!isDomain(domainParam)) {
    return NextResponse.json({ error: "unknown_domain" }, { status: 400 });
  }

  const items = await bootstrapTenantCatalog(tenantId, domainParam);
  return NextResponse.json({ tenantId, domain: domainParam, items });
}

export async function PUT(request: Request) {
  const gated = await requireAdminMutation(request);
  if ("error" in gated) return gated.error;

  let body: {
    tenantId?: string;
    domain?: string;
    items?: unknown[];
  };
  try {
    body = (await request.json()) as {
      tenantId?: string;
      domain?: string;
      items?: unknown[];
    };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.domain || !isDomain(body.domain)) {
    return NextResponse.json({ error: "unknown_domain" }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const { resolveWriteTenantId } = await import(
    "@/lib/tenant/resolve-write-tenant"
  );
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  await writeCatalog(bound.tenantId, body.domain, body.items);
  return NextResponse.json({
    tenantId: bound.tenantId,
    domain: body.domain,
    count: body.items.length,
  });
}
