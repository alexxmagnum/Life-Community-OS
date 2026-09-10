/**
 * Unified Experience composer isolation — Phase 2.
 * Run: pnpm --filter @life-community-os/web exec node --import tsx --test src/lib/experiences/experience-composer-isolation.test.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  communityCreationRoute,
  COMMUNITY_CREATION_ACTIONS,
  experienceComposerConfigForKind,
  experienceKindForCreationAction,
} from "@life-community-os/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

describe("Experience composer isolation", () => {
  it("keeps a single create screen and route", () => {
    const screen = readFileSync(
      path.join(root, "src/screens/CreateExperienceScreen.tsx"),
      "utf8",
    );
    const page = readFileSync(
      path.join(root, "src/app/(member)/experiences/create/page.tsx"),
      "utf8",
    );
    assert.equal(/CreatePlanScreen/.test(screen), false);
    assert.equal(/CreateEventScreen/.test(screen), false);
    assert.equal(page.includes("CreateExperienceScreen"), true);
    assert.equal(screen.includes("listExperienceComposerKindOptions"), true);
    assert.equal(screen.includes("experienceComposerConfigForKind"), true);
  });

  it("does not invent parallel create routes for plan/event", () => {
    const planPage = path.join(root, "src/app/(member)/plans/create/page.tsx");
    const eventPage = path.join(
      root,
      "src/app/(member)/create-event/page.tsx",
    );
    let planExists = true;
    let eventExists = true;
    try {
      readFileSync(planPage);
    } catch {
      planExists = false;
    }
    try {
      readFileSync(eventPage);
    } catch {
      eventExists = false;
    }
    assert.equal(planExists, false);
    assert.equal(eventExists, false);
  });

  it("ActionComposer deep links converge with kind query", () => {
    for (const type of [
      "plan_create",
      "experience_create",
      "event_create",
    ] as const) {
      const action = COMMUNITY_CREATION_ACTIONS.find((item) => item.type === type);
      assert.ok(action);
      assert.equal(action.route, "/experiences/create");
      const kind = experienceKindForCreationAction(type);
      assert.ok(kind);
      assert.equal(
        communityCreationRoute(action).includes(`kind=${kind}`),
        true,
      );
      assert.equal(
        experienceComposerConfigForKind(kind).kind,
        kind,
      );
    }
  });

  it("legacy event create screen redirects to Experience composer", () => {
    const legacy = readFileSync(
      path.join(root, "src/screens/CreateCommunityEventScreen.tsx"),
      "utf8",
    );
    assert.equal(legacy.includes('kind", "event"') || legacy.includes("kind=event") || legacy.includes('set("kind", "event")'), true);
    assert.equal(legacy.includes("/experiences/create"), true);
    assert.equal(legacy.includes("createCommunityEventRequest"), false);
  });

  it("composer submit path writes Experience only (no CommunityEvent client)", () => {
    const screen = readFileSync(
      path.join(root, "src/screens/CreateExperienceScreen.tsx"),
      "utf8",
    );
    assert.equal(screen.includes("createExperienceRequest"), true);
    assert.equal(screen.includes("createCommunityEventRequest"), false);
    assert.equal(screen.includes("kind,"), true);
  });

  it("draft CTA is wired to real lifecycle status", () => {
    const screen = readFileSync(
      path.join(root, "src/screens/CreateExperienceScreen.tsx"),
      "utf8",
    );
    assert.equal(screen.includes('"draft"'), true);
    assert.equal(screen.includes("Guardar como borrador") || screen.includes("draftCta"), true);
  });
});
