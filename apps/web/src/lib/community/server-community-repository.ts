/**
 * Community Core repository.
 *
 * Production: PostgreSQL community_* tables (tenant_id + created_by).
 * Development fixture: apps/web/.data/community when DB is not the data plane.
 * Pack catalogs may seed fixtures only when file persistence is allowed.
 */

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  emptyCommunityDomain,
  type CommunityCommentRecord,
  type CommunityDomainSnapshot,
  type CommunityEvent,
  type CommunityGroupRecord,
  type CommunityNotificationRecord,
  type CommunityPost,
  type CommunityPostKind,
  type CommunityReaction,
  type CommunityReactionKind,
  type CommunitySave,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  isProductionDataPlane,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";

export type CommunityWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data", "community");

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(
  tenantSlug: string,
): Promise<CommunityDomainSnapshot> {
  if (!isFilePersistenceAllowed()) return emptyCommunityDomain();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<CommunityDomainSnapshot>;
    return {
      ...emptyCommunityDomain(),
      ...parsed,
      groups: parsed.groups ?? [],
      posts: parsed.posts ?? [],
      events: parsed.events ?? [],
      comments: parsed.comments ?? [],
      reactions: parsed.reactions ?? [],
      saves: parsed.saves ?? [],
      notifications: parsed.notifications ?? [],
    };
  } catch {
    return emptyCommunityDomain();
  }
}

async function writeFileStore(
  tenantSlug: string,
  snapshot: CommunityDomainSnapshot,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    filePath(tenantSlug),
    JSON.stringify(snapshot, null, 2),
    "utf8",
  );
}

function communityFixtureEnabled(): boolean {
  return process.env.LCOS_COMMUNITY_FIXTURE === "1";
}

async function loadSnapshot(
  tenantSlug: string,
  scope?: CommunityWriteScope,
): Promise<CommunityDomainSnapshot> {
  if (communityFixtureEnabled()) {
    return readFileStore(tenantSlug);
  }
  const fromDb = await loadFromDatabase(tenantSlug, scope);
  if (fromDb) return fromDb;
  if (!isFilePersistenceAllowed()) {
    if (isDatabaseConfigured()) return emptyCommunityDomain();
    throw new PersistenceUnavailableError();
  }
  return readFileStore(tenantSlug);
}

async function persistSnapshot(
  tenantSlug: string,
  snapshot: CommunityDomainSnapshot,
  scope?: CommunityWriteScope,
): Promise<void> {
  if (communityFixtureEnabled()) {
    await writeFileStore(tenantSlug, snapshot);
    return;
  }
  const wrote = await saveToDatabase(tenantSlug, snapshot, scope);
  if (wrote) return;
  await writeFileStore(tenantSlug, snapshot);
}

type PostRow = {
  id: string;
  tenant_id: string;
  group_id: string | null;
  author_person_id: string;
  author_display_name: string;
  kind: CommunityPostKind;
  title: string;
  body: string;
  status: CommunityPost["status"];
  created_by: string;
  created_at: string;
  updated_at: string;
};

