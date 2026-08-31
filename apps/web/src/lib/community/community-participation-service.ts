/**
 * Community Participation Service — who participates around a domain context.
 * Does not persist a universal social entity. Writes stay in Experience, Community, Help.
 */

import {
  createParticipationContext,
  DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY,
  entityHrefForParticipation,
  mergeParticipationPrivacy,
  reservationIsActive,
  visibleParticipantIds,
  type CommunityOwnActivity,
  type CommunityParticipationContext,
  type CommunityParticipationEntityType,
  type CommunityParticipationPrivacy,
  type CommunityParticipationRow,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { actorCanJoinExperience } from "@/lib/experiences/permissions";
import {
  actorCanCreateEvent,
  actorCanCreateGroup,
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import { actorCanViewHelp } from "@/lib/help/permissions";
import {
  addEventParticipantServer,
  addGroupMemberServer,
  createCommunityNotification,
  getCommunityEventServer,
  getCommunityGroupServer,
  getParticipationPrivacyServer,
  listCommunityEvents,
  listEventParticipantsServer,
  listGroupMembershipsServer,
  listParticipationPrivacyServer,
  setParticipationPrivacyServer,
} from "@/lib/community/server-community-repository";
import { findOrCreateConversationServer } from "@/lib/communication/server-communication-repository";
import {
  getExperienceServer,
  inviteExperienceParticipantServer,
  joinExperienceServer,
  listExperienceParticipantsServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import {
  getHelpRequestServer,
  listHelpRequestsServer,
} from "@/lib/help/server-help-repository";
import { listReservationsServer } from "@/lib/reservations/server-reservations-repository";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export type ParticipationWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export class ParticipationDeniedError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "ParticipationDeniedError";
  }
}

export type ResolveParticipationInput = {
  tenantId: string;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  actor: RequestActor;
  territoryId?: string | null;
  scope?: ParticipationWriteScope;
};

export type ParticipationResolveResult = {
  context: CommunityParticipationContext;
  visiblePersonIds: string[];
};

function requireActor(actor: RequestActor): string {
  if (!actor.authenticated || !actor.hasMembership || !actor.personId) {
    throw new ParticipationDeniedError("unauthorized");
  }
  return actor.personId;
}

function activeTerritory(
  tenantId: string,
  actor: RequestActor,
  query?: string | null,
) {
  const territory = resolveActiveTerritoryContext({
    tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: query,
  });
  if ("error" in territory) {
    throw new ParticipationDeniedError("cross_territory_forbidden");
  }
  return territory.context.territoryId;
}

function assertSameTerritory(
  actor: RequestActor,
  recordTerritoryId: string | undefined,
) {
  if (!recordTerritoryId) return;
  const actorTerritory = actor.territoryId?.trim();
  if (actorTerritory && actorTerritory !== recordTerritoryId) {
    throw new ParticipationDeniedError("cross_territory_forbidden");
  }
}

async function privacyMap(
  tenantId: string,
  scope?: ParticipationWriteScope,
): Promise<Map<string, CommunityParticipationPrivacy>> {
  const rows = await listParticipationPrivacyServer(tenantId, scope);
  return new Map(rows.map((row) => [row.personId, mergeParticipationPrivacy(row)]));
}

async function notify(input: {
  tenantId: string;
  recipientPersonId: string;
  kind:
    | "experience_joined"
    | "experience_invited"
    | "event_joined"
    | "group_member_added"
    | "help_response";
  title: string;
  body: string;
  entityType: "experience" | "event" | "group" | "help";
  entityId: string;
  createdBy: string;
  scope?: ParticipationWriteScope;
}) {
  if (input.recipientPersonId === input.createdBy) return;
  await createCommunityNotification({
    tenantId: input.tenantId,
    recipientPersonId: input.recipientPersonId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    entityType: input.entityType,
    entityId: input.entityId,
    createdBy: input.createdBy,
    scope: input.scope,
  });
}

export async function ensureContextualConversation(input: {
  tenantId: string;
  actor: RequestActor;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  title?: string;
  territoryId?: string;
  participantPersonIds?: string[];
  scope?: ParticipationWriteScope;
}) {
  return findOrCreateConversationServer({
    tenantId: input.tenantId,
    actor: input.actor,
    type: input.entityType === "group" ? "group" : "context",
    contextType: input.entityType,
    contextId: input.entityId,
    title: input.title,
    territoryId: input.territoryId,
    participantPersonIds: input.participantPersonIds,
    scope: input.scope,
  });
}

async function rowsFor(
  input: ResolveParticipationInput,
  territoryId: string,
): Promise<{
  rows: CommunityParticipationRow[];
  recordTerritoryId: string;
  canJoin: boolean;
  canInvite: boolean;
  canConverse: boolean;
}> {
  const personId = input.actor.personId;
  switch (input.entityType) {
    case "experience": {
      const experience = await getExperienceServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!experience) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, experience.territoryId);
      const participants = await listExperienceParticipantsServer(
        input.tenantId,
        experience.id,
        input.scope,
      );
      const joined = participants.some(
        (row) =>
          row.personId === personId &&
          (row.role === "creator" ||
            row.role === "participant" ||
            row.role === "waitlist" ||
            row.role === "invited"),
      );
      return {
        rows: participants.map((row) => ({
          personId: row.personId,
          role: row.role,
        })),
        recordTerritoryId: experience.territoryId,
        canJoin: actorCanJoinExperience(input.actor),
        canInvite: Boolean(joined && actorCanJoinExperience(input.actor)),
        canConverse: Boolean(joined),
      };
    }
    case "event": {
      const event = await getCommunityEventServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!event) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, event.territoryId);
      const participants = await listEventParticipantsServer(
        input.tenantId,
        event.id,
        input.scope,
      );
      const joined = participants.some(
        (row) =>
          row.personId === personId &&
          (row.role === "organizer" ||
            row.role === "participant" ||
            row.role === "invited"),
      );
      return {
        rows: participants.map((row) => ({
          personId: row.personId,
          role: row.role,
        })),
        recordTerritoryId: event.territoryId ?? territoryId,
        canJoin:
          actorCanCreateEvent(input.actor) || actorCanViewCommunity(input.actor),
        canInvite: Boolean(joined && actorCanViewCommunity(input.actor)),
        canConverse: Boolean(joined),
      };
    }
    case "group": {
      const group = await getCommunityGroupServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!group) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, group.territoryId);
      const members = await listGroupMembershipsServer(
        input.tenantId,
        group.id,
        input.scope,
      );
      const joined = members.some(
        (row) =>
          row.personId === personId &&
          (row.status === "active" || row.status === "invited"),
      );
      return {
        rows: members.map((row) => ({
          personId: row.personId,
          role: row.status === "active" ? row.role || "member" : row.status,
        })),
        recordTerritoryId: group.territoryId ?? territoryId,
        canJoin: actorCanViewCommunity(input.actor),
        canInvite: Boolean(
          joined &&
            (actorCanCreateGroup(input.actor) ||
              actorCanViewCommunity(input.actor)),
        ),
        canConverse: Boolean(joined),
      };
    }
    case "help": {
      const help = await getHelpRequestServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!help) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, help.territoryId);
      return {
        rows: [{ personId: help.createdBy, role: "organizer" }],
        recordTerritoryId: help.territoryId ?? territoryId,
        canJoin: actorCanViewHelp(input.actor),
        canInvite: false,
        canConverse: actorCanViewHelp(input.actor),
      };
    }
  }
}

