import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductCapabilityMap } from "./tenant-contract";
import { EMPTY_PRODUCT_CAPABILITIES } from "./tenant-contract";
import { CAPABILITIES } from "./capabilities";
import type { TenantFeatureFlags } from "./capabilities";
import {
  capabilitiesForRole,
  resolveEffectivePermissions,
} from "./authorization";

const ALL_FEATURES_ON: TenantFeatureFlags = {
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
};

const TENANT_A_FEATURES: TenantFeatureFlags = {
  ...ALL_FEATURES_ON,
  marketplace: true,
  housing: true,
};

const TENANT_B_FEATURES: TenantFeatureFlags = {
  ...ALL_FEATURES_ON,
  marketplace: false,
  housing: false,
  lifeMap: false,
  securityModule: false,
};

const TENANT_A_PRODUCT: ProductCapabilityMap = {
  ...EMPTY_PRODUCT_CAPABILITIES,
  golf: true,
  marketplace: true,
  housing: true,
  lifeMap: true,
  resources: true,
  experiences: true,
  community: true,
};

const TENANT_B_PRODUCT: ProductCapabilityMap = {
  ...EMPTY_PRODUCT_CAPABILITIES,
  golf: false,
  hospitality: true,
  marketplace: false,
  housing: false,
  lifeMap: false,
  resources: true,
  experiences: true,
  community: true,
};

describe("platform authorization", () => {
  it("keeps marketplace on for tenant A and off for tenant B", () => {
    const tenantA = resolveEffectivePermissions({
      role: "member",
      features: TENANT_A_FEATURES,
      productCapabilities: TENANT_A_PRODUCT,
    });
    const tenantB = resolveEffectivePermissions({
      role: "member",
      features: TENANT_B_FEATURES,
      productCapabilities: TENANT_B_PRODUCT,
    });
    assert.equal(tenantA.includes(CAPABILITIES.marketplaceCreate), true);
    assert.equal(tenantA.includes(CAPABILITIES.housingView), true);
    assert.equal(tenantB.includes(CAPABILITIES.marketplaceCreate), false);
    assert.equal(tenantB.includes(CAPABILITIES.marketplaceView), false);
    assert.equal(tenantB.includes(CAPABILITIES.housingView), false);
  });

  it("does not grant admin actions to member", () => {
    const member = capabilitiesForRole("member");
    assert.equal(member.has(CAPABILITIES.manageEnter), false);
    assert.equal(member.has(CAPABILITIES.housingManage), false);
    assert.equal(member.has(CAPABILITIES.securityView), false);
    assert.equal(member.has(CAPABILITIES.resourceCreateTerritorial), false);
    const effective = resolveEffectivePermissions({
      role: "member",
      features: ALL_FEATURES_ON,
    });
    assert.equal(effective.includes(CAPABILITIES.manageEnter), false);
  });

  it("does not let tenant configuration grant permissions the role lacks", () => {
    const granted = resolveEffectivePermissions({
      role: "member",
      features: ALL_FEATURES_ON,
      productCapabilities: {
        ...EMPTY_PRODUCT_CAPABILITIES,
        golf: true,
        marketplace: true,
        housing: true,
        lifeMap: true,
        resources: true,
        experiences: true,
        community: true,
        reservations: true,
        work: true,
        official: true,
        hospitality: true,
      },
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
    assert.equal(granted.includes(CAPABILITIES.housingManage), false);
    assert.equal(granted.includes(CAPABILITIES.lifeMapManage), false);
    assert.equal(granted.includes(CAPABILITIES.securityView), false);
    assert.equal(granted.includes(CAPABILITIES.announcementPublishOfficial), false);
    assert.equal(granted.includes(CAPABILITIES.channelCreate), false);
  });

  it("returns the full role matrix when tenant config is omitted", () => {
    const member = resolveEffectivePermissions({ role: "member" });
    assert.equal(member.includes(CAPABILITIES.marketplaceCreate), true);
    assert.equal(member.includes(CAPABILITIES.housingView), true);
    const admin = resolveEffectivePermissions({ role: "administrator" });
    assert.equal(admin.includes(CAPABILITIES.manageEnter), true);
    assert.equal(admin.includes(CAPABILITIES.securityView), true);
  });
});
