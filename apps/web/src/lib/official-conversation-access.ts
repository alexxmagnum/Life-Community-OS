import type {
  OfficialConversationSnapshot,
  TenantConfiguration,
} from "@life-community-os/types";
import { createOfficialConversationAdapter } from "@life-community-os/types";
import {
  getOfficialConversationSnapshot,
  getPrimaryOfficialNoticeId,
  officialEntityModuleId,
  toOfficialAdapterKind,
  type OfficialEntityProfile,
} from "@life-community-os/tenant-life-panoramica";

function resolveSnapshot(
  entity: OfficialEntityProfile,
  noticeId?: string,
): OfficialConversationSnapshot | undefined {
  const id = noticeId ?? getPrimaryOfficialNoticeId(entity.id);
  if (!id) return undefined;
  const base = getOfficialConversationSnapshot(id);
  if (!base) return undefined;
  return {
    ...base,
    kind: toOfficialAdapterKind(entity),
    officialEntityId: entity.id,
  };
}

/**
 * Gate for Official Conversation UI (D.0.6.3).
 * Fail closed when parent official or entity submodule is OFF.
 */
export function canOpenOfficialConversation(input: {
  entity: OfficialEntityProfile;
  noticeId?: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("official")) return false;
  const submodule = officialEntityModuleId(input.entity);
  if (submodule !== "official" && !input.isModuleEnabled(submodule)) {
    return false;
  }

  const adapter = createOfficialConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const snapshot = resolveSnapshot(input.entity, input.noticeId);
  if (!snapshot) return false;

  const context = {
    id: `ctx-official-${snapshot.id}`,
    contextType: "official" as const,
    contextId: snapshot.id,
    tenantId: input.configuration.tenantId,
    territoryId: (input.configuration.territory?.territoryId ?? input.configuration.tenantId),
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}

export function canViewOfficialConversation(input: {
  entity: OfficialEntityProfile;
  personId: string;
  noticeId?: string;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!canOpenOfficialConversation(input)) return false;

  const adapter = createOfficialConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };

  const snapshot = resolveSnapshot(input.entity, input.noticeId);
  if (!snapshot) return false;

  const context = {
    id: `ctx-official-${snapshot.id}`,
    contextType: "official" as const,
    contextId: snapshot.id,
    tenantId: input.configuration.tenantId,
    territoryId: (input.configuration.territory?.territoryId ?? input.configuration.tenantId),
    moduleId: adapter.getModuleId(),
  };

  return adapter.canView(context, input.personId, env, snapshot);
}

/** Whether the official entity surface itself is available (module fail-closed). */
export function isOfficialEntitySurfaceAvailable(input: {
  entity: OfficialEntityProfile;
  isModuleEnabled: (moduleId: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("official")) return false;
  const submodule = officialEntityModuleId(input.entity);
  if (submodule !== "official" && !input.isModuleEnabled(submodule)) {
    return false;
  }
  return true;
}
