/**
 * Experience capability — tenant-neutral domain shape (ADR-027).
 * Mock catalog for Life Panoramica; swap content per tenant, keep the model.
 * Ready for future API replacement (same fields).
 */

import {
  DEMO_PERSON_ANA,
  DEMO_PERSON_CLARA,
  DEMO_PERSON_ELENA,
  DEMO_PERSON_INES,
  DEMO_PERSON_JOHN,
  DEMO_PERSON_JORDI,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_LUIS,
  DEMO_PERSON_MARTA,
  DEMO_PERSON_TOM,
} from "./demo-ids";

export type ExperienceType = "experience" | "event" | "meeting";

/** Publishing / operational status of the experience itself. */
export type ExperienceStatus =
  | "published"
  | "registration_open"
  | "full"
  | "cancelled"
  | "expired"
  | "completed";

export type ExperienceOrganizer = {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
};

export type ExperienceParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Experience = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** ISO 8601 start */
  startsAt: string;
  endsAt?: string;
  location: string;
  areaLabel: string;
  organizer: ExperienceOrganizer;
  capacity: number;
  participantCount: number;
  participants: ExperienceParticipant[];
  status: ExperienceStatus;
  type: ExperienceType;
  /** Creating Person when known (Phase C.4 contribution join key). */
  createdByPersonId?: string;
  /** ADR-035 organization links (optional). */
  channelId?: string;
  groupId?: string;
  communityAreaId?: string;
  resourceId?: string;
};

/** Derived UI state for the current viewer (not stored on Experience). */
export type ExperienceViewerState =
  | "available"
  | "joined"
  | "waitlisted"
  | "full"
  | "cancelled"
  | "expired";

/** Product timezone — keeps SSR (often UTC) and browser clocks aligned. */
const EXPERIENCE_TZ = "Europe/Madrid";

function madridDayKey(nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EXPERIENCE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

/** Wall-clock in Europe/Madrid → ISO UTC (handles CET/CEST). */
function madridWallToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const asUtc = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: EXPERIENCE_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(ms));
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");
    let h = get("hour");
    if (h === 24) h = 0;
    return Date.UTC(get("year"), get("month") - 1, get("day"), h, get("minute"));
  };
  const want = Date.UTC(year, month - 1, day, hour, minute);
  let utc = Date.UTC(year, month - 1, day, hour - 2, minute);
  for (let i = 0; i < 4; i++) {
    utc += want - asUtc(utc);
  }
  return new Date(utc).toISOString();
}

function upcomingFrom(
  nowMs: number,
  dayOffset: number,
  hour: number,
  minute = 0,
): string {
  const parts = madridDayKey(nowMs).split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const anchor = new Date(Date.UTC(y, m - 1, d + dayOffset));
  return madridWallToIso(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + 1,
    anchor.getUTCDate(),
    hour,
    minute,
  );
}

function endOf(startIso: string, durationHours: number): string {
  return new Date(
    new Date(startIso).getTime() + durationHours * 60 * 60 * 1000,
  ).toISOString();
}

/**
 * Life Panoramica reference catalog.
 * Rebuilt per Madrid calendar day so Node SSR and the browser share the same startsAt.
 */
