import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTerritory } from "../domain/territory";
import {
  canSwitchTerritory,
  createTerritorySwitcher,
  discoverQueryFromActive,
  lifeMapBindingFromActive,
  resolveActiveTerritory,
  territoryHomeQuery,
} from "./territory-experience";

const TENANT = "tenant-luxury-communities";

describe("Territory Experience — Active Territory", () => {
  const panoramica = createTerritory({
    id: "terr-panoramica-golf",
    tenantId: TENANT,
    name: "Panorámica Golf",
    status: "active",
    locale: "es",
    timezone: "Europe/Madrid",
    bounds: { south: 37.3, west: -4.9, north: 37.5, east: -4.6 },
  });
  const oceanHills = createTerritory({
    id: "terr-ocean-hills",
    tenantId: TENANT,
    name: "Ocean Hills",
    status: "active",
    locale: "en",
    timezone: "Atlantic/Canary",
  });
  const valley = createTerritory({
    id: "terr-valley",
    tenantId: TENANT,
    name: "Valley",
    status: "active",
    locale: "es",
    timezone: "Europe/Madrid",
  });
  const foreign = createTerritory({
    id: "terr-other-client",
    tenantId: "tenant-other",
    name: "Otro cliente",
    status: "active",
  });

  it("TEST 1 — a user with one Territory resolves it", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      territories: [panoramica, foreign],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.source, "membership");
    assert.equal(resolved.context.territoryId, panoramica.id);
    assert.equal(resolved.context.territoryName, "Panorámica Golf");
    assert.notEqual(resolved.context.slug, "life-panoramica");
  });

  it("TEST 2 — a user with several Territories uses the tenant default", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      defaultTerritoryId: panoramica.id,
      territories: [oceanHills, panoramica, valley],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.source, "default");
    assert.equal(resolved.context.territoryId, panoramica.id);
  });

  it("TEST 3 — a user can switch to an allowed Territory", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      selectedTerritoryId: valley.id,
      territories: [panoramica, oceanHills, valley],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.source, "selected");
    assert.equal(resolved.context.territoryId, valley.id);
    assert.equal(
      canSwitchTerritory({
        tenantId: TENANT,
        actorTenantId: TENANT,
        requestedTerritoryId: oceanHills.id,
        territories: [panoramica, oceanHills, valley],
      }),
      true,
    );
  });

  it("TEST 4 — switching to a foreign Territory is denied", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      selectedTerritoryId: foreign.id,
      territories: [panoramica, oceanHills, foreign],
    });
    assert.equal(resolved.ok, false);
    if (resolved.ok) return;
    assert.equal(resolved.error, "territory_forbidden");
    assert.equal(
      canSwitchTerritory({
        tenantId: TENANT,
        actorTenantId: TENANT,
        requestedTerritoryId: foreign.id,
        territories: [panoramica, oceanHills, foreign],
      }),
      false,
    );
  });

  it("TEST 5 — a tenant pack does not control Territory", () => {
    const packWouldSay = {
      slug: "life-panoramica",
      territoryName: "From pack catalog",
    };
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      territories: [panoramica, oceanHills],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.context.territoryName, panoramica.name);
    assert.notEqual(resolved.context.territoryName, packWouldSay.territoryName);
    assert.notEqual(resolved.context.territoryId, packWouldSay.slug);
    const switcher = createTerritorySwitcher({
      tenantId: TENANT,
      tenantName: "Luxury Communities Inc",
      territories: [panoramica, oceanHills, valley],
      activeTerritoryId: panoramica.id,
    });
    assert.equal(switcher.territories.length, 3);
    assert.equal(switcher.tenantName, "Luxury Communities Inc");
  });

  it("TEST 6 — Life Map binding uses Active Territory, not a pack", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      territories: [panoramica],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    const binding = lifeMapBindingFromActive(resolved.context);
    assert.equal(binding.territoryId, panoramica.id);
    assert.equal(binding.name, "Panorámica Golf");
    assert.equal(binding.bounds?.south, 37.3);
    assert.equal(binding.metadata.locale, "es");
  });

  it("Home and Discover queries carry the Active Territory", () => {
    const resolved = resolveActiveTerritory({
      tenantId: TENANT,
      membershipTerritoryId: panoramica.id,
      territories: [panoramica],
      capabilities: ["experience.view", "resource.reserve"],
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    const discover = discoverQueryFromActive(resolved.context);
    assert.equal(discover.territoryId, panoramica.id);
    assert.equal(discover.locale, "es");
    const home = territoryHomeQuery(resolved.context);
    assert.equal(home.territoryId, panoramica.id);
    assert.equal(home.sources.includes("experience"), true);
  });
});
