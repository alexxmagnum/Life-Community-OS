/**
 * Community Automation Service — proactive assistance with user confirmation.
 * Composes domain projections. Never executes actions without explicit confirm.
 */

import {
  createAutomationPreview,
  operationalHintsFromPlace,
  projectCommunityAutomationContext,
  resolveAdminOperationalHints,
  resolveTriggers,
  RuleBasedAutomationProvider,
  recordMatchesTerritoryScope,
  reservationIsActive,
  type CommunityAutomationContext,
  type CommunityAutomationPreview,
  type CommunityOperationalHint,
  type LifePlaceExperienceView,
  type ReservationAutomationRow,
  type ExperienceAutomationRow,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { CommunityOperationsService } from "@/lib/community/community-operations-service";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import {
  createCommunityNotification,
  listCommunityEvents,
  listCommunityNotifications,
} from "@/lib/community/server-community-repository";
import { canModerateCommunity } from "@/lib/community/permissions";
import { listExperiencesServer } from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { listPersonalFavoritesServer } from "@/lib/personal/server-personal-repository";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { listReservationsServer } from "@/lib/reservations/server-reservations-repository";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

async function automationInput(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  place?: import("@life-community-os/types").LifePlaceContext;
}) {
  const context = await PersonalizationService.resolve({
    tenantId: input.tenantId,
    actor: input.actor,
    territoryId: input.territoryId,
  });
  const personId = input.actor.personId;
  const pack = getTenantPack(input.tenantId);
  const [reservations, experiences, announcements, feed, favorites, events, help] =
    await Promise.all([
      listReservationsServer(input.tenantId),
      listExperiencesServer(input.tenantId, undefined, {
        territoryId: input.territoryId,
      }),
      CommunityOperationsService.announcements({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
      }),
      CommunityExperienceFeedService.list({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        productCapabilities: pack?.productCapabilities,
        permissions: input.actor.permissions,
      }),
      personId && input.actor.hasMembership
        ? listPersonalFavoritesServer({
            tenantId: input.tenantId,
            personId,
          })
        : Promise.resolve([]),
      listCommunityEvents(input.tenantId),
      listHelpRequestsServer(input.tenantId),
    ]);
  const inScope = (territoryId?: string) =>
    recordMatchesTerritoryScope(territoryId, input.territoryId);
  const ownReservations: ReservationAutomationRow[] = reservations
    .filter(
      (row) =>
        row.createdBy === personId &&
        reservationIsActive(row.status) &&
        inScope(row.territoryId),
    )
    .map((row) => ({
      id: row.id,
      tenantId: row.tenantId ?? input.tenantId,
      territoryId: row.territoryId,
      createdBy: row.createdBy,
      date: row.date,
      start: row.start,
      resourceName: row.resourceName,
      status: row.status,
    }));
  const scopedExperiences: ExperienceAutomationRow[] = experiences
    .filter((row) => row.status === "published" && inScope(row.territoryId))
    .map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      territoryId: row.territoryId,
      title: row.title,
      startsAt: row.startsAt,
      status: row.status,
      capacity: row.capacity,
    }));
  const isCommunityAdmin = canModerateCommunity(input.actor.role);
  const adminHints = isCommunityAdmin
    ? resolveAdminOperationalHints({
        pendingEvents: events.filter(
          (row) => row.status === "draft" && inScope(row.territoryId),
        ).length,
        openHelpRequests: help.filter(
          (row) => row.status === "open" && inScope(row.territoryId),
        ).length,
      })
    : [];
  return {
    context,
    reservations: ownReservations,
    experiences: scopedExperiences,
    announcements,
    feed,
    favoriteLocationIds: favorites
      .filter((row) => row.kind === "location")
      .map((row) => row.targetId),
    place: input.place,
    isCommunityAdmin,
    adminHints,
  };
}

export const CommunityAutomationService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    place?: import("@life-community-os/types").LifePlaceContext;
  }): Promise<CommunityAutomationContext> {
    const base = await automationInput(input);
    const triggers = RuleBasedAutomationProvider.resolveTriggers(base);
    return projectCommunityAutomationContext({
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      context: base.context,
      triggers,
      adminHints: base.adminHints,
      isCommunityAdmin: base.isCommunityAdmin,
    });
  },

  resolveTriggers,
  createAutomationPreview,

  async preview(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    triggerId: string;
  }): Promise<CommunityAutomationPreview | null> {
    const automation = await this.resolve(input);
    const trigger = automation.triggers.find((row) => row.id === input.triggerId);
    if (!trigger) return null;
    return createAutomationPreview(trigger);
  },

  async confirm(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    previewId: string;
  }): Promise<{ ok: true; notificationId: string } | { ok: false; error: string }> {
    const personId = input.actor.personId;
    if (!input.actor.hasMembership || !personId) {
      return { ok: false, error: "forbidden" };
    }
    const automation = await this.resolve(input);
    if (!automation.permissions.canConfirm) {
      return { ok: false, error: "recommendations_disabled" };
    }
    const preview = automation.suggestions.find(
      (row) => row.id === input.previewId,
    );
    if (!preview) return { ok: false, error: "not_found" };
    const existing = await listCommunityNotifications(input.tenantId, personId);
    const duplicate = existing.some(
      (row) =>
        row.kind === preview.notificationKind &&
        row.entityId === preview.entityId,
    );
    if (duplicate) return { ok: false, error: "already_delivered" };
    const notification = await createCommunityNotification({
      tenantId: input.tenantId,
      recipientPersonId: personId,
      kind: preview.notificationKind,
      title: preview.title,
      body: `${preview.body} ${preview.explanation}`.trim(),
      entityType:
        preview.entityType === "experience"
          ? "experience"
          : preview.entityType === "event"
            ? "event"
            : undefined,
      entityId: preview.entityId,
      createdBy: personId,
    });
    await recordAdminAudit({
      actor: input.actor,
      action: "community.automation.confirmed",
      entityType: "person",
      entityId: personId,
      reason: "automation_confirmed",
      metadata: {
        previewId: preview.id,
        triggerId: preview.triggerId,
        territoryId: input.territoryId,
        notificationKind: preview.notificationKind,
      },
    });
    return { ok: true, notificationId: notification.id };
  },

  async enrichLifePlaceView(
    view: LifePlaceExperienceView,
    input: {
      tenantId: string;
      actor: RequestActor;
      territoryId: string;
      place: import("@life-community-os/types").LifePlaceContext;
    },
  ): Promise<LifePlaceExperienceView> {
    if (!input.actor.hasMembership) return view;
    const context = await PersonalizationService.resolve({
      tenantId: input.tenantId,
      actor: input.actor,
      territoryId: input.territoryId,
    });
    if (!context.privacy.receiveRecommendations) return view;
    const hints = operationalHintsFromPlace(input.place, context);
    return hints.length > 0 ? { ...view, operationalHints: hints } : view;
  },

  resolveOperationalHints(
    place: import("@life-community-os/types").LifePlaceContext,
    context: import("@life-community-os/types").PersonalContext,
  ): CommunityOperationalHint[] {
    return operationalHintsFromPlace(place, context);
  },
};
