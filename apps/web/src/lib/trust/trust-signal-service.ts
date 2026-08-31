/**
 * Trust Signal Service — projects real domain activity into TrustContext.
 * Does not persist scores or rankings.
 */

import type {
  CommunityFeedItem,
  TrustContext,
  TrustPrivacy,
} from "@life-community-os/types";
import {
  businessTrustLabels,
  countTrustSignals,
  emptyTrustContext,
  hasPositiveTrustHistory,
  ownTrustContribution,
  placeTrustLabel,
  projectTrustContext,
  publicPersonTrustLabels,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { listCommunitySnapshot } from "@/lib/community/server-community-repository";
import { createCommunityNotification } from "@/lib/community/server-community-repository";
import {
  listExperienceParticipationsByPersonServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import {
  getTrustPrivacyServer,
  hasDeliveredThanksServer,
  markThanksDeliveredServer,
  patchTrustPrivacyServer,
} from "@/lib/trust/server-trust-repository";

export class TrustDeniedError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "TrustDeniedError";
  }
}

function inTerritory(
  recordTerritoryId: string | null | undefined,
  territoryId: string,
): boolean {
  return !recordTerritoryId || recordTerritoryId === territoryId;
}

async function countSignals(input: {
  tenantId: string;
  personId: string;
  territoryId: string;
}) {
  const experiences = await listExperiencesServer(input.tenantId, undefined, {
    territoryId: input.territoryId,
  });
  const hosted = experiences.filter(
    (item) =>
      item.ownerPersonId === input.personId &&
      item.status !== "cancelled" &&
      item.status !== "archived",
  ).length;
  const joined = (
    await listExperienceParticipationsByPersonServer(
      input.tenantId,
      input.personId,
    )
  ).filter((row) => row.role === "participant").length;
  const help = (await listHelpRequestsServer(input.tenantId)).filter(
    (item) =>
      item.createdBy === input.personId &&
      item.type === "offer_help" &&
      inTerritory(item.territoryId, input.territoryId),
  ).length;
  const snapshot = await listCommunitySnapshot(input.tenantId);
  const posts = snapshot.posts.filter(
    (item) =>
      item.authorPersonId === input.personId &&
      item.status === "published" &&
      inTerritory(item.territoryId, input.territoryId),
  ).length;
  const events = snapshot.events.filter(
    (item) =>
      item.authorPersonId === input.personId &&
      item.status === "published" &&
      inTerritory(item.territoryId, input.territoryId),
  ).length;
  const groups = snapshot.groups.filter(
    (item) =>
      item.createdBy === input.personId &&
      item.status !== "archived" &&
      inTerritory(item.territoryId, input.territoryId),
  ).length;
  const businesses = (await listBusinessesServer(input.tenantId)).filter(
    (item) =>
      item.ownerPersonId === input.personId &&
      item.status === "published" &&
      Boolean(item.locationId) &&
      inTerritory(item.territoryId, input.territoryId),
  ).length;
  return countTrustSignals({
    experienceHosted: hosted,
    experienceJoined: joined,
    helpProvided: help,
    communityContributions: posts + events + groups,
    verifiedBusinesses: businesses,
  });
}

export async function resolveTrustContext(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  personId?: string | null;
}): Promise<TrustContext> {
  const actorId = input.actor.personId;
  if (!input.actor.hasMembership || !actorId) {
    return emptyTrustContext({
      personId: "anonymous",
      tenantId: input.tenantId,
      territoryId: input.territoryId,
    });
  }
  const targetId = input.personId?.trim() || actorId;
  if (targetId !== actorId) {
    throw new TrustDeniedError("forbidden");
  }
  const privacy = await getTrustPrivacyServer({
    tenantId: input.tenantId,
    personId: actorId,
  });
  const signals = await countSignals({
    tenantId: input.tenantId,
    personId: actorId,
    territoryId: input.territoryId,
  });
  return projectTrustContext({
    personId: actorId,
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    signals,
    privacy,
  });
}

