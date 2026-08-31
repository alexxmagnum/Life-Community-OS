import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyGovernanceContext,
  filterModeratedFeedItems,
  hasGovernanceKarma,
  isOpaqueGovernanceEntity,
  redactReporter,
  territoryRolesFromMembership,
  trustReviewRequired,
  type CommunityContentReport,
  type CommunityFeedItem,
} from "./governance-context";

const TERRITORY = "10000000-0000-4000-8000-000000000002";
const OTHER = "20000000-0000-4000-8000-000000000002";

function report(partial: Partial<CommunityContentReport>): CommunityContentReport {
  return {
    id: partial.id ?? "r1",
    tenantId: "life-panoramica",
    territoryId: TERRITORY,
    entityType: "experience",
    entityId: "exp-1",
    reason: "spam",
    status: "open",
    reporterPersonId: "person-reporter",
    subjectPersonId: "person-alex",
    createdAt: "2026-08-31T10:00:00.000Z",
    updatedAt: "2026-08-31T10:00:00.000Z",
    ...partial,
  };
}

describe("Community Governance Context", () => {
  it("maps membership roles to territorial governance without global staff", () => {
    const admin = emptyGovernanceContext({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      role: "administrator",
    });
    assert.equal(admin.roles.administrator, true);
    assert.equal(admin.permissions.manageLocalRules, true);
    assert.equal(admin.permissions.reviewReports, true);
    const moderator = territoryRolesFromMembership("moderator");
    assert.equal(moderator.administrator, false);
    assert.equal(moderator.moderator, true);
    assert.equal(isOpaqueGovernanceEntity("GlobalModerator"), true);
    assert.equal(isOpaqueGovernanceEntity("PlatformModerator"), true);
  });

  it("keeps rules inside the Territory", () => {
    const context = emptyGovernanceContext({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      role: "administrator",
      rules: [
        {
          id: "rule-1",
          tenantId: "life-panoramica",
          territoryId: TERRITORY,
          title: "Respeto entre vecinos",
          description: "Convive con cuidado.",
          active: true,
          createdBy: "person-admin",
          createdAt: "2026-08-31T10:00:00.000Z",
        },
        {
          id: "rule-other",
          tenantId: "life-valley",
          territoryId: OTHER,
          title: "Otra norma",
          description: "No aplica.",
          active: true,
          createdBy: "person-valley",
          createdAt: "2026-08-31T10:00:00.000Z",
        },
      ],
    });
    assert.equal(context.rules.length, 1);
    assert.equal(context.rules[0]?.territoryId, TERRITORY);
  });

  it("protects the reporter identity", () => {
    const publicView = redactReporter(report({}));
    assert.equal(publicView.reporterProtected, true);
    assert.equal("reporterPersonId" in publicView, false);
  });

  it("asks for trust review without scoring or karma", () => {
    assert.equal(
      trustReviewRequired({
        subjectPersonId: "person-alex",
        territoryId: TERRITORY,
        reports: [report({ id: "a" }), report({ id: "b" })],
      }),
      true,
    );
    assert.equal(hasGovernanceKarma("Vecino colaborador"), false);
    assert.equal(isOpaqueGovernanceEntity("ReputationPenalty"), true);
    assert.equal(isOpaqueGovernanceEntity("GlobalBan"), true);
    assert.equal(isOpaqueGovernanceEntity("UniversalContentEntity"), true);
  });

  it("filters hidden content without dropping people", () => {
    const items: CommunityFeedItem[] = [
      {
        id: "exp-hidden",
        tenantId: "life-panoramica",
        territoryId: TERRITORY,
        type: "experience",
        title: "Oculta",
        experienceId: "exp-hidden",
        actions: { primary: "join" },
        metadata: { organizerPersonId: "person-alex" },
      },
      {
        id: "exp-open",
        tenantId: "life-panoramica",
        territoryId: TERRITORY,
        type: "experience",
        title: "Abierta",
        experienceId: "exp-open",
        actions: { primary: "join" },
        metadata: { organizerPersonId: "person-alex" },
      },
    ];
    const filtered = filterModeratedFeedItems(items, ["exp-hidden"]);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, "exp-open");
    assert.equal(filtered[0]?.metadata?.organizerPersonId, "person-alex");
  });
});
