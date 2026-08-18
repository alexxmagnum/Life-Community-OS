/**
 * Server Housing persistence — created listings + overrides + contact intents.
 * Survives browser/device when Supabase is not yet wired for Housing.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  HousingContactIntent,
  HousingListing,
} from "@life-community-os/types";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type HousingTenantState = {
  created: HousingListing[];
  overrides: Record<string, Partial<HousingListing>>;
  contacts: HousingContactIntent[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "housing");

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

const emptyState = (): HousingTenantState => ({
  created: [],
  overrides: {},
  contacts: [],
});

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readHousingState(
  tenantId: string,
): Promise<HousingTenantState> {
  const slug = resolveTenantPublicId(tenantId);
  try {
    const raw = await fs.readFile(filePath(slug), "utf8");
    const parsed = JSON.parse(raw) as HousingTenantState;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === "object"
          ? parsed.overrides
          : {},
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
    };
  } catch {
    return emptyState();
  }
}

export async function writeHousingState(
  tenantId: string,
  state: HousingTenantState,
): Promise<HousingTenantState> {
  const slug = resolveTenantPublicId(tenantId);
  await ensureDir();
  const next: HousingTenantState = {
    created: state.created ?? [],
    overrides: state.overrides ?? {},
    contacts: state.contacts ?? [],
  };
  await fs.writeFile(filePath(slug), JSON.stringify(next, null, 2), "utf8");
  return next;
}
