/**
 * Spanish UI copy for demo residency / resource access feedback.
 */

export function resourceAccessHint(input: {
  canViewPublicInfo: boolean;
  canReserve: boolean;
  reasons: string[];
}): { hint: string; tone: "ok" | "blocked" | "info" } {
  if (input.canReserve) {
    return {
      hint: "Puedes reservar · residencia verificada en el área",
      tone: "ok",
    };
  }
  if (input.reasons.includes("community_area_not_affiliated")) {
    if (input.canViewPublicInfo) {
      return {
        hint: "Visible · no puedes reservar (otra zona o sin verificación)",
        tone: "blocked",
      };
    }
    return {
      hint: "Sin acceso a este recurso",
      tone: "blocked",
    };
  }
  if (input.reasons.includes("missing_reserve_permission")) {
    return {
      hint: "Sin permiso de reserva en tu rol",
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
    return { badge: "Privado · acceso verificado", tone: "ok", locked: false };
  }
  return {
    badge: "Privado · requiere residencia verificada",
    tone: "blocked",
    locked: true,
  };
}
