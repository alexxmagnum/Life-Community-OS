/**
 * Admin Operations Center isolation tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  canAssignMembershipRole,
  canAccessAdminOperations,
  canAccessAdminSection,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { actorCanAccessOperations } from "./permissions";
import { loadOperationsDashboard } from "./operations-metrics";
import {
  listAdminAuditServer,
  recordAdminAudit,
  replaceAdminStoreForTests,
} from "./server-admin-repository";
import {
  createRegisteredBusiness,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import {
  createCommunityPost,
  moderateCommunityPost,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  createResourceServer,
  replaceReservationsStoreForTests,
  updateResourceServer,
} from "@/lib/reservations/server-reservations-repository";
import { actorCanManageResources } from "@/lib/reservations/permissions";
import { canModerateCommunity } from "@/lib/community/permissions";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";

process.env.LCOS_ADMIN_FIXTURE = "1";
process.env.LCOS_BUSINESS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
  tenantDenied?: boolean;
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
    tenantDenied: input.tenantDenied === true,
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

describe("admin operations isolation", () => {
  beforeEach(async () => {
    await replaceAdminStoreForTests(PANO);
    await replaceAdminStoreForTests(VALLEY);
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
  });

  it("TEST 1 — admin sees dashboard of their tenant", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    assert.equal(actorCanAccessOperations(admin), true);
    const metrics = await loadOperationsDashboard({ tenantId: PANO });
    assert.equal(metrics.tenantId, PANO);
    assert.equal(metrics.incidents, 0);
  });

  it("TEST 2 — Valley admin does not see Panoramica", async () => {
    const valleyAdmin = actor({
      tenantSlug: VALLEY,
      role: "administrator",
      personId: "person-valley-admin",
    });
    await recordAdminAudit({
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-pano-admin",
      }),
      action: "business.approve",
      entityType: "business",
      entityId: "biz-pano",
    });
    const valleyLog = await listAdminAuditServer(VALLEY);
    assert.equal(valleyLog.length, 0);
    const panoLog = await listAdminAuditServer(PANO);
    assert.equal(panoLog.length, 1);
    assert.equal(
      actorCanAccessOperations({ ...valleyAdmin, tenantDenied: true }),
      false,
    );
  });

  it("TEST 3 — member cannot enter admin", () => {
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-member",
    });
    assert.equal(canAccessAdminOperations("member"), false);
    assert.equal(actorCanAccessOperations(member), false);
    assert.equal(canAccessAdminSection("member", "dashboard"), false);
  });

  it("TEST 4 — admin publishes a business", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-owner",
      name: "Taller del puerto",
      category: "electrician",
      description: "Servicio local",
      contact: "600000000",
      hours: "Lun–Vie",
      address: "Calle Mayor 1",
      latitude: 40.5,
      longitude: 0.3,
      type: "service",
    });
    const published = await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    assert.equal(published?.status, "published");
    await recordAdminAudit({
      actor: admin,
      action: "business.approve",
      entityType: "business",
      entityId: created.business.id,
    });
    const log = await listAdminAuditServer(PANO);
    assert.equal(log[0]?.action, "business.approve");
  });

  it("TEST 5 — manager can manage an assigned resource", async () => {
    const manager = actor({
      tenantSlug: PANO,
      role: "group_manager",
      personId: "person-manager",
    });
    assert.equal(actorCanManageResources(manager), true);
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: manager.personId!,
      name: "Pista pádel 1",
      description: "Pista comunitaria",
      category: "sport",
    });
    const updated = await updateResourceServer({
      tenantId: PANO,
      resourceId: resource.id,
      status: "maintenance",
    });
    assert.equal(updated?.status, "maintenance");
  });

  it("TEST 6 — moderator can moderate content", async () => {
    const moderator = actor({
      tenantSlug: PANO,
      role: "moderator",
      personId: "person-mod",
    });
    assert.equal(canModerateCommunity(moderator.role), true);
    const post = await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-member",
      authorDisplayName: "Vecino",
      title: "Aviso",
      body: "Texto",
    });
    const hidden = await moderateCommunityPost({
      tenantId: PANO,
      postId: post.id,
      status: "hidden",
    });
    assert.equal(hidden?.status, "hidden");
  });

  it("TEST 7 — audit log records the action", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    const entry = await recordAdminAudit({
      actor: admin,
      action: "content.archive",
      entityType: "post",
      entityId: "post-1",
      reason: "fuera de normas",
    });
    assert.ok(entry);
    const listed = await listAdminAuditServer(PANO);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.actorPersonId, "person-admin");
    assert.equal(listed[0]?.reason, "fuera de normas");
  });

  it("TEST 8 — role change without permission is denied", () => {
    assert.equal(
      canAssignMembershipRole({
        actorRole: "moderator",
        fromRole: "member",
        toRole: "group_manager",
      }),
      false,
    );
    assert.equal(
      canAssignMembershipRole({
        actorRole: "administrator",
        fromRole: "member",
        toRole: "administrator",
      }),
      false,
    );
  });
});
