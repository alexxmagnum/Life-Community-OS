import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createReservationRecord } from "../domain/resource";
import { emptyPersonalContext } from "../personal/personal-context";
import type { CommunityFeedItem } from "./community-feed";
import {
  announcementFromPost,
  composerTitleForSource,
  deriveLifePlaceOperations,
  isOpaqueDailyLifeEntity,
  personalizeTerritoryDailyPulse,
  projectCommunityOperationsContext,
  projectTerritoryDailyPulse,
} from "./operations";

const TERRITORY = "10000000-0000-4000-8000-000000000002";
const OTHER = "20000000-0000-4000-8000-000000000002";

function item(
  partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title" | "type">,
): CommunityFeedItem {
  return {
    tenantId: "life-panoramica",
    territoryId: TERRITORY,
    actions: { primary: "join" },
    ...partial,
  };
}

describe("Community Operations Context", () => {
  it("projects today's territorial counts without storing a daily entity", () => {
    const context = projectCommunityOperationsContext({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      experiences: 2,
      events: 1,
      help: 3,
    });
    assert.equal(context.today.experiences, 2);
    assert.equal(context.today.help, 3);
    assert.equal(isOpaqueDailyLifeEntity("DailyLifeEntity"), true);
  });

  it("builds a daily pulse as now / next / important / community", () => {
    const yoga = item({
      id: "exp-now",
      type: "experience",
      title: "Aquagym",
      startsAt: new Date().toISOString(),
    });
    const later = item({
      id: "exp-next",
      type: "experience",
      title: "Yoga al atardecer",
      startsAt: new Date(Date.now() + 36 * 3600_000).toISOString(),
    });
    const move = item({
      id: "biz-1",
      type: "business_activity",
      title: "Cafetería abierta",
    });
    const pulse = projectTerritoryDailyPulse({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      items: [yoga, later, move],
      announcements: [
        {
          id: "ann-1",
          tenantId: "life-panoramica",
          territoryId: TERRITORY,
          title: "Horario de verano",
          body: "La piscina cambia horario.",
          createdAt: new Date().toISOString(),
        },
      ],
    });
    assert.equal(pulse.now.some((row) => row.id === "exp-now"), true);
    assert.equal(pulse.next.some((row) => row.id === "exp-next"), true);
    assert.equal(pulse.important[0]?.title, "Horario de verano");
    assert.equal(pulse.community[0]?.id, "biz-1");
    assert.equal(
      pulse.now.some((row) => "likes" in (row as object)),
      false,
    );
  });

  it("does not leak another Territory into the pulse", () => {
    const pulse = projectTerritoryDailyPulse({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      items: [
        item({
          id: "foreign",
          type: "experience",
          title: "Ajeno",
          territoryId: OTHER,
        }),
      ],
    });
    assert.equal(pulse.now.length + pulse.next.length, 0);
  });

  it("projects announcements from Community posts, not a new domain", () => {
    const announcement = announcementFromPost({
      id: "post-1",
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      kind: "announcement",
      title: "Corte de agua",
      body: "Mañana de 8 a 10.",
      status: "published",
      createdAt: new Date().toISOString(),
    });
    assert.equal(announcement?.title, "Corte de agua");
    assert.equal(
      announcementFromPost({
        id: "post-2",
        tenantId: "life-panoramica",
        territoryId: TERRITORY,
        kind: "discussion",
        title: "Charla",
        body: "Hola",
        status: "published",
        createdAt: new Date().toISOString(),
      }),
      null,
    );
  });

  it("derives Life Place status from real domains", () => {
    const activity = deriveLifePlaceOperations({
      currentActivity: [{ title: "Aquagym" }],
    });
    assert.equal(activity.status, "activity_now");
    const notice = deriveLifePlaceOperations({
      importantNotice: "Horario verano",
      currentActivity: [{ title: "Aquagym" }],
    });
    assert.equal(notice.status, "important_notice");
    assert.equal(deriveLifePlaceOperations({}).status, "available");
  });

  it("personalization reorders pulse items without inventing or dropping", () => {
    const yoga = item({ id: "exp-yoga", type: "experience", title: "Yoga" });
    const golf = item({
      id: "exp-golf",
      type: "experience",
      title: "Partido de golf",
    });
    const pulse = projectTerritoryDailyPulse({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      items: [yoga, golf],
    });
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["golf"];
    const next = personalizeTerritoryDailyPulse(pulse, context);
    assert.equal(next.now.length + next.next.length, pulse.now.length + pulse.next.length);
  });

  it("titles the composer from home or experience, never from a place", () => {
    assert.equal(composerTitleForSource("home"), "Crear para hoy");
    assert.equal(composerTitleForSource("life_place"), "Crear experiencia");
    assert.equal(composerTitleForSource("discover"), "Crear experiencia");
  });

  it("keeps service reservations valid without a physical resource", () => {
    const reservation = createReservationRecord({
      tenantId: "life-panoramica",
      createdBy: "person-alex",
      date: "2026-09-06",
      start: "11:00",
      end: "12:00",
      contextType: "service",
      contextId: "massage-visit",
      territoryId: TERRITORY,
    });
    assert.equal(reservation.contextType, "service");
    assert.equal(reservation.resourceId, undefined);
  });

  it("does not invent opaque daily-life entities", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(here, "operations.ts"), "utf8");
    assert.equal(/export type DailyLifeEntity/.test(source), false);
    assert.equal(/export type CommunityTimelineEntity/.test(source), false);
    assert.equal(/export type UniversalNotificationFeed/.test(source), false);
    assert.equal(/export type ResidentScore/.test(source), false);
    assert.equal(/export type SocialWall/.test(source), false);
  });
});
