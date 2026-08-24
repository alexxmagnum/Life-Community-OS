import { randomUUID } from "node:crypto";
import { PersistenceUnavailableError, isDatabaseConfigured } from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import { tenantSlugToUuid } from "@/lib/tenant/ids";
import type { RequestActor } from "@/lib/auth/request-actor";

export type IncidentStatus = "open" | "reviewing" | "resolved" | "closed";
export type IncidentPriority = "low" | "normal" | "high" | "urgent";
export type Incident = {
  id: string;
  tenantId: string;
  createdBy: string;
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  description: string;
  locationId?: string;
  attachmentIds: string[];
  createdAt: string;
  updatedAt: string;
};

type Scope = { accessToken?: string | null; personId?: string | null };
type Row = Record<string, unknown>;

function fromRow(row: Row, tenantSlug: string): Incident {
  return {
    id: String(row.id),
    tenantId: tenantSlug,
    createdBy: String(row.created_by),
    category: String(row.category),
    priority: row.priority as IncidentPriority,
    status: row.status as IncidentStatus,
    description: String(row.description),
    ...(typeof row.location_id === "string" && row.location_id
      ? { locationId: row.location_id }
      : {}),
    attachmentIds: Array.isArray(row.attachment_ids)
      ? row.attachment_ids.filter((value): value is string => typeof value === "string")
      : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function database(tenantSlug: string, scope: Scope) {
  if (!isDatabaseConfigured()) throw new PersistenceUnavailableError("incidents");
  const tenantId = tenantSlugToUuid(tenantSlug);
  const client = await createDomainDatabaseClient(scope);
  if (!tenantId || !client) throw new PersistenceUnavailableError("incidents");
  return { client, tenantId };
}

export async function listIncidents(
  tenantSlug: string,
  actor: RequestActor,
  scope: Scope,
): Promise<Incident[]> {
  const { client, tenantId } = await database(tenantSlug, scope);
  let query = client.from("incidents").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (actor.role !== "administrator" && actor.role !== "moderator") {
    query = query.eq("created_by", actor.personId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => fromRow(row, tenantSlug));
}

export async function createIncident(input: {
  tenantSlug: string;
  actor: RequestActor;
  category: string;
  priority: IncidentPriority;
  description: string;
  locationId?: string;
  attachmentIds?: string[];
  scope: Scope;
}): Promise<Incident> {
  const { client, tenantId } = await database(input.tenantSlug, input.scope);
  const id = `incident-${randomUUID()}`;
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("incidents")
    .insert({
      id,
      tenant_id: tenantId,
      created_by: input.actor.personId,
      category: input.category,
      priority: input.priority,
      status: "open",
      description: input.description,
      location_id: input.locationId ?? null,
      attachment_ids: input.attachmentIds ?? [],
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as Row, input.tenantSlug);
}
