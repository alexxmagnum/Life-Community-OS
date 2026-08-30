import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAPABILITIES,
  resolveEffectivePermissions,
} from "@life-community-os/types";
import { capabilitiesForRole } from "./capabilities";
import { MEMBERSHIP_ROLES } from "./roles";

describe("packages/auth authorization surface", () => {
  it("exposes platform roles, not tenant-pack roles", () => {
    assert.deepEqual([...MEMBERSHIP_ROLES], [
      "member",
      "group_manager",
      "moderator",
      "administrator",
    ]);
  });

  it("member cannot perform admin actions", () => {
    const caps = capabilitiesForRole("member");
    assert.equal(caps.has(CAPABILITIES.manageEnter), false);
    assert.equal(
      resolveEffectivePermissions({ role: "member" }).includes(
        CAPABILITIES.manageEnter,
      ),
      false,
    );
  });

  it("enabling tenant flags cannot grant administrator permissions", () => {
    const granted = resolveEffectivePermissions({
      role: "member",
      features: {
        experiences: true,
        activities: true,
        services: true,
        work: true,
        resources: true,
        recommendations: true,
        localLife: true,
        localEntities: true,
        communityPulse: true,
        groups: true,
        decide: true,
        interactions: true,
        incidents: true,
        feed: true,
        calendar: true,
        marketplace: true,
        communityChannels: true,
        officialChannels: true,
        municipalServices: true,
        securityModule: true,
        mobility: true,
        residencyVerification: true,
        participationTrust: true,
        intelligentDiffusion: true,
        housing: true,
        lifeMap: true,
      },
    });
    assert.equal(granted.includes(CAPABILITIES.securityView), false);
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
  });
});