export async function saveTrustPrivacy(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  privacy: Partial<TrustPrivacy>;
}): Promise<TrustContext> {
  const personId = input.actor.personId;
  if (!personId || !input.actor.hasMembership) {
    throw new TrustDeniedError("unauthorized");
  }
  await patchTrustPrivacyServer({
    tenantId: input.tenantId,
    personId,
    privacy: input.privacy,
  });
  return resolveTrustContext({
    tenantId: input.tenantId,
    actor: input.actor,
    territoryId: input.territoryId,
  });
}

export async function publicTrustLabelsForPerson(input: {
  tenantId: string;
  territoryId: string;
  personId: string;
}): Promise<string[]> {
  const personId = input.personId.trim();
  if (!personId) return [];
  const privacy = await getTrustPrivacyServer({
    tenantId: input.tenantId,
    personId,
  });
  const signals = await countSignals({
    tenantId: input.tenantId,
    personId,
    territoryId: input.territoryId,
  });
  return publicPersonTrustLabels(
    projectTrustContext({
      personId,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      signals,
      privacy,
    }),
  );
}

export async function listTrustedOrganizerIds(input: {
  tenantId: string;
  territoryId: string;
  personIds: readonly string[];
}): Promise<string[]> {
  const unique = [...new Set(input.personIds.filter(Boolean))];
  const trusted: string[] = [];
  for (const personId of unique) {
    const privacy = await getTrustPrivacyServer({
      tenantId: input.tenantId,
      personId,
    });
    if (!privacy.visible || !privacy.showSignals) continue;
    const signals = await countSignals({
      tenantId: input.tenantId,
      personId,
      territoryId: input.territoryId,
    });
    if (hasPositiveTrustHistory(signals)) trusted.push(personId);
  }
  return trusted;
}

export async function thankCommunityContribution(input: {
  tenantId: string;
  recipientPersonId: string;
  key: string;
  title: string;
  body: string;
  createdBy: string;
}): Promise<void> {
  if (input.recipientPersonId === input.createdBy) return;
  if (
    await hasDeliveredThanksServer({
      tenantId: input.tenantId,
      key: input.key,
    })
  ) {
    return;
  }
  await createCommunityNotification({
    tenantId: input.tenantId,
    recipientPersonId: input.recipientPersonId,
    kind: "community_thanks",
    title: input.title,
    body: input.body,
    createdBy: input.createdBy,
  });
  await markThanksDeliveredServer({
    tenantId: input.tenantId,
    key: input.key,
  });
}

export async function annotateFeedWithTrust(input: {
  tenantId: string;
  territoryId: string;
  items: readonly CommunityFeedItem[];
}): Promise<CommunityFeedItem[]> {
  const labeled = [];
  for (const item of input.items) {
    if (item.metadata?.trustLabel || !item.metadata?.organizerPersonId) {
      labeled.push(item);
      continue;
    }
    if (item.metadata.domain !== "help" && item.metadata.domain !== "experience") {
      labeled.push(item);
      continue;
    }
    const labels = await publicTrustLabelsForPerson({
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      personId: item.metadata.organizerPersonId,
    });
    if (labels.length === 0) {
      labeled.push(item);
      continue;
    }
    labeled.push({
      ...item,
      metadata: {
        ...item.metadata,
        trustLabel: labels[0],
      },
    });
  }
  return labeled;
}

export const TrustSignalService = {
  resolve: resolveTrustContext,
  savePrivacy: saveTrustPrivacy,
  publicLabels: publicTrustLabelsForPerson,
  trustedOrganizers: listTrustedOrganizerIds,
  thank: thankCommunityContribution,
  annotateFeed: annotateFeedWithTrust,
  contribution: ownTrustContribution,
  businessLabels: businessTrustLabels,
  placeLabel: placeTrustLabel,
};
