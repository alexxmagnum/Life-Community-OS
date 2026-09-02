/**
 * Phase 18L-FIX-C — Business lifecycle & local economy trust isolation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  canAdminApproveBusiness,
  canOwnerSubmitBusinessForReview,
  isBusinessPubliclyDiscoverable,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanEditBusiness,
  actorCanPublishBusiness,
  actorCanReviewBusiness,
  businessVisibleToActor,
} from "@/lib/business/permissions";
import {
  createRegisteredBusiness,
  listBusinessesServer,
  listLocationsForMapVisibility,
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

function guestActor(tenantSlug: string): RequestActor {
  return {
    authenticated: false,
    hasMembership: false,
    membershipStatus: null,
    providerReference: null,
    personId: null,
    role: null,
    permissions: [],
    tenantSlug,
    membershipId: null,
    tenantDenied: false,
    territoryId: null,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: false,
      hasMembership: false,
      tenantId: tenantSlug,
    },
  };
}

function memberActor(
  tenantSlug: string,
  personId: string,
  role: RequestActor["role"] = "member",
): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    membershipStatus: "active",
    providerReference: "auth-user",
    personId,
    role,
    permissions: permissionsForRole(role),
    tenantSlug,
    membershipId: "mem-1",
    tenantDenied: false,
    territoryId: null,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: tenantSlug,
      role,
    },
  };
}

async function registerBusiness(input: {
  tenantId: string;
  ownerPersonId: string;
  name: string;
}) {
  return createRegisteredBusiness({
    tenantId: input.tenantId,
    ownerPersonId: input.ownerPersonId,
    name: input.name,
    category: "restaurant",
    description: "Cocina local",
    contact: "600000000",
    hours: "Lun–Dom 12:00–23:00",
    address: "Calle Mayor 1, Castelló, España",
    latitude: 40.508,
    longitude: 0.332,
    type: "business",
  });
}

describe("business lifecycle isolation", () => {
  beforeEach(async () => {
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
  });

  it("TEST 1 — nuevo negocio empieza en DRAFT", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Restaurante Mar",
    });
    assert.equal(created.business.status, "draft");
    assert.equal(isBusinessPubliclyDiscoverable(created.business.status), false);
    assert.equal(canOwnerSubmitBusinessForReview(created.business.status), true);
  });

  it("TEST 2 — DRAFT no aparece en Discover", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Borrador Oculto",
    });
    const guest = guestActor(PANO);
    assert.equal(businessVisibleToActor(guest, created.business), false);
    const discoverScreen = readWeb("screens/DiscoverScreen.tsx");
    assert.match(discoverScreen, /status:\s*"published"/);
  });

  it("TEST 3 — SUBMITTED no aparece público", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "En revisión",
    });
    const submitted = await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "pending_review",
    });
    assert.ok(submitted);
    assert.equal(submitted?.status, "pending_review");
    const guest = guestActor(PANO);
    assert.equal(businessVisibleToActor(guest, submitted!), false);
    const mapPins = await listLocationsForMapVisibility(PANO);
    assert.equal(
      mapPins.some((item) => item.id === created.location.id),
      false,
    );
  });

  it("TEST 4 — admin puede aprobar", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Cola admin",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "pending_review",
    });
    const admin = memberActor(PANO, "person-admin", "administrator");
    assert.equal(actorCanReviewBusiness(admin), true);
    assert.equal(canAdminApproveBusiness("pending_review"), true);
    const published = await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    assert.equal(published?.status, "published");
  });

  it("TEST 5 — PUBLISHED aparece público", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Visible LIFE",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const guest = guestActor(PANO);
    const row = (await listBusinessesServer(PANO)).find(
      (item) => item.id === created.business.id,
    );
    assert.ok(row);
    assert.equal(isBusinessPubliclyDiscoverable(row!.status), true);
    assert.equal(businessVisibleToActor(guest, row!), true);
    const mapPins = await listLocationsForMapVisibility(PANO);
    assert.equal(
      mapPins.some((item) => item.id === created.location.id),
      true,
    );
  });

  it("TEST 6 — SUSPENDED desaparece", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Suspendido",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "suspended",
    });
    const guest = guestActor(PANO);
    const row = (await listBusinessesServer(PANO)).find(
      (item) => item.id === created.business.id,
    );
    assert.ok(row);
    assert.equal(businessVisibleToActor(guest, row!), false);
    const mapPins = await listLocationsForMapVisibility(PANO);
    assert.equal(
      mapPins.some((item) => item.id === created.location.id),
      false,
    );
  });

  it("TEST 7 — owner solo gestiona su negocio", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Propio",
    });
    const owner = memberActor(PANO, "person-owner");
    const stranger = memberActor(PANO, "person-stranger");
    assert.equal(actorCanEditBusiness(owner, created.business), true);
    assert.equal(actorCanPublishBusiness(owner, created.business), true);
    assert.equal(actorCanEditBusiness(stranger, created.business), false);
    assert.equal(actorCanPublishBusiness(stranger, created.business), false);
    const registration = readWeb("screens/BusinessRegistrationScreen.tsx");
    assert.doesNotMatch(registration, /publishBusinessRequest/);
  });

  it("TEST 8 — tenant isolation", async () => {
    const created = await registerBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Solo Pano",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const valleyGuest = guestActor(VALLEY);
    const valleyList = await listBusinessesServer(VALLEY);
    assert.equal(
      valleyList.some((item) => item.id === created.business.id),
      false,
    );
    const row = (await listBusinessesServer(PANO)).find(
      (item) => item.id === created.business.id,
    );
    assert.ok(row);
    assert.equal(businessVisibleToActor(valleyGuest, row!), false);
  });
});
