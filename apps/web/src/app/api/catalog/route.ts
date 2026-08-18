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
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

function isDomain(value: string): value is CatalogDomain {
  return (CATALOG_DOMAINS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
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

  const tenantId = resolveTenantPublicId(
    body.tenantId ||
      resolveRequestTenantSlug(request) ||
      gated.actor.tenantSlug,
  );
  await writeCatalog(tenantId, body.domain, body.items);
  return NextResponse.json({
    tenantId,
    domain: body.domain,
    count: body.items.length,
  });
}
