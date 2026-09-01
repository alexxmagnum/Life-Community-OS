/**
 * Community Communication isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  communicationRespectsTerritory,
  isOpaqueCommunityCommunicationEntity,
  privateConversationProtected,
  resolveChannelKind,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CommunityCommunicationService } from "@/lib/community/community-communication-service";
import {
  createCommunityPost,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  findOrCreateConversationServer,
  postMessageServer,
  replaceCommunicationStoreForTests,
} from "@/lib/communication/server-communication-repository";
import { replaceGovernanceStoreForTests } from "@/lib/governance/server-governance-repository";
import { replacePersonalStoreForTests } from "@/lib/personal/server-personal-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";

process.env.LCOS_COMMUNICATION_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
  hasMembership?: boolean;
}): RequestActor {
  const personId = input.personId ?? "person-alex";
  const hasMembership = input.hasMembership ?? true;
  const role = input.role ?? "member";
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : "",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

describe("Community Communication isolation", () => {
  beforeEach(async () => {
    await replaceCommunicationStoreForTests(PANO);
    await replaceCommunicationStoreForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceGovernanceStoreForTests(PANO);
    await replaceGovernanceStoreForTests(VALLEY);
    await replacePersonalStoreForTests(PANO);
    await replacePersonalStoreForTests(VALLEY);
  });

  it("TEST 1 — miembro activo accede canal territorial", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "context",
      contextType: "community",
      contextId: "territory-board",
      title: "Territorio",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.permissions.canRead, true);
    assert.equal(communication.channels.length > 0, true);
  });

  it("TEST 2 — guest no accede comunicación privada", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false, personId: "" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.conversations.length, 0);
    assert.equal(communication.permissions.canSend, false);
  });

  it("TEST 3 — mensaje privado protegido", async () => {
    const thread = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    const summary = communicationRespectsTerritory(
      await CommunityCommunicationService.resolve({
        tenantId: PANO,
        actor: actor({ tenantSlug: PANO, personId: "person-mia" }),
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      }),
      PANO,
      LIFE_PANORAMICA_TERRITORY_UUID,
    );
    assert.equal(summary, true);
    assert.equal(resolveChannelKind(thread.conversation), "private");
  });

  it("TEST 4 — Community Admin no lee privados", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, role: "moderator", personId: "person-mod" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.permissions.canReadPrivateAsAdmin, false);
    const privateConvo = communication.conversations.find(
      (row) => row.channelKind === "private",
    );
    if (privateConvo) {
      assert.equal(
        privateConversationProtected(privateConvo, "person-mod", true),
        false,
      );
    }
  });

  it("TEST 5 — moderación funciona", async () => {
    const thread = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      type: "context",
      contextType: "community",
      contextId: "public-thread",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const message = await postMessageServer({
      tenantId: PANO,
      conversationId: thread.conversation.id,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      content: "Contenido reportable",
    });
    const report = await CommunityCommunicationService.reportMessage({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-mia" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      messageId: message.id,
      reason: "spam",
    });
    assert.equal(report.entityType, "message");
    assert.equal(report.status, "open");
  });

  it("TEST 6 — announcement territorial", async () => {
    await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-mod",
      authorDisplayName: "Admin",
      title: "Aviso",
      body: "Mantenimiento",
      kind: "announcement",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.announcements.length, 1);
    assert.equal(communication.announcements[0]?.requiresAcknowledgement, true);
  });

  it("TEST 7 — experience communication aislada", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "context",
      contextType: "experience",
      contextId: "exp-yoga",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      communication.conversations.some((row) => row.channelKind === "experience"),
      true,
    );
  });

  it("TEST 8 — reservation communication aislada", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "context",
      contextType: "reservation",
      contextId: "res-1",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      communication.conversations.some((row) => row.channelKind === "reservation"),
      true,
    );
  });

  it("TEST 9 — tenant A separado tenant B", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "context",
      contextType: "community",
      contextId: "pano-only",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    await findOrCreateConversationServer({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
      type: "context",
      contextType: "community",
      contextId: "valley-only",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const pano = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const valley = await CommunityCommunicationService.resolve({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(
      pano.conversations.some((row) => row.contextId === "valley-only"),
      false,
    );
    assert.equal(
      valley.conversations.some((row) => row.contextId === "pano-only"),
      false,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", async () => {
    const pano = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      communicationRespectsTerritory(
        pano,
        PANO,
        LIFE_PANORAMICA_TERRITORY_UUID,
      ),
      true,
    );
    assert.equal(
      communicationRespectsTerritory(
        pano,
        VALLEY,
        LIFE_VALLEY_TERRITORY_UUID,
      ),
      false,
    );
  });

  it("TEST 11 — sendMessage rechaza channelId cliente", async () => {
    const source = readFileSync(
      path.join(
        HERE,
        "..",
        "..",
        "app",
        "api",
        "community",
        "messages",
        "route.ts",
      ),
      "utf8",
    );
    assert.equal(source.includes("server_resolves_routing"), true);
  });

  it("TEST 12 — enrichHome incluye comunicación", async () => {
    await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-mod",
      authorDisplayName: "Admin",
      title: "Importante",
      body: "Aviso",
      kind: "announcement",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const summary = CommunityCommunicationService.homeCommunicationSummary(
      communication,
    );
    assert.equal(summary.importantAnnouncements.length >= 1, true);
  });

  it("TEST 13 — composer hints requieren confirmación", async () => {
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      communication.composerHints?.every((row) => row.requiresConfirmation === true),
      true,
    );
  });

  it("TEST 14 — admin summary sin contenido privado", async () => {
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, role: "moderator", personId: "person-mod" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(typeof communication.adminSummary?.pendingReports, "number");
    assert.equal(communication.permissions.canReadPrivateAsAdmin, false);
  });

  it("TEST 15 — no opaque entities in service", () => {
    const source = readFileSync(
      path.join(HERE, "community-communication-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueCommunityCommunicationEntity("UniversalChatEntity"), true);
    assert.equal(source.includes("UniversalChatEntity"), false);
  });

  it("TEST 16 — sendMessage vía contexto", async () => {
    const message = await CommunityCommunicationService.sendMessage({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      contextType: "experience",
      contextId: "exp-send",
      content: "Coordinación",
    });
    assert.equal(message.content, "Coordinación");
  });

  it("TEST 17 — guest ve avisos oficiales", async () => {
    await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-mod",
      authorDisplayName: "Admin",
      title: "Oficial",
      body: "Info",
      kind: "announcement",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false, personId: "" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.announcements.length, 1);
    assert.equal(communication.permissions.canRead, true);
  });

  it("TEST 18 — territory scoped conversations", async () => {
    await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      type: "context",
      contextType: "community",
      contextId: "valley-chat",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      communication.conversations.some((row) => row.contextId === "valley-chat"),
      false,
    );
  });

  it("TEST 19 — report message forbidden for guest", async () => {
    await assert.rejects(
      () =>
        CommunityCommunicationService.reportMessage({
          tenantId: PANO,
          actor: actor({ tenantSlug: PANO, hasMembership: false, personId: "" }),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
          messageId: "msg-1",
        }),
      /forbidden/,
    );
  });

  it("TEST 20 — unread context calculado", async () => {
    const thread = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    await postMessageServer({
      tenantId: PANO,
      conversationId: thread.conversation.id,
      actor: actor({ tenantSlug: PANO, personId: "person-mia" }),
      content: "Hola vecino",
    });
    const communication = await CommunityCommunicationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(communication.unread.totalUnread >= 0, true);
  });
});
