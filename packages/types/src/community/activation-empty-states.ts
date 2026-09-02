/**
 * Activation empty states — opportunity to create life, never abandoned-app copy.
 */

/** Home — experiences block */
export const LIVING_EMPTY_TITLE = "La comunidad empieza contigo";
export const LIVING_EMPTY_DESCRIPTION =
  "Crea la primera experiencia y comparte un momento con tus vecinos.";
export const LIVING_EMPTY_CTA = "Crear experiencia";

/** Community — Ahora / Próximamente */
export const COMMUNITY_NOW_EMPTY_TITLE = "La comunidad empieza contigo";
export const COMMUNITY_NOW_EMPTY_DESCRIPTION =
  "Crea la primera experiencia y comparte un momento con tus vecinos.";

/** Community activation panel */
export const COMMUNITY_ACTIVATION_PANEL_TITLE =
  "Empieza a dar vida a tu comunidad";
export const COMMUNITY_ACTIVATION_PANEL_DESCRIPTION =
  "Elige una acción para iniciar el movimiento en tu territorio.";
export const COMMUNITY_ACTIVATION_VISITOR_CTA = "Únete para participar";

/** Community — Grupos */
export const COMMUNITY_GROUPS_EMPTY_TITLE =
  "Crea conexiones alrededor de intereses comunes";
export const COMMUNITY_GROUPS_EMPTY_DESCRIPTION =
  "Grupos para organizar actividades, compartir aficiones o ayudar a otros vecinos.";
export const COMMUNITY_GROUPS_EMPTY_CTA = "Crear grupo";

/** Community — Ayudas (neighbour help, not professional services) */
export const COMMUNITY_HELP_EMPTY_TITLE = "Ayuda entre vecinos";
export const COMMUNITY_HELP_EMPTY_DESCRIPTION =
  "Ofrece tu tiempo o pide colaboración cuando alguien lo necesite.";
export const COMMUNITY_HELP_EMPTY_CTA = "Pedir ayuda";

/** Community — Oficial / avisos */
export const COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE = "Avisos del territorio";
export const COMMUNITY_OFFICIAL_ANNOUNCEMENTS_DESCRIPTION =
  "Información importante de tu comunidad: mantenimiento, novedades y comunicaciones oficiales.";
export const COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA = "Crear aviso";
export const COMMUNITY_OFFICIAL_ANNOUNCEMENTS_VISITOR =
  "Los avisos públicos aparecerán aquí.";

/** Home — announcements hint */
export const HOME_ANNOUNCEMENTS_EMPTY =
  "Información importante aparecerá aquí.";
export const HOME_ANNOUNCEMENTS_CTA = "Crear aviso";

/** Home — help block */
export const HOME_HELP_CTA = "Pedir ayuda";

/** Home — services block */
export const HOME_SERVICES_EMPTY_TITLE = "¿Necesitas algo?";
export const HOME_SERVICES_EMPTY_CTA = "Explorar servicios";

/** Services — professionals category */
export const SERVICES_PROFESSIONALS_EMPTY_TITLE = "Encuentra soluciones cerca";
export const SERVICES_PROFESSIONALS_EMPTY_DESCRIPTION =
  "Profesionales y negocios locales aparecerán aquí.";
export const SERVICES_PROFESSIONALS_EMPTY_CTA = "Ofrecer servicio";
export const SERVICES_PROFESSIONALS_VISITOR =
  "Regístrate para contactar con profesionales del territorio.";

/** Reservations */
export const RESERVATIONS_EMPTY_TITLE = "Espacios para disfrutar";
export const RESERVATIONS_EMPTY_DESCRIPTION =
  "Reserva instalaciones, actividades y recursos de tu comunidad.";
export const RESERVATIONS_EMPTY_CTA = "Explorar espacios";

/** Life Place — experiences at location */
export const LIVING_PLACE_EMPTY_TITLE = "Aún no hay experiencias aquí";
export const LIVING_PLACE_EMPTY_DESCRIPTION =
  "Descubre qué ocurre en este lugar o crea una experiencia para compartir.";
export const LIVING_PLACE_EMPTY_CTA = "Ver experiencias";
export const LIVING_PLACE_CREATE_CTA = "Crear experiencia";

/** Profile — visitor (title is composed dynamically via profileVisitorTitle) */
export const PROFILE_VISITOR_TITLE = "Bienvenido a LIFE";
export const PROFILE_VISITOR_DESCRIPTION =
  "Forma parte de la comunidad para participar y crear experiencias.";

/** Profile — registered (no active membership) */
export const PROFILE_REGISTERED_TITLE = "Únete a tu comunidad";

/** Dead empty copy patterns — must never ship in activation surfaces. */
export const DEAD_EMPTY_COPY_PATTERNS = [
  /no hay nada/i,
  /sin contenido/i,
  /todavía no existe nada/i,
  /primera historia/i,
] as const;
