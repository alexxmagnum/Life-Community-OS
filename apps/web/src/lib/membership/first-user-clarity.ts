/**
 * First-user clarity — canonical visual states.
 * Account ≠ Membership. Visitor ≠ Member. Registered ≠ Pending.
 * No technical jargon in user-facing copy.
 */

import type { MembershipStatus } from "@life-community-os/types";
import {
  resolveMembershipAccessScope,
  type MembershipAccessScope,
} from "@/lib/membership/membership-experience-scope";

export type CanonicalUserState =
  | "visitor"
  | "registered"
  | "pending_membership"
  | "active_member";

export type CanonicalUserStateView = {
  state: CanonicalUserState;
  title: string;
  explanation: string;
  nextActionLabel: string;
  nextActionHref: string;
};

export const PROFILE_REGISTERED_CLARITY_TITLE = "Completa tu comunidad";
export const PROFILE_REGISTERED_CLARITY_BODY =
  "Tienes una cuenta LIFE. Ahora únete a una comunidad para participar.";
export const PROFILE_REGISTERED_CLARITY_CTA = "Unirme a comunidad";

export const PROFILE_PENDING_CLARITY_TITLE = "Solicitud enviada";
export const PROFILE_PENDING_CLARITY_BODY =
  "Estamos esperando la activación de tu acceso.";
export const PROFILE_PENDING_CLARITY_CTA = "Explorar mientras tanto";

export const PROFILE_ACTIVE_CLARITY_TITLE = "Mi vida aquí";

export const JOIN_EXPERIENCE_TITLE = "Únete a tu comunidad";
export const JOIN_EXPERIENCE_BODY =
  "Tu cuenta está lista. Ahora forma parte de una comunidad para participar con tus vecinos.";
export const JOIN_CODE_LABEL = "Código de comunidad";
export const JOIN_CODE_CTA = "Continuar con código";
export const JOIN_INVITE_LABEL = "Aceptar invitación";
export const JOIN_INVITE_CTA = "Continuar con invitación";
export const JOIN_CODE_HINT =
  "Pide el código a tu comunidad o a la administración del territorio.";

export const WELCOME_AFTER_REGISTER_TITLE = "Tu cuenta está lista";
export const WELCOME_AFTER_REGISTER_BODY =
  "Ahora forma parte de una comunidad para participar con tus vecinos.";
export const WELCOME_AFTER_REGISTER_CTA = "Encuentra tu comunidad";

export const MAGIC_PLUS_JOIN_TITLE =
  "Únete a una comunidad para crear experiencias";
export const MAGIC_PLUS_JOIN_BODY =
  "Tu cuenta está lista. Completa tu pertenencia para crear y participar.";
export const MAGIC_PLUS_JOIN_CTA = "Unirme";

export function resolveCanonicalUserState(input: {
  authenticated: boolean;
  hasMembership: boolean;
  membershipStatus?: MembershipStatus | null;
  role?: string | null;
}): CanonicalUserState {
  const scope: MembershipAccessScope = resolveMembershipAccessScope({
    authenticated: input.authenticated,
    hasMembership: input.hasMembership,
    membershipStatus: input.membershipStatus,
    role: (input.role as never) ?? null,
  }).scope;

  if (scope === "visitor") return "visitor";
  if (scope === "pending") return "pending_membership";
  if (scope === "active" || scope === "admin") return "active_member";
  return "registered";
}

export function canonicalUserStateView(input: {
  authenticated: boolean;
  hasMembership: boolean;
  membershipStatus?: MembershipStatus | null;
  role?: string | null;
}): CanonicalUserStateView {
  const state = resolveCanonicalUserState(input);
  switch (state) {
    case "visitor":
      return {
        state,
        title: "Descubre LIFE",
        explanation:
          "Explora el territorio. Crea una cuenta LIFE para participar.",
        nextActionLabel: "Únete a LIFE",
        nextActionHref: "/register",
      };
    case "registered":
      return {
        state,
        title: PROFILE_REGISTERED_CLARITY_TITLE,
        explanation: PROFILE_REGISTERED_CLARITY_BODY,
        nextActionLabel: PROFILE_REGISTERED_CLARITY_CTA,
        nextActionHref: "/me#join",
      };
    case "pending_membership":
      return {
        state,
        title: PROFILE_PENDING_CLARITY_TITLE,
        explanation: PROFILE_PENDING_CLARITY_BODY,
        nextActionLabel: PROFILE_PENDING_CLARITY_CTA,
        nextActionHref: "/discover",
      };
    case "active_member":
      return {
        state,
        title: PROFILE_ACTIVE_CLARITY_TITLE,
        explanation: "Participa con tus vecinos en lo que ocurre cerca.",
        nextActionLabel: "Ver inicio",
        nextActionHref: "/",
      };
  }
}
