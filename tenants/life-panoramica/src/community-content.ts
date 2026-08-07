/**
 * Community content — tenant-neutral publishing model (ADR-026).
 * Lifecycle: draft → pending_review → published → expired → archived
 * Interactions attach per ADR-028 (content-centric, not a social network).
 */

export type PublishingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "expired"
  | "archived";

export type CommunityContentType =
  | "announcement"
  | "news"
  | "discussion"
  | "proposal"
  | "member_update";

export type ReactionKind = "acknowledge" | "support";

export type CommunityAuthor = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type CommunityComment = {
  id: string;
  author: CommunityAuthor;
  body: string;
  createdAt: string;
  replyToId?: string;
  mentionNames?: string[];
};

export type CommunityContent = {
  id: string;
  type: CommunityContentType;
  title: string;
  body: string;
  status: PublishingStatus;
  isOfficial: boolean;
  author: CommunityAuthor;
  areaLabel?: string;
  createdAt: string;
  publishedAt?: string;
  imageUrl?: string;
  /** Optional link to Experience capability (ADR-027) — not a separate domain */
  linkedExperienceId?: string;
  commentCount: number;
  reactionCounts: Record<ReactionKind, number>;
  comments: CommunityComment[];
  /** Proposal-only display hint */
  decisionStatus?: "open" | "closing_soon" | "closed";
};

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** Life Panoramica reference catalog — same shape for any tenant. */
export const communityContentCatalog: CommunityContent[] = [
  {
    id: "cc-official-lighting",
    type: "announcement",
    title: "Actualización de iluminación en caminos",
    body: "La fase 2 ya está lista en los caminos de Aldea Golf. Gracias por la paciencia durante las obras.",
    status: "published",
    isOfficial: true,
    author: {
      id: "org-community",
      name: "Life Panoramica",
    },
    areaLabel: "Aldea Golf",
    createdAt: hoursAgo(5),
    publishedAt: hoursAgo(5),
    commentCount: 3,
    reactionCounts: { acknowledge: 18, support: 7 },
    comments: [
      {
        id: "c1",
        author: { id: "p-elena", name: "Elena" },
        body: "Se ve mucho más seguro por la noche — gracias.",
        createdAt: hoursAgo(3),
      },
      {
        id: "c2",
        author: { id: "p-jordi", name: "Jordi" },
        body: "¿Será Pinar el siguiente?",
        createdAt: hoursAgo(2),
        replyToId: "c1",
      },
    ],
  },
  {
    id: "cc-water",
    type: "announcement",
    title: "Mantenimiento de agua el sábado",
    body: "Obras de 10:00 a 14:00 en Aldea Golf. Guarda un poco de agua para la mañana.",
    status: "published",
    isOfficial: true,
    author: { id: "org-community", name: "Life Panoramica" },
    areaLabel: "Aldea Golf",
    createdAt: daysAgo(1),
    publishedAt: daysAgo(1),
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80",
    commentCount: 5,
    reactionCounts: { acknowledge: 24, support: 4 },
    comments: [],
  },
  {
    id: "cc-walk-invite",
    type: "discussion",
    title: "¿Alguien para un paseo al atardecer?",
    body: "Hacia Detinsa sobre las 19:00 — únete si te apetece. Ritmo suave, bienvenidos todos.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-ana",
      name: "Ana",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "Detinsa",
    createdAt: hoursAgo(8),
    publishedAt: hoursAgo(8),
    linkedExperienceId: "exp-sunset-walk",
    commentCount: 4,
    reactionCounts: { acknowledge: 9, support: 12 },
    comments: [
      {
        id: "c3",
        author: { id: "p-marta", name: "Marta" },
        body: "Me apunto — nos vemos en la entrada del camino.",
        createdAt: hoursAgo(6),
        mentionNames: ["Ana"],
      },
    ],
  },
  {
    id: "cc-pool-hours",
    type: "discussion",
    title: "Horario de la piscina en agosto",
    body: "Hilo para dudas antes de cerrar la decisión de la comunidad. Útil y con respeto.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-luis",
      name: "Luis",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "Toda Panoramica",
    createdAt: daysAgo(2),
    publishedAt: daysAgo(2),
    commentCount: 11,
    reactionCounts: { acknowledge: 6, support: 3 },
    comments: [],
  },
  {
    id: "cc-proposal-pool",
    type: "proposal",
    title: "Ampliar el horario de verano de la piscina",
    body: "Propuesta de abrir la piscina hasta las 21:00 entre semana en agosto. Comparte tu opinión en Decidir.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-clara",
      name: "Clara",
    },
    areaLabel: "Toda Panoramica",
    createdAt: daysAgo(3),
    publishedAt: daysAgo(3),
    commentCount: 8,
    reactionCounts: { acknowledge: 15, support: 21 },
    comments: [],
    decisionStatus: "closing_soon",
  },
  {
    id: "cc-news-gardens",
    type: "news",
    title: "Consejos de jardín de los vecinos",
    body: "Resumen breve de riego y cuidado de plantas del círculo de paseos — práctico, local, sin publicidad.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-ines",
      name: "Inés",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "Valle Golf",
    createdAt: daysAgo(4),
    publishedAt: daysAgo(4),
    commentCount: 2,
    reactionCounts: { acknowledge: 11, support: 5 },
    comments: [],
  },
  {
    id: "cc-pending",
    type: "member_update",
    title: "Llaves encontradas cerca de la pista 2",
    body: "Las dejé en la oficina de la comunidad — pregunta por Marta si son tuyas.",
    status: "pending_review",
    isOfficial: false,
    author: { id: "p-tom", name: "Tom" },
    areaLabel: "Aldea Golf",
    createdAt: hoursAgo(1),
    commentCount: 0,
    reactionCounts: { acknowledge: 0, support: 0 },
    comments: [],
  },
];

export function listPublishedCommunityContent(): CommunityContent[] {
  return communityContentCatalog
    .filter((c) => c.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    );
}

export function getCommunityContentById(
  id: string,
): CommunityContent | undefined {
  return communityContentCatalog.find((c) => c.id === id);
}

export function listDiscussions(): CommunityContent[] {
  return listPublishedCommunityContent().filter(
    (c) => c.type === "discussion" || c.type === "member_update",
  );
}

export function listProposals(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.type === "proposal");
}

export function listOfficialContent(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.isOfficial);
}

export function formatContentWhen(iso: string): string {
  const d = new Date(iso);
  const diffH = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return "Ahora mismo";
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "Ayer";
  if (diffD < 7) return `Hace ${diffD} d`;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function contentTypeLabel(type: CommunityContentType): string {
  switch (type) {
    case "announcement":
      return "Oficial";
    case "news":
      return "Noticia";
    case "discussion":
      return "Conversación";
    case "proposal":
      return "Propuesta";
    case "member_update":
      return "Actualización";
    default:
      return "Comunidad";
  }
}
