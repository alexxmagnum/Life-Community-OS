/**
 * Visitor activation copy and routes — Discover first, then join, then participate.
 * Phase 18O-FIX-A: one primary conversion CTA; no ambiguous “únete cuando quieras”.
 */

export const VISITOR_JOIN_HEADLINE = "Únete a LIFE";

export const VISITOR_VALUE_PROPOSITION =
  "Life conecta vecinos, lugares y actividades reales — no es una red social.";

export const VISITOR_HOME_DESCRIPTION =
  "Descubre el territorio y ve qué ocurre cerca. Crea una cuenta para participar.";

/** Home — visitor empty state when territory has no live activity yet. */
export const VISITOR_HOME_EMPTY_TITLE = "Descubre tu territorio";
export const VISITOR_HOME_EMPTY_DESCRIPTION =
  "Explora lugares y servicios cerca de ti. Crea una cuenta para participar con tus vecinos.";
export const VISITOR_HOME_EXPLORE_LABEL = "Explorar lugares";
export const VISITOR_HOME_SERVICES_LABEL = "Ver servicios";
export const VISITOR_HOME_REGISTER_LABEL = "Únete a LIFE";

/** Community preview — visitor / registered without membership. */
export const COMMUNITY_PREVIEW_EMPTY_TITLE = "Tu comunidad está esperando";
export const COMMUNITY_PREVIEW_EMPTY_DESCRIPTION =
  "Únete para participar, ayudar y crear actividades con otros vecinos.";
export const COMMUNITY_PREVIEW_JOIN_LABEL = "Unirme a comunidad";

export const COMMUNITY_PREVIEW_GROUPS_TITLE = "Grupos e intereses";
export const COMMUNITY_PREVIEW_GROUPS_DESCRIPTION =
  "Organiza actividades, comparte aficiones y conecta con vecinos que comparten tus intereses.";

export const COMMUNITY_PREVIEW_HELP_TITLE = "Ayuda vecinal";
export const COMMUNITY_PREVIEW_HELP_DESCRIPTION =
  "Pide o ofrece ayuda entre vecinos cuando alguien lo necesite en el territorio.";

/** Contextual conversion CTAs — never generic "Sin acceso". */
export const VISITOR_CTA_RESERVE = "Regístrate para reservar";
export const VISITOR_CTA_COMMUNICATE = "Únete a la comunidad para participar";
export const VISITOR_CTA_CREATE = "Únete para crear experiencias";
export const VISITOR_CTA_WORK = "Únete para ver anuncios de trabajo";
export const VISITOR_CTA_NEIGHBOUR_HELP = "Únete para ver ayuda vecinal";
export const VISITOR_CTA_MOBILITY = "Únete para ver movilidad compartida";
export const VISITOR_CTA_RECOMMENDATIONS = "Únete para ver recomendaciones";
export const VISITOR_CTA_CONTACT = "Regístrate para contactar";

export function visitorConversionHref(authenticated: boolean): string {
  return authenticated ? "/me" : "/register";
}

export function visitorConversionLabel(authenticated: boolean): string {
  return authenticated ? "Unirme a la comunidad" : "Únete a LIFE";
}

export function visitorLoginLabel(authenticated: boolean): string {
  return authenticated ? "Ver mi perfil" : "Iniciar sesión";
}

export function visitorLoginHref(authenticated: boolean): string {
  return authenticated ? "/me" : "/login";
}

export function profileVisitorTitle(communityName: string): string {
  const name = communityName.trim() || "tu comunidad";
  return `Bienvenido a LIFE ${name}`;
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