export async function resolveParticipation(
  input: ResolveParticipationInput,
): Promise<ParticipationResolveResult> {
  requireActor(input.actor);
  const territoryId = activeTerritory(
    input.tenantId,
    input.actor,
    input.territoryId,
  );
  const resolved = await rowsFor(input, territoryId ?? "");
  const context = createParticipationContext({
    tenantId: input.tenantId,
    territoryId: resolved.recordTerritoryId,
    entityType: input.entityType,
    entityId: input.entityId,
    rows: resolved.rows,
    viewerPersonId: input.actor.personId,
    canJoin: resolved.canJoin,
    canInvite: resolved.canInvite,
    canConverse: resolved.canConverse,
  });
  const privacy = await privacyMap(input.tenantId, input.scope);
  return {
    context,
    visiblePersonIds: visibleParticipantIds(resolved.rows, privacy),
  };
}

export async function joinParticipation(input: {
  tenantId: string;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  actor: RequestActor;
  scope?: ParticipationWriteScope;
}): Promise<ParticipationResolveResult> {
  const personId = requireActor(input.actor);
  void activeTerritory(input.tenantId, input.actor);
  switch (input.entityType) {
    case "experience": {
      const experience = await getExperienceServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!experience) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, experience.territoryId);
      if (!actorCanJoinExperience(input.actor)) {
        throw new ParticipationDeniedError("forbidden");
      }
      await joinExperienceServer({
        tenantId: input.tenantId,
        experienceId: experience.id,
        personId,
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: experience.ownerPersonId,
        kind: "experience_joined",
        title: "Nuevo plan en tu comunidad",
        body: `${experience.title}: alguien se ha unido.`,
        entityType: "experience",
        entityId: experience.id,
        createdBy: personId,
        scope: input.scope,
      });
      void import("@/lib/trust/trust-signal-service").then(({ TrustSignalService }) =>
        TrustSignalService.thank({
          tenantId: input.tenantId,
          recipientPersonId: experience.ownerPersonId,
          key: `thanks:host:${experience.id}`,
          title: "Gracias por organizar esta actividad.",
          body: experience.title,
          createdBy: personId,
        }),
      );
      await ensureContextualConversation({
        tenantId: input.tenantId,
        actor: input.actor,
        entityType: "experience",
        entityId: experience.id,
        title: experience.title,
        territoryId: experience.territoryId,
        scope: input.scope,
      });
      break;
    }
    case "event": {
      const event = await getCommunityEventServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!event) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, event.territoryId);
      await addEventParticipantServer({
        tenantId: input.tenantId,
        eventId: event.id,
        personId,
        createdBy: personId,
        role: "participant",
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: event.authorPersonId,
        kind: "event_joined",
        title: "Alguien se une a tu evento",
        body: event.title,
        entityType: "event",
        entityId: event.id,
        createdBy: personId,
        scope: input.scope,
      });
      await ensureContextualConversation({
        tenantId: input.tenantId,
        actor: input.actor,
        entityType: "event",
        entityId: event.id,
        title: event.title,
        territoryId: event.territoryId,
        scope: input.scope,
      });
      break;
    }
    case "group": {
      const group = await getCommunityGroupServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!group) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, group.territoryId);
      await addGroupMemberServer({
        tenantId: input.tenantId,
        groupId: group.id,
        personId,
        createdBy: personId,
        status: "active",
        role: "member",
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: group.createdBy,
        kind: "group_member_added",
        title: "Nuevo miembro en el grupo",
        body: group.name,
        entityType: "group",
        entityId: group.id,
        createdBy: personId,
        scope: input.scope,
      });
      await ensureContextualConversation({
        tenantId: input.tenantId,
        actor: input.actor,
        entityType: "group",
        entityId: group.id,
        title: group.name,
        territoryId: group.territoryId,
        scope: input.scope,
      });
      break;
    }
    case "help":
      throw new ParticipationDeniedError("use_respond");
  }
  return resolveParticipation(input);
}

