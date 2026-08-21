/**
 * Media Platform isolation, ownership and domain overlay tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { preferEntityMediaUrl } from "./media-policy";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  findOrCreateConversationServer,
  postMessageServer,
  replaceCommunicationStoreForTests,
} from "@/lib/communication/server-communication-repository";
import {
  displayUrlsFromEntityMedia,
  deleteMediaServer,
  getMediaAssetServer,
  linkMediaReferenceServer,
  listEntityMediaServer,
  MediaDeniedError,
  replaceMediaStoreForTests,
  uploadMediaServer,
} from "./server-media-repository";
import { resetMediaStorageForTests } from "./storage/create-media-storage";

process.env.LCOS_MEDIA_FIXTURE = "1";
process.env.LCOS_COMMUNICATION_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

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

describe("media platform isolation", () => {
  beforeEach(async () => {
    resetMediaStorageForTests();
    await replaceMediaStoreForTests(PANO);
    await replaceMediaStoreForTests(VALLEY);
    await replaceCommunicationStoreForTests(PANO);
  });

  it("TEST 1 — user uploads their own image", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "cover.png",
      mimeType: "image/png",
      bytes: PNG,
      type: "image",
    });
    assert.equal(result.asset.ownerPersonId, "person-alex");
    assert.equal(result.asset.status, "ready");
    assert.equal(result.asset.tenantId, PANO);
    assert.match(result.asset.storageKey, /^life-panoramica\//);
    const found = await getMediaAssetServer({
      tenantId: PANO,
      actor: owner,
      mediaId: result.asset.id,
    });
    assert.equal(found.asset.id, result.asset.id);
  });

  it("TEST 2 — user reads media in their tenant", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const neighbour = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-mia",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "cover.png",
      mimeType: "image/png",
      bytes: PNG,
    });
    await linkMediaReferenceServer({
      tenantId: PANO,
      actor: owner,
      mediaId: result.asset.id,
      entityType: "business",
      entityId: "biz-1",
      purpose: "cover",
    });
    const found = await getMediaAssetServer({
      tenantId: PANO,
      actor: neighbour,
      mediaId: result.asset.id,
    });
    assert.equal(found.asset.id, result.asset.id);
    assert.match(found.url, /\/api\/media\//);
  });

  it("TEST 3 — Valley cannot access Panoramica media", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const valley = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-alex",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "cover.png",
      mimeType: "image/png",
      bytes: PNG,
    });
    await assert.rejects(
      () =>
        getMediaAssetServer({
          tenantId: PANO,
          actor: valley,
          mediaId: result.asset.id,
        }),
      (error: unknown) =>
        error instanceof MediaDeniedError && error.code === "forbidden",
    );
    await assert.rejects(
      () =>
        getMediaAssetServer({
          tenantId: VALLEY,
          actor: valley,
          mediaId: result.asset.id,
        }),
      (error: unknown) =>
        error instanceof MediaDeniedError && error.code === "not_found",
    );
  });

  it("TEST 4 — user cannot delete someone else's file", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const other = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-mia",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "cover.png",
      mimeType: "image/png",
      bytes: PNG,
    });
    await assert.rejects(
      () =>
        deleteMediaServer({
          tenantId: PANO,
          actor: other,
          mediaId: result.asset.id,
        }),
      (error: unknown) =>
        error instanceof MediaDeniedError && error.code === "forbidden",
    );
  });

  it("TEST 5 — business shows images from MediaAsset", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "shop.png",
      mimeType: "image/png",
      bytes: PNG,
      entityType: "business",
      entityId: "biz-profile-1",
      purpose: "cover",
    });
    const items = await listEntityMediaServer({
      tenantId: PANO,
      actor: owner,
      entityType: "business",
      entityId: "biz-profile-1",
    });
    const urls = displayUrlsFromEntityMedia(items, "cover");
    assert.equal(items[0]?.asset.id, result.asset.id);
    assert.equal(urls[0], result.url);
    assert.equal(
      preferEntityMediaUrl(
        urls[0],
        "https://images.unsplash.com/photo-demo",
      ),
      result.url,
    );
    assert.equal(
      preferEntityMediaUrl(undefined, "https://images.unsplash.com/photo-demo"),
      undefined,
    );
  });

  it("TEST 6 — housing shows images from MediaReference", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const result = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "home.png",
      mimeType: "image/png",
      bytes: PNG,
    });
    await linkMediaReferenceServer({
      tenantId: PANO,
      actor: owner,
      mediaId: result.asset.id,
      entityType: "property",
      entityId: "prop-1",
      purpose: "gallery",
    });
    const items = await listEntityMediaServer({
      tenantId: PANO,
      actor: owner,
      entityType: "property",
      entityId: "prop-1",
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]?.reference.entityType, "property");
    assert.equal(items[0]?.reference.purpose, "gallery");
    assert.equal(items[0]?.asset.id, result.asset.id);
  });

  it("TEST 7 — message attaches the correct file", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const uploaded = await uploadMediaServer({
      tenantId: PANO,
      actor: owner,
      filename: "note.pdf",
      mimeType: "application/pdf",
      bytes: PNG,
      type: "attachment",
    });
    const thread = await findOrCreateConversationServer({
      tenantId: PANO,
      actor: owner,
      type: "context",
      contextType: "community",
      contextId: "group-media-1",
      title: "Adjuntos",
    });
    const message = await postMessageServer({
      tenantId: PANO,
      conversationId: thread.conversation.id,
      actor: owner,
      content: "Te dejo el archivo",
      attachments: [
        {
          kind: "document",
          fileName: "note.pdf",
          mimeType: "application/pdf",
          fileId: uploaded.asset.id,
        },
      ],
    });
    assert.equal(message.attachments?.[0]?.fileId, uploaded.asset.id);
    const items = await listEntityMediaServer({
      tenantId: PANO,
      actor: owner,
      entityType: "message",
      entityId: message.id,
    });
    assert.equal(items[0]?.asset.id, uploaded.asset.id);
    assert.equal(items[0]?.reference.purpose, "attachment");
  });

  it("rejects a client-supplied storage_key", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    await assert.rejects(
      () =>
        uploadMediaServer({
          tenantId: PANO,
          actor: owner,
          filename: "cover.png",
          mimeType: "image/png",
          bytes: PNG,
          storageKeyFromClient: "life-valley/stolen/file.png",
        }),
      (error: unknown) =>
        error instanceof MediaDeniedError &&
        error.code === "storage_key_forbidden",
    );
  });
});
