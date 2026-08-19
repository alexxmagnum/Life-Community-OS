/**
 * Marketplace + Help isolation and ownership tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanEditListing,
  listingVisibleToActor,
} from "./permissions";
import {
  createMarketplaceListingServer,
  listMarketplaceListingsServer,
  replaceMarketplaceStoreForTests,
  updateMarketplaceListingServer,
} from "./server-marketplace-repository";
import {
  actorCanEditHelp,
  helpVisibleToActor,
} from "@/lib/help/permissions";
import {
  createHelpRequestServer,
  listHelpRequestsServer,
  replaceHelpStoreForTests,
} from "@/lib/help/server-help-repository";
import {
  createRegisteredBusiness,
  listBusinessesServer,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { businessVisibleToActor } from "@/lib/business/permissions";

process.env.LCOS_MARKETPLACE_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";
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

describe("marketplace + help isolation", () => {
  beforeEach(async () => {
    await replaceMarketplaceStoreForTests(PANO);
    await replaceMarketplaceStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
    await replaceBusinessStoreForTests(PANO);
    await replaceLocationsForTests(PANO);
  });

  it("TEST 1 — usuario crea anuncio", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "sale",
      title: "Sofá de dos plazas",
      description: "Buen estado, recogida en la comunidad.",
      price: 80,
    });
    assert.equal(listing.tenantId, PANO);
    assert.equal(listing.ownerPersonId, "person-alex");
    assert.equal(listing.createdBy, "person-alex");
    assert.equal(listing.status, "published");
    const listed = await listMarketplaceListingsServer(PANO);
    assert.equal(listed.some((item) => item.id === listing.id), true);
  });

  it("TEST 2 — usuario edita anuncio propio", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "giveaway",
      title: "Bicicleta",
      description: "La dejamos a una familia de la comunidad.",
    });
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    assert.equal(actorCanEditListing(owner, listing), true);
    const updated = await updateMarketplaceListingServer({
      tenantId: PANO,
      listingId: listing.id,
      patch: { title: "Bicicleta infantil" },
    });
    assert.equal(updated?.title, "Bicicleta infantil");
    assert.equal(updated?.ownerPersonId, "person-alex");
  });

  it("TEST 3 — usuario edita anuncio ajeno DENIED", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "sale",
      title: "Mesa",
      description: "Mesa de exterior.",
    });
    const stranger = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    assert.equal(actorCanEditListing(stranger, listing), false);
  });

  it("TEST 4 — Valley no ve Marketplace Panoramica", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "sale",
      title: "Solo Panorámica",
      description: "No debe salir en Valley.",
    });
    const valleyActor = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-valley",
    });
    const valleyList = await listMarketplaceListingsServer(VALLEY);
    assert.equal(
      valleyList.some((item) => item.id === listing.id),
      false,
    );
    assert.equal(listingVisibleToActor(valleyActor, listing), false);
  });

  it("TEST 5 — professional service aparece solo publicado", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Electricidad Alex",
      category: "electrician",
      address: "Calle Mayor 1, Castelló",
      latitude: 40.5,
      longitude: 0.33,
      type: "service",
    });
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-jordan",
    });
    assert.equal(created.business.status, "draft");
    assert.equal(businessVisibleToActor(member, created.business), false);
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const published = (await listBusinessesServer(PANO)).find(
      (item) => item.id === created.business.id,
    );
    assert.ok(published);
    assert.equal(published.status, "published");
    assert.equal(businessVisibleToActor(member, published), true);
  });

  it("TEST 6 — help request pertenece al tenant correcto", async () => {
    const help = await createHelpRequestServer({
      tenantId: PANO,
      createdBy: "person-alex",
      type: "need_help",
      category: "tools",
      title: "¿Alguien presta un taladro?",
      description: "Necesito colgar dos cuadros este finde.",
    });
    assert.equal(help.tenantId, PANO);
    assert.equal(help.createdBy, "person-alex");
    const valley = await listHelpRequestsServer(VALLEY);
    assert.equal(
      valley.some((item) => item.id === help.id),
      false,
    );
    const valleyActor = actor({
      tenantSlug: VALLEY,
      role: "member",
      personId: "person-valley",
    });
    assert.equal(helpVisibleToActor(valleyActor, help), false);
  });

  it("TEST 7 — frontend intenta spoof owner DENIED", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      ownerPersonIdFromClient: "person-intruder",
      type: "sale",
      title: "Taladro",
      description: "En buen estado.",
    });
    assert.equal(listing.ownerPersonId, "person-alex");
    assert.notEqual(listing.ownerPersonId, "person-intruder");
    const help = await createHelpRequestServer({
      tenantId: PANO,
      createdBy: "person-alex",
      createdByFromClient: "person-intruder",
      type: "offer_help",
      title: "Puedo ayudar con mudanzas",
      description: "Fines de semana.",
    });
    assert.equal(help.createdBy, "person-alex");
    const stranger = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-intruder",
    });
    assert.equal(actorCanEditListing(stranger, listing), false);
    assert.equal(actorCanEditHelp(stranger, help), false);
  });
});
