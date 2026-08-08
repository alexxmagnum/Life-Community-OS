/**
 * Community job board demo catalog + session creates (Servicios · Trabajo).
 * Announcements only — not professionals, not marketplace, not neighbour-help.
 */

import type {
  WorkPost,
  WorkPostCategory,
  WorkPostType,
} from "@life-community-os/types";
import {
  DEMO_PERSON_ANA,
  DEMO_PERSON_ELENA,
  DEMO_PERSON_INES,
  DEMO_PERSON_JORDI,
  DEMO_PERSON_LUIS,
  DEMO_PERSON_TOM,
} from "./demo-ids";
import { getDemoMemberByPersonId } from "./demo-members";

const CREATED_STORAGE_KEY = "lcos.life-panoramica.work-posts.created.v1";

export type WorkPostListing = WorkPost & {
  /** Display name for UI cards — denormalized from Person. */
  authorName: string;
  authorAvatarUrl?: string;
  categoryLabel: string;
};

export type CreateWorkPostInput = {
  type: WorkPostType;
  title: string;
  description: string;
  category: WorkPostCategory;
  availability?: string;
  location?: string;
  createdByPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
};

export const WORK_POST_CATEGORIES: readonly {
  id: WorkPostCategory;
  label: string;
}[] = [
  { id: "gardening", label: "Jardinería" },
  { id: "maintenance", label: "Mantenimiento" },
  { id: "lessons", label: "Clases" },
  { id: "cleaning", label: "Limpieza" },
  { id: "transport", label: "Transporte" },
  { id: "other", label: "Otros" },
];

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function workPostCategoryLabel(category: WorkPostCategory): string {
  return (
    WORK_POST_CATEGORIES.find((c) => c.id === category)?.label ?? "Otros"
  );
}

/** looking_for_work = Busco trabajo; offering_work = Ofrezco trabajo */
export function workPostTypeLabel(type: WorkPostType): string {
  return type === "looking_for_work" ? "Busco trabajo" : "Ofrezco trabajo";
}

const CATALOG_AUTHORS: Record<
  string,
  { authorName: string; authorAvatarUrl?: string }
> = {
  [DEMO_PERSON_ANA]: {
    authorName: "Ana",
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  },
  [DEMO_PERSON_INES]: { authorName: "Inés" },
  [DEMO_PERSON_ELENA]: {
    authorName: "Elena",
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
  },
  [DEMO_PERSON_JORDI]: {
    authorName: "Jordi",
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
  },
  [DEMO_PERSON_LUIS]: { authorName: "Luis" },
  [DEMO_PERSON_TOM]: { authorName: "Tom" },
};

function authorDisplay(personId: string): {
  authorName: string;
  authorAvatarUrl?: string;
} {
  const member = getDemoMemberByPersonId(personId);
  if (member) {
    return {
      authorName: member.displayName,
      authorAvatarUrl: member.avatarUrl,
    };
  }
  return CATALOG_AUTHORS[personId] ?? { authorName: "Vecino" };
}

export const workPostCatalog: WorkPost[] = [
  {
    id: "work-looking-garden",
    type: "looking_for_work",
    title: "Trabajo de jardinería",
    category: "gardening",
    createdByPersonId: DEMO_PERSON_ANA,
    description: "Busco trabajo de jardinería unas horas a la semana.",
    availability: "Mañanas entre semana",
    location: "Zona norte",
    status: "open",
    createdAt: hoursAgo(4),
  },
  {
    id: "work-looking-english",
    type: "looking_for_work",
    title: "Clases de inglés",
    category: "lessons",
    createdByPersonId: DEMO_PERSON_TOM,
    description: "Busco trabajo dando clases de inglés a vecinos.",
    availability: "Tardes flexibles",
    location: "Centro",
    status: "open",
    createdAt: hoursAgo(22),
  },
  {
    id: "work-looking-it",
    type: "looking_for_work",
    title: "Ayuda informática",
    category: "other",
    createdByPersonId: DEMO_PERSON_INES,
    description: "Busco trabajo de ayuda informática básica en casa.",
    availability: "Fines de semana",
    location: "Life Panoramica",
    status: "open",
    createdAt: hoursAgo(12),
  },
  {
    id: "work-looking-maintenance",
    type: "looking_for_work",
    title: "Electricidad y bricolaje",
    category: "maintenance",
    createdByPersonId: DEMO_PERSON_JORDI,
    description: "Busco pequeños trabajos de electricidad y bricolaje.",
    availability: "Entre semana, con cita",
    location: "Life Panoramica",
    status: "open",
    createdAt: hoursAgo(16),
  },
  {
    id: "work-offering-garden",
    type: "offering_work",
    title: "Mantenimiento del jardín",
    category: "gardening",
    createdByPersonId: DEMO_PERSON_ELENA,
    description: "Necesito a alguien para el mantenimiento del jardín.",
    availability: "Esta semana, por la mañana",
    location: "Zona verde",
    status: "open",
    createdAt: hoursAgo(6),
  },
  {
    id: "work-offering-hours",
    type: "offering_work",
    title: "Ordenar trastero",
    category: "other",
    createdByPersonId: DEMO_PERSON_LUIS,
    description: "Ofrezco unas horas de trabajo para ordenar un trastero.",
    availability: "Fin de semana",
    location: "Centro",
    status: "open",
    createdAt: hoursAgo(10),
  },
  {
    id: "work-offering-lessons",
    type: "offering_work",
    title: "Profesor de inglés",
    category: "lessons",
    createdByPersonId: DEMO_PERSON_ANA,
    description: "Busco profesor de inglés para conversación semanal.",
    availability: "Martes o jueves por la tarde",
    location: "Life Panoramica",
    status: "open",
    createdAt: hoursAgo(28),
  },
  {
    id: "work-offering-pet",
    type: "offering_work",
    title: "Cuidado de mascota",
    category: "other",
    createdByPersonId: DEMO_PERSON_ELENA,
    description:
      "Necesito a alguien de confianza para cuidar a mi perro dos días.",
    availability: "Jueves y viernes",
    location: "Los pinos",
    status: "open",
    createdAt: hoursAgo(8),
  },
];

