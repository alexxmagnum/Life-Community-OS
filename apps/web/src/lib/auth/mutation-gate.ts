/**
 * Mutation gate — when auth is enforced, writes require a resolved actor.
 */

import { NextResponse } from "next/server";
import { isAuthEnforced } from "@life-community-os/auth";
import {
  resolveRequestActor,
  type RequestActor,
} from "@/lib/auth/request-actor";

export async function requireMutationActor(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const actor = await resolveRequestActor(request);
  if (!isAuthEnforced()) {
    return { actor };
  }
  if (!actor.authenticated) {
    return {
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { actor };
}

export async function requireAdminMutation(
  request: Request,
): Promise<{ actor: RequestActor } | { error: NextResponse }> {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated;
  if (gated.actor.role !== "administrator" && gated.actor.role !== "moderator") {
    return {
      error: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return gated;
}
