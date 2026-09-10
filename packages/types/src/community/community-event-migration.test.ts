import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  experienceIdForLegacyCommunityEvent,
  legacyCommunityEventIdFromExperienceId,
  mapCommunityEventParticipantRole,
  mapCommunityEventStatusToExperience,
  mapCommunityEventToExperienceFields,
  readLegacyCommunityEventId,
} from "./community-event-migration";
import { projectEventToFeedItem } from "./community-feed";

describe("CommunityEvent → Experience migration mapping", () => {
  it("builds stable experience ids and round-trips", () => {
    const legacy = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const id = experienceIdForLegacyCommunityEvent(legacy);
    assert.equal(id, `ex-ce-${legacy}`);
    assert.equal(legacyCommunityEventIdFromExperienceId(id), legacy);
  });

  it("maps CommunityEvent fields without inventing location", () => {
    const fields = mapCommunityEventToExperienceFields({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Noche de música",
      description: "Directo",
      startsAt: "2026-09-12T20:00:00.000Z",
      locationLabel: "IKON",
      status: "published",
      authorPersonId: "person-a",
      createdBy: "person-a",
      territoryId: "terr-1",
      authorDisplayName: "Alex",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    assert.equal(fields.kind, "event");
    assert.equal(fields.id, "ex-ce-11111111-1111-4111-8111-111111111111");
    assert.equal(fields.location, "IKON");
    assert.equal(
      readLegacyCommunityEventId(fields.metadata),
      "11111111-1111-4111-8111-111111111111",
    );
    assert.equal(fields.metadata.migratedFrom, "community_event");
    assert.equal(fields.status, "published");
  });

  it("maps statuses and participant roles", () => {
    assert.equal(mapCommunityEventStatusToExperience("cancelled"), "cancelled");
    assert.equal(mapCommunityEventParticipantRole("organizer"), "creator");
    assert.equal(mapCommunityEventParticipantRole("invited"), "invited");
    assert.equal(mapCommunityEventParticipantRole("unknown"), null);
  });

  it("projects unmigrated event feed items to legacy redirect href", () => {
    const item = projectEventToFeedItem({
      id: "evt-1",
      tenantId: "life-panoramica",
      territoryId: "terr-1",
      title: "Fiesta",
      status: "published",
      startsAt: "2026-09-12T20:00:00.000Z",
    });
    assert.ok(item);
    assert.equal(item!.metadata?.href, "/community/events/evt-1");
  });

  it("projects migrated event feed items to Experience detail", () => {
    const item = projectEventToFeedItem({
      id: "evt-1",
      tenantId: "life-panoramica",
      territoryId: "terr-1",
      title: "Fiesta",
      status: "published",
      startsAt: "2026-09-12T20:00:00.000Z",
      experienceId: "ex-ce-evt-1",
    });
    assert.ok(item);
    assert.equal(item!.metadata?.href, "/experiences/ex-ce-evt-1");
    assert.equal(item!.metadata?.experienceKind, "event");
  });
});
