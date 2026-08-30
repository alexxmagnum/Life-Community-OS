/**
 * File-backed membership store — durable when Supabase is unavailable.
 * Same shape as DB memberships (person ↔ territory ↔ role).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveJoinRole } from "@life-community-os/auth";
import {
  coerceMembershipRole,
  type MembershipRole,
} from "@life-community-os/types";
import { isFilePersistenceAllowed } from "@/lib/data/data-plane";
import {
  REGISTERED_TENANT_SLUGS,
  resolveTenantPublicId,
  sanitizeTenantSlug,
} from "@/lib/tenant/ids";

export type StoredIdentity = {
  id: string;
  providerReference: string;
  personId: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
};

export type StoredMembership = {
  id: string;
  personId: string;
  tenantSlug: string;
  territoryId: string;
  role: MembershipRole;
  status: "active" | "inactive" | "ended";
  createdAt: string;
  updatedAt: string;
};

type MembershipFile = {
  identities: StoredIdentity[];
  memberships: StoredMembership[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "memberships");

function filePath(tenantSlug: string): string {
  const slug = sanitizeTenantSlug(tenantSlug);
  if (!slug) {
    throw new Error("unknown_tenant");
  }
  return path.join(DATA_DIR, `${slug}.json`);
}

async function readFile(tenantSlug: string): Promise<MembershipFile> {
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as MembershipFile;
    return {
      identities: Array.isArray(parsed.identities) ? parsed.identities : [],
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
    };
  } catch {
    return { identities: [], memberships: [] };
  }
}

async function writeFile(
  tenantSlug: string,
  data: MembershipFile,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new Error("file persistence disabled");
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(data, null, 2), "utf8");
}

function newId(prefix: string): string {
  const c = globalThis.crypto?.randomUUID?.();
  if (c) return `${prefix}-${c}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function findIdentityByProvider(
  tenantSlug: string,
  providerReference: string,
): Promise<StoredIdentity | null> {
  const slug = resolveTenantPublicId(tenantSlug);
  const data = await readFile(slug);
  return (
    data.identities.find((i) => i.providerReference === providerReference) ??
    null
  );
}

export async function findMembershipForPerson(
  tenantSlug: string,
  personId: string,
): Promise<StoredMembership | null> {
  const slug = resolveTenantPublicId(tenantSlug);
  const data = await readFile(slug);
  return (
    data.memberships.find(
      (m) => m.personId === personId && m.status === "active",
    ) ?? null
  );
}

export async function listMembershipsForProvider(
  providerReference: string,
): Promise<
  Array<{
    identity: StoredIdentity;
    membership: StoredMembership;
  }>
> {
  const results: Array<{
    identity: StoredIdentity;
    membership: StoredMembership;
  }> = [];
  for (const slug of REGISTERED_TENANT_SLUGS) {
    const data = await readFile(slug);
    const identity = data.identities.find(
      (i) => i.providerReference === providerReference,
    );
    if (!identity) continue;
    const membership = data.memberships.find(
      (m) => m.personId === identity.personId && m.status === "active",
    );
    if (!membership) continue;
    results.push({ identity, membership });
  }
  return results;
}

export async function upsertFileMembership(input: {
  tenantSlug: string;
  territoryId: string;
  providerReference: string;
  email: string | null;
  displayName: string | null;
  role?: MembershipRole;
}): Promise<{ identity: StoredIdentity; membership: StoredMembership }> {
  const slug = resolveTenantPublicId(input.tenantSlug);
  const data = await readFile(slug);
  const now = new Date().toISOString();
  let identity = data.identities.find(
    (i) => i.providerReference === input.providerReference,
  );
  if (!identity) {
    identity = {
      id: newId("id"),
      providerReference: input.providerReference,
      personId: newId("person"),
      email: input.email,
      displayName: input.displayName,
      createdAt: now,
    };
    data.identities.push(identity);
  } else {
    identity = {
      ...identity,
      email: input.email ?? identity.email,
      displayName: input.displayName ?? identity.displayName,
    };
    data.identities = data.identities.map((i) =>
      i.id === identity!.id ? identity! : i,
    );
  }

  let membership = data.memberships.find(
    (m) => m.personId === identity!.personId && m.status === "active",
  );
  if (!membership) {
    const directoryEmpty = !data.memberships.some((m) => m.status === "active");
    const role = coerceMembershipRole(
      resolveJoinRole({ existingRole: null, directoryEmpty }),
    );
    membership = {
      id: newId("mem"),
      personId: identity.personId,
      tenantSlug: slug,
      territoryId: input.territoryId,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    data.memberships.push(membership);
  }

  await writeFile(slug, data);
  return { identity, membership };
}

export async function updateFileMembershipRole(input: {
  tenantSlug: string;
  personId: string;
  role: MembershipRole;
}): Promise<StoredMembership | null> {
  const slug = resolveTenantPublicId(input.tenantSlug);
  const data = await readFile(slug);
  const idx = data.memberships.findIndex(
    (m) => m.personId === input.personId && m.status === "active",
  );
  if (idx < 0) return null;
  const current = data.memberships[idx];
  if (!current) return null;
  const next: StoredMembership = {
    ...current,
    role: coerceMembershipRole(input.role),
    updatedAt: new Date().toISOString(),
  };
  data.memberships[idx] = next;
  await writeFile(slug, data);
  return next;
}

export async function updateFileMembershipStatus(input: {
  tenantSlug: string;
  personId: string;
  status: StoredMembership["status"];
}): Promise<StoredMembership | null> {
  const slug = resolveTenantPublicId(input.tenantSlug);
  const data = await readFile(slug);
  const idx = data.memberships.findIndex((m) => m.personId === input.personId);
  if (idx < 0) return null;
  const current = data.memberships[idx];
  if (!current) return null;
  const next: StoredMembership = {
    ...current,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  data.memberships[idx] = next;
  await writeFile(slug, data);
  return next;
}

export async function listFileMembershipDirectory(
  tenantSlug: string,
  includeInactive = false,
): Promise<
  Array<{
    membership: StoredMembership;
    identity: StoredIdentity | null;
  }>
> {
  const slug = resolveTenantPublicId(tenantSlug);
  const data = await readFile(slug);
  return data.memberships
    .filter((m) => includeInactive || m.status === "active")
    .map((membership) => ({
      membership,
      identity:
        data.identities.find((i) => i.personId === membership.personId) ?? null,
    }))
    .sort((a, b) =>
      (a.identity?.displayName ?? a.identity?.email ?? a.membership.personId).localeCompare(
        b.identity?.displayName ?? b.identity?.email ?? b.membership.personId,
      ),
    );
}
