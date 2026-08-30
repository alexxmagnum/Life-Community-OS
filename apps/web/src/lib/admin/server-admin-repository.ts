/**
 * Admin Operations repository — audit, settings overlay, invites, territory assets.
 *
 * Production: PostgreSQL admin_* tables.
 * Tests / dev fixture: apps/web/.data/admin when LCOS_ADMIN_FIXTURE=1.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createAdminAuditLog,
  type AdminAuditLog,
  type MembershipInvitation,
  type TenantOperationsSettings,
  type TerritoryAssetAssignment,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import type { RequestActor } from "@/lib/auth/request-actor";

export type AdminWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

type AdminStore = {
  audit: AdminAuditLog[];
  settings: TenantOperationsSettings | null;
  invitations: MembershipInvitation[];
  territoryAssignments: TerritoryAssetAssignment[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "admin");

function fixtureEnabled(): boolean {
  return process.env.LCOS_ADMIN_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): AdminStore {
  return {
    audit: [],
    settings: null,
    invitations: [],
    territoryAssignments: [],
  };
}

function fileStoreEnabled(): boolean {
  return isFilePersistenceAllowed() && (fixtureEnabled() || !isDatabaseConfigured());
}

async function readFileStore(tenantSlug: string): Promise<AdminStore> {
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminStore>;
    return {
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      settings: parsed.settings ?? null,
      invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
      territoryAssignments: Array.isArray(parsed.territoryAssignments)
        ? parsed.territoryAssignments
        : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(tenantSlug: string, store: AdminStore): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError("Admin write requires Postgres");
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2), "utf8");
}

export async function replaceAdminStoreForTests(tenantSlug: string): Promise<void> {
  await writeFileStore(resolveTenantPublicId(tenantSlug), emptyStore());
}

export async function recordAdminAudit(input: {
  actor: RequestActor;
  action: AdminAuditLog["action"];
  entityType: AdminAuditLog["entityType"];
  entityId: string;
  reason?: string;
  metadata?: AdminAuditLog["metadata"];
  scope?: AdminWriteScope;
}): Promise<AdminAuditLog | null> {
  if (!input.actor.personId || !input.actor.role) return null;
  const slug = resolveTenantPublicId(input.actor.tenantSlug);
  const entry = createAdminAuditLog({
    tenantId: slug,
    actorPersonId: input.actor.personId,
    actorRole: input.actor.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    reason: input.reason,
    metadata: input.metadata,
  });

  if (fileStoreEnabled()) {
    const store = await readFileStore(slug);
    store.audit = [entry, ...store.audit];
    await writeFileStore(slug, store);
    return entry;
  }

  const client = await createDomainDatabaseClient(input.scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (!client || !tenantUuid) return entry;
  const { error } = await client.from("admin_audit_logs").insert({
    id: entry.id,
    tenant_id: tenantUuid,
    created_by: entry.actorPersonId,
    actor_person_id: entry.actorPersonId,
    actor_role: entry.actorRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.warn("[admin] audit insert failed", error.message);
  }
  return entry;
}

export async function listAdminAuditServer(
  tenantId: string,
  scope?: AdminWriteScope,
): Promise<AdminAuditLog[]> {
  const slug = resolveTenantPublicId(tenantId);
  if (fileStoreEnabled()) {
    const store = await readFileStore(slug);
    return store.audit.filter((item) => item.tenantId === slug);
  }
  const client = await createDomainDatabaseClient(scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (!client || !tenantUuid) return [];
  const { data, error } = await client
    .from("admin_audit_logs")
    .select("*")
    .eq("tenant_id", tenantUuid)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    tenantId: slug,
    actorPersonId: row.actor_person_id as string,
    actorRole: row.actor_role as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    reason: (row.reason as string | null) ?? undefined,
    metadata: (row.metadata as AdminAuditLog["metadata"]) ?? undefined,
    createdAt: row.created_at as string,
  }));
}

export async function getTenantOperationsSettingsServer(
  tenantId: string,
  scope?: AdminWriteScope,
): Promise<TenantOperationsSettings | null> {
  const slug = resolveTenantPublicId(tenantId);
  if (fileStoreEnabled()) {
    return (await readFileStore(slug)).settings;
  }
  const client = await createDomainDatabaseClient(scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (!client || !tenantUuid) return null;
  const { data } = await client
    .from("tenant_operation_settings")
    .select("*")
    .eq("tenant_id", tenantUuid)
    .maybeSingle();
  if (!data) return null;
  return {
    tenantId: slug,
    brandingName: data.branding_name ?? undefined,
    tagline: data.tagline ?? undefined,
    primaryColor: data.primary_color ?? undefined,
    locale: data.locale ?? undefined,
    timezone: data.timezone ?? undefined,
    contactEmail: data.contact_email ?? undefined,
    contactPhone: data.contact_phone ?? undefined,
    capabilities: (data.capabilities as TenantOperationsSettings["capabilities"]) ?? undefined,
    updatedAt: data.updated_at as string,
    updatedBy: data.created_by as string,
  };
}

export async function upsertTenantOperationsSettingsServer(input: {
  tenantId: string;
  actor: RequestActor;
  patch: Partial<Omit<TenantOperationsSettings, "tenantId" | "updatedAt" | "updatedBy">>;
  scope?: AdminWriteScope;
}): Promise<TenantOperationsSettings> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const current = await getTenantOperationsSettingsServer(slug, input.scope);
  const next: TenantOperationsSettings = {
    tenantId: slug,
    brandingName: input.patch.brandingName ?? current?.brandingName,
    tagline: input.patch.tagline ?? current?.tagline,
    primaryColor: input.patch.primaryColor ?? current?.primaryColor,
    locale: input.patch.locale ?? current?.locale,
    timezone: input.patch.timezone ?? current?.timezone,
    contactEmail: input.patch.contactEmail ?? current?.contactEmail,
    contactPhone: input.patch.contactPhone ?? current?.contactPhone,
    capabilities: input.patch.capabilities ?? current?.capabilities,
    updatedAt: now,
    updatedBy: input.actor.personId ?? "unknown",
  };

  if (fileStoreEnabled()) {
    const store = await readFileStore(slug);
    store.settings = next;
    await writeFileStore(slug, store);
    return next;
  }

  const client = await createDomainDatabaseClient(input.scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (client && tenantUuid) {
    await client.from("tenant_operation_settings").upsert({
      tenant_id: tenantUuid,
      created_by: next.updatedBy,
      branding_name: next.brandingName ?? null,
      tagline: next.tagline ?? null,
      primary_color: next.primaryColor ?? null,
      locale: next.locale ?? null,
      timezone: next.timezone ?? null,
      contact_email: next.contactEmail ?? null,
      contact_phone: next.contactPhone ?? null,
      capabilities: next.capabilities ?? {},
      updated_at: now,
    });
  }
  return next;
}

export async function createMembershipInvitationServer(input: {
  tenantId: string;
  email: string;
  role: MembershipInvitation["role"];
  invitedBy: string;
  scope?: AdminWriteScope;
}): Promise<MembershipInvitation> {
  const slug = resolveTenantPublicId(input.tenantId);
  const invitation: MembershipInvitation = {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `inv-${Date.now().toString(36)}`,
    tenantId: slug,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    invitedBy: input.invitedBy,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (fileStoreEnabled()) {
    const store = await readFileStore(slug);
    store.invitations = [invitation, ...store.invitations];
    await writeFileStore(slug, store);
    return invitation;
  }
  const client = await createDomainDatabaseClient(input.scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (client && tenantUuid) {
    await client.from("membership_invitations").insert({
      id: invitation.id,
      tenant_id: tenantUuid,
      created_by: invitation.invitedBy,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    });
  }
  return invitation;
}

export async function listMembershipInvitationsServer(
  tenantId: string,
  scope?: AdminWriteScope,
): Promise<MembershipInvitation[]> {
  const slug = resolveTenantPublicId(tenantId);
  if (fileStoreEnabled()) {
    return (await readFileStore(slug)).invitations;
  }
  const client = await createDomainDatabaseClient(scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (!client || !tenantUuid) return [];
  const { data } = await client
    .from("membership_invitations")
    .select("*")
    .eq("tenant_id", tenantUuid);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    tenantId: slug,
    email: row.email as string,
    role: row.role as MembershipInvitation["role"],
    invitedBy: row.created_by as string,
    status: row.status as MembershipInvitation["status"],
    createdAt: row.created_at as string,
  }));
}

export async function listTerritoryAssetAssignmentsServer(
  tenantId: string,
  scope?: AdminWriteScope,
): Promise<TerritoryAssetAssignment[]> {
  const slug = resolveTenantPublicId(tenantId);
  if (fileStoreEnabled()) {
    return (await readFileStore(slug)).territoryAssignments;
  }
  const client = await createDomainDatabaseClient(scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (!client || !tenantUuid) return [];
  const { data } = await client
    .from("territory_object_asset_assignments")
    .select("*")
    .eq("tenant_id", tenantUuid);
  return (data ?? []).map((row) => ({
    tenantId: slug,
    territoryObjectId: row.territory_object_id as string,
    spatialAssetId: row.spatial_asset_id as string,
    updatedAt: row.updated_at as string,
    updatedBy: row.created_by as string,
  }));
}

export async function assignTerritorySpatialAssetServer(input: {
  tenantId: string;
  territoryObjectId: string;
  spatialAssetId: string;
  actor: RequestActor;
  scope?: AdminWriteScope;
}): Promise<TerritoryAssetAssignment> {
  const slug = resolveTenantPublicId(input.tenantId);
  const assignment: TerritoryAssetAssignment = {
    tenantId: slug,
    territoryObjectId: input.territoryObjectId,
    spatialAssetId: input.spatialAssetId,
    updatedAt: new Date().toISOString(),
    updatedBy: input.actor.personId ?? "unknown",
  };
  if (fileStoreEnabled()) {
    const store = await readFileStore(slug);
    store.territoryAssignments = [
      assignment,
      ...store.territoryAssignments.filter(
        (item) => item.territoryObjectId !== assignment.territoryObjectId,
      ),
    ];
    await writeFileStore(slug, store);
    return assignment;
  }
  const client = await createDomainDatabaseClient(input.scope);
  const tenantUuid = tenantSlugToUuid(slug);
  if (client && tenantUuid) {
    await client.from("territory_object_asset_assignments").upsert({
      tenant_id: tenantUuid,
      territory_object_id: assignment.territoryObjectId,
      spatial_asset_id: assignment.spatialAssetId,
      created_by: assignment.updatedBy,
      updated_at: assignment.updatedAt,
    });
  }
  return assignment;
}
