/**
 * Community Operations Service — composes today's territorial life.
 * Does not persist a daily-life aggregate.
 */

import type {
  CommunityOperationsContext,
  TerritoryAnnouncement,
  TerritoryDailyPulse,
} from "@life-community-os/types";
import {
  announcementFromPost,
  communityOperationActionLabel,
  personalizeTerritoryDailyPulse,
  projectCommunityOperationsContext,
  projectTerritoryDailyPulse,
  recordMatchesTerritoryScope,
  reservationIsActive,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { canModerateCommunity } from "@/lib/community/permissions";
import {
  createCommunityNotification,
  createCommunityPost,
  listCommunityEvents,
  listCommunityNotifications,
  listPublishedPosts,
} from "@/lib/community/server-community-repository";
import { listExperiencesServer } from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { listReservationsServer } from "@/lib/reservations/server-reservations-repository";
import { resolvePersonalContext } from "@/lib/personal/personalization-service";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export class OperationsDeniedError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "OperationsDeniedError";
  }
}

function requireActor(actor: RequestActor, tenantId: string): string {
  if (!actor.authenticated || !actor.hasMembership || !actor.personId) {
    throw new OperationsDeniedError("unauthorized");
  }
  if (
    resolveTenantPublicId(actor.tenantSlug) !==
    resolveTenantPublicId(tenantId)
  ) {
    throw new OperationsDeniedError("forbidden");
  }
  return actor.personId;
}

export const CommunityOperationsService = {
  async announcements(input: {
    tenantId: string;
    territoryId: string;
  }): Promise<TerritoryAnnouncement[]> {
    const posts = await listPublishedPosts(input.tenantId);
    return posts
      .filter((post) =>
        recordMatchesTerritoryScope(post.territoryId, input.territoryId),
      )
      .map(announcementFromPost)
      .filter((item): item is TerritoryAnnouncement => Boolean(item));
  },

  async createAnnouncement(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    title: string;
    body: string;
    createdByFromClient?: string | null;
  }): Promise<TerritoryAnnouncement> {
    const personId = requireActor(input.actor, input.tenantId);
    if (input.createdByFromClient) {
      throw new OperationsDeniedError("owner_immutable");
    }
    if (!canModerateCommunity(input.actor.role)) {
      throw new OperationsDeniedError("forbidden");
    }
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title || !body) throw new OperationsDeniedError("invalid");
    const post = await createCommunityPost({
      tenantId: input.tenantId,
      authorPersonId: personId,
      authorDisplayName:
        input.actor.currentUser.displayName?.trim() ||
        input.actor.currentUser.email?.split("@")[0] ||
        "Comunidad",
      title,
      body,
      kind: "announcement",
      territoryId: input.territoryId,
    });
    const projected = announcementFromPost(post);
    if (!projected) throw new OperationsDeniedError("invalid");
    await recordAdminAudit({
      actor: input.actor,
      action: "content.publish",
      entityType: "post",
      entityId: post.id,
      reason: "territory_announcement",
      metadata: { territoryId: input.territoryId },
    });
    return projected;
  },

  async pulse(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<TerritoryDailyPulse> {
    requireActor(input.actor, input.tenantId);
    const items = await CommunityExperienceFeedService.list({
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      permissions: input.actor.permissions,
    });
    const announcements = await this.announcements(input);
    const pulse = projectTerritoryDailyPulse({
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      items,
      announcements,
    });
    const context = await resolvePersonalContext({
      tenantId: input.tenantId,
      actor: input.actor,
      territoryId: input.territoryId,
    });
    return personalizeTerritoryDailyPulse(pulse, context);
  },

  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<CommunityOperationsContext> {
    requireActor(input.actor, input.tenantId);
    const territoryId = input.territoryId;
    const tenantId = resolveTenantPublicId(input.tenantId);
    const [experiences, events, reservations, help, businesses, announcements] =
      await Promise.all([
        listExperiencesServer(input.tenantId, undefined, { territoryId }),
        listCommunityEvents(input.tenantId),
        listReservationsServer(input.tenantId),
        listHelpRequestsServer(input.tenantId),
        listBusinessesServer(input.tenantId),
        this.announcements(input),
      ]);
    const inScope = (recordTerritoryId?: string) =>
      recordMatchesTerritoryScope(recordTerritoryId, territoryId);
    return projectCommunityOperationsContext({
      tenantId,
      territoryId,
      experiences: experiences.filter(
        (item) => item.status === "published" && inScope(item.territoryId),
      ).length,
      events: events.filter(
        (item) => item.status === "published" && inScope(item.territoryId),
      ).length,
      reservations: reservations.filter(
        (item) =>
          reservationIsActive(item.status) && inScope(item.territoryId),
      ).length,
      announcements: announcements.length,
      help: help.filter(
        (item) => item.status === "open" && inScope(item.territoryId),
      ).length,
      services: businesses.filter(
        (item) => item.status === "published" && inScope(item.territoryId),
      ).length,
      actions: [
        {
          kind: "create_today",
          label: communityOperationActionLabel("create_today"),
          href: "/",
        },
        {
          kind: "ask_help",
          label: communityOperationActionLabel("ask_help"),
          href: "/help/create?type=need_help",
        },
      ],
    });
  },

  async remindActor(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<number> {
    const personId = requireActor(input.actor, input.tenantId);
    const reservations = (await listReservationsServer(input.tenantId)).filter(
      (item) =>
        item.createdBy === personId &&
        reservationIsActive(item.status) &&
        recordMatchesTerritoryScope(item.territoryId, input.territoryId),
    );
    if (reservations.length === 0) return 0;
    const existing = await listCommunityNotifications(input.tenantId, personId);
    const already = new Set(
      existing
        .filter((item) => item.kind === "experience_reminder")
        .map((item) => item.entityId),
    );
    let created = 0;
    for (const reservation of reservations.slice(0, 2)) {
      if (already.has(reservation.id)) continue;
      await createCommunityNotification({
        tenantId: input.tenantId,
        recipientPersonId: personId,
        kind: "experience_reminder",
        title: "Reserva cercana",
        body: reservation.resourceName
          ? `Tienes una reserva de ${reservation.resourceName}.`
          : "Tienes una reserva próxima en tu territorio.",
        entityType: "event",
        entityId: reservation.id,
        createdBy: personId,
      });
      created += 1;
    }
    return created;
  },
};