export async function inviteToParticipation(input: {
  tenantId: string;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  inviteePersonId: string;
  actor: RequestActor;
  scope?: ParticipationWriteScope;
}): Promise<ParticipationResolveResult> {
  const personId = requireActor(input.actor);
  const invitee = input.inviteePersonId.trim();
  if (!invitee || invitee === personId) {
    throw new ParticipationDeniedError("invalid_invitee");
  }
  void activeTerritory(input.tenantId, input.actor);
  const privacy =
    (await getParticipationPrivacyServer(
      input.tenantId,
      invitee,
      input.scope,
    )) ?? DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY;
  if (!privacy.receiveInvitations) {
    throw new ParticipationDeniedError("invitations_disabled");
  }
  const current = await resolveParticipation(input);
  if (current.context.viewerParticipation.status === "none") {
    throw new ParticipationDeniedError("forbidden");
  }
  switch (input.entityType) {
    case "experience": {
      const experience = await getExperienceServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!experience) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, experience.territoryId);
      await inviteExperienceParticipantServer({
        tenantId: input.tenantId,
        experienceId: experience.id,
        inviteePersonId: invitee,
        createdBy: personId,
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: invitee,
        kind: "experience_invited",
        title: "Te invitan a un plan",
        body: experience.title,
        entityType: "experience",
        entityId: experience.id,
        createdBy: personId,
        scope: input.scope,
      });
      await ensureContextualConversation({
        tenantId: input.tenantId,
        actor: input.actor,
        entityType: "experience",
        entityId: experience.id,
        title: experience.title,
        territoryId: experience.territoryId,
        participantPersonIds: [invitee],
        scope: input.scope,
      });
      break;
    }
    case "event": {
      const event = await getCommunityEventServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!event) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, event.territoryId);
      await addEventParticipantServer({
        tenantId: input.tenantId,
        eventId: event.id,
        personId: invitee,
        createdBy: personId,
        role: "invited",
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: invitee,
        kind: "event_joined",
        title: "Te invitan a un evento",
        body: event.title,
        entityType: "event",
        entityId: event.id,
        createdBy: personId,
        scope: input.scope,
      });
      break;
    }
    case "group": {
      const group = await getCommunityGroupServer(
        input.tenantId,
        input.entityId,
        input.scope,
      );
      if (!group) throw new ParticipationDeniedError("not_found");
      assertSameTerritory(input.actor, group.territoryId);
      await addGroupMemberServer({
        tenantId: input.tenantId,
        groupId: group.id,
        personId: invitee,
        createdBy: personId,
        status: "invited",
        role: "member",
        scope: input.scope,
      });
      await notify({
        tenantId: input.tenantId,
        recipientPersonId: invitee,
        kind: "group_member_added",
        title: "Invitación a un grupo",
        body: group.name,
        entityType: "group",
        entityId: group.id,
        createdBy: personId,
        scope: input.scope,
      });
      break;
    }
    case "help":
      throw new ParticipationDeniedError("use_respond");
  }
  return resolveParticipation(input);
}

