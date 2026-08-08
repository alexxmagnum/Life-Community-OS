import type { DomainId } from "../../../domain/ids";
import type {
  ConversationContextAdapter,
  ConversationContextAdapterEnv,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Official conversation adapter — owner module: official (+ submodules).
 * Respects Tenant Configuration for administration / municipality / security / publicServices.
 */

const MODULE_ID = "official";
const CAP_CHANNEL_VIEW = "community.channel.view";
const CAP_ANNOUNCE = "community.announcement.publish_official";
const CAP_SECURITY_VIEW = "community.security.view";
const CAP_SECURITY_NOTICES = "community.security.notices.view";

export type OfficialEntityKind =
  | "administration"
  | "municipality"
  | "security"
  | "public_service"
  | (string & {});

/**
 * Official interaction mode — product behaviour, not AuthZ.
 * announcement_only: read (+ react); no free resident discussion.
 * announcement_with_responses: residents may reply; official moderates.
 */
export type OfficialInteractionMode =
  | "announcement_only"
  | "announcement_with_responses";

export type OfficialConversationSnapshot = {
  id: DomainId;
  title: string;
  officialEntityId: DomainId;
  kind?: OfficialEntityKind;
  status?: "draft" | "active" | "archived" | "locked" | string;
  interactionMode?: OfficialInteractionMode;
  /** When false, reactions are hidden even if messages exist. Default true. */
  reactionsEnabled?: boolean;
  audiencePersonIds?: readonly DomainId[];
  staffPersonIds?: readonly DomainId[];
};

/** Whether residents may post free-form / quick-action replies. */
export function allowsOfficialResidentReplies(
  snapshot: OfficialConversationSnapshot | undefined,
): boolean {
  if (!snapshot) return false;
  const life = mapOfficialLifecycle(snapshot.status);
  if (life === "archived" || snapshot.status === "locked") return false;
  return snapshot.interactionMode === "announcement_with_responses";
}

export function allowsOfficialReactions(
  snapshot: OfficialConversationSnapshot | undefined,
): boolean {
  if (!snapshot) return false;
  if (snapshot.reactionsEnabled === false) return false;
  return mapOfficialLifecycle(snapshot.status) !== "archived";
}

/** Map official kind → Platform Module Registry submodule id (fail closed). */
function submoduleIdForKind(kind: OfficialEntityKind | undefined): string | null {
  switch (kind) {
    case "administration":
      return "administration";
    case "municipality":
      return "municipality";
    case "security":
      return "security";
    case "public_service":
      return "publicServices";
    default:
      return null;
  }
}

function isOfficialSurfaceAvailable(
  env: ConversationContextAdapterEnv,
  kind: OfficialEntityKind | undefined,
): boolean {
  if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
  const sub = submoduleIdForKind(kind);
  if (!sub) {
    // Unknown kind — parent official module only (fail closed for specialized OFF).
    return true;
  }
  return isAdapterModuleAvailable(sub, env);
}

function mapOfficialLifecycle(
  status: string | undefined,
): ContextLifecycleState {
  switch (status) {
    case "draft":
      return "draft";
    case "archived":
      return "archived";
    case "locked":
      // Locked notices remain open for viewing; posting gated separately.
      return "active";
    case "active":
    case undefined:
      return "active";
    default:
      return "active";
  }
}

function hasOfficialViewCapability(
  env: ConversationContextAdapterEnv,
  kind: OfficialEntityKind | undefined,
): boolean {
  if (kind === "security") {
    return (
      env.hasCapability(CAP_SECURITY_VIEW) ||
      env.hasCapability(CAP_SECURITY_NOTICES) ||
      env.hasCapability(CAP_CHANNEL_VIEW)
    );
  }
  return (
    env.hasCapability(CAP_CHANNEL_VIEW) || env.hasCapability(CAP_ANNOUNCE)
  );
}

export function createOfficialConversationAdapter(): ConversationContextAdapter<OfficialConversationSnapshot> {
  return {
    contextType: "official",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (!isOfficialSurfaceAvailable(env, snapshot.kind)) return false;
      if (!hasOfficialViewCapability(env, snapshot.kind)) return false;
      const life = mapOfficialLifecycle(snapshot.status);
      return life === "active" || life === "draft";
    },
    canView(_context, personId, env, snapshot) {
      if (!snapshot) return false;
      if (!isOfficialSurfaceAvailable(env, snapshot.kind)) return false;
      if (!hasOfficialViewCapability(env, snapshot.kind)) return false;
      if (snapshot.staffPersonIds?.includes(personId)) return true;
      if (snapshot.audiencePersonIds?.length) {
        return snapshot.audiencePersonIds.includes(personId);
      }
      // Broad official notices: capability + module ON is enough.
      return mapOfficialLifecycle(snapshot.status) !== "archived";
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [];
      const seen = new Set<DomainId>();
      for (const id of snapshot.staffPersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "official" });
        seen.add(id);
      }
      for (const id of snapshot.audiencePersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "observer" });
        seen.add(id);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      return snapshot?.title?.trim() || "Official";
    },
    getLifecycle(_context, snapshot) {
      return mapOfficialLifecycle(snapshot?.status);
    },
  };
}
