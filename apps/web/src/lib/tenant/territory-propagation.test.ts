/**
 * Territory domain propagation — same Tenant, different Territory isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { LIFE_PANORAMICA_TERRITORY_UUID } from "@/lib/tenant/ids";
import {
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";
import {
  createCommunityPost,
  listPublishedPosts,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  communityRecordBelongsToTerritory,
  recordMatchesTerritoryScope,
} from "@life-community-os/types";

process.env.LCOS_COMMUNITY_FIXTURE = "1";

const TENANT = "life-panoramica";
const TERR_A = LIFE_PANORAMICA_TERRITORY_UUID;
const TERR_B = "aaaaaaaa-0000-4000-8000-000000000003";

describe("territory domain propagation", () => {
  beforeEach(async () => {
    await replaceCommunitySnapshotForTests(TENANT);
  });

  it("stamps the Tenant default Territory when membership omits one", () => {
    const stamped = resolveStampTerritoryId({ tenantId: TENANT });
    assert.equal(stamped, TERR_A);
  });

  it("denies a foreign Territory query on the same Tenant bind", () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: TENANT,
      queryTerritoryId: TERR_B,
    });
    assert.equal("error" in denied, true);
  });

  it("binds membership Territory without reading a tenant pack", () => {
    const bound = resolveActiveTerritoryContext({
      tenantId: TENANT,
      actorTerritoryId: TERR_A,
    });
    assert.equal("error" in bound, false);
    if ("error" in bound) return;
    assert.equal(bound.context.tenantId, TENANT);
    assert.equal(bound.context.territoryId, TERR_A);
  });

  it("Community cross Territory is denied for the same Tenant", async () => {
    const pano = await createCommunityPost({
      tenantId: TENANT,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Panorámica",
      body: "Solo este territorio.",
      territoryId: TERR_A,
    });
    const other = await createCommunityPost({
      tenantId: TENANT,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Ocean Hills",
      body: "No debe filtrarse a Panorámica.",
      territoryId: TERR_B,
    });
    assert.equal(pano.tenantId, other.tenantId);
    assert.notEqual(pano.territoryId, other.territoryId);
    assert.equal(
      communityRecordBelongsToTerritory(other, TERR_A, TENANT),
      false,
    );
    const feed = await listPublishedPosts(TENANT);
    const inA = feed.filter((item) =>
      recordMatchesTerritoryScope(item.territoryId, TERR_A),
    );
    assert.equal(inA.some((item) => item.id === pano.id), true);
    assert.equal(inA.some((item) => item.id === other.id), false);
  });
});
