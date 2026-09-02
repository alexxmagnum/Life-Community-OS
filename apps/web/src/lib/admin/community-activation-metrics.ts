/**
 * Community activation metrics — assembled from domain stores.
 * Counts real activity only; never engagement signals.
 */

import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { CommunityOperationsService } from "@/lib/community/community-operations-service";
import {
  listExperienceParticipantsServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { listReservationsServer } from "@/lib/reservations/server-reservations-repository";
import type { AdminWriteScope } from "./server-admin-repository";
import {
  EMPTY_COMMUNITY_ACTIVATION_METRICS,
  isProfessionalBusiness,
  type CommunityActivationMetrics,
} from "@life-community-os/types";

export type { CommunityActivationMetrics };

export async function loadCommunityActivationMetrics(input: {
  tenantId: string;
  territoryId?: string;
  scope?: AdminWriteScope;
}): Promise<CommunityActivationMetrics> {
  const tenantId = input.tenantId;
  const [experiences, businesses, help, reservations, announcements] =
    await Promise.all([
      listExperiencesServer(tenantId, input.scope),
      listBusinessesServer(tenantId, input.scope),
      listHelpRequestsServer(tenantId, input.scope),
      listReservationsServer(tenantId, input.scope),
      input.territoryId
        ? CommunityOperationsService.announcements({
            tenantId,
            territoryId: input.territoryId,
          })
        : Promise.resolve([]),
    ]);

  const tenantExperiences = experiences.filter(
    (row) => row.tenantId === tenantId,
  );
  let experiencesParticipants = 0;
  for (const experience of tenantExperiences) {
    const participants = await listExperienceParticipantsServer(
      tenantId,
      experience.id,
      input.scope,
    );
    experiencesParticipants += participants.length;
  }

  const publishedBusinesses = businesses.filter(
    (row) => row.tenantId === tenantId && row.status === "published",
  );
  const professionalServices = publishedBusinesses.filter((row) =>
    isProfessionalBusiness(row),
  ).length;
  const openWorkPosts = help.filter(
    (row) =>
      row.tenantId === tenantId &&
      row.status === "open" &&
      row.category === "work",
  ).length;

  const tenantHelp = help.filter((row) => row.tenantId === tenantId);
  const helpRequestsCreated = tenantHelp.length;
  const helpRequestsCompleted = tenantHelp.filter(
    (row) => row.status === "completed" || row.status === "closed",
  ).length;

  const reservationsCompleted = reservations.filter(
    (row) =>
      (!row.tenantId || row.tenantId === tenantId) &&
      row.status === "completed",
  ).length;

  return {
    ...EMPTY_COMMUNITY_ACTIVATION_METRICS(tenantId),
    experiencesCreated: tenantExperiences.length,
    experiencesParticipants,
    announcementsPublished: announcements.length,
    businessesPublished: publishedBusinesses.length,
    servicesAvailable: professionalServices + openWorkPosts,
    reservationsCompleted,
    helpRequestsCreated,
    helpRequestsCompleted,
  };
}
