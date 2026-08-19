/**
 * Business ownership, publication, and tenant isolation tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanEditBusiness,
  actorCanPublishBusiness,
  actorCanReviewBusiness,
  businessVisibleToActor,
} from "./permissions";
import {
  createRegisteredBusiness,
  listBusinessesServer,
  listLocationsForMapVisibility,
  replaceBusinessStoreForTests,
  setBusinessStatus,
  updateBusinessProfile,
} from "./server-business-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";

process.env.LCOS_BUSINESS_FIXTURE = "1";

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
  ownerPersonId: string;
  name: string;
  spoofOwner?: string;
}) {
  return createRegisteredBusiness({
    tenantId: input.tenantId,
    ownerPersonId: input.ownerPersonId,
    ownerPersonIdFromClient: input.spoofOwner ?? null,
    name: input.name,
    category: "electrician",
    description: "Servicio local",
    contact: "600000000",
    hours: "Lun–Vie 9:00–18:00",
    address: "Calle Mayor 1, Castelló, España",
    latitude: 40.508,
    longitude: 0.332,
    type: "service",
  });
}

describe("business platform ownership", () => {
  beforeEach(async () => {
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
  });

  it("TEST 1 — usuario crea negocio", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Electricidad Alex",
    });
    assert.equal(created.business.tenantId, PANO);
    assert.equal(created.business.ownerPersonId, "person-alex");
    assert.equal(created.business.status, "draft");
    assert.equal(created.location.tenantId, PANO);
    assert.equal(created.location.businessId, created.business.id);
    assert.equal(created.location.visibility, "private");
    const listed = await listBusinessesServer(PANO);
    assert.equal(listed.some((item) => item.id === created.business.id), true);
  });

  it("TEST 2 — usuario no puede editar negocio ajeno", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
    });
    const stranger = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    assert.equal(actorCanEditBusiness(stranger, created.business), false);
  });

  it("TEST 3 — administrador publica negocio", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
    });
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    assert.equal(actorCanPublishBusiness(admin, created.business), true);
    assert.equal(actorCanReviewBusiness(admin), true);
    const published = await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    assert.equal(published?.status, "published");
  });

  it("TEST 4 — Valley no puede ver negocio Panoramica", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Solo Panorámica",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const valley = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-valley",
    });
    const valleyList = await listBusinessesServer(VALLEY);
    assert.equal(
      valleyList.some((item) => item.id === created.business.id),
      false,
    );
    const published = (await listBusinessesServer(PANO)).find(
      (item) => item.id === created.business.id,
    );
    assert.ok(published);
    assert.equal(businessVisibleToActor(valley, published), false);
    assert.equal(published.tenantId === VALLEY, false);
  });

  it("TEST 5 — Location creada pertenece al tenant correcto", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
    });
    assert.equal(created.location.tenantId, PANO);
    assert.equal(created.business.locationId, created.location.id);
    const valleyPlaces = await listLocationsForMapVisibility(VALLEY);
    assert.equal(
      valleyPlaces.some((item) => item.id === created.location.id),
      false,
    );
  });

  it("TEST 6 — negocio publicado aparece en mapa", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
    });
    const before = await listLocationsForMapVisibility(PANO);
    assert.equal(
      before.some((item) => item.id === created.location.id),
      false,
    );
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const after = await listLocationsForMapVisibility(PANO);
    const pin = after.find((item) => item.id === created.location.id);
    assert.ok(pin);
    assert.equal(pin.visibility, "public");
    assert.equal(pin.tenantId, PANO);
  });

  it("TEST 7 — cambio manual de owner desde frontend DENIED", async () => {
    const created = await register({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
      spoofOwner: "person-intruder",
    });
    assert.equal(created.business.ownerPersonId, "person-alex");
    assert.notEqual(created.business.ownerPersonId, "person-intruder");
    const patched = await updateBusinessProfile({
      tenantId: PANO,
      businessId: created.business.id,
      patch: { name: "Taller Alex Norte" },
    });
    assert.equal(patched?.ownerPersonId, "person-alex");
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const stranger = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-intruder",
    });
    assert.equal(actorCanEditBusiness(owner, created.business), true);
    assert.equal(actorCanEditBusiness(stranger, created.business), false);
  });
});
