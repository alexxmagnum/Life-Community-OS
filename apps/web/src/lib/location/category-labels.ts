/**
 * Human-facing labels for Location categories (product, not GIS codes).
 */

export const LOCATION_CATEGORY_OPTIONS = [
  { value: "restaurant", label: "Restaurante / Lounge" },
  { value: "cafe", label: "Café" },
  { value: "shop", label: "Comercio" },
  { value: "pool", label: "Piscina" },
  { value: "padel", label: "Pádel" },
  { value: "golf", label: "Golf" },
  { value: "sports", label: "Deporte / Instalación" },
  { value: "electrician", label: "Electricista" },
  { value: "plumber", label: "Fontanero" },
  { value: "veterinary", label: "Veterinario" },
  { value: "gardening", label: "Jardinería" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "service", label: "Servicio local" },
  { value: "facility", label: "Instalación comunitaria" },
  { value: "other", label: "Otro" },
] as const;

export type LocationCategoryValue =
  (typeof LOCATION_CATEGORY_OPTIONS)[number]["value"];

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  LOCATION_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
);

export function locationCategoryLabel(category: string): string {
  const key = category.trim().toLowerCase();
  return LABEL_BY_VALUE[key] ?? category;
}

/** Filter chips for the community map — "all" + product categories present. */
export function buildLocationFilterChips(
  categoriesPresent: readonly string[],
): { id: string; label: string }[] {
  const chips: { id: string; label: string }[] = [
    { id: "all", label: "Todos" },
  ];
  const seen = new Set<string>();
  for (const category of categoriesPresent) {
    const id = category.trim().toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    chips.push({ id, label: locationCategoryLabel(id) });
  }
  return chips;
}

export function openDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
