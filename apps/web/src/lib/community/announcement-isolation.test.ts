/**
 * Structured community announcements — permissions and tenant isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { MembershipRole } from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanCreateCommunityAnnouncement,
  actorCanCreateOfficialAnnouncement,
  actorCanReadTerritoryAnnouncements,
} from "@/lib/community/permissions";
import {
  CommunityOperationsService,
  OperationsDeniedError,
} from "@/lib/community/community-operations-service";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";

process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole | null;
  personId?: string | null;
  authenticated?: boolean;
  hasMembership?: boolean;
}): RequestActor {
  const authenticated = input.authenticated ?? true;
  const hasMembership = input.hasMembership ?? authenticated;
  const role = input.role ?? (authenticated ? "member" : null);
  const personId = input.personId ?? (authenticated ? "person-alex" : null);
  return {
    authenticated,
    hasMembership,
    membershipStatus: hasMembership ? "active" : null,
    providerReference: authenticated ? "auth-user" : null,
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : null,
    permissions:
      role && hasMembership
        ? permissionsForRole(role, input.tenantSlug)
        : [],
    tenantDenied: false,
    territoryId: null,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated,
      hasMembership,
      personId: personId ?? null,
      tenantId: input.tenantSlug,
      role: role ?? null,
    },
  };
}

function guestActor(tenantSlug: string): RequestActor {
  return actor({
    tenantSlug,
    authenticated: false,
    hasMembership: false,
    role: null,
    personId: null,
  });
}

describe("Structured community announcements isolation", () => {
  beforeEach(async () => {
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
  });

  it("TEST 1 — Visitor can read public announcements", async () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanReadTerritoryAnnouncements(guest), true);
    await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-admin",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Horario verano",
      body: "La piscina abre a las 10.",
      category: "official",
    });
    const listed = await CommunityOperationsService.announcements({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(listed.some((item) => item.title === "Horario verano"), true);
  });

  it("TEST 2 — Visitor cannot create announcements", async () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanCreateCommunityAnnouncement(guest), false);
    assert.equal(actorCanCreateOfficialAnnouncement(guest), false);
    await assert.rejects(
      () =>
        CommunityOperationsService.createAnnouncement({
          tenantId: PANO,
          actor: guest,
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
          title: "Aviso vecinal",
          body: "No permitido.",
          category: "community",
        }),
      (error: unknown) => error instanceof OperationsDeniedError,
    );
  });

  it("TEST 3 — Member can create community announcements", async () => {
    const member = actor({ tenantSlug: PANO, role: "member" });
    assert.equal(actorCanCreateCommunityAnnouncement(member), true);
    assert.equal(actorCanCreateOfficialAnnouncement(member), false);
    const created = await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: member,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Llave encontrada",
      body: "Recepción del club.",
      category: "community",
    });
    assert.equal(created.category, "community");
    assert.equal(created.createdBy, "person-alex");
  });

  it("TEST 4 — Admin can create official announcements", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    assert.equal(actorCanCreateOfficialAnnouncement(admin), true);
    const created = await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: admin,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Corte de agua",
      body: "Mañana de 9:00 a 13:00.",
      category: "official",
      priority: "urgent",
    });
    assert.equal(created.category, "official");
    assert.equal(created.priority, "urgent");
  });

  it("TEST 5 — Valley tenant does not see Panorámica announcements", async () => {
    const created = await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-admin",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Solo Panorámica",
      body: "No cruza a Valley.",
      category: "official",
    });
    const valleyListed = await CommunityOperationsService.announcements({
      tenantId: VALLEY,
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(
      valleyListed.some((item) => item.id === created.id),
      false,
    );
  });

  it("TEST 6 — Announcement belongs to the correct tenant", async () => {
    const created = await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, role: "member" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Mantenimiento piscina",
      body: "Cierre temporal.",
      category: "maintenance",
    });
    assert.equal(created.tenantId, PANO);
    assert.equal(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const listed = await CommunityOperationsService.announcements({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const match = listed.find((item) => item.id === created.id);
    assert.ok(match);
    assert.equal(match?.tenantId, PANO);
  });
});
