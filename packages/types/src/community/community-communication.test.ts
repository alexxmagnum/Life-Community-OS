/**
 * Community Communication contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  createConversationRecord,
  createMessageRecord,
} from "../platform/communication/communication-core";
import { emptyPersonalContext } from "../personal/personal-context";
import {
  announcementExperienceFromTerritory,
  communicationRespectsTerritory,
  isOpaqueCommunityCommunicationEntity,
  privateConversationProtected,
  projectCommunityCommunicationContext,
  projectLifeHomeCommunicationSummary,
  resolveChannelKind,
  resolveChannels,
  resolveCommunicationPreferences,
  resolveConversation,
  resolveUnreadContext,
} from "./communication";
import type { TerritoryAnnouncement } from "./operations";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PANO = "life-panoramica";
const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";
const VALLEY_TERRITORY = "20000000-0000-4000-8000-000000000002";

function announcement(id: string): TerritoryAnnouncement {
  return {
    id,
    tenantId: PANO,
    territoryId: PANO_TERRITORY,
    title: "Mantenimiento piscina",
    body: "El lunes habrá mantenimiento de piscina",
    createdAt: new Date().toISOString(),
  };
}

describe("Community Communication", () => {
  it("TEST 1 — miembro activo accede canal territorial", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "context",
      contextType: "community",
      contextId: "territory-chat",
      title: "Comunidad",
      createdBy: "person-admin",
    });
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const projected = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context,
      conversations: [{ conversation, participants: [] }],
      announcements: [],
      hasMembership: true,
    });
    assert.equal(projected.permissions.canRead, true);
    assert.equal(projected.channels.some((row) => row.kind === "territory"), true);
  });

  it("TEST 2 — guest no accede comunicación privada", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "direct",
      contextType: "community",
      contextId: "direct:a:b",
      title: "Privado",
      createdBy: "person-a",
    });
    const context = emptyPersonalContext({
      personId: "anonymous",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const projected = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context,
      conversations: [{ conversation, participants: [] }],
      announcements: [announcement("ann-1")],
      hasMembership: false,
    });
    assert.equal(projected.conversations.length, 0);
    assert.equal(projected.permissions.canSend, false);
  });

  it("TEST 3 — mensaje privado protegido", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "direct",
      contextType: "community",
      contextId: "direct:a:b",
      title: "Privado",
      createdBy: "person-a",
    });
    const summary = resolveConversation(
      { conversation, participants: [] },
      "person-b",
    );
    assert.equal(summary.channelKind, "private");
    assert.equal(
      privateConversationProtected(summary, "person-b", true),
      false,
    );
    assert.equal(
      privateConversationProtected(summary, "person-b", false),
      true,
    );
  });

  it("TEST 4 — Community Admin no lee privados", () => {
    const projected = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-mod",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      conversations: [],
      announcements: [],
      hasMembership: true,
      isCommunityAdmin: true,
    });
    assert.equal(projected.permissions.canReadPrivateAsAdmin, false);
  });

  it("TEST 5 — moderación integrada sin vigilancia", () => {
    const projected = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-mod",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      conversations: [],
      announcements: [],
      hasMembership: true,
      isCommunityAdmin: true,
      pendingReports: 2,
    });
    assert.equal(projected.permissions.canModerate, true);
    assert.equal(projected.adminSummary?.pendingReports, 2);
  });

  it("TEST 6 — announcement territorial con acknowledgement", () => {
    const experience = announcementExperienceFromTerritory(
      announcement("ann-1"),
      [],
    );
    assert.equal(experience.requiresAcknowledgement, true);
    assert.equal(experience.acknowledged, false);
    assert.equal(experience.territoryVisible, true);
    const acked = announcementExperienceFromTerritory(
      announcement("ann-1"),
      ["ann-1"],
    );
    assert.equal(acked.acknowledged, true);
  });

  it("TEST 7 — experience communication aislada", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "context",
      contextType: "experience",
      contextId: "exp-1",
      title: "Yoga",
      createdBy: "person-alex",
    });
    assert.equal(resolveChannelKind(conversation), "experience");
  });

  it("TEST 8 — reservation communication aislada", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "context",
      contextType: "reservation",
      contextId: "res-1",
      title: "Reserva",
      createdBy: "person-alex",
    });
    assert.equal(resolveChannelKind(conversation), "reservation");
  });

  it("TEST 9 — tenant isolation", () => {
    const pano = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      conversations: [],
      announcements: [announcement("ann-pano")],
      hasMembership: true,
    });
    assert.equal(communicationRespectsTerritory(pano, PANO, PANO_TERRITORY), true);
    assert.equal(
      communicationRespectsTerritory(pano, "life-valley", VALLEY_TERRITORY),
      false,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const source = readFileSync(
      path.join(HERE, "communication.ts"),
      "utf8",
    );
    assert.equal(source.includes('if tenant === "panoramica"'), false);
    assert.equal(source.includes("if tenant === panoramica"), false);
  });

  it("TEST 11 — unread context deduplicado", () => {
    const unread = resolveUnreadContext({
      conversations: [
        {
          id: "c1",
          title: "A",
          layer: "community",
          channelKind: "territory",
          href: "/messages/c1",
          unread: true,
        },
      ],
      announcements: [
        announcementExperienceFromTerritory(announcement("ann-1"), []),
      ],
    });
    assert.equal(unread.conversationUnread, 1);
    assert.equal(unread.announcementUnread, 1);
    assert.equal(unread.totalUnread, 2);
  });

  it("TEST 12 — preferencias respetan privacy", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      privacy: { receiveRecommendations: false, shareActivity: true },
    };
    const prefs = resolveCommunicationPreferences({ context });
    assert.equal(prefs.canReceiveMessages, false);
    assert.equal(prefs.canReceiveExperienceUpdates, false);
  });

  it("TEST 13 — home communication summary acotado", () => {
    const communication = projectCommunityCommunicationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      conversations: [
        {
          conversation: createConversationRecord({
            tenantId: PANO,
            territoryId: PANO_TERRITORY,
            type: "direct",
            contextType: "community",
            contextId: "direct:a:b",
            title: "Vecino",
            createdBy: "person-a",
          }),
          participants: [],
          lastMessage: createMessageRecord({
            tenantId: PANO,
            conversationId: "c1",
            senderPersonId: "person-b",
            content: "Hola",
          }),
        },
      ],
      announcements: [announcement("ann-1")],
      hasMembership: true,
    });
    const summary = projectLifeHomeCommunicationSummary({ communication });
    assert.equal(summary.pendingConversations >= 0, true);
    assert.equal(summary.importantAnnouncements.length <= 3, true);
  });

  it("TEST 14 — no existe red social global", () => {
    assert.equal(isOpaqueCommunityCommunicationEntity("GlobalSocialNetwork"), true);
    assert.equal(isOpaqueCommunityCommunicationEntity("ResidentFollowerGraph"), true);
    assert.equal(isOpaqueCommunityCommunicationEntity("ExperienceChatEntity"), true);
  });

  it("TEST 15 — channels no exponen engagement", () => {
    const conversation = createConversationRecord({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "group",
      contextType: "group",
      contextId: "grp-1",
      title: "Grupo",
      createdBy: "person-alex",
    });
    const channels = resolveChannels({
      conversations: [{ conversation, participants: [] }],
      announcements: [],
      territoryId: PANO_TERRITORY,
      viewerPersonId: "person-alex",
    });
    assert.equal(
      JSON.stringify(channels).includes("EngagementMessagingScore"),
      false,
    );
  });
});
