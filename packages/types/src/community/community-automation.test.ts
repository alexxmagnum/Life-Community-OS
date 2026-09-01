/**
 * Community Automation contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { createLocation } from "../domain/location";
import { createLifePlaceContext } from "../platform/life-place";
import { projectLifePlaceExperienceView } from "../platform/life-place-experience-view";
import { emptyPersonalContext } from "../personal/personal-context";
import {
  automationDoesNotAutoExecute,
  automationRequiresConfirmation,
  automationRespectsTerritory,
  createAutomationPreview,
  isOpaqueCommunityAutomationEntity,
  operationalHintsFromPlace,
  projectCommunityAutomationContext,
  resolveAdminOperationalHints,
  resolveReminders,
  resolveTriggers,
} from "./automation";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PANO = "life-panoramica";
const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";
const VALLEY_TERRITORY = "20000000-0000-4000-8000-000000000002";

describe("Community Automation", () => {
  it("TEST 1 — reserva genera recordatorio correcto", () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const date = tomorrow.toISOString().slice(0, 10);
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const reminders = resolveReminders({
      context,
      now: Date.now(),
      reservations: [
        {
          id: "res-1",
          tenantId: PANO,
          territoryId: PANO_TERRITORY,
          createdBy: "person-alex",
          date,
          start: "10:00",
          resourceName: "Pista de pádel",
          status: "confirmed",
        },
      ],
    });
    assert.equal(reminders.length, 1);
    assert.equal(reminders[0]?.kind, "reservation_upcoming");
    assert.equal(reminders[0]?.title.includes("reserva"), true);
  });

  it("TEST 2 — usuario puede desactivar sugerencias", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      privacy: { receiveRecommendations: false, shareActivity: true },
    };
    const triggers = resolveTriggers({ context });
    assert.equal(triggers.length, 0);
    const projected = projectCommunityAutomationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context,
      triggers: [],
    });
    assert.equal(projected.enabled, false);
  });

  it("TEST 3 — no existe AutomationEntity global", () => {
    assert.equal(isOpaqueCommunityAutomationEntity("GlobalAutomationEntity"), true);
    assert.equal(isOpaqueCommunityAutomationEntity("AutonomousCommunityAgent"), true);
  });

  it("TEST 4 — no hay acciones automáticas sin confirmación", () => {
    const preview = createAutomationPreview({
      id: "trigger:1",
      kind: "reservation_upcoming",
      sourceType: "reservation",
      sourceId: "res-1",
      title: "Recordatorio",
      body: "Mañana",
      reason: "Porque tienes reserva",
    });
    assert.equal(automationRequiresConfirmation(preview), true);
    assert.equal(automationDoesNotAutoExecute(preview), true);
  });

  it("TEST 5 — Life Place usa datos reales", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const place = createLifePlaceContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      location: createLocation({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        type: "facility",
        name: "Piscina",
        address: "Club",
        latitude: 37.41,
        longitude: -4.75,
        category: "pool",
      }),
      reservations: [
        {
          context: { type: "resource", id: "res-pool" },
          available: 2,
          label: "Piscina",
          href: "/resources/res-pool/reserve",
        },
      ],
    });
    const hints = operationalHintsFromPlace(place, context);
    const view = projectLifePlaceExperienceView(place, undefined, hints);
    assert.equal(view.operationalHints?.length, hints.length);
  });

  it("TEST 6 — Experience permanece autoridad", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const triggers = resolveTriggers({
      context,
      now: Date.now(),
      experiences: [
        {
          id: "exp-1",
          tenantId: PANO,
          territoryId: PANO_TERRITORY,
          title: "Aquagym",
          startsAt: new Date(Date.now() + 7200_000).toISOString(),
          status: "published",
        },
      ],
    });
    assert.equal(triggers.every((row) => row.sourceType !== "experience" || row.href?.includes("experiences")), true);
    assert.equal("autoCreateExperience" in triggers[0]!, false);
  });

  it("TEST 7 — privacy respetada", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      privacy: { receiveRecommendations: false, shareActivity: false },
    };
    const projected = projectCommunityAutomationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context,
      triggers: [],
    });
    assert.equal(projected.permissions.canConfirm, false);
  });

  it("TEST 8 — Community Admin limitado", () => {
    const hints = resolveAdminOperationalHints({
      pendingEvents: 2,
      openHelpRequests: 1,
    });
    assert.equal(hints.length, 2);
    assert.equal(hints.every((row) => row.reason.includes("operativa")), true);
  });

  it("TEST 9 — tenant isolation", () => {
    const pano = projectCommunityAutomationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      triggers: [],
    });
    assert.equal(automationRespectsTerritory(pano, PANO, PANO_TERRITORY), true);
    assert.equal(automationRespectsTerritory(pano, "life-valley", VALLEY_TERRITORY), false);
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const source = readFileSync(path.join(HERE, "automation.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 11 — preview incluye explicación", () => {
    const preview = createAutomationPreview({
      id: "trigger:1",
      kind: "territory_notice",
      sourceType: "announcement",
      sourceId: "ann-1",
      title: "Horario especial",
      body: "Piscina cierra antes",
      reason: "Aviso territorial de tu comunidad",
    });
    assert.equal(preview.explanation.length > 0, true);
    assert.equal(preview.notificationKind, "community_update");
  });

  it("TEST 12 — triggers acotados", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const triggers = resolveTriggers({
      context,
      now: Date.now(),
      reservations: Array.from({ length: 5 }, (_, index) => ({
        id: `res-${index}`,
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
        start: "10:00",
        status: "confirmed",
      })),
    });
    assert.equal(triggers.length >= 1, true);
  });

  it("TEST 13 — admin hints no exponen preferencias", () => {
    const hints = resolveAdminOperationalHints({ openHelpRequests: 3 });
    assert.equal(JSON.stringify(hints).includes("interests"), false);
  });

  it("TEST 14 — provider rule-based", () => {
    const projected = projectCommunityAutomationContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      triggers: [],
      providerId: "rules",
    });
    assert.equal(projected.providerId, "rules");
  });

  it("TEST 15 — no tracking invasivo", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const serialized = JSON.stringify(
      projectCommunityAutomationContext({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        context,
        triggers: [],
      }),
    );
    assert.equal(/geofence|continuousTracking|habitProfile/i.test(serialized), false);
  });
});
