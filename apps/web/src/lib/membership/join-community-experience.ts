/**
 * Join Community Experience — registered users join without re-registering.
 */

import type { MembershipStatus } from "@life-community-os/types";

export type JoinCommunityResult = {
  ok: boolean;
  status?: MembershipStatus;
  error?: string;
};

export async function joinWithCommunityCode(input: {
  code: string;
  tenantId?: string;
}): Promise<JoinCommunityResult> {
  const code = input.code.trim();
  if (!code) {
    return { ok: false, error: "invalid_code" };
  }
  const res = await fetch("/api/auth/community-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      code,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    }),
  });
  const data = (await res.json()) as {
    membership?: { status?: MembershipStatus };
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error ?? "join_failed" };
  }
  return { ok: true, status: data.membership?.status ?? "active" };
}

export async function acceptInvitationCode(input: {
  invitationId: string;
  email: string;
  tenantId?: string;
}): Promise<JoinCommunityResult> {
  const invitationId = input.invitationId.trim();
  const email = input.email.trim();
  if (!invitationId || !email) {
    return { ok: false, error: "invalid_body" };
  }
  const res = await fetch("/api/auth/invitation/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      invitationId,
      email,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    }),
  });
  const data = (await res.json()) as {
    membership?: { status?: MembershipStatus };
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error ?? "invitation_failed" };
  }
  return { ok: true, status: data.membership?.status ?? "active" };
}

export function joinErrorMessage(error?: string): string {
  switch (error) {
    case "invalid_code":
      return "Introduce un código de comunidad válido.";
    case "invalid_body":
      return "Completa el código de invitación y tu email.";
    case "invitation_invalid":
      return "La invitación no es válida o ha caducado.";
    case "guest_access_denied":
      return "Necesitas iniciar sesión para unirte.";
    default:
      return "No pudimos completar la solicitud. Revisa los datos e inténtalo de nuevo.";
  }
}

export function membershipStatusLabel(status: MembershipStatus | null): string {
  switch (status) {
    case "active":
      return "Miembro";
    case "pending":
      return "Pendiente de aprobación";
    case "invited":
      return "Invitación pendiente";
    case "suspended":
      return "Membresía suspendida";
    case "removed":
    case "inactive":
    case "ended":
      return "Sin membresía activa";
    default:
      return "Registrado";
  }
}

export function profileMembershipLabel(input: {
  authenticated: boolean;
  hasMembership: boolean;
  membershipStatus: MembershipStatus | null;
  role: string | null;
}): string {
  if (!input.authenticated) return "Visitante";
  if (input.hasMembership && input.membershipStatus === "active") {
    if (input.role === "administrator") return "Administrador";
    return "Miembro";
  }
  if (input.membershipStatus === "pending") return "Pendiente";
  if (input.membershipStatus === "invited") return "Invitado";
  return "Registrado";
}
