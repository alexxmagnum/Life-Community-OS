/**
 * Community Communication Service — territorial messaging experience.
 * Composes Communication Core + Community domains. Never duplicates Message SoT.
 */

import {
  projectCommunityCommunicationContext,
  projectLifeHomeCommunicationSummary,
  type CommunityCommunicationContext,
  type LifeHomeContext,
  type LifeHomeCommunicationSummary,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { CommunityOperationsService } from "@/lib/community/community-operations-service";
import { canModerateCommunity } from "@/lib/community/permissions";
import {
  getParticipationPrivacyServer,
  listCommunitySnapshot,
} from "@/lib/community/server-community-repository";
import {
  findOrCreateConversationServer,
  getConversationThreadServer,
  listMyConversationsServer,
  postMessageServer,
} from "@/lib/communication/server-communication-repository";
import { CommunityGovernanceService } from "@/lib/governance/community-governance-service";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

async function communicationInput(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
}) {
  const personId = input.actor.personId;
  const [context, announcements, conversations, participationPrivacy, snapshot] =
    await Promise.all([
      PersonalizationService.resolve({
        tenantId: input.tenantId,
        actor: input.actor,
        territoryId: input.territoryId,
      }),
      CommunityOperationsService.announcements({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
      }),
      input.actor.hasMembership && personId
        ? listMyConversationsServer(input.tenantId, input.actor)
        : Promise.resolve([]),
      personId
        ? getParticipationPrivacyServer(input.tenantId, personId)
        : Promise.resolve(undefined),
      listCommunitySnapshot(input.tenantId),
    ]);
  const acknowledgedAnnouncementIds =
    personId && snapshot.reactions
      ? snapshot.reactions
          .filter(
            (row) =>
              row.personId === personId &&
              row.targetType === "post" &&
              row.kind === "acknowledge",
          )
          .map((row) => row.targetId)
      : [];
  const isCommunityAdmin = canModerateCommunity(input.actor.role);
  let pendingReports = 0;
  if (isCommunityAdmin) {
    const reports = await CommunityGovernanceService.listReports({
      tenantId: input.tenantId,
      actor: input.actor,
      territoryId: input.territoryId,
    });
    pendingReports = reports.filter((row) => row.status === "open").length;
  }
  const scopedConversations = conversations.filter((item) => {
    const territoryId = item.conversation.territoryId?.trim();
    return !territoryId || territoryId === input.territoryId;
  });
  return {
    context,
    announcements,
    conversations: scopedConversations,
    acknowledgedAnnouncementIds,
    participationPrivacy,
    isCommunityAdmin,
    pendingReports,
  };
}

export const CommunityCommunicationService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<CommunityCommunicationContext> {
    const base = await communicationInput(input);
    return projectCommunityCommunicationContext({
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      context: base.context,
      conversations: base.conversations,
      announcements: base.announcements,
      acknowledgedAnnouncementIds: base.acknowledgedAnnouncementIds,
      participationPrivacy: base.participationPrivacy ?? undefined,
      hasMembership: input.actor.hasMembership,
      isCommunityAdmin: base.isCommunityAdmin,
      pendingReports: base.pendingReports,
    });
  },

  async enrichHome(
    home: LifeHomeContext,
    input: {
      tenantId: string;
      actor: RequestActor;
      territoryId: string;
    },
  ): Promise<LifeHomeContext> {
    if (home.membershipScope !== "active") return home;
    const communication = await this.resolve(input);
    const summary = projectLifeHomeCommunicationSummary({ communication });
    if (
      summary.importantAnnouncements.length === 0 &&
      summary.unreadCount === 0
    ) {
      return home;
    }
    return { ...home, communication: summary };
  },

  homeCommunicationSummary(
    communication: CommunityCommunicationContext,
  ): LifeHomeCommunicationSummary {
    return projectLifeHomeCommunicationSummary({ communication });
  },

  async sendMessage(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    conversationId?: string;
    contextType?: string;
    contextId?: string;
    content: string;
    scope?: import("@/lib/communication/server-communication-repository").CommunicationWriteScope;
  }) {
    if (!input.actor.hasMembership || !input.actor.personId) {
      throw new Error("forbidden");
    }
    let conversationId = input.conversationId?.trim();
    if (!conversationId && input.contextType && input.contextId) {
      const thread = await findOrCreateConversationServer({
        tenantId: input.tenantId,
        actor: input.actor,
        type: input.contextType === "community" ? "group" : "context",
        contextType: input.contextType,
        contextId: input.contextId,
        territoryId: input.territoryId,
        scope: input.scope,
      });
      conversationId = thread.conversation.id;
      await recordAdminAudit({
        actor: input.actor,
        action: "community.communication.channel.created",
        entityType: "conversation",
        entityId: conversationId,
        metadata: {
          territoryId: input.territoryId,
          contextType: input.contextType,
        },
      });
    }
    if (!conversationId) throw new Error("invalid");
    const thread = await getConversationThreadServer(
      input.tenantId,
      conversationId,
      input.actor,
      input.scope,
    );
    if (!thread) throw new Error("not_found");
    const territoryId = thread.conversation.territoryId?.trim();
    if (territoryId && territoryId !== input.territoryId) {
      throw new Error("forbidden");
    }
    return postMessageServer({
      tenantId: input.tenantId,
      conversationId,
      actor: input.actor,
      content: input.content,
      scope: input.scope,
    });
  },

  async reportMessage(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    messageId: string;
    reason?: string;
  }) {
    if (!input.actor.hasMembership) throw new Error("forbidden");
    const report = await CommunityGovernanceService.createReport({
      tenantId: input.tenantId,
      actor: input.actor,
      territoryId: input.territoryId,
      entityType: "message",
      entityId: input.messageId,
      reason:
        input.reason === "spam" ||
        input.reason === "inappropriate" ||
        input.reason === "safety"
          ? input.reason
          : "other",
    });
    await recordAdminAudit({
      actor: input.actor,
      action: "community.communication.message.reported",
      entityType: "message",
      entityId: input.messageId,
      metadata: { territoryId: input.territoryId, reportId: report.id },
    });
    return report;
  },
};

export { ConversationExperienceService } from "@life-community-os/types";