/** Session author display cache — names stored with create for listing. */
const sessionAuthorCache = new Map<
  string,
  { authorName: string; authorAvatarUrl?: string }
>();

function readCreatedWorkPosts(): WorkPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CREATED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedWorkPosts(items: WorkPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREATED_STORAGE_KEY, JSON.stringify(items));
}

function toListing(item: WorkPost): WorkPostListing {
  const cached = sessionAuthorCache.get(item.id);
  const author = cached ?? authorDisplay(item.createdByPersonId);
  return {
    ...item,
    ...author,
    categoryLabel: workPostCategoryLabel(item.category),
  };
}

/**
 * Full list for contribution aggregation (catalog + session creates).
 */
export function listWorkPostsForContribution(
  options: { includeSessionCreated?: boolean } = {},
): WorkPost[] {
  const includeSession = options.includeSessionCreated !== false;
  const created = includeSession ? readCreatedWorkPosts() : [];
  const seen = new Set<string>();
  const merged: WorkPost[] = [];
  for (const post of [...created, ...workPostCatalog]) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    merged.push(post);
  }
  return merged;
}

/**
 * Resolve a work post by id (catalog + session creates).
 */
export function getWorkPostById(
  workPostId: string,
  options: { includeSessionCreated?: boolean } = {},
): WorkPostListing | undefined {
  const target = workPostId.trim();
  if (!target) return undefined;
  const includeSession =
    options.includeSessionCreated ?? typeof window !== "undefined";
  const post = listWorkPostsForContribution({
    includeSessionCreated: includeSession,
  }).find((item) => item.id === target);
  return post ? toListing(post) : undefined;
}

export function listWorkPosts(options?: {
  type?: WorkPostType;
  query?: string;
  /**
   * Include posts created in this browser session (localStorage).
   * Default: true in browser, false during SSR.
   */
  includeSessionCreated?: boolean;
}): WorkPostListing[] {
  const includeSession =
    options?.includeSessionCreated ?? typeof window !== "undefined";
  const q = options?.query?.trim().toLowerCase() ?? "";
  const source = listWorkPostsForContribution({
    includeSessionCreated: includeSession,
  });

  return source
    .filter((item) => item.status === "open")
    .filter((item) => (options?.type ? item.type === options.type : true))
    .filter((item) => {
      if (!q) return true;
      const hay =
        `${item.title} ${item.description} ${item.category} ${item.location ?? ""} ${item.availability ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .map(toListing)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Create a work announcement in the local demo session (no DB).
 */
export function createWorkPost(input: CreateWorkPostInput): WorkPost {
  const id = `work-created-${Date.now().toString(36)}`;
  const post: WorkPost = {
    id,
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    availability: input.availability?.trim() || undefined,
    location: input.location?.trim() || undefined,
    createdByPersonId: input.createdByPersonId,
    createdAt: new Date().toISOString(),
    status: "open",
  };

  sessionAuthorCache.set(id, {
    authorName: input.authorName.trim() || "Vecino",
    authorAvatarUrl: input.authorAvatarUrl,
  });

  const existing = readCreatedWorkPosts();
  writeCreatedWorkPosts([post, ...existing.filter((p) => p.id !== id)]);
  return post;
}

/** Count job posts authored by a Person — contribution join. */
export function countWorkPostsForPerson(
  personId: string,
  options: { includeSessionCreated?: boolean } = {},
): number {
  const target = personId.trim();
  if (!target) return 0;
  return listWorkPostsForContribution(options).filter(
    (item) => item.createdByPersonId === target,
  ).length;
}
