/**
 * Mutation gate — writes require a resolved membership actor.
 * The frontend may hide actions; this is the enforcement layer.
 */

import { NextResponse } from "next/server";
import { actorHasCapability } from "@/lib/auth/permissions";
import {
  resolveRequestActor,
  type RequestActor,
} from "@/lib/auth/request-actor";
import { communityTenantBlocksMutations } from "@/lib/platform/tenant-lifecycle-service";

function deny(
  error: string,
  status: number,
): { error: NextResponse } {
  return { error: NextResponse.json({ error }, { status }) };
}

export function mutationDenial(
  actor: RequestActor,
): { error: string; status: number } | null {
  if (actor.tenantDenied) {
    return { error: "tenant_forbidden", status: 403 };
  }
  if (!actor.authenticated || !actor.personId || !actor.hasMembership) {
    return { error: "unauthorized", status: 401 };
  }
  if (communityTenantBlocksMutations(actor.tenantSlug)) {
    return { error: "tenant_suspended", status: 403 };
  }
  return null;
}

export async function requireAuthenticatedActor(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.providerReference) {
    return deny("unauthorized", 401);
  }
  if (actor.tenantDenied) {
    return deny("tenant_forbidden", 403);
  }
  return { actor };
}

export async function requireMutationActor(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const actor = await resolveRequestActor(request);
  const denied = mutationDenial(actor);
  if (denied) return deny(denied.error, denied.status);
  return { actor };
}

export async function requireAdminMutation(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated;
  if (
    gated.actor.role !== "administrator" &&
    gated.actor.role !== "moderator"
  ) {
    return deny("forbidden", 403);
  }
  return gated;
}

export async function requireModeratorMutation(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  return requireAdminMutation(request);
}

export async function requireAdministratorMutation(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated;
  if (gated.actor.role !== "administrator") {
    return deny("forbidden", 403);
  }
  return gated;
}

export async function requireOperationsActor(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated;
  if (
    gated.actor.role !== "administrator" &&
    gated.actor.role !== "moderator" &&
    gated.actor.role !== "group_manager"
  ) {
    return deny("forbidden", 403);
  }
  return gated;
}

export async function requireCapabilityMutation(
  request: Request,
  capability: string,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated;
  if (!actorHasCapability(gated.actor.permissions, capability)) {
    return deny("forbidden", 403);
  }
  return gated;
}
