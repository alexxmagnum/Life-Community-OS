/**
 * Communication Core isolation, ownership and context-linking tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import type { RequestActor } from "@/lib/auth/request-actor";
import { permissionsForRole } from "@/lib/auth/permissions";
import {
  listCommunitySnapshot,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  CommunicationDeniedError,
  findConversationByContextServer,
  findOrCreateConversationServer,
  getConversationThreadServer,
  listMyConversationsServer,
  postMessageServer,
  replaceCommunicationStoreForTests,
  updateMessageServer,
} from "./server-communication-repository";

process.env.LCOS_COMMUNICATION_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
}): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: input.personId,
    role: input.role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(input.role),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: input.personId,
      tenantId: input.tenantSlug,
      role: input.role,
    },
  };
}

describe("communication isolation", () => {
  beforeEach(async () => {
    await replaceCommunicationStoreForTests(PANO);
    await replaceCommunicationStoreForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
  });

  it("TEST 1 — member creates a conversation", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const thread = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      title: "Vecinos",
      participantPersonIds: ["person-mia"],
    });
    assert.equal(thread.conversation.tenantId, PANO);
    assert.equal(thread.conversation.createdBy, "person-alex");
    assert.equal(thread.conversation.type, "direct");
    assert.equal(thread.participants.length, 2);
  });

  it("TEST 2 — participant receives messages", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const peer = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-mia",
    });
    const created = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    await postMessageServer({
      tenantId: PANO,
      conversationId: created.conversation.id,
      actor: owner,
      content: "Hola Mia",
    });
    const thread = await getConversationThreadServer(
      PANO,
      created.conversation.id,
      peer,
    );
    assert.ok(thread);
    assert.equal(thread?.messages.length, 1);
    assert.equal(thread?.messages[0]?.content, "Hola Mia");
    assert.equal(thread?.messages[0]?.senderPersonId, "person-alex");
  });

  it("TEST 3 — outsider cannot read the conversation", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const outsider = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-other",
    });
    const created = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    await assert.rejects(
      () =>
        getConversationThreadServer(PANO, created.conversation.id, outsider),
      (error: unknown) =>
        error instanceof CommunicationDeniedError && error.code === "forbidden",
    );
  });

  it("TEST 4 — sender cannot be changed", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const created = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    await assert.rejects(
      () =>
        postMessageServer({
          tenantId: PANO,
          conversationId: created.conversation.id,
          actor: owner,
          content: "spoof",
          senderPersonId: "person-mia",
        }),
      (error: unknown) =>
        error instanceof CommunicationDeniedError &&
        error.code === "sender_immutable",
    );
    const message = await postMessageServer({
      tenantId: PANO,
      conversationId: created.conversation.id,
      actor: owner,
      content: "real",
    });
    await assert.rejects(
      () =>
        updateMessageServer({
          tenantId: PANO,
          messageId: message.id,
          actor: owner,
          content: "edited",
          senderPersonId: "person-mia",
        }),
      (error: unknown) =>
        error instanceof CommunicationDeniedError &&
        error.code === "sender_immutable",
    );
  });

  it("TEST 5 — Valley cannot access a Panoramica conversation", async () => {
    const pano = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const valley = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-alex",
    });
    const created = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: pano,
      type: "context",
      contextType: "community",
      contextId: "group-1",
    });
    const valleyList = await listMyConversationsServer(VALLEY, valley);
    assert.equal(
      valleyList.some((item) => item.conversation.id === created.conversation.id),
      false,
    );
    await assert.rejects(
      () => getConversationThreadServer(PANO, created.conversation.id, valley),
      (error: unknown) =>
        error instanceof CommunicationDeniedError && error.code === "forbidden",
    );
  });

  it("TEST 6 — business context links without duplicating", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const first = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "context",
      contextType: "business",
      contextId: "biz-profile-1",
      title: "Negocio",
    });
    const second = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "context",
      contextType: "business",
      contextId: "biz-profile-1",
    });
    assert.equal(first.conversation.id, second.conversation.id);
    assert.equal(first.conversation.contextType, "business");
    const found = await findConversationByContextServer(
      PANO,
      "business",
      "biz-profile-1",
      owner,
    );
    assert.equal(found?.conversation.id, first.conversation.id);
  });

  it("TEST 7 — reservation context links without duplicating", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const first = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "context",
      contextType: "reservation",
      contextId: "rsv-1",
    });
    const second = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "context",
      contextType: "reservation",
      contextId: "rsv-1",
    });
    assert.equal(first.conversation.id, second.conversation.id);
    assert.equal(first.conversation.contextType, "reservation");
  });

  it("TEST 8 — a message creates a community notification", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const created = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "direct",
      contextType: "community",
      contextId: "direct:person-alex:person-mia",
      participantPersonIds: ["person-mia"],
    });
    await postMessageServer({
      tenantId: PANO,
      conversationId: created.conversation.id,
      actor: owner,
      content: "Nos vemos en la plaza",
    });
    const snapshot = await listCommunitySnapshot(PANO);
    const notices = snapshot.notifications.filter(
      (item) => item.recipientPersonId === "person-mia",
    );
    assert.ok(notices.length >= 1);
    assert.equal(notices[0]?.kind, "mention");
    assert.equal(notices[0]?.entityId, created.conversation.id);
  });
});