function postFromRow(row: PostRow, tenantSlug: string): CommunityPost {
  return {
    id: row.id,
    tenantId: tenantSlug,
    groupId: row.group_id ?? undefined,
    authorPersonId: row.author_person_id,
    authorDisplayName: row.author_display_name,
    kind: row.kind,
    title: row.title,
    body: row.body,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadFromDatabase(
  tenantSlug: string,
  scope?: CommunityWriteScope,
): Promise<CommunityDomainSnapshot | null> {
  if (!isDatabaseConfigured()) return null;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return null;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return null;

  const [groups, posts, events, comments, reactions, saves, notifications] =
    await Promise.all([
      client.from("community_groups").select("*").eq("tenant_id", tenantUuid),
      client.from("community_posts").select("*").eq("tenant_id", tenantUuid),
      client.from("community_events").select("*").eq("tenant_id", tenantUuid),
      client.from("community_comments").select("*").eq("tenant_id", tenantUuid),
      client.from("community_reactions").select("*").eq("tenant_id", tenantUuid),
      client.from("community_saves").select("*").eq("tenant_id", tenantUuid),
      client
        .from("community_notifications")
        .select("*")
        .eq("tenant_id", tenantUuid),
    ]);

  if (posts.error) {
    console.warn("[community] list failed", posts.error.message);
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError(posts.error.message);
    }
    return null;
  }

  return {
    groups: (groups.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      name: row.name,
      description: row.description ?? "",
      imageUrl: row.image_url ?? undefined,
      categoryLabel: row.category_label ?? undefined,
      groupType: row.group_type,
      visibility: row.visibility,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    posts: (posts.data as PostRow[]).map((row) => postFromRow(row, tenantSlug)),
    events: (events.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      groupId: row.group_id ?? undefined,
      authorPersonId: row.author_person_id,
      authorDisplayName: row.author_display_name,
      title: row.title,
      description: row.description ?? "",
      startsAt: row.starts_at,
      endsAt: row.ends_at ?? undefined,
      locationLabel: row.location_label ?? undefined,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    comments: (comments.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      postId: row.post_id ?? undefined,
      eventId: row.event_id ?? undefined,
      authorPersonId: row.author_person_id,
      authorDisplayName: row.author_display_name,
      body: row.body,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    reactions: (reactions.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      personId: row.person_id,
      targetType: row.target_type,
      targetId: row.target_id,
      kind: row.kind,
      createdBy: row.created_by,
      createdAt: row.created_at,
    })),
    saves: (saves.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      personId: row.person_id,
      targetType: row.target_type,
      targetId: row.target_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
    })),
    notifications: (notifications.data ?? []).map((row) => ({
      id: row.id,
      tenantId: tenantSlug,
      recipientPersonId: row.recipient_person_id,
      kind: row.kind,
      title: row.title,
      body: row.body ?? "",
      entityType: row.entity_type ?? undefined,
      entityId: row.entity_id ?? undefined,
      readAt: row.read_at ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

async function saveToDatabase(
  tenantSlug: string,
  snapshot: CommunityDomainSnapshot,
  scope?: CommunityWriteScope,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return false;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return false;

  const groupRows = snapshot.groups.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    name: item.name,
    description: item.description,
    image_url: item.imageUrl ?? null,
    category_label: item.categoryLabel ?? null,
    group_type: item.groupType,
    visibility: item.visibility,
    status: item.status,
    created_by: item.createdBy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const postRows = snapshot.posts.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    group_id: item.groupId ?? null,
    author_person_id: item.authorPersonId,
    author_display_name: item.authorDisplayName,
    kind: item.kind,
    title: item.title,
    body: item.body,
    status: item.status,
    created_by: item.createdBy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const eventRows = snapshot.events.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    group_id: item.groupId ?? null,
    author_person_id: item.authorPersonId,
    author_display_name: item.authorDisplayName,
    title: item.title,
    description: item.description,
    starts_at: item.startsAt,
    ends_at: item.endsAt ?? null,
    location_label: item.locationLabel ?? null,
    status: item.status,
    created_by: item.createdBy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const commentRows = snapshot.comments.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    post_id: item.postId ?? null,
    event_id: item.eventId ?? null,
    author_person_id: item.authorPersonId,
    author_display_name: item.authorDisplayName,
    body: item.body,
    status: item.status,
    created_by: item.createdBy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const reactionRows = snapshot.reactions.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    person_id: item.personId,
    target_type: item.targetType,
    target_id: item.targetId,
    kind: item.kind,
    created_by: item.createdBy,
    created_at: item.createdAt,
  }));
  const saveRows = snapshot.saves.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    person_id: item.personId,
    target_type: item.targetType,
    target_id: item.targetId,
    created_by: item.createdBy,
    created_at: item.createdAt,
  }));
  const notificationRows = snapshot.notifications.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    recipient_person_id: item.recipientPersonId,
    kind: item.kind,
    title: item.title,
    body: item.body,
    entity_type: item.entityType ?? null,
    entity_id: item.entityId ?? null,
    read_at: item.readAt ?? null,
    created_by: item.createdBy ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));

  const writes = await Promise.all([
    groupRows.length
      ? client.from("community_groups").upsert(groupRows)
      : { error: null },
    postRows.length
      ? client.from("community_posts").upsert(postRows)
      : { error: null },
    eventRows.length
      ? client.from("community_events").upsert(eventRows)
      : { error: null },
    commentRows.length
      ? client.from("community_comments").upsert(commentRows)
      : { error: null },
    reactionRows.length
      ? client.from("community_reactions").upsert(reactionRows)
      : { error: null },
    saveRows.length
      ? client.from("community_saves").upsert(saveRows)
      : { error: null },
    notificationRows.length
      ? client.from("community_notifications").upsert(notificationRows)
      : { error: null },
  ]);
  if (writes.some((result) => result.error)) {
    console.warn(
      "[community] upsert failed",
      writes.find((result) => result.error)?.error?.message,
    );
    return false;
  }
  return true;
}

