import type {
  CommunityGroup,
  CommunityGroupStatus,
  GroupMembership,
} from "../../../domain/community-group";
import type { DomainId } from "../../../domain/ids";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Group conversation adapter — owner module: community.groups.
 */

const MODULE_ID = "community.groups";
const CAP_CONTENT_VIEW = "community.content.view";
const CAP_GROUP_CREATE = "community.group.create";

export type GroupConversationSnapshot = {
  group: CommunityGroup;
  memberships?: readonly GroupMembership[];
  moderatorPersonIds?: readonly DomainId[];
};

function mapGroupLifecycle(
  status: CommunityGroupStatus | undefined,
): ContextLifecycleState {
  switch (status) {
    case "draft":
      return "draft";
    case "active":
      return "active";
    case "archived":
      return "archived";
    default:
      return "unavailable";
  }
}

export function createGroupConversationAdapter(): ConversationContextAdapter<GroupConversationSnapshot> {
  return {
    contextType: "group",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.group.id !== context.contextId) return false;
      if (snapshot.group.tenantId !== context.tenantId) return false;
      const life = mapGroupLifecycle(snapshot.group.status);
      if (life !== "active" && life !== "draft") return false;
      return (
        env.hasCapability(CAP_CONTENT_VIEW) ||
        env.hasCapability(CAP_GROUP_CREATE)
      );
    },
    canView(context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot) return false;
      if (snapshot.group.ownerPersonId === personId) return true;
      if (snapshot.moderatorPersonIds?.includes(personId)) return true;
      const membership = snapshot.memberships?.find(
        (m) =>
          m.groupId === context.contextId &&
          m.personId === personId &&
          m.status === "active",
      );
      if (membership) return true;
      return env.hasCapability(CAP_GROUP_CREATE);
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [];
      const seen = new Set<DomainId>();
      const ownerId = snapshot.group.ownerPersonId;
      if (ownerId) {
        list.push({ personId: ownerId, role: "owner" });
        seen.add(ownerId);
      }
      for (const modId of snapshot.moderatorPersonIds ?? []) {
        if (seen.has(modId)) continue;
        list.push({ personId: modId, role: "moderator" });
        seen.add(modId);
      }
      for (const m of snapshot.memberships ?? []) {
        if (m.status !== "active" || seen.has(m.personId)) continue;
        list.push({ personId: m.personId, role: "member" });
        seen.add(m.personId);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      return snapshot?.group.name?.trim() || "Group";
    },
    getLifecycle(_context, snapshot) {
      return mapGroupLifecycle(snapshot?.group.status);
    },
  };
}
