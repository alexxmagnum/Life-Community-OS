/**
 * Community Explorer navigation config for Life Panoramica.
 * Navigation IA only — not domain models. Order is tenant-specific.
 */

export type ExplorerNavLeaf = {
  id: string;
  label: string;
  /** Maps to AppMenuLeafIcon in @life-community-os/ui */
  icon:
    | "golf"
    | "padel"
    | "tennis"
    | "hike"
    | "class"
    | "games"
    | "info"
    | "proposal"
    | "help"
    | "people"
    | "calendar"
    | "sport"
    | "place"
    | "cart"
    | "handshake"
    | "car"
    | "restaurant"
    | "shop"
    | "service"
    | "admin"
    | "city"
    | "public"
    | "security";
  href: string;
};

/**
 * Permanent activities — Golf first (identity of this community).
 * Not events, not reservations. Experiences nest under activities later.
 * Other tenants may reorder without changing global defaults.
 */
export const explorerActivityNav: ExplorerNavLeaf[] = [
  { id: "act-golf", label: "Golf", icon: "golf", href: "/discover" },
  { id: "act-padel", label: "Pádel", icon: "padel", href: "/resources" },
  { id: "act-tennis", label: "Tenis", icon: "tennis", href: "/resources" },
  { id: "act-nature", label: "Naturaleza", icon: "hike", href: "/discover" },
  { id: "act-wellness", label: "Bienestar", icon: "class", href: "/discover" },
  { id: "act-classes", label: "Clases y talleres", icon: "class", href: "/discover" },
  { id: "act-social", label: "Ocio social", icon: "games", href: "/discover" },
];

export function listExplorerActivities(): ExplorerNavLeaf[] {
  return explorerActivityNav;
}
