/**
 * Local Services isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  boostRelevantServiceFeed,
  businessTrustLabels,
  dateOffsetIso,
  isOpaqueEconomyEntity,
  neighborExchangeIsMarketplace,
  type CommunityFeedItem,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  createRegisteredBusiness,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { CommunityGovernanceService } from "@/lib/governance/community-governance-service";
import { replaceGovernanceStoreForTests } from "@/lib/governance/server-governance-repository";
import {
  createHelpRequestServer,
  replaceHelpStoreForTests,
} from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import {
  createMarketplaceListingServer,
  replaceMarketplaceStoreForTests,
} from "@/lib/marketplace/server-marketplace-repository";
import {
  createReservationServer,
  createResourceServer,
  listAvailabilityServer,
  replaceReservationsStoreForTests,
} from "@/lib/reservations/server-reservations-repository";
import { replaceExperienceStoreForTests } from "@/lib/experiences/server-experience-repository";
import { LocalServicesService } from "@/lib/economy/local-services-service";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

process.env.LCOS_LOCATION_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_BUSINESS_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";
process.env.LCOS_MARKETPLACE_FIXTURE = "1";
process.env.LCOS_ADMIN_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

describe("Local Services isolation", () => {
  beforeEach(async () => {
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
    await replaceMarketplaceStoreForTests(PANO);
    await replaceMarketplaceStoreForTests(VALLEY);
    await replaceGovernanceStoreForTests(PANO);
    await replaceGovernanceStoreForTests(VALLEY);
  });

  it("TEST 1 — a professional Business appears in its Territory", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Electricista Alex",
      category: "electrician",
      description: "Instalaciones locales",
      address: "Calle Mayor 1, Castelló, España",
      latitude: 40.508,
      longitude: 0.332,
      type: "service",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const context = await LocalServicesService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(context.services.professionals >= 1);
    assert.ok(context.services.businesses >= 1);
  });

  it("TEST 2 — another Territory cannot access it", async () => {
    await assert.rejects(
      () =>
        LocalServicesService.resolve({
          tenantId: PANO,
          actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        }),
      (error: Error) => error.name === "EconomyDeniedError",
    );
  });

  it("TEST 3 — Marketplace keeps isolation", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "sale",
      title: "Bicicleta",
      description: "En buen estado para el barrio.",
      category: "goods",
    });
    assert.equal(listing.type, "sale");
    assert.notEqual(listing.type, "offer_help");
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 4 — Help stays separate from sale", async () => {
    const help = await createHelpRequestServer({
      tenantId: PANO,
      createdBy: "person-maria",
      type: "offer_help",
      title: "María ayuda con plantas",
      description: "Puedo cuidar jardineras del patio.",
    });
    assert.equal(help.type, "offer_help");
    assert.equal(neighborExchangeIsMarketplace(), true);
    const context = await LocalServicesService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(context.services.helpOffers >= 1);
  });

  it("TEST 5 — a bookable service uses Reservation Context", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-alex",
      name: "Cabina de masaje",
      description: "Servicio local.",
      category: "service",
      location: "Wellness",
      capacity: 1,
      slotMinutes: 60,
    });
    const date = dateOffsetIso(0);
    const slots = await listAvailabilityServer(PANO, resource.id, date);
    const slot = slots.find((item) => item.status === "available");
    assert.ok(slot);
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-maria",
      resourceId: resource.id,
      context: { type: "service", id: resource.id },
      date,
      start: slot.start,
      end: slot.end,
    });
    assert.equal(reservation.contextType, "service");
    assert.equal(reservation.contextId, resource.id);
    assert.equal(reservation.resourceId, resource.id);
  });

  it("TEST 6 — Trust labels work without ratings", async () => {
    const labels = businessTrustLabels({
      registered: true,
      locationConfirmed: true,
      published: true,
    });
    assert.equal(labels.includes("Negocio registrado"), true);
    assert.equal(labels.includes("Ubicación confirmada"), true);
    assert.equal(labels.includes("Activo en la comunidad"), true);
    assert.equal(labels.some((item) => /⭐|rating|puntos/i.test(item)), false);
  });

  it("TEST 7 — Governance can report a service", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Fontanero Luis",
      category: "plumber",
      description: "Urgencias.",
      address: "Calle Mayor 2, Castelló, España",
      latitude: 40.508,
      longitude: 0.332,
      type: "service",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const report = await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "business",
      entityId: created.business.id,
      reason: "spam",
    });
    assert.equal(report.entityType, "business");
    const listed = await CommunityGovernanceService.listReports({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "moderator",
        personId: "person-mod",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const mine = listed.find((item) => item.entityId === created.business.id);
    assert.ok(mine);
    assert.equal("reporterPersonId" in mine, false);
  });

  it("TEST 8 — personalization reorders services without hiding", async () => {
    const items: CommunityFeedItem[] = [
      {
        id: "biz-resto",
        tenantId: PANO,
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        type: "business_activity",
        title: "Restaurante del club",
        description: "Cena mediterránea",
        actions: { primary: "contact" },
      },
      {
        id: "biz-elec",
        tenantId: PANO,
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        type: "business_activity",
        title: "Electricista del barrio",
        description: "Mantenimiento e instalaciones",
        actions: { primary: "contact" },
      },
    ];
    const ordered = boostRelevantServiceFeed(items, ["electricista", "mantenimiento"]);
    assert.equal(ordered[0]?.id, "biz-elec");
    assert.equal(ordered.length, 2);
  });

  it("TEST 9 — Valley is separated from Panorámica", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Solo Panorámica",
      category: "electrician",
      description: "No cruza.",
      address: "Calle Mayor 3, Castelló, España",
      latitude: 40.508,
      longitude: 0.332,
      type: "service",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const valleyCards = await LocalServicesService.cards({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(
      valleyCards.some((item) => item.id === created.business.id),
      false,
    );
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 10 — EconomyEntity does not exist", () => {
    const source = readFileSync(
      path.join(HERE, "local-services-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueEconomyEntity("EconomyEntity"), true);
    assert.equal(/export type EconomyEntity/.test(source), false);
    assert.equal(/export type LocalCommerceEntity/.test(source), false);
    assert.equal(/export type ServiceMarketplaceEntity/.test(source), false);
    assert.equal(/export type UniversalOfferEntity/.test(source), false);
    assert.equal(/export type ProviderScoreEntity/.test(source), false);
  });
});
