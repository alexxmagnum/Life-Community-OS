/**
 * Visitor activation copy and routes — Phase 18K-FIX-A.
 * Discover first, then join, then participate.
 */

export const VISITOR_JOIN_HEADLINE = "Únete a tu comunidad";

export const VISITOR_VALUE_PROPOSITION =
  "Life conecta vecinos, lugares y actividades reales — no es una red social.";

export const VISITOR_HOME_DESCRIPTION =
  "Descubre el territorio, ve qué ocurre cerca y únete cuando quieras participar.";

export function visitorConversionHref(authenticated: boolean): string {
  return authenticated ? "/me" : "/register";
}

export function visitorConversionLabel(authenticated: boolean): string {
  return authenticated ? "Unirme a la comunidad" : "Crear cuenta";
}

export function visitorLoginLabel(authenticated: boolean): string {
  return authenticated ? "Ver mi perfil" : "Iniciar sesión";
}

export function visitorLoginHref(authenticated: boolean): string {
  return authenticated ? "/me" : "/login";
}

/** Member-only Life Place actions — visitors get conversion CTAs instead. */
export const LIFE_PLACE_MEMBER_ACTION_KINDS = new Set([
  "join_experience",
  "participate",
  "reserve_resource",
  "ask_help",
  "hire_service",
  "create_activity",
]);