export async function respondToHelp(input: {
  tenantId: string;
  helpId: string;
  actor: RequestActor;
  scope?: ParticipationWriteScope;
}): Promise<ParticipationResolveResult> {
  const personId = requireActor(input.actor);
  void activeTerritory(input.tenantId, input.actor);
  const help = await getHelpRequestServer(
    input.tenantId,
    input.helpId,
    input.scope,
  );
  if (!help) throw new ParticipationDeniedError("not_found");
  assertSameTerritory(input.actor, help.territoryId);
  if (!actorCanViewHelp(input.actor)) {
    throw new ParticipationDeniedError("forbidden");
  }
  await ensureContextualConversation({
    tenantId: input.tenantId,
    actor: input.actor,
    entityType: "help",
    entityId: help.id,
    title: help.title,
    territoryId: help.territoryId,
    participantPersonIds: [help.createdBy],
    scope: input.scope,
  });
  await notify({
    tenantId: input.tenantId,
    recipientPersonId: help.createdBy,
    kind: "help_response",
    title: "Alguien responde a tu petición",
    body: help.title,
    entityType: "help",
    entityId: help.id,
    createdBy: personId,
    scope: input.scope,
  });
  const helperId = help.type === "offer_help" ? help.createdBy : personId;
  void import("@/lib/trust/trust-signal-service").then(({ TrustSignalService }) =>
    TrustSignalService.thank({
      tenantId: input.tenantId,
      recipientPersonId: helperId,
      key: `thanks:help:${help.id}`,
      title: "Tu ayuda ha sido valorada por la comunidad.",
      body: help.title,
      createdBy: personId,
    }),
  );
  return resolveParticipation({
    tenantId: input.tenantId,
    entityType: "help",
    entityId: help.id,
    actor: input.actor,
    scope: input.scope,
  });
}

