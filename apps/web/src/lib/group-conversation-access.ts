import type {
  GroupConversationSnapshot,
  TenantConfiguration,
} from "@life-community-os/types";
import { createGroupConversationAdapter } from "@life-community-os/types";
import {
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
  getGroupConversationSnapshotParts,
  type CommunityGroup,
} from "@life-community-os/tenant-life-panoramica";

function buildSnapshot(
  group: CommunityGroup,
): GroupConversationSnapshot | undefined {
  const parts = getGroupConversationSnapshotParts(group.id);
  if (!parts) return undefined;
  return parts;
}

/**
 * Gate for Group Conversation UI (D.0.6.2).
 * Fail closed when community.groups module OFF or adapter denies open.
 */
export function canOpenGroupConversation(input: {
  group: CommunityGroup;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("community.groups")) return false;

  const adapter = createGroupConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const snapshot = buildSnapshot(input.group);
  if (!snapshot) return false;

  const context = {
    id: `ctx-group-${snapshot.group.id}`,
    contextType: "group" as const,
    contextId: snapshot.group.id,
    tenantId: snapshot.group.tenantId ?? DEMO_TENANT_ID,
    territoryId: snapshot.group.territoryId ?? DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}

/**
 * Whether a Person may view the group conversation (membership / roles).
 */
export function canViewGroupConversation(input: {
  group: CommunityGroup;
  personId: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!canOpenGroupConversation(input)) return false;

  const adapter = createGroupConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };

  const snapshot = buildSnapshot(input.group);
  if (!snapshot) return false;

  const context = {
    id: `ctx-group-${snapshot.group.id}`,
    contextType: "group" as const,
    contextId: snapshot.group.id,
    tenantId: snapshot.group.tenantId ?? DEMO_TENANT_ID,
    territoryId: snapshot.group.territoryId ?? DEMO_TERRITORY_ID,
    moduleId: adapter.getModuleId(),
  };

  return adapter.canView(context, input.personId, env, snapshot);
}
