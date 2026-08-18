/**
 * Demo lifestyle profiles for Panorámica seed places.
 * Does not extend the Location contract — keyed by stable seed id suffix / name.
 */

export type DemoPlaceProfile = {
  summary: string;
  hours: string;
  imageUrl: string;
  contact?: string;
};

const BY_SUFFIX: Record<string, DemoPlaceProfile> = {
  ikon: {
    summary:
      "Terraza, cocina mediterránea y ambiente lounge junto al club. Ideal para quedar con vecinos al atardecer.",
    hours: "Mar–Dom · 12:00–23:30",
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    contact: "+34 964 000 111",
  },
  pool: {
    summary:
      "Piscina comunitaria con zona de sombra y relax. Reserva de tumbonas en temporada alta.",
    hours: "Todos los días · 10:00–20:00 (verano)",
    imageUrl:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
    contact: "comunidad@panoramica.life",
  },
  padel: {
    summary:
      "Pistas de pádel iluminadas. Reserva con vecinos o ven a jugar un partido improvisado.",
    hours: "Lun–Dom · 08:00–22:00",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
    contact: "+34 964 000 222",
  },
  golf: {
    summary:
      "Campo y casa club abiertos a la comunidad. Salidas, green fee y terraza con vistas.",
    hours: "Mar–Dom · 08:00–19:00",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
    contact: "https://panoramica.life/golf",
  },
  service: {
    summary:
      "Jardinería, mantenimiento y pequeños arreglos para vecinos de Panorámica.",
    hours: "Lun–Vie · 09:00–18:00",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
    contact: "+34 600 123 456",
  },
  electrician: {
    summary:
      "Electricista de confianza en la urbanización. Averías, iluminación y revisiones.",
    hours: "Lun–Sáb · 09:00–20:00",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    contact: "+34 600 987 654",
  },
};

const BY_NAME: Record<string, DemoPlaceProfile> = {
  "IKON Sports & Lounge": BY_SUFFIX.ikon!,
  "Piscina comunitaria": BY_SUFFIX.pool!,
  "Pistas de pádel": BY_SUFFIX.padel!,
  "Club de Golf Panorámica": BY_SUFFIX.golf!,
  "Jardinería Panorámica": BY_SUFFIX.service!,
  "Electricista del barrio": BY_SUFFIX.electrician!,
};

export function demoPlaceProfileFor(input: {
  id?: string;
  name?: string;
}): DemoPlaceProfile | null {
  // Production cutover: no demo copy unless explicitly opted in.
  const demoOptIn =
    process.env.NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES === "1" ||
    process.env.NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES === "true";
  if (process.env.NODE_ENV === "production" && !demoOptIn) {
    return null;
  }
  if (process.env.NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES === "0") {
    return null;
  }
  const id = input.id ?? "";
  const match = /loc-example-([a-z0-9]+)-/i.exec(id);
  if (match?.[1] && BY_SUFFIX[match[1]]) {
    return BY_SUFFIX[match[1]]!;
  }
  // Also match catalog seed suffixes (loc-catalog-lp-ikon-…).
  const catalog = /loc-catalog-(?:lp-|lv-)?([a-z0-9-]+?)-(?:life-)/i.exec(id);
  if (catalog?.[1]) {
    const key = catalog[1].replace(/-club$/, "").replace(/golf-club/, "golf");
    if (BY_SUFFIX[key]) return BY_SUFFIX[key]!;
    if (key.includes("ikon") && BY_SUFFIX.ikon) return BY_SUFFIX.ikon;
    if (key.includes("pool") && BY_SUFFIX.pool) return BY_SUFFIX.pool;
    if (key.includes("golf") && BY_SUFFIX.golf) return BY_SUFFIX.golf;
    if (key.includes("padel") && BY_SUFFIX.padel) return BY_SUFFIX.padel;
  }
  const name = input.name?.trim() ?? "";
  if (name && BY_NAME[name]) return BY_NAME[name]!;
  return null;
}