export async function listOwnCommunityActivity(input: {
  tenantId: string;
  actor: RequestActor;
  scope?: ParticipationWriteScope;
}): Promise<CommunityOwnActivity> {
  const personId = requireActor(input.actor);
  const territoryId = activeTerritory(input.tenantId, input.actor);
  const privacy =
    (await getParticipationPrivacyServer(
      input.tenantId,
      personId,
      input.scope,
    )) ?? DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY;
  if (!privacy.showActivity) {
    return {
      experiencesCreated: [],
      upcomingEvents: [],
      helpOffered: [],
      upcomingReservations: [],
    };
  }
  const experiences = (
    await listExperiencesServer(input.tenantId, input.scope, { territoryId })
  ).filter(
    (item) =>
      item.ownerPersonId === personId &&
      item.status !== "cancelled" &&
      item.status !== "archived",
  );
  const events = (await listCommunityEvents(input.tenantId, input.scope)).filter(
    (item) =>
      (item.territoryId ?? territoryId) === territoryId &&
      item.authorPersonId === personId,
  );
  const help = (await listHelpRequestsServer(input.tenantId, input.scope)).filter(
    (item) =>
      item.createdBy === personId &&
      item.type === "offer_help" &&
      (item.territoryId ?? territoryId) === territoryId,
  );
  const reservations = (
    await listReservationsServer(input.tenantId, input.scope)
  ).filter(
    (item) =>
      item.createdBy === personId &&
      reservationIsActive(item.status) &&
      (item.territoryId ?? territoryId) === territoryId,
  );
  return {
    experiencesCreated: experiences.map((item) => ({
      id: item.id,
      title: item.title,
      href: entityHrefForParticipation("experience", item.id),
      startsAt: item.startsAt,
      status: item.status,
    })),
    upcomingEvents: events.map((item) => ({
      id: item.id,
      title: item.title,
      href: entityHrefForParticipation("event", item.id),
      startsAt: item.startsAt,
      status: item.status,
    })),
    helpOffered: help.map((item) => ({
      id: item.id,
      title: item.title,
      href: entityHrefForParticipation("help", item.id),
      status: item.status,
    })),
    upcomingReservations: reservations.map((item) => ({
      id: item.id,
      title: item.resourceId ?? "Reserva",
      href: "/reservations",
      startsAt: item.date,
      status: item.status,
    })),
  };
}

export async function updateOwnParticipationPrivacy(input: {
  tenantId: string;
  actor: RequestActor;
  privacy: CommunityParticipationPrivacy;
  scope?: ParticipationWriteScope;
}): Promise<CommunityParticipationPrivacy> {
  const personId = requireActor(input.actor);
  const saved = await setParticipationPrivacyServer({
    tenantId: input.tenantId,
    personId,
    privacy: mergeParticipationPrivacy(input.privacy),
    scope: input.scope,
  });
  return mergeParticipationPrivacy(saved);
}

export const CommunityParticipationService = {
  resolve: resolveParticipation,
  join: joinParticipation,
  invite: inviteToParticipation,
  respond: respondToHelp,
  activity: listOwnCommunityActivity,
  privacy: updateOwnParticipationPrivacy,
  ensureConversation: ensureContextualConversation,
};
