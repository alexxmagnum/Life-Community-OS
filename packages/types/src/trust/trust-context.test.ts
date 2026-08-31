import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import path from "node:path";
import type { CommunityFeedItem } from "../community/community-feed";
import {
  businessTrustLabels,
  countTrustSignals,
  emptyTrustContext,
  hasPublicTrustScoring,
  isOpaqueTrustEntity,
  ownTrustContribution,
  personTrustLabels,
  placeTrustLabel,
  projectTrustContext,
  publicPersonTrustLabels,
} from "./trust-context";
import { applyTrustedOrganizerBoost } from "./trust-projection";

const PANO = "life-panoramica";
const TERRITORY = "10000000-0000-4000-8000-000000000002";

describe("Trust Context", () => {
  it("counts hosted experiences as a signal without scoring", () => {
    const context = projectTrustContext({
      personId: "person-juan",
      tenantId: PANO,
      territoryId: TERRITORY,
      signals: countTrustSignals({ experienceHosted: 5, helpProvided: 3 }),
      privacy: { visible: true, showSignals: true },
    });
    assert.equal(context.signals.experienceHosted, 5);
    assert.equal(context.signals.helpProvided, 3);
    assert.deepEqual(personTrustLabels(context.signals), [
      "Ha creado varias experiencias",
      "Vecino colaborador",
    ]);
    assert.equal(hasPublicTrustScoring(JSON.stringify(context)), false);
  });

  it("keeps contribution private until the person opts in", () => {
    const context = emptyTrustContext({
      personId: "person-juan",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.signals.experienceHosted = 5;
    assert.equal(context.privacy.showSignals, false);
    assert.deepEqual(publicPersonTrustLabels(context), []);
    const own = ownTrustContribution(context.signals);
    assert.equal(own[0]?.title, "He organizado");
    assert.equal(own[0]?.detail, "5 experiencias");
  });

  it("hides public labels when privacy is off", () => {
    const context = projectTrustContext({
      personId: "person-juan",
      tenantId: PANO,
      territoryId: TERRITORY,
      signals: { ...emptyTrustContext({ personId: "x", tenantId: PANO, territoryId: TERRITORY }).signals, helpProvided: 3 },
      privacy: { visible: true, showSignals: false },
    });
    assert.deepEqual(publicPersonTrustLabels(context), []);
  });

  it("describes a verified business without reviews", () => {
    assert.deepEqual(
      businessTrustLabels({
        registered: true,
        locationConfirmed: true,
        published: true,
      }),
      [
        "Negocio registrado",
        "Ubicación confirmada",
        "Activo en la comunidad",
      ],
    );
  });

  it("describes a living place without a reputation list", () => {
    assert.equal(
      placeTrustLabel({ participantCount: 4, activityCount: 2 }),
      "Comunidad activa · Vecinos participan",
    );
  });

  it("boosts trusted organizers without dropping items", () => {
    const yoga: CommunityFeedItem = {
      id: "exp-yoga",
      tenantId: PANO,
      territoryId: TERRITORY,
      title: "Yoga",
      type: "experience",
      actions: { primary: "join" },
      metadata: { organizerPersonId: "person-a" },
    };
    const golf: CommunityFeedItem = {
      id: "exp-golf",
      tenantId: PANO,
      territoryId: TERRITORY,
      title: "Golf",
      type: "experience",
      actions: { primary: "join" },
      metadata: { organizerPersonId: "person-b" },
    };
    const ranked = applyTrustedOrganizerBoost({
      feed: [yoga, golf],
      trustedOrganizerIds: ["person-b"],
    });
    assert.equal(ranked[0]?.id, "exp-golf");
    assert.equal(ranked.length, 2);
  });

  it("does not invent TrustEntity or public scoring", () => {
    const source = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "trust-context.ts"),
      "utf8",
    );
    assert.equal(isOpaqueTrustEntity("TrustEntity"), true);
    assert.equal(/export type TrustEntity/.test(source), false);
    assert.equal(/export type ReputationEntity/.test(source), false);
    assert.equal(/export type CommunityPointsEntity/.test(source), false);
    assert.equal(hasPublicTrustScoring("Juan tiene 87 puntos"), true);
  });
});
