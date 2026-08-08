import type {
  TenantConfiguration,
  WorkPost,
  WorkConversationSnapshot,
} from "@life-community-os/types";
import { createWorkConversationAdapter } from "@life-community-os/types";
import {
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
  getWorkInterestedPersonIds,
} from "@life-community-os/tenant-life-panoramica";

type WorkPostLike = {
  id: string;
  type: WorkPost["type"];
  title: string;
  description: string;
  category: WorkPost["category"];
  availability?: string;
  location?: string;
  createdByPersonId: string;
  createdAt: string;
  status: WorkPost["status"] | string;
  interestedPersonIds?: readonly string[];
};

/**
 * Gate for Work Post Conversation UI (D.0.6.1).
 * Fail closed when services module OFF or adapter denies open.
 */
export function canOpenWorkConversation(input: {
  workPost: WorkPostLike;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("services")) return false;

  const adapter = createWorkConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const interestedPersonIds =
    input.workPost.interestedPersonIds ??
    getWorkInterestedPersonIds(input.workPost.id);

  const snapshot: WorkConversationSnapshot = {
    id: input.workPost.id,
    type: input.workPost.type,
    title: input.workPost.title,
    description: input.workPost.description,
    category: input.workPost.category,
    availability: input.workPost.availability,
    location: input.workPost.location,
    createdByPersonId: input.workPost.createdByPersonId,
    createdAt: input.workPost.createdAt,
    status: input.workPost.status as WorkPost["status"],
    interestedPersonIds,
  };

  const context = {
    id: `ctx-service-${snapshot.id}`,
    contextType: "service" as const,
    contextId: snapshot.id,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}

/**
 * Whether the current person may view the Work conversation (author or interested).
 */
export function canViewWorkConversation(input: {
  workPost: WorkPostLike;
  personId: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!canOpenWorkConversation(input)) return false;

  const adapter = createWorkConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };

  const interestedPersonIds =
    input.workPost.interestedPersonIds ??
    getWorkInterestedPersonIds(input.workPost.id);

  const snapshot: WorkConversationSnapshot = {
    id: input.workPost.id,
    type: input.workPost.type,
    title: input.workPost.title,
    description: input.workPost.description,
    category: input.workPost.category,
    availability: input.workPost.availability,
    location: input.workPost.location,
    createdByPersonId: input.workPost.createdByPersonId,
    createdAt: input.workPost.createdAt,
    status: input.workPost.status as WorkPost["status"],
    interestedPersonIds,
  };

  const context = {
    id: `ctx-service-${snapshot.id}`,
    contextType: "service" as const,
    contextId: snapshot.id,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canView(context, input.personId, env, snapshot);
}
