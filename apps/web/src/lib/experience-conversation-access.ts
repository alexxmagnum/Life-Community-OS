import type { Experience, TenantConfiguration } from "@life-community-os/types";
import { createExperienceConversationAdapter } from "@life-community-os/types";

type ExperienceLike = {
  id: string;
  tenantId?: string;
  status: Experience["status"] | string;
  title: string;
  createdByPersonId?: string;
  organizer: { id: string; name?: string };
  participants?: { id: string; name?: string }[];
  participantCount: number;
  description?: string;
  location?: string;
  capacity?: number;
  type?: Experience["type"];
  startsAt?: string;
};

/**
 * Gate for Experience Conversation UI (D.0.6).
 * Fail closed when module OFF or adapter denies open.
 */
export function canOpenExperienceConversation(input: {
  experience: ExperienceLike;
  configuration: TenantConfiguration;
  isModuleEnabled: (moduleId: string) => boolean;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.isModuleEnabled("experiences")) return false;

  const adapter = createExperienceConversationAdapter();
  const env = {
    configuration: input.configuration,
    hasCapability: input.hasCapability,
  };
  if (!adapter.isModuleAvailable(env)) return false;

  const snapshot = {
    ...input.experience,
    tenantId: input.experience.tenantId ?? input.configuration.tenantId,
    description: input.experience.description ?? "",
    location: input.experience.location ?? "",
    capacity: input.experience.capacity ?? 0,
    type: input.experience.type ?? "experience",
    startsAt: input.experience.startsAt ?? new Date().toISOString(),
    organizer: {
      id: input.experience.organizer.id,
      name: input.experience.organizer.name ?? "Organizer",
    },
    participants: (input.experience.participants ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? "Vecino",
    })),
    status: input.experience.status as Experience["status"],
  } as Experience;

  const context = {
    id: `ctx-experience-${snapshot.id}`,
    contextType: "experience" as const,
    contextId: snapshot.id,
    tenantId: snapshot.tenantId ?? input.configuration.tenantId,
    territoryId: (input.configuration.territory?.territoryId ?? input.configuration.tenantId),
    moduleId: adapter.getModuleId(),
  };

  return adapter.canOpen(context, env, snapshot);
}
