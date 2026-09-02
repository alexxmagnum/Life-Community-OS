/**
 * Community help request — neighbour help and work board (one domain).
 *
 * offer_help / need_help cover:
 * - neighbour help (tools, pets, moving)
 * - work board (looking for work / offering work)
 *
 * Not a professional directory — that is Business Profile + category.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

export type HelpRequestType = "offer_help" | "need_help";

export const HELP_REQUEST_TYPES: readonly HelpRequestType[] = [
  "offer_help",
  "need_help",
] as const;

export type HelpRequestStatus =
  | "open"
  | "accepted"
  | "completed"
  | "closed";

export const HELP_REQUEST_STATUSES: readonly HelpRequestStatus[] = [
  "open",
  "accepted",
  "completed",
  "closed",
] as const;

export type HelpRequest = {
  id: DomainId;
  tenantId: DomainId;
  /** Geographic world inside the Tenant. Additive — tenantId remains. */
  territoryId?: DomainId;
  createdBy: DomainId;
  type: HelpRequestType;
  category: string;
  title: string;
  description: string;
  status: HelpRequestStatus;
  authorDisplayName: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export function isHelpRequestType(value: string): value is HelpRequestType {
  return (HELP_REQUEST_TYPES as readonly string[]).includes(value);
}

export function isHelpRequestStatus(value: string): value is HelpRequestStatus {
  return (HELP_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function helpRequestTypeLabel(type: HelpRequestType): string {
  return type === "offer_help" ? "Ofrezco ayuda" : "Pido ayuda";
}

export type CreateHelpRequestInput = {
  tenantId: DomainId;
  createdBy: DomainId;
  type: HelpRequestType;
  category: string;
  title: string;
  description: string;
  status?: HelpRequestStatus;
  authorDisplayName?: string;
  territoryId?: DomainId;
  id?: DomainId;
};

export function createHelpRequestRecord(
  input: CreateHelpRequestInput,
): HelpRequest {
  const now = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim() || "general";
  if (!title || !description) {
    throw new Error("Invalid HelpRequest: missing_fields");
  }
  if (!isHelpRequestType(input.type)) {
    throw new Error("Invalid HelpRequest: invalid_type");
  }
  const status = input.status ?? "open";
  if (!isHelpRequestStatus(status)) {
    throw new Error("Invalid HelpRequest: invalid_status");
  }
  return {
    id: input.id?.trim() || `help-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    createdBy: input.createdBy.trim(),
    type: input.type,
    category,
    title,
    description,
    status,
    authorDisplayName: input.authorDisplayName?.trim() || "Vecino",
    createdAt: now,
    updatedAt: now,
    ...(input.territoryId?.trim()
      ? { territoryId: input.territoryId.trim() }
      : {}),
  };
}

export const WORK_HELP_CATEGORIES = [
  "gardening",
  "maintenance",
  "lessons",
  "cleaning",
  "transport",
  "other",
  "work",
] as const;

export function isWorkHelpCategory(category: string): boolean {
  return (WORK_HELP_CATEGORIES as readonly string[]).includes(
    category.trim().toLowerCase(),
  );
}

export function helpRequestHref(id: string): string {
  return `/help/${encodeURIComponent(id.trim())}`;
}

export function workPostHref(id: string): string {
  return `/services/work/${encodeURIComponent(id.trim())}`;
}

export function helpHrefForCategory(id: string, category: string): string {
  return isWorkHelpCategory(category) ? workPostHref(id) : helpRequestHref(id);
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
