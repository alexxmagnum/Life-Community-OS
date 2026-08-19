/**
 * Housing isolation, ownership, residency, and privacy tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { toPropertyPublicView } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import {
  actorCanEditProperty,
  canSeePropertyHousehold,
  propertyVisibleToActor,
} from "./permissions";
import {
  addPropertyMemberServer,
  createRegisteredProperty,
  listHousingStore,
  replaceHousingStoreForTests,
  updatePropertyServer,
} from "./server-housing-repository";

process.env.LCOS_HOUSING_FIXTURE = "1";
process.env.LCOS_LOCATION_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
}): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: input.personId,
    role: input.role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(input.role),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: input.personId,
      tenantId: input.tenantSlug,
      role: input.role,
    },
  };
}

async function register(input: {
  tenantId: string;
  createdBy: string;
  title: string;
  availability?: "private" | "rent" | "sale";
  ownerPersonIdFromClient?: string | null;
}) {
  return createRegisteredProperty({
    tenantId: input.tenantId,
    createdBy: input.createdBy,
    ownerPersonIdFromClient: input.ownerPersonIdFromClient,
    title: input.title,
    description: "Vivienda de prueba en la comunidad.",
    propertyType: "apartment",
    address: "Calle Mayor 12, Castelló",
    latitude: 40.5,
    longitude: 0.33,
    availability: input.availability ?? "private",
    areaLabel: "Centro",
  });
}

describe("housing property isolation", () => {
  beforeEach(async () => {
    await replaceHousingStoreForTests(PANO);
    await replaceHousingStoreForTests(VALLEY);
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
  });

  it("TEST 1 — usuario crea propiedad", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Piso en la aldea",
    });
    assert.equal(created.property.tenantId, PANO);
    assert.equal(created.property.createdBy, "person-alex");
    assert.equal(created.ownerMembership.relationshipType, "owner");
    assert.equal(created.ownerMembership.personId, "person-alex");
    assert.ok(created.property.locationId);
    assert.equal(created.location.type, "community-place");
    const listed = await listHousingStore(PANO);
    assert.equal(
      listed.properties.some((item) => item.id === created.property.id),
      true,
    );
  });

  it("TEST 2 — owner gestiona propiedad propia", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Villa norte",
    });
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const store = await listHousingStore(PANO);
    assert.equal(
      actorCanEditProperty(owner, created.property, store.memberships),
      true,
    );
    const updated = await updatePropertyServer({
      tenantId: PANO,
      propertyId: created.property.id,
      patch: { title: "Villa norte reformada" },
    });
    assert.equal(updated?.title, "Villa norte reformada");
    assert.equal(updated?.createdBy, "person-alex");
  });

  it("TEST 3 — usuario ajeno no accede", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Casa privada",
      availability: "private",
    });
    const stranger = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    const store = await listHousingStore(PANO);
    assert.equal(
      propertyVisibleToActor(stranger, created.property, store.memberships),
      false,
    );
    assert.equal(
      actorCanEditProperty(stranger, created.property, store.memberships),
      false,
    );
  });

  it("TEST 4 — resident ve propiedad asignada", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Piso familiar",
      availability: "private",
    });
    await addPropertyMemberServer({
      tenantId: PANO,
      propertyId: created.property.id,
      personId: "person-jordan",
      relationshipType: "resident",
      createdBy: "person-alex",
    });
    const resident = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    const store = await listHousingStore(PANO);
    assert.equal(
      propertyVisibleToActor(resident, created.property, store.memberships),
      true,
    );
    assert.equal(
      canSeePropertyHousehold(resident, created.property, store.memberships),
      true,
    );
    assert.equal(
      actorCanEditProperty(resident, created.property, store.memberships),
      false,
    );
  });

  it("TEST 5 — Valley no ve viviendas Panoramica", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Solo Panorámica",
      availability: "rent",
    });
    const valleyActor = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-valley",
    });
    const valley = await listHousingStore(VALLEY);
    assert.equal(
      valley.properties.some((item) => item.id === created.property.id),
      false,
    );
    const pano = await listHousingStore(PANO);
    assert.equal(
      propertyVisibleToActor(valleyActor, created.property, pano.memberships),
      false,
    );
  });

  it("TEST 6 — owner enviado desde frontend no modifica ownership", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Piso",
      ownerPersonIdFromClient: "person-intruder",
    });
    assert.equal(created.property.createdBy, "person-alex");
    assert.notEqual(created.property.createdBy, "person-intruder");
    assert.equal(created.ownerMembership.personId, "person-alex");
  });

  it("TEST 7 — datos privados no aparecen en listado público", async () => {
    const created = await register({
      tenantId: PANO,
      createdBy: "person-alex",
      title: "Piso en alquiler",
      availability: "rent",
    });
    const view = toPropertyPublicView(created.property);
    assert.ok(view);
    assert.equal(view.title, "Piso en alquiler");
    assert.equal("createdBy" in view, false);
    const serialized = JSON.stringify(view);
    assert.equal(serialized.includes("person-alex"), false);
    assert.equal(serialized.includes("createdBy"), false);
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    const store = await listHousingStore(PANO);
    assert.equal(
      propertyVisibleToActor(member, created.property, store.memberships),
      true,
    );
    assert.equal(
      canSeePropertyHousehold(member, created.property, store.memberships),
      false,
    );
  });
});
