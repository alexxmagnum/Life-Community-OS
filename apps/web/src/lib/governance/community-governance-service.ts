/**
 * Community Governance Service — territorial rules, reports and safety.
 * Does not own Experience / Help / Marketplace / Business content.
 */

import type {
  CommunityContentReport,
  CommunityFeedItem,
  CommunityGovernanceContext,
  CommunityRule,
  GovernancePersonBlock,
  GovernanceReportEntityType,
  GovernanceReportStatus,
  GovernanceSafetyAction,
  GovernanceSafetyActionType,
  PublicGovernanceReport,
} from "@life-community-os/types";
import {
  emptyGovernanceContext,
  filterModeratedFeedItems,
  hiddenContentIdsFromActions,
  isGovernanceReportEntityType,
  isGovernanceReportReason,
  isGovernanceSafetyActionType,
  redactReporter,
  trustReviewRequired,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { canModerateCommunity } from "@/lib/community/permissions";
import { createCommunityNotification } from "@/lib/community/server-community-repository";
import { getExperienceServer } from "@/lib/experiences/server-experience-repository";
import {
  loadGovernanceStore,
  persistGovernanceStore,
} from "@/lib/governance/server-governance-repository";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export class GovernanceDeniedError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "GovernanceDeniedError";
  }
}

function newId(prefix: string): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function requireActor(actor: RequestActor, tenantId: string): string {
  if (!actor.authenticated || !actor.hasMembership || !actor.personId) {
    throw new GovernanceDeniedError("unauthorized");
  }
  if (
    resolveTenantPublicId(actor.tenantSlug) !==
    resolveTenantPublicId(tenantId)
  ) {
    throw new GovernanceDeniedError("forbidden");
  }
  return actor.personId;
}

function inTerritory(
  territoryId: string,
  recordTerritoryId: string,
): boolean {
  return recordTerritoryId === territoryId;
}

async function subjectForEntity(input: {
  tenantId: string;
  entityType: GovernanceReportEntityType;
  entityId: string;
}): Promise<string | undefined> {
  if (input.entityType !== "experience") return undefined;
  const experience = await getExperienceServer(input.tenantId, input.entityId);
  return experience?.ownerPersonId;
}

