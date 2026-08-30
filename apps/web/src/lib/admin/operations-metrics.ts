/**
 * Operations dashboard metrics — assembled from existing domain stores.
 * Never invents numbers. Missing domains stay empty.
 */

import { listMembershipDirectory } from "@/lib/auth/ensure-domain-membership";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { listCommunitySnapshot } from "@/lib/community/server-community-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { listReservationsServer } from "@/lib/reservations/server-reservations-repository";
import type { AdminWriteScope } from "./server-admin-repository";

export type OperationsDashboardMetrics = {
  tenantId: string;
  activeMembers: number;
  newMembers: number;
  publishedBusinesses: number;
  upcomingReservations: number;
  pendingPublications: number;
  openHelpRequests: number;
  incidents: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadOperationsDashboard(input: {
  tenantId: string;
  scope?: AdminWriteScope;
}): Promise<OperationsDashboardMetrics> {
  const tenantId = input.tenantId;
  const [directory, businesses, community, help, reservations] =
    await Promise.all([
      listMembershipDirectory(tenantId),
      listBusinessesServer(tenantId, input.scope),
      listCommunitySnapshot(tenantId, input.scope),
      listHelpRequestsServer(tenantId, input.scope),
      listReservationsServer(tenantId, input.scope),
    ]);

  const now = Date.now();
  const activeMembers = directory.filter(
    (row) => row.membership.status === "active",
  ).length;
  const newMembers = directory.filter((row) => {
    const created = Date.parse(row.membership.createdAt);
    return Number.isFinite(created) && now - created <= WEEK_MS;
  }).length;
  const publishedBusinesses = businesses.filter(
    (item) => item.tenantId === tenantId && item.status === "published",
  ).length;
  const upcomingReservations = reservations.filter((item) => {
    if (item.tenantId && item.tenantId !== tenantId) return false;
    if (
      item.status === "cancelled" ||
      item.status === "completed" ||
      item.status === "expired"
    ) {
      return false;
    }
    const start = Date.parse(item.startTime ?? `${item.date}T${item.start}:00.000Z`);
    return Number.isFinite(start) && start >= now;
  }).length;
  const pendingPublications = community.posts.filter(
    (post) =>
      post.tenantId === tenantId &&
      (post.status === "hidden" || post.status === "draft"),
  ).length;
  const openHelpRequests = help.filter(
    (item) => item.tenantId === tenantId && item.status === "open",
  ).length;

  return {
    tenantId,
    activeMembers,
    newMembers,
    publishedBusinesses,
    upcomingReservations,
    pendingPublications,
    openHelpRequests,
    incidents: 0,
  };
}
