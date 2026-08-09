/**
 * Spanish UI copy for demo residency / resource access feedback.
 * Resident language — no architecture jargon.
 */

export function resourceAccessHint(input: {
  canViewPublicInfo: boolean;
  canReserve: boolean;
  reasons: string[];
}): { hint: string; tone: "ok" | "blocked" | "info" } {
  if (input.canReserve) {
    return {
      hint: "Puedes reservar · verificado en tu zona",
      tone: "ok",
    };
  }
  if (input.reasons.includes("community_area_not_affiliated")) {
    if (input.canViewPublicInfo) {
      return {
        hint: "Visible · reserva disponible tras verificar en esta zona",
        tone: "blocked",
      };
    }
    return {
      hint: "No disponible para ti ahora",
      tone: "blocked",
    };
  }
  if (input.reasons.includes("missing_reserve_permission")) {
    return {
      hint: "La reserva no está disponible para tu cuenta",
      tone: "blocked",
    };
  }
  if (input.canViewPublicInfo) {
    return {
      hint: "Puedes ver la información · reserva no disponible",
      tone: "info",
    };
  }
  return { hint: "Sin acceso", tone: "blocked" };
}

export function channelAccessLabel(input: {
  allowed: boolean;
  reason: string;
  requiresVerifiedResidency?: boolean;
  type: string;
}): { badge: string; tone: "ok" | "blocked" | "info"; locked: boolean } {
  if (input.type === "official") {
    return { badge: "Oficial", tone: "info", locked: false };
  }
  if (!input.requiresVerifiedResidency) {
    return {
      badge: input.type === "community" ? "Comunidad" : "Abierto",
      tone: "ok",
      locked: false,
    };
  }
  if (input.allowed) {
    return { badge: "Privado · disponible para ti", tone: "ok", locked: false };
  }
  return {
    badge: "Privado · verifica tu zona",
    tone: "blocked",
    locked: true,
  };
}
