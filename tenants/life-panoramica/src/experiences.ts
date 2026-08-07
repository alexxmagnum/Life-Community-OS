/**
 * Experience capability — tenant-neutral domain shape (ADR-027).
 * Mock catalog for Life Panoramica; swap content per tenant, keep the model.
 * Ready for future API replacement (same fields).
 */

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
};

/** Derived UI state for the current viewer (not stored on Experience). */
export type ExperienceViewerState =
  | "available"
  | "joined"
  | "waitlisted"
  | "full"
  | "cancelled"
  | "expired";

function upcoming(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}

function endOf(startIso: string, durationHours: number): string {
  const d = new Date(startIso);
  d.setHours(d.getHours() + durationHours);
  return d.toISOString();
}

const startWalk = upcoming(2, 9, 30);
const startStretch = upcoming(3, 10, 0);
const startCoffee = upcoming(1, 11, 0);
const startSunset = upcoming(4, 19, 0);
const startExpired = upcoming(-3, 18, 0);
const startFull = upcoming(5, 17, 0);

/**
 * Life Panoramica reference catalog.
 * Other tenants provide their own list with the same Experience shape.
 */
export const experienceCatalog: Experience[] = [
  {
    id: "exp-sunset-walk",
    title: "Paseo mediterráneo al atardecer",
    description:
      "Un paseo suave entre pinos mientras baja la luz. Conoce vecinos, respira y disfruta del camino — sin prisas, solo lugar y gente.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    startsAt: startSunset,
    endsAt: endOf(startSunset, 1.5),
    location: "Entrada del camino de pinos",
    areaLabel: "Los pinos",
    organizer: {
      id: "org-ana",
      name: "Ana López",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      roleLabel: "Organizadora",
    },
    capacity: 20,
    participantCount: 12,
    participants: [
      {
        id: "p-1",
        name: "Elena",
        avatarUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      },
      {
        id: "p-2",
        name: "Jordi",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
      },
      {
        id: "p-3",
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
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80",
    startsAt: startWalk,
    endsAt: endOf(startWalk, 1),
    location: "Inicio del sendero · Los pinos",
    areaLabel: "Los pinos",
    organizer: {
      id: "org-marta",
      name: "Marta Ruiz",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      roleLabel: "Organizadora",
    },
    capacity: 16,
    participantCount: 9,
    participants: [
      {
        id: "p-4",
        name: "Luis",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
      },
      {
        id: "p-5",
        name: "Clara",
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
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80",
    startsAt: startStretch,
    endsAt: endOf(startStretch, 1),
    location: "Terraza · Terraza",
    areaLabel: "Terraza",
    organizer: {
      id: "org-ines",
      name: "Inés Vidal",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      roleLabel: "Anfitriona",
    },
    capacity: 12,
    participantCount: 8,
    participants: [
      { id: "p-6", name: "Nora" },
      { id: "p-7", name: "Pau" },
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
    areaLabel: "Life Panoramica",
    organizer: {
      id: "org-community",
      name: "Life Panoramica",
      roleLabel: "Comunidad",
    },
    capacity: 30,
    participantCount: 14,
    participants: [
      { id: "p-8", name: "Rita" },
      { id: "p-9", name: "Tom" },
      { id: "p-10", name: "Eva" },
    ],
    status: "registration_open",
    type: "event",
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
      { id: "p-11", name: "Marc" },
      { id: "p-12", name: "Laia" },
      { id: "p-13", name: "Hugo" },
      { id: "p-14", name: "Iris" },
    ],
    status: "full",
    type: "experience",
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
      id: "org-ana",
      name: "Ana López",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      roleLabel: "Organizadora",
    },
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
      id: "org-ines",
      name: "Inés Vidal",
      roleLabel: "Anfitriona",
    },
    capacity: 15,
    participantCount: 11,
    participants: [],
    status: "expired",
    type: "experience",
  },
];

export function getExperienceById(id: string): Experience | undefined {
  return experienceCatalog.find((e) => e.id === id);
}

export function listDiscoverableExperiences(): Experience[] {
  return experienceCatalog.filter(
    (e) =>
      e.status === "published" ||
      e.status === "registration_open" ||
      e.status === "full",
  );
}

export function formatExperienceWhen(startsAt: string): string {
  const d = new Date(startsAt);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatExperienceDay(startsAt: string): string {
  const d = new Date(startsAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(d);
  if (diff === 0) return `Hoy · ${weekday}`;
  if (diff === 1) return `Mañana · ${weekday}`;
  return weekday;
}

export function formatExperienceTime(startsAt: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
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
