/**
 * Fill missing presentation fields on Location for RC / demo completeness.
 * Does not change Location contract — only patches empty optional fields.
 */

import type { Location } from "@life-community-os/types";
import { demoPlaceProfileFor } from "./demo-place-profile";

const DEFAULT_HOURS = "Consulta horarios en el lugar";

const VALLEY_IMAGES: Record<string, string> = {
  "loc-catalog-lv-plaza-life-valley":
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
  "loc-catalog-lv-cafe-life-valley":
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
};

const VALLEY_OVERRIDES: Record<
  string,
  { summary: string; contact: string; hours: string }
> = {
  "loc-catalog-lv-plaza-life-valley": {
    summary: "Plaza y punto de encuentro de Life Valley.",
    contact: "hola@lifevalley.community",
    hours: "Acceso libre · eventos anunciados",
  },
  "loc-catalog-lv-cafe-life-valley": {
    summary: "Café acogedor en el centro de Life Valley.",
    contact: "+34 960 000 200",
    hours: "Lun–Dom · 08:00–20:00",
  },
};

const CATEGORY_HOURS: Record<string, string> = {
  restaurant: "Mar–Dom · 12:00–23:00",
  cafe: "Lun–Dom · 08:00–20:00",
  shop: "Lun–Sáb · 10:00–20:00",
  pool: "Todos los días · 10:00–20:00",
  golf: "Lun–Dom · 08:00–19:00",
  sports: "Lun–Dom · 08:00–22:00",
  padel: "Lun–Dom · 08:00–22:00",
  service: "Lun–Vie · 09:00–18:00",
  place: "Acceso libre · consulta avisos",
};

const CATEGORY_CONTACT: Record<string, string> = {
  restaurant: "Reservas en el local",
  cafe: "Consulta en el local",
  shop: "Consulta en el local",
  pool: "Recepción de la comunidad",
  golf: "Recepción del club",
  sports: "Recepción del club",
  padel: "Recepción del club",
  service: "Consulta en el local",
  place: "hola@comunidad.life",
};

export function enrichLocationFields(location: Location): Location {
  const demo = demoPlaceProfileFor({
    id: location.id,
    name: location.name,
  });
  const valley = VALLEY_OVERRIDES[location.id];
  const next = { ...location };
  let changed = false;

  if (valley) {
    if (next.summary !== valley.summary) {
      next.summary = valley.summary;
      changed = true;
    }
    if (next.contact !== valley.contact) {
      next.contact = valley.contact;
      changed = true;
    }
    if (next.hours !== valley.hours) {
      next.hours = valley.hours;
      changed = true;
    }
  }

  if (!next.summary?.trim() && demo?.summary) {
    next.summary = demo.summary;
    changed = true;
  }
  if (!next.imageUrl?.trim()) {
    const valleyImg = VALLEY_IMAGES[next.id];
    if (valleyImg) {
      next.imageUrl = valleyImg;
      changed = true;
    } else if (demo?.imageUrl) {
      next.imageUrl = demo.imageUrl;
      changed = true;
    }
  }
  if (!next.hours?.trim()) {
    next.hours =
      demo?.hours ??
      CATEGORY_HOURS[next.category.toLowerCase()] ??
      DEFAULT_HOURS;
    changed = true;
  }
  if (!next.contact?.trim()) {
    if (demo?.contact) {
      next.contact = demo.contact;
      changed = true;
    } else {
      const fallback =
        CATEGORY_CONTACT[next.category.toLowerCase()] ?? "Consulta en el local";
      next.contact = fallback;
      changed = true;
    }
  }

  // Strip leftover hardening / validation copy for client demos.
  if (next.summary?.toLowerCase().includes("hardening")) {
    next.summary =
      next.category === "cafe"
        ? "Café de barrio para quedar con vecinos."
        : "Punto de encuentro de la comunidad.";
    changed = true;
  }
  if (next.summary?.toLowerCase().includes("validación multi-tenant")) {
    next.summary = "Plaza y punto de encuentro de Life Valley.";
    changed = true;
  }
  if (
    next.summary?.toLowerCase().includes("solo en life valley") ||
    next.summary?.toLowerCase().includes("referencia solo")
  ) {
    next.summary = "Café acogedor en el centro de Life Valley.";
    changed = true;
  }

  return changed ? next : location;
}

export function locationNeedsEnrichment(location: Location): boolean {
  const enriched = enrichLocationFields(location);
  return (
    enriched.summary !== location.summary ||
    enriched.imageUrl !== location.imageUrl ||
    enriched.hours !== location.hours ||
    enriched.contact !== location.contact
  );
}
