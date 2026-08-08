import type { Experience, ExperienceStatus } from "../../../domain/experience";
import type { DomainId } from "../../../domain/ids";
import type {
  ConversationContextAdapter,
  ConversationContextAdapterEnv,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";
import type { ConversationContext } from "../conversation-context";

/**
 * Experience conversation adapter — owner module: experiences.
 * Lifecycle owned by Experience domain; Communication Core stays generic.
 */

const MODULE_ID = "experiences";
const CAP_VIEW = "community.experience.view";
const CAP_JOIN = "community.experience.join";
const CAP_MANAGE = "community.experience.manage";

export type ExperienceConversationSnapshot = Experience;

function mapExperienceLifecycle(
  status: ExperienceStatus | undefined,
): ContextLifecycleState {
  switch (status) {
    case "draft":
      return "draft";
    case "published":
    case "registration_open":
    case "full":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
    case "expired":
    case "archived":
      return "archived";
    default:
      return "unavailable";
  }
}

function participantIds(snapshot: ExperienceConversationSnapshot): DomainId[] {
  const ids = new Set<DomainId>();
  if (snapshot.createdByPersonId) ids.add(snapshot.createdByPersonId);
  if (snapshot.organizer?.id) ids.add(snapshot.organizer.id);
  for (const p of snapshot.participants ?? []) {
    if (p.id) ids.add(p.id);
  }
  return [...ids];
}

export function createExperienceConversationAdapter(): ConversationContextAdapter<ExperienceConversationSnapshot> {
  return {
    contextType: "experience",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (context.tenantId && snapshot.tenantId && context.tenantId !== snapshot.tenantId) {
        return false;
      }
      const life = mapExperienceLifecycle(snapshot.status);
      if (life === "archived" || life === "unavailable") return false;
      return (
        env.hasCapability(CAP_VIEW) ||
        env.hasCapability(CAP_JOIN) ||
        env.hasCapability(CAP_MANAGE)
      );
    },
    canView(_context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_VIEW) && !env.hasCapability(CAP_MANAGE)) {
        return false;
      }
      if (!snapshot) return env.hasCapability(CAP_MANAGE);
      if (env.hasCapability(CAP_MANAGE)) return true;
      return participantIds(snapshot).includes(personId);
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [];
      const organizerId = snapshot.organizer?.id ?? snapshot.createdByPersonId;
      if (organizerId) {
        list.push({ personId: organizerId, role: "organizer" });
      }
      for (const p of snapshot.participants ?? []) {
        if (!p.id || p.id === organizerId) continue;
        list.push({ personId: p.id, role: "member" });
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      if (!snapshot?.title?.trim()) return "Experience";
      return snapshot.title.trim();
    },
    getLifecycle(_context, snapshot) {
      return mapExperienceLifecycle(snapshot?.status);
    },
  };
}

/** Convenience for tests / callers that only have a context shell. */
export function experienceContextMatches(
  context: ConversationContext,
  snapshot: ExperienceConversationSnapshot,
): boolean {
  return (
    context.contextType === "experience" &&
    context.contextId === snapshot.id &&
    context.moduleId === MODULE_ID
  );
}