function buildExperienceCatalog(nowMs: number): Experience[] {
  const upcoming = (dayOffset: number, hour: number, minute = 0) =>
    upcomingFrom(nowMs, dayOffset, hour, minute);
  const startWalk = upcoming(2, 9, 30);
  const startStretch = upcoming(3, 10, 0);
  const startCoffee = upcoming(1, 11, 0);
  const startSunset = upcoming(4, 19, 0);
  const startExpired = upcoming(-3, 18, 0);
  const startFull = upcoming(5, 17, 0);

  return [
    {
      id: "exp-sunset-walk",
      title: "Paseo mediterráneo al atardecer",
      description:
        "Un paseo suave entre pinos mientras baja la luz. Conoce vecinos, respira y disfruta del camino — sin prisas, solo lugar y gente.",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
      startsAt: startSunset,
      endsAt: endOf(startSunset, 1.5),
      location: "Entrada del camino de pinos",
      areaLabel: "Los pinos",
      organizer: {
        id: DEMO_PERSON_ANA,
        name: "Ana López",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        roleLabel: "Organizadora",
      },
      createdByPersonId: DEMO_PERSON_ANA,
      capacity: 20,
      participantCount: 12,
      participants: [
        {
          id: DEMO_PERSON_ELENA,
          name: "Elena",
          avatarUrl:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
        },
        {
          id: DEMO_PERSON_JORDI,
          name: "Jordi",
          avatarUrl:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
        },
        {
          id: "p-sofia",
          name: "Sofía",
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        },
      ],
      status: "registration_open",
      type: "experience",
    },
    {
      id: "exp-sunrise-pines",
      title: "Paseo al amanecer entre pinos",
      description:
        "Luz temprana, caminos tranquilos y un circuito corto por Los pinos. Ideal si te gustan las mañanas y la conversación fácil.",
      imageUrl:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
      startsAt: startWalk,
      endsAt: endOf(startWalk, 1),
      location: "Inicio del sendero",
      areaLabel: "Los pinos",
      organizer: {
        id: DEMO_PERSON_MARTA,
        name: "Marta Ruiz",
        avatarUrl:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
        roleLabel: "Organizadora",
      },
      createdByPersonId: DEMO_PERSON_MARTA,
      capacity: 16,
      participantCount: 9,
      participants: [
        {
          id: DEMO_PERSON_LUIS,
          name: "Luis",
          avatarUrl:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
        },
        {
          id: DEMO_PERSON_CLARA,
          name: "Clara",
        },
        {
          id: DEMO_PERSON_LUCIA,
          name: "Lucía",
          avatarUrl:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
        },
      ],
      status: "registration_open",
      type: "experience",
    },
    {
      id: "exp-stretch",
      title: "Estiramientos mediterráneos",
      description:
        "Estiramiento al aire libre en la terraza. Movimiento suave, todos los niveles. Trae esterilla si tienes.",
      imageUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
      startsAt: startStretch,
      endsAt: endOf(startStretch, 1),
      location: "Terraza comunitaria",
      areaLabel: "Hacienda",
      organizer: {
        id: DEMO_PERSON_INES,
        name: "Inés Vidal",
        avatarUrl:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
        roleLabel: "Anfitriona",
      },
      createdByPersonId: DEMO_PERSON_INES,
      capacity: 12,
      participantCount: 8,
      participants: [
        { id: "p-nora", name: "Nora" },
        { id: "p-pau", name: "Pau" },
      ],
      status: "registration_open",
      type: "experience",
    },
    {
      id: "exp-coffee",
      title: "Café de vecinos",
      description:
        "Café, presentaciones y un comienzo tranquilo del día en Zona norte. Pasa — sin agenda, solo comunidad.",
      imageUrl:
        "https://images.unsplash.com/photo-1511632765481-a929fcf8e8f4?auto=format&fit=crop&w=1400&q=80",
      startsAt: startCoffee,
      endsAt: endOf(startCoffee, 1.5),
      location: "Terraza comunitaria",
      areaLabel: "Aldea Golf",
      organizer: {
        id: "org-community",
        name: "Life Panoramica",
        roleLabel: "Comunidad",
      },
      capacity: 30,
      participantCount: 14,
      participants: [
        { id: "p-rita", name: "Rita" },
        { id: DEMO_PERSON_TOM, name: "Tom" },
        { id: "p-eva", name: "Eva" },
      ],
      status: "registration_open",
      type: "event",
      channelId: "ch-events",
      communityAreaId: "area-aldea-golf",
    },
    {
      id: "exp-padel-social",
      title: "Pádel social al atardecer",
      description:
        "Niveles mixtos, parejas rotativas, juego amable. Pistas reservadas para el grupo — solo ven.",
      imageUrl:
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
      startsAt: startFull,
      endsAt: endOf(startFull, 2),
      location: "Pistas de pádel 1–2",
      areaLabel: "Zona norte",
      organizer: {
        id: "org-padel",
        name: "Pádel mañanas",
        roleLabel: "Grupo",
      },
      capacity: 8,
      participantCount: 8,
      participants: [
        { id: DEMO_PERSON_JOHN, name: "John" },
        { id: "p-laia", name: "Laia" },
        { id: "p-hugo", name: "Hugo" },
        { id: "p-iris", name: "Iris" },
      ],
      status: "full",
      type: "experience",
      channelId: "ch-padel",
      groupId: "g-padel",
      resourceId: "res-padel-2",
    },
    {
      id: "exp-cancelled-bbq",
      title: "BBQ en la terraza (aplazado)",
      description:
        "Este encuentro se ha cancelado por el tiempo. Anunciaremos una nueva fecha pronto.",
      imageUrl:
        "https://images.unsplash.com/photo-1555939596-19271ee170b3?auto=format&fit=crop&w=1400&q=80",
      startsAt: upcoming(6, 19, 0),
      location: "Terraza · Zona norte",
      areaLabel: "Zona norte",
      organizer: {
        id: DEMO_PERSON_ANA,
        name: "Ana López",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        roleLabel: "Organizadora",
      },
      createdByPersonId: DEMO_PERSON_ANA,
      capacity: 40,
      participantCount: 0,
      participants: [],
      status: "cancelled",
      type: "event",
    },
    {
      id: "exp-past-yoga",
      title: "Yoga matinal en el césped",
      description: "Sesión pasada — se mantiene para completar el catálogo.",
      imageUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
      startsAt: startExpired,
      endsAt: endOf(startExpired, 1),
      location: "Césped central",
      areaLabel: "El pinar",
      organizer: {
        id: DEMO_PERSON_INES,
        name: "Inés Vidal",
        roleLabel: "Anfitriona",
      },
      createdByPersonId: DEMO_PERSON_INES,
      capacity: 15,
      participantCount: 11,
      participants: [],
      status: "expired",
      type: "experience",
    },
  ];
}

