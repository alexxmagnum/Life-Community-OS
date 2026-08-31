import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  FORBIDDEN_SOCIAL_NETWORK_TYPES,
  aggregatedSocialLabel,
  createParticipationContext,
  isCommunityParticipationEntityType,
  occupyingParticipationCount,
  visibleParticipantIds,
} from "./participation";

describe("Community Participation Context", () => {
  it("projects participation around an experience without a social entity", () => {
    const context = createParticipationContext({
      tenantId: "life-panoramica",
      territoryId: "10000000-0000-4000-8000-000000000002",
      entityType: "experience",
      entityId: "exp-yoga",
      rows: [
        { personId: "person-alex", role: "creator" },
        { personId: "person-maria", role: "participant" },
      ],
      viewerPersonId: "person-maria",
      canJoin: true,
      canInvite: true,
      canConverse: true,
    });
    assert.equal(context.entityType, "experience");
    assert.equal(context.viewerParticipation.status, "joined");
    assert.equal(occupyingParticipationCount(context.participants), 2);
    assert.equal(
      context.actions.some((item) => item.kind === "invite" && item.enabled),
      true,
    );
    assert.equal(isCommunityParticipationEntityType("experience"), true);
    assert.equal(isCommunityParticipationEntityType("social_post"), false);
  });

  it("hides identities when privacy forbids appearing in participants", () => {
    const rows = [
      { personId: "person-alex", role: "creator" },
      { personId: "person-mia", role: "participant" },
    ];
    const visible = visibleParticipantIds(
      rows,
      new Map([
        [
          "person-mia",
          {
            appearInParticipants: false,
            receiveInvitations: true,
            showActivity: true,
          },
        ],
      ]),
    );
    assert.equal(visible.includes("person-mia"), false);
    assert.equal(visible.includes("person-alex"), true);
    assert.equal(aggregatedSocialLabel(8), "8 personas participando");
  });

  it("does not invent a parallel social network", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(here, "participation.ts"), "utf8");
    for (const name of FORBIDDEN_SOCIAL_NETWORK_TYPES) {
      assert.equal(new RegExp(`export type ${name}`).test(source), false);
      assert.equal(new RegExp(`interface ${name}`).test(source), false);
    }
    assert.equal(/Facebook/i.test(source), false);
  });
});
