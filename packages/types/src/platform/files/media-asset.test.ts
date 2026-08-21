import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMediaAsset,
  createMediaReference,
  mediaAssetToFileReference,
  validateMediaAsset,
} from "./media-asset";

describe("MediaAsset", () => {
  it("creates a tenant-owned file without accepting a client storage key shape", () => {
    const asset = createMediaAsset({
      tenantId: "life-panoramica",
      ownerPersonId: "person-alex",
      createdBy: "person-alex",
      storageKey: "life-panoramica/media-1/cover.png",
      filename: "cover.png",
      mimeType: "image/png",
      size: 128,
      type: "image",
      status: "ready",
    });
    assert.equal(asset.ownerPersonId, "person-alex");
    assert.equal(validateMediaAsset(asset).length, 0);
    const file = mediaAssetToFileReference(asset);
    assert.equal(file.id, asset.id);
    assert.equal(file.status, "ready");
    assert.equal(file.fileType, "image");
  });

  it("links an entity through MediaReference instead of image columns", () => {
    const ref = createMediaReference({
      tenantId: "life-panoramica",
      createdBy: "person-alex",
      mediaId: "media-1",
      entityType: "business",
      entityId: "biz-1",
      purpose: "cover",
    });
    assert.equal(ref.entityType, "business");
    assert.equal(ref.purpose, "cover");
  });
});
