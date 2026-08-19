/**
 * One-shot import of development `.data` fixtures into Postgres.
 * Does not run at request time. Usage:
 *   pnpm --filter @life-community-os/web migrate:files
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createServiceDatabaseClient } from "@life-community-os/database";
import { isDatabaseConfigured } from "../src/lib/data/data-plane";
import { tenantSlugToUuid } from "../src/lib/tenant/ids";

const ROOT = path.join(process.cwd(), ".data");

async function readJson(file: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.error("Database is not configured; nothing to import.");
    process.exit(1);
  }
  const client = createServiceDatabaseClient();
    const tenants = ["life-panoramica", "life-valley", "life-ocean-hills"];

  for (const slug of tenants) {
    const tenantUuid = tenantSlugToUuid(slug);
    if (!tenantUuid) continue;

    const locations = (await readJson(
      path.join(ROOT, "locations", `${slug}.json`),
    )) as Array<Record<string, unknown>> | null;
    if (Array.isArray(locations)) {
      for (const loc of locations) {
        const { error } = await client.from("locations").upsert({
          id: String(loc.id),
          tenant_id: tenantUuid,
          type: loc.type,
          name: loc.name,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          category: loc.category,
          visibility: loc.visibility ?? "public",
          geocode_provider: loc.geocodeProvider ?? null,
          geocode_source_ref: loc.geocodeSourceRef ?? null,
          geocode_display_name: loc.geocodeDisplayName ?? null,
          contact: loc.contact ?? null,
          summary: loc.summary ?? null,
          image_url: loc.imageUrl ?? null,
          hours: loc.hours ?? null,
          area_label: loc.areaLabel ?? null,
          owner_id: loc.ownerId ?? null,
          created_by: loc.createdBy ?? null,
        } as never);
        if (error) console.warn(`[import] location ${loc.id}`, error.message);
      }
      console.log(`[import] ${slug} locations: ${locations.length}`);
    }

    const housing = await readJson(path.join(ROOT, "housing", `${slug}.json`));
    if (housing) {
      const { error } = await client.from("tenant_documents").upsert({
        tenant_id: tenantUuid,
        doc_key: "housing:state",
        payload: housing,
      } as never);
      if (error) console.warn(`[import] housing ${slug}`, error.message);
      else console.log(`[import] ${slug} housing`);
    }

    for (const domain of [
      "community",
      "experiences",
      "marketplace",
      "resources",
    ]) {
      const items = await readJson(
        path.join(ROOT, "catalog", slug, `${domain}.json`),
      );
      if (!items) continue;
      const { error } = await client.from("tenant_documents").upsert({
        tenant_id: tenantUuid,
        doc_key: `catalog:${domain}`,
        payload: items,
      } as never);
      if (error) console.warn(`[import] catalog ${slug}/${domain}`, error.message);
      else console.log(`[import] ${slug} catalog:${domain}`);
    }

    const durableDir = path.join(ROOT, "durable", slug);
    try {
      const files = await fs.readdir(durableDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const key = file.replace(/\.json$/, "");
        const payload = await readJson(path.join(durableDir, file));
        const { error } = await client.from("tenant_documents").upsert({
          tenant_id: tenantUuid,
          doc_key: `durable:${key}`,
          payload: payload ?? {},
        } as never);
        if (error) console.warn(`[import] durable ${slug}/${key}`, error.message);
        else console.log(`[import] ${slug} durable:${key}`);
      }
    } catch {
      // no durable dir
    }
  }

  console.log("Import finished. Memberships are created on register/join, not copied from file person-* ids.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