export const CommunityGovernanceService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<CommunityGovernanceContext> {
    requireActor(input.actor, input.tenantId);
    const store = await loadGovernanceStore(input.tenantId);
    const rules = store.rules.filter((rule) =>
      inTerritory(input.territoryId, rule.territoryId),
    );
    return emptyGovernanceContext({
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      role: input.actor.role,
      rules,
    });
  },

  async createRule(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    title: string;
    description: string;
  }): Promise<CommunityRule> {
    const personId = requireActor(input.actor, input.tenantId);
    const context = await this.resolve(input);
    if (!context.permissions.manageLocalRules) {
      throw new GovernanceDeniedError("forbidden");
    }
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || !description) {
      throw new GovernanceDeniedError("invalid");
    }
    const now = new Date().toISOString();
    const rule: CommunityRule = {
      id: newId("rule"),
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      title,
      description,
      active: true,
      createdBy: personId,
      createdAt: now,
    };
    const store = await loadGovernanceStore(input.tenantId);
    store.rules.push(rule);
    await persistGovernanceStore(input.tenantId, store);
    return rule;
  },

  async createReport(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    entityType: string;
    entityId: string;
    reason: string;
    personIdFromClient?: string | null;
    reporterPersonIdFromClient?: string | null;
  }): Promise<CommunityContentReport> {
    const personId = requireActor(input.actor, input.tenantId);
    if (
      input.personIdFromClient ||
      input.reporterPersonIdFromClient
    ) {
      throw new GovernanceDeniedError("owner_immutable");
    }
    if (!isGovernanceReportEntityType(input.entityType)) {
      throw new GovernanceDeniedError("invalid");
    }
    if (!isGovernanceReportReason(input.reason)) {
      throw new GovernanceDeniedError("invalid");
    }
    const entityId = input.entityId.trim();
    if (!entityId) throw new GovernanceDeniedError("invalid");
    const subjectPersonId = await subjectForEntity({
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId,
    });
    const now = new Date().toISOString();
    const report: CommunityContentReport = {
      id: newId("report"),
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      entityType: input.entityType,
      entityId,
      reason: input.reason,
      status: "open",
      reporterPersonId: personId,
      subjectPersonId,
      createdAt: now,
      updatedAt: now,
    };
    const store = await loadGovernanceStore(input.tenantId);
    store.reports.push(report);
    await persistGovernanceStore(input.tenantId, store);
    return report;
  },

  async listReports(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<PublicGovernanceReport[]> {
    const context = await this.resolve(input);
    if (!context.permissions.reviewReports) {
      throw new GovernanceDeniedError("forbidden");
    }
    const store = await loadGovernanceStore(input.tenantId);
    return store.reports
      .filter((item) => inTerritory(input.territoryId, item.territoryId))
      .map(redactReporter);
  },

  async listOwnReports(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<PublicGovernanceReport[]> {
    const personId = requireActor(input.actor, input.tenantId);
    const store = await loadGovernanceStore(input.tenantId);
    return store.reports
      .filter(
        (item) =>
          inTerritory(input.territoryId, item.territoryId) &&
          item.reporterPersonId === personId,
      )
      .map(redactReporter);
  },

  async reviewReport(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    reportId: string;
    status: GovernanceReportStatus;
    decisionFromClient?: string | null;
    moderatorIdFromClient?: string | null;
    contactCreator?: boolean;
  }): Promise<PublicGovernanceReport> {
    const personId = requireActor(input.actor, input.tenantId);
    if (input.decisionFromClient || input.moderatorIdFromClient) {
      throw new GovernanceDeniedError("owner_immutable");
    }
    const context = await this.resolve(input);
    if (!context.permissions.reviewReports) {
      throw new GovernanceDeniedError("forbidden");
    }
    const store = await loadGovernanceStore(input.tenantId);
    const report = store.reports.find(
      (item) =>
        item.id === input.reportId &&
        inTerritory(input.territoryId, item.territoryId),
    );
    if (!report) throw new GovernanceDeniedError("not_found");
    report.status = input.status;
    report.updatedAt = new Date().toISOString();
    if (input.status === "resolved" || input.status === "dismissed") {
      report.resolvedBy = personId;
    }
    await persistGovernanceStore(input.tenantId, store);
    await recordAdminAudit({
      actor: input.actor,
      action: "governance.review",
      entityType: "governance_report",
      entityId: report.id,
      reason: input.status,
      metadata: { territoryId: input.territoryId },
    });
    if (input.contactCreator && report.subjectPersonId) {
      await createCommunityNotification({
        tenantId: input.tenantId,
        recipientPersonId: report.subjectPersonId,
        kind: "community_governance",
        title: "Un moderador de tu territorio quiere hablar contigo.",
        body: "Hay un aviso sobre contenido que has publicado. El reportante permanece privado.",
        entityType:
          report.entityType === "experience" ||
          report.entityType === "event" ||
          report.entityType === "help"
            ? report.entityType
            : undefined,
        entityId: report.entityId,
        createdBy: personId,
      });
    }
    return redactReporter(report);
  },

  async applySafetyAction(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    type: string;
    entityType?: string;
    entityId?: string;
    targetPersonId?: string;
    reportId?: string;
    reason?: string;
    safetyLevelFromClient?: string | null;
    moderatorIdFromClient?: string | null;
  }): Promise<GovernanceSafetyAction> {
    const personId = requireActor(input.actor, input.tenantId);
    if (input.safetyLevelFromClient || input.moderatorIdFromClient) {
      throw new GovernanceDeniedError("owner_immutable");
    }
    const context = await this.resolve(input);
    if (!context.permissions.manageCommunity) {
      throw new GovernanceDeniedError("forbidden");
    }
    if (!isGovernanceSafetyActionType(input.type)) {
      throw new GovernanceDeniedError("invalid");
    }
    if (input.type === "hide" && !canModerateCommunity(input.actor.role)) {
      throw new GovernanceDeniedError("forbidden");
    }
    const entityType =
      input.entityType && isGovernanceReportEntityType(input.entityType)
        ? input.entityType
        : undefined;
    const now = new Date().toISOString();
    const action: GovernanceSafetyAction = {
      id: newId("safety"),
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      type: input.type as GovernanceSafetyActionType,
      entityType,
      entityId: input.entityId?.trim() || undefined,
      targetPersonId: input.targetPersonId?.trim() || undefined,
      reportId: input.reportId?.trim() || undefined,
      actorPersonId: personId,
      reason: input.reason?.trim() || undefined,
      createdAt: now,
    };
    const store = await loadGovernanceStore(input.tenantId);
    store.safetyActions.push(action);
    if (input.reportId) {
      const report = store.reports.find(
        (item) =>
          item.id === input.reportId &&
          inTerritory(input.territoryId, item.territoryId),
      );
      if (report && (input.type === "hide" || input.type === "warning")) {
        report.status = "reviewing";
        report.updatedAt = now;
      }
    }
    await persistGovernanceStore(input.tenantId, store);
    await recordAdminAudit({
      actor: input.actor,
      action: "governance.safety",
      entityType: "safety_action",
      entityId: action.id,
      reason: action.type,
      metadata: {
        territoryId: input.territoryId,
        entityId: action.entityId ?? "",
      },
    });
    return action;
  },

  async listSafetyActions(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<GovernanceSafetyAction[]> {
    const context = await this.resolve(input);
    if (!context.permissions.reviewReports) {
      throw new GovernanceDeniedError("forbidden");
    }
    const store = await loadGovernanceStore(input.tenantId);
    return store.safetyActions.filter((item) =>
      inTerritory(input.territoryId, item.territoryId),
    );
  },

  async blockPerson(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    blockedPersonId: string;
  }): Promise<GovernancePersonBlock> {
    const personId = requireActor(input.actor, input.tenantId);
    const blockedPersonId = input.blockedPersonId.trim();
    if (!blockedPersonId || blockedPersonId === personId) {
      throw new GovernanceDeniedError("invalid");
    }
    const store = await loadGovernanceStore(input.tenantId);
    const existing = store.blocks.find(
      (item) =>
        item.personId === personId &&
        item.blockedPersonId === blockedPersonId &&
        inTerritory(input.territoryId, item.territoryId),
    );
    if (existing) return existing;
    const block: GovernancePersonBlock = {
      id: newId("block"),
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      personId,
      blockedPersonId,
      createdAt: new Date().toISOString(),
    };
    store.blocks.push(block);
    await persistGovernanceStore(input.tenantId, store);
    return block;
  },

  async listOwnBlocks(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<GovernancePersonBlock[]> {
    const personId = requireActor(input.actor, input.tenantId);
    const store = await loadGovernanceStore(input.tenantId);
    return store.blocks.filter(
      (item) =>
        item.personId === personId &&
        inTerritory(input.territoryId, item.territoryId),
    );
  },

  async trustReviewHint(input: {
    tenantId: string;
    territoryId: string;
    personId: string;
  }): Promise<boolean> {
    const store = await loadGovernanceStore(input.tenantId);
    return trustReviewRequired({
      subjectPersonId: input.personId,
      territoryId: input.territoryId,
      reports: store.reports,
    });
  },

  async hiddenEntityIds(input: {
    tenantId: string;
    territoryId: string;
  }): Promise<string[]> {
    const store = await loadGovernanceStore(input.tenantId);
    return hiddenContentIdsFromActions(store.safetyActions, input.territoryId);
  },

  async annotateFeed(input: {
    tenantId: string;
    territoryId: string;
    items: readonly CommunityFeedItem[];
    viewerPersonId?: string | null;
  }): Promise<CommunityFeedItem[]> {
    const hidden = await this.hiddenEntityIds(input);
    let items = filterModeratedFeedItems(input.items, hidden);
    if (input.viewerPersonId) {
      const store = await loadGovernanceStore(input.tenantId);
      const blocked = new Set(
        store.blocks
          .filter(
            (item) =>
              item.personId === input.viewerPersonId &&
              inTerritory(input.territoryId, item.territoryId),
          )
          .map((item) => item.blockedPersonId),
      );
      if (blocked.size > 0) {
        items = items.filter((item) => {
          const organizer = item.metadata?.organizerPersonId;
          if (!organizer) return true;
          return !blocked.has(organizer);
        });
      }
    }
    return items;
  },
};
