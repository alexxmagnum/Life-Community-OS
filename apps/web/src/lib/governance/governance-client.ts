"use client";

import type {
  CommunityContentReport,
  CommunityGovernanceContext,
  GovernancePersonBlock,
  PublicGovernanceReport,
} from "@life-community-os/types";

function headers(tenantId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-tenant-slug": tenantId,
  };
}

export async function fetchGovernanceContext(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<CommunityGovernanceContext | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) params.set("territoryId", input.territoryId.trim());
  const res = await fetch(`/api/governance/context?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { context?: CommunityGovernanceContext };
  return data.context ?? null;
}

export async function fetchGovernanceReports(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<PublicGovernanceReport[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) params.set("territoryId", input.territoryId.trim());
  const res = await fetch(`/api/governance/reports?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { reports?: PublicGovernanceReport[] };
  return Array.isArray(data.reports) ? data.reports : [];
}

export async function createGovernanceReport(input: {
  tenantId: string;
  entityType: string;
  entityId: string;
  reason?: string;
}): Promise<{ id: string } | null> {
  const res = await fetch("/api/governance/reports", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(input.tenantId),
    body: JSON.stringify({
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason ?? "other",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { report?: { id: string } };
  return data.report ?? null;
}

export async function reviewGovernanceReport(input: {
  tenantId: string;
  reportId: string;
  status: string;
  contactCreator?: boolean;
}): Promise<boolean> {
  const res = await fetch(`/api/governance/reports/${input.reportId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: headers(input.tenantId),
    body: JSON.stringify({
      status: input.status,
      contactCreator: input.contactCreator,
    }),
  });
  return res.ok;
}

export async function createCommunityRule(input: {
  tenantId: string;
  title: string;
  description: string;
}): Promise<boolean> {
  const res = await fetch("/api/governance/rules", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(input.tenantId),
    body: JSON.stringify({
      title: input.title,
      description: input.description,
    }),
  });
  return res.ok;
}

export async function applySafetyAction(input: {
  tenantId: string;
  type: string;
  entityType?: string;
  entityId?: string;
  reportId?: string;
  reason?: string;
}): Promise<boolean> {
  const res = await fetch("/api/governance/safety", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(input.tenantId),
    body: JSON.stringify({
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      reportId: input.reportId,
      reason: input.reason,
    }),
  });
  return res.ok;
}

export async function fetchOwnGovernance(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<{
  reports: PublicGovernanceReport[];
  blocks: GovernancePersonBlock[];
}> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) params.set("territoryId", input.territoryId.trim());
  const res = await fetch(`/api/governance/mine?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return { reports: [], blocks: [] };
  const data = (await res.json()) as {
    reports?: PublicGovernanceReport[];
    blocks?: GovernancePersonBlock[];
  };
  return {
    reports: Array.isArray(data.reports) ? data.reports : [],
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
  };
}

export type OwnGovernanceReport = PublicGovernanceReport | CommunityContentReport;
