/**
 * Server Housing persistence — created listings + overrides + contact intents.
 * Postgres tenant_documents when configured; .data fixture in development only.
 */

import type {
  HousingContactIntent,
  HousingListing,
} from "@life-community-os/types";
import {
  readTenantDocument,
  writeTenantDocument,
  type DocumentScope,
} from "@/lib/data/tenant-document-store";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type HousingTenantState = {
  created: HousingListing[];
  overrides: Record<string, Partial<HousingListing>>;
  contacts: HousingContactIntent[];
};

export type HousingScope = DocumentScope;

const emptyState = (): HousingTenantState => ({
  created: [],
  overrides: {},
  contacts: [],
});

const DOC_KEY = "housing:state";

export async function readHousingState(
  tenantId: string,
  scope?: HousingScope,
): Promise<HousingTenantState> {
  const slug = resolveTenantPublicId(tenantId);
  const parsed = await readTenantDocument<HousingTenantState>(
    slug,
    DOC_KEY,
    scope,
  );
  if (!parsed) return emptyState();
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    overrides:
      parsed.overrides && typeof parsed.overrides === "object"
        ? parsed.overrides
        : {},
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
  };
}

export async function writeHousingState(
  tenantId: string,
  state: HousingTenantState,
  scope?: HousingScope,
): Promise<HousingTenantState> {
  const slug = resolveTenantPublicId(tenantId);
  const next: HousingTenantState = {
    created: state.created ?? [],
    overrides: state.overrides ?? {},
    contacts: state.contacts ?? [],
  };
  await writeTenantDocument(slug, DOC_KEY, next, scope);
  return next;
}