export async function listCommunitySnapshot(
  tenantId: string,
  scope?: CommunityWriteScope,
): Promise<CommunityDomainSnapshot> {
  const slug = resolveTenantPublicId(tenantId);
  return loadSnapshot(slug, scope);
}

export async function listPublishedPosts(
  tenantId: string,
  scope?: CommunityWriteScope,
): Promise<CommunityPost[]> {
  const snapshot = await listCommunitySnapshot(tenantId, scope);
  return snapshot.posts
    .filter((post) => post.status === "published" && post.tenantId === resolveTenantPublicId(tenantId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function createCommunityPost(input: {
  tenantId: string;
  authorPersonId: string;
  authorDisplayName: string;
  title: string;
  body: string;
  kind?: CommunityPostKind;
  groupId?: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityPost> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const post: CommunityPost = {
    id: randomUUID(),
    tenantId: slug,
    groupId: input.groupId,
    authorPersonId: input.authorPersonId,
    authorDisplayName: input.authorDisplayName,
    kind: input.kind ?? "member_update",
    title: input.title.trim(),
    body: input.body.trim(),
    status: "published",
    createdBy: input.authorPersonId,
    createdAt: now,
    updatedAt: now,
  };
  const snapshot = await loadSnapshot(slug, input.scope);
  snapshot.posts = [post, ...snapshot.posts.filter((item) => item.id !== post.id)];
  await persistSnapshot(slug, snapshot, input.scope);
  return post;
}

export async function moderateCommunityPost(input: {
  tenantId: string;
  postId: string;
  status: Extract<CommunityPost["status"], "hidden" | "archived" | "published">;
  scope?: CommunityWriteScope;
}): Promise<CommunityPost | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const snapshot = await loadSnapshot(slug, input.scope);
  const index = snapshot.posts.findIndex((item) => item.id === input.postId);
  if (index < 0) return null;
  const next = {
    ...snapshot.posts[index]!,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  snapshot.posts[index] = next;
  await persistSnapshot(slug, snapshot, input.scope);
  return next;
}

export async function listCommunityGroups(
  tenantId: string,
  scope?: CommunityWriteScope,
): Promise<CommunityGroupRecord[]> {
  const snapshot = await listCommunitySnapshot(tenantId, scope);
  return snapshot.groups.filter((group) => group.status !== "archived");
}

export async function createCommunityGroup(input: {
  tenantId: string;
  createdBy: string;
  name: string;
  description?: string;
  categoryLabel?: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityGroupRecord> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const group: CommunityGroupRecord = {
    id: randomUUID(),
    tenantId: slug,
    name: input.name.trim(),
    description: (input.description ?? "").trim(),
    categoryLabel: input.categoryLabel,
    groupType: "custom",
    visibility: "territory",
    status: "active",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const snapshot = await loadSnapshot(slug, input.scope);
  snapshot.groups = [group, ...snapshot.groups];
  await persistSnapshot(slug, snapshot, input.scope);
  return group;
}

export async function listCommunityEvents(
  tenantId: string,
  scope?: CommunityWriteScope,
): Promise<CommunityEvent[]> {
  const snapshot = await listCommunitySnapshot(tenantId, scope);
  return snapshot.events
    .filter((event) => event.status === "published")
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

export async function createCommunityEvent(input: {
  tenantId: string;
  authorPersonId: string;
  authorDisplayName: string;
  title: string;
  description?: string;
  startsAt: string;
  locationLabel?: string;
  groupId?: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityEvent> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const event: CommunityEvent = {
    id: randomUUID(),
    tenantId: slug,
    groupId: input.groupId,
    authorPersonId: input.authorPersonId,
    authorDisplayName: input.authorDisplayName,
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    startsAt: input.startsAt,
    locationLabel: input.locationLabel,
    status: "published",
    createdBy: input.authorPersonId,
    createdAt: now,
    updatedAt: now,
  };
  const snapshot = await loadSnapshot(slug, input.scope);
  snapshot.events = [event, ...snapshot.events];
  await persistSnapshot(slug, snapshot, input.scope);
  return event;
}

export async function addCommunityComment(input: {
  tenantId: string;
  authorPersonId: string;
  authorDisplayName: string;
  body: string;
  postId?: string;
  eventId?: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityCommentRecord> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const comment: CommunityCommentRecord = {
    id: randomUUID(),
    tenantId: slug,
    postId: input.postId,
    eventId: input.eventId,
    authorPersonId: input.authorPersonId,
    authorDisplayName: input.authorDisplayName,
    body: input.body.trim(),
    status: "published",
    createdBy: input.authorPersonId,
    createdAt: now,
    updatedAt: now,
  };
  const snapshot = await loadSnapshot(slug, input.scope);
  snapshot.comments = [comment, ...snapshot.comments];
  await persistSnapshot(slug, snapshot, input.scope);
  return comment;
}

export async function setCommunityReaction(input: {
  tenantId: string;
  personId: string;
  targetType: CommunityReaction["targetType"];
  targetId: string;
  kind: CommunityReactionKind;
  scope?: CommunityWriteScope;
}): Promise<CommunityReaction | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const snapshot = await loadSnapshot(slug, input.scope);
  const existing = snapshot.reactions.find(
    (item) =>
      item.personId === input.personId &&
      item.targetType === input.targetType &&
      item.targetId === input.targetId &&
      item.kind === input.kind,
  );
  if (existing) {
    snapshot.reactions = snapshot.reactions.filter(
      (item) => item.id !== existing.id,
    );
    await persistSnapshot(slug, snapshot, input.scope);
    return null;
  }
  const reaction: CommunityReaction = {
    id: randomUUID(),
    tenantId: slug,
    personId: input.personId,
    targetType: input.targetType,
    targetId: input.targetId,
    kind: input.kind,
    createdBy: input.personId,
    createdAt: new Date().toISOString(),
  };
  snapshot.reactions = [reaction, ...snapshot.reactions];
  await persistSnapshot(slug, snapshot, input.scope);
  return reaction;
}

export async function toggleCommunitySave(input: {
  tenantId: string;
  personId: string;
  targetType: CommunitySave["targetType"];
  targetId: string;
  scope?: CommunityWriteScope;
}): Promise<boolean> {
  const slug = resolveTenantPublicId(input.tenantId);
  const snapshot = await loadSnapshot(slug, input.scope);
  const existing = snapshot.saves.find(
    (item) =>
      item.personId === input.personId &&
      item.targetType === input.targetType &&
      item.targetId === input.targetId,
  );
  if (existing) {
    snapshot.saves = snapshot.saves.filter((item) => item.id !== existing.id);
    await persistSnapshot(slug, snapshot, input.scope);
    return false;
  }
  snapshot.saves = [
    {
      id: randomUUID(),
      tenantId: slug,
      personId: input.personId,
      targetType: input.targetType,
      targetId: input.targetId,
      createdBy: input.personId,
      createdAt: new Date().toISOString(),
    },
    ...snapshot.saves,
  ];
  await persistSnapshot(slug, snapshot, input.scope);
  return true;
}

export async function listCommunityNotifications(
  tenantId: string,
  recipientPersonId: string,
  scope?: CommunityWriteScope,
): Promise<CommunityNotificationRecord[]> {
  const snapshot = await listCommunitySnapshot(tenantId, scope);
  return snapshot.notifications
    .filter((item) => item.recipientPersonId === recipientPersonId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function createCommunityNotification(input: {
  tenantId: string;
  recipientPersonId: string;
  kind: CommunityNotificationRecord["kind"];
  title: string;
  body?: string;
  entityType?: CommunityNotificationRecord["entityType"];
  entityId?: string;
  createdBy?: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityNotificationRecord> {
  const slug = resolveTenantPublicId(input.tenantId);
  const now = new Date().toISOString();
  const notification: CommunityNotificationRecord = {
    id: randomUUID(),
    tenantId: slug,
    recipientPersonId: input.recipientPersonId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? "",
    entityType: input.entityType,
    entityId: input.entityId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const snapshot = await loadSnapshot(slug, input.scope);
  snapshot.notifications = [notification, ...snapshot.notifications];
  await persistSnapshot(slug, snapshot, input.scope);
  return notification;
}

export async function markCommunityNotificationRead(input: {
  tenantId: string;
  notificationId: string;
  recipientPersonId: string;
  scope?: CommunityWriteScope;
}): Promise<CommunityNotificationRecord | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const snapshot = await loadSnapshot(slug, input.scope);
  const index = snapshot.notifications.findIndex(
    (item) =>
      item.id === input.notificationId &&
      item.recipientPersonId === input.recipientPersonId,
  );
  if (index < 0) return null;
  const now = new Date().toISOString();
  const next = {
    ...snapshot.notifications[index]!,
    readAt: now,
    updatedAt: now,
  };
  snapshot.notifications[index] = next;
  await persistSnapshot(slug, snapshot, input.scope);
  return next;
}

/**
 * Development / demo-pack fixture only. Never runs on the production data plane.
 */
export async function seedCommunityFixtureIfEmpty(
  tenantId: string,
  fixture: Partial<CommunityDomainSnapshot>,
  scope?: CommunityWriteScope,
): Promise<boolean> {
  if (isProductionDataPlane()) return false;
  if (!isFilePersistenceAllowed() && !isDatabaseConfigured()) return false;
  const slug = resolveTenantPublicId(tenantId);
  const snapshot = await loadSnapshot(slug, scope);
  const empty =
    snapshot.posts.length === 0 &&
    snapshot.groups.length === 0 &&
    snapshot.events.length === 0;
  if (!empty) return false;
  const next: CommunityDomainSnapshot = {
    ...emptyCommunityDomain(),
    groups: fixture.groups ?? [],
    posts: fixture.posts ?? [],
    events: fixture.events ?? [],
    comments: fixture.comments ?? [],
    reactions: fixture.reactions ?? [],
    saves: fixture.saves ?? [],
    notifications: fixture.notifications ?? [],
  };
  await persistSnapshot(slug, next, scope);
  return true;
}

export async function replaceCommunitySnapshotForTests(
  tenantId: string,
  snapshot: CommunityDomainSnapshot = emptyCommunityDomain(),
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), snapshot);
}
