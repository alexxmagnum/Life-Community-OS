/**
 * Phase 18M-FIX-A — Community activation density & launch readiness isolation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  FORBIDDEN_ACTIVATION_METRIC_KEYS,
  magicPlusSectionIdForActionType,
} from "@life-community-os/types";
import { loadCommunityActivationMetrics } from "@/lib/admin/community-activation-metrics";
import {
  createRegisteredBusiness,
  listBusinessesServer,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";

process.env.LCOS_BUSINESS_FIXTURE = "1";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const PANO = "life-panoramica";
const VALLEY = "life-valley";

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("community activation density isolation", () => {
  it("TEST 1 — empty community shows activation guidance", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(home, /CommunityActivationPanel/);
    assert.match(community, /CommunityActivationPanel/);
    assert.match(home, /LIVING_EMPTY_TITLE/);
    assert.match(home, /LIVING_EMPTY_DESCRIPTION/);
  });

  it("TEST 2 — no fake content generated", () => {
    const panel = readWeb("components/community/CommunityActivationPanel.tsx");
    const checklist = readWeb("components/admin/CommunityLaunchChecklist.tsx");
    const metrics = readWeb("lib/admin/community-activation-metrics.ts");
    assert.doesNotMatch(
      panel,
      /generateFake|seedFake|createFake|mockUsers|autoGenerate/i,
    );
    assert.doesNotMatch(checklist, /generateFake|seedFake|autoGenerate/i);
    assert.doesNotMatch(metrics, /generateFake|seedFake|autoGenerate/i);
    assert.match(checklist, /no se genera contenido automáticamente/i);
  });

  it("TEST 3 — visitor sees join CTA", () => {
    const panel = readWeb("components/community/CommunityActivationPanel.tsx");
    assert.match(panel, /COMMUNITY_ACTIVATION_VISITOR_CTA/);
    assert.match(panel, /variant === "visitor"/);
  });

  it("TEST 4 — member can create first experience via focused Magic Plus", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /openActionComposerWithIntent\("experience_create"/);
    assert.doesNotMatch(home, /router\.push\("\/experiences\/create"\)/);
    assert.equal(
      magicPlusSectionIdForActionType("experience_create"),
      "experience",
    );
  });

  it("TEST 5 — admin sees launch checklist", () => {
    const admin = readWeb("screens/admin/AdminDashboardScreen.tsx");
    assert.match(admin, /CommunityLaunchChecklist/);
    assert.match(admin, /Checklist de lanzamiento|CommunityLaunchChecklist/);
  });

  it("TEST 6 — metrics contain activity counts, not engagement", async () => {
    const metrics = await loadCommunityActivationMetrics({ tenantId: PANO });
    assert.equal(typeof metrics.experiencesCreated, "number");
    assert.equal(typeof metrics.experiencesParticipants, "number");
    assert.equal(typeof metrics.announcementsPublished, "number");
    for (const key of FORBIDDEN_ACTIVATION_METRIC_KEYS) {
      assert.equal(key in metrics, false);
    }
    const admin = readWeb("screens/admin/AdminDashboardScreen.tsx");
    assert.match(admin, /Actividad comunitaria/);
    assert.doesNotMatch(admin, /ranking|más activos|engagementScore/i);
  });

  it("TEST 7 — no tenant data leakage", async () => {
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
    await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-pano",
      name: "Solo Panoramica",
      category: "restaurant",
      description: "Local",
      address: "Calle 1",
      latitude: 40.5,
      longitude: 0.33,
      type: "business",
    });
    const created = await listBusinessesServer(PANO);
    const biz = created.find((item) => item.name === "Solo Panoramica");
    assert.ok(biz);
    await setBusinessStatus({
      tenantId: PANO,
      businessId: biz!.id,
      status: "published",
    });
    const pano = await loadCommunityActivationMetrics({ tenantId: PANO });
    const valley = await loadCommunityActivationMetrics({ tenantId: VALLEY });
    assert.equal(pano.businessesPublished >= 1, true);
    assert.equal(valley.businessesPublished, 0);
  });
});