let catalogDayKey: string | null = null;
let catalogCache: Experience[] | null = null;

function getExperienceCatalog(nowMs = Date.now()): Experience[] {
  const key = madridDayKey(nowMs);
  if (catalogCache && catalogDayKey === key) return catalogCache;
  catalogDayKey = key;
  catalogCache = buildExperienceCatalog(nowMs);
  return catalogCache;
}

/** Snapshot of today's catalog (Madrid day). Prefer list/get helpers in new code. */
export const experienceCatalog: Experience[] = getExperienceCatalog();

/** Demo-only session creations — no persistence backend (Phase B.2). */
const CREATED_STORAGE_KEY = "lcos:created-experiences";

export type CreateExperienceInput = {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  capacity: number;
  /** Optional Activity Hub slug — links channel/group when known. */
  activitySlug?: string;
  resourceId?: string;
  imageUrl?: string;
  areaLabel?: string;
  organizer: ExperienceOrganizer;
  channelId?: string;
  groupId?: string;
};

function readCreatedExperiences(): Experience[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CREATED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Experience[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedExperiences(items: Experience[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREATED_STORAGE_KEY, JSON.stringify(items));
}

function isDiscoverableStatus(status: ExperienceStatus): boolean {
  return (
    status === "published" ||
    status === "registration_open" ||
    status === "full"
  );
}

export function getExperienceById(id: string): Experience | undefined {
  return (
    readCreatedExperiences().find((e) => e.id === id) ??
    getExperienceCatalog().find((e) => e.id === id)
  );
}

/**
 * Full experience list for contribution aggregation (catalog + session creates).
 * Includes non-discoverable statuses (cancelled / expired) for historical impact.
 */
export function listExperiencesForContribution(
  options: { includeSessionCreated?: boolean } = {},
): Experience[] {
  const includeSession = options.includeSessionCreated !== false;
  const created = includeSession ? readCreatedExperiences() : [];
  const catalog = getExperienceCatalog();
  const seen = new Set<string>();
  const merged: Experience[] = [];
  for (const exp of [...created, ...catalog]) {
    if (seen.has(exp.id)) continue;
    seen.add(exp.id);
    merged.push(exp);
  }
  return merged;
}

export type ListDiscoverableExperiencesOptions = {
  /**
   * Include experiences created in this browser session (localStorage).
   * Default true. Use false for SSR / first paint so server HTML matches client.
   */
  includeSessionCreated?: boolean;
};

export function listDiscoverableExperiences(
  options: ListDiscoverableExperiencesOptions = {},
): Experience[] {
  const includeSession = options.includeSessionCreated !== false;
  const created = includeSession
    ? readCreatedExperiences().filter((e) => isDiscoverableStatus(e.status))
    : [];
  const catalog = getExperienceCatalog().filter((e) =>
    isDiscoverableStatus(e.status),
  );
  const seen = new Set<string>();
  const merged: Experience[] = [];
  for (const exp of [...created, ...catalog]) {
    if (seen.has(exp.id)) continue;
    seen.add(exp.id);
    merged.push(exp);
  }
  return merged;
}

/**
 * Create a resident experience in the local demo session (no DB).
 * Returns the Experience for immediate navigation to detail.
 */
export function createExperience(input: CreateExperienceInput): Experience {
  const id = `exp-created-${Date.now().toString(36)}`;
  const experience: Experience = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    imageUrl:
      input.imageUrl ??
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: input.location.trim(),
    areaLabel: input.areaLabel?.trim() || "Life Panoramica",
    organizer: {
      ...input.organizer,
      roleLabel: input.organizer.roleLabel ?? "Vecino",
    },
    createdByPersonId: input.organizer.id,
    capacity: Math.max(1, Math.floor(input.capacity)),
    // Base count excludes the viewer; join() marks the creator as registered
    // and ExperienceDetailScreen adds +1 for the joined viewer.
    participantCount: 0,
    participants: [],
    status: "registration_open",
    type: "experience",
    channelId: input.channelId,
    groupId: input.groupId,
    resourceId: input.resourceId,
  };

  const next = [experience, ...readCreatedExperiences().filter((e) => e.id !== id)];
  writeCreatedExperiences(next);
  return experience;
}

export function formatExperienceWhen(startsAt: string): string {
  const d = new Date(startsAt);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(d);
}

export function formatExperienceDay(startsAt: string): string {
  const d = new Date(startsAt);
  const todayKey = madridDayKey(Date.now());
  const targetKey = madridDayKey(d.getTime());
  const todayUtc = new Date(`${todayKey}T12:00:00Z`).getTime();
  const targetUtc = new Date(`${targetKey}T12:00:00Z`).getTime();
  const diff = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: EXPERIENCE_TZ,
  }).format(d);
  if (diff === 0) return `Hoy · ${weekday}`;
  if (diff === 1) return `Mañana · ${weekday}`;
  return weekday;
}

export function formatExperienceTime(startsAt: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EXPERIENCE_TZ,
  }).format(new Date(startsAt));
}

export function spotsLeft(experience: Experience): number {
  return Math.max(0, experience.capacity - experience.participantCount);
}

export function deriveViewerState(
  experience: Experience,
  participation: "none" | "registered" | "waitlisted",
): ExperienceViewerState {
  if (participation === "registered") return "joined";
  if (participation === "waitlisted") return "waitlisted";
  if (experience.status === "cancelled") return "cancelled";
  if (experience.status === "expired" || experience.status === "completed") {
    return "expired";
  }
  if (experience.status === "full" || spotsLeft(experience) <= 0) return "full";
  return "available";
}
