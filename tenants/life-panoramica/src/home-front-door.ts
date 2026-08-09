/**
 * Home front door — deterministic personalization + section builders (Phase C.3).
 * No AI. Scores over existing Experience / LocalEntity / Content / Pulse.
 * Architecture allows swapping the scorer later without new domain models.
 */

import type { CommunityActivity, LocalEntity } from "@life-community-os/types";

import { listProposals, listOfficialContent } from "./community-content";
import type { DemoMemberProfile } from "./demo-members";
import {
  listDiscoverableExperiences,
  type Experience,
} from "./experiences";
import {
  listNearYou,
  listNeighbourRecommendations,
} from "./local-places";
import { buildCommunityPulse } from "./community-pulse";

export type ForYouItem = {
  id: string;
  kind: "experience" | "local" | "welcome" | "proposal";
  title: string;
  subtitle: string;
  imageUrl?: string;
  href: string;
  score: number;
};

export type TodayMoment = {
  id: string;
  timeLabel: string;
  title: string;
  meta: string;
  href: string;
  imageUrl?: string;
  source: "experience" | "announcement" | "activity";
};

export type CommunityLifeItem = {
  id: string;
  narrative: string;
  context?: string;
  href: string;
  imageUrl?: string;
  personName?: string;
  personAvatarUrl?: string;
};

/** Normalize interest / catalog tokens for soft matching. */
function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

const INTEREST_ALIASES: Record<string, string[]> = {
  caminar: ["caminar", "paseo", "sender", "walk", "atardecer", "pinos"],
  padel: ["padel", "pádel"],
  natacion: ["natacion", "piscina", "swim", "baño"],
  cafe: ["cafe", "café", "desayuno", "club"],
  golf: ["golf"],
  familia: ["familia", "familiar", "niñ", "taller"],
};

function interestTokens(interests: string[]): string[] {
  const tokens = new Set<string>();
  for (const interest of interests) {
    const n = normalizeToken(interest);
    tokens.add(n);
    for (const [key, aliases] of Object.entries(INTEREST_ALIASES)) {
      if (n.includes(key) || aliases.some((a) => n.includes(normalizeToken(a)))) {
        aliases.forEach((a) => tokens.add(normalizeToken(a)));
        tokens.add(key);
      }
    }
  }
  return [...tokens];
}

function textBlob(...parts: Array<string | undefined>): string {
  return normalizeToken(parts.filter(Boolean).join(" "));
}

function interestMatchScore(blob: string, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (token.length < 3) continue;
    if (blob.includes(token)) score += 18;
  }
  return Math.min(score, 36);
}

function areaMatchScore(blob: string, areaLabel: string): number {
  const area = normalizeToken(areaLabel.replace(/\(.*?\)/g, ""));
  if (!area) return 0;
  return blob.includes(area) ? 14 : 0;
}

/** Product timezone — avoids SSR (UTC) vs browser locale day/hour drift. */
const HOME_TZ = "Europe/Madrid";

function timeRelevanceScore(startsAt: string, now = Date.now()): number {
  const t = new Date(startsAt).getTime();
  const delta = t - now;
  if (delta < 0) return 0;
  const hours = delta / (1000 * 60 * 60);
  if (hours <= 6) return 28;
  if (hours <= 24) return 22;
  if (hours <= 72) return 14;
  if (hours <= 168) return 8;
  return 2;
}

function dayKeyInTz(isoOrDate: string | Date, timeZone = HOME_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate);
}

function isSameLocalDay(iso: string, now = new Date()): boolean {
  return dayKeyInTz(iso) === dayKeyInTz(now);
}

function formatTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: HOME_TZ,
  }).format(new Date(iso));
}

export type HomeFrontDoorOptions = {
  limit?: number;
  /** When false, ignore localStorage-created experiences (SSR-safe). Default true. */
  includeSessionExperiences?: boolean;
  /** Clock for ranking / “today”. Omit for Date.now(). */
  nowMs?: number;
  /** Drop time-based score variance (stable SSR ranking). */
  stabilizeTime?: boolean;
};

export function experienceActivityLabel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("golf")) return "Golf";
  if (t.includes("pádel") || t.includes("padel")) return "Pádel";
  if (t.includes("yoga") || t.includes("estir")) return "Bienestar";
  if (t.includes("paseo") || t.includes("sender") || t.includes("atardecer")) {
    return "Naturaleza";
  }
  if (t.includes("juego") || t.includes("mesa")) return "Ocio";
  if (t.includes("café") || t.includes("cafe")) return "Encuentro";
  if (t.includes("taller") || t.includes("clase")) return "Clases";
  return "Experiencia";
}

/**
 * Para ti — personalized shortlist.
 * Rank boosts only; never exclusive filters.
 */
export function buildForYouItems(
  member: DemoMemberProfile,
  options: HomeFrontDoorOptions = {},
): ForYouItem[] {
  const limit = options.limit ?? 4;
  const includeSession = options.includeSessionExperiences !== false;
  const nowMs = options.nowMs ?? Date.now();
  const tokens = interestTokens(member.interests);
  const items: ForYouItem[] = [];

  for (const exp of listDiscoverableExperiences({
    includeSessionCreated: includeSession,
  })) {
    const blob = textBlob(exp.title, exp.description, exp.location, exp.areaLabel);
    const score =
      20 +
      interestMatchScore(blob, tokens) +
      areaMatchScore(blob, member.areaLabel) +
      (options.stabilizeTime ? 0 : timeRelevanceScore(exp.startsAt, nowMs)) +
      Math.min(exp.participantCount, 10);
    const peopleBit =
      exp.participantCount > 0
        ? `${exp.participantCount} van`
        : `${Math.max(0, exp.capacity - exp.participantCount)} plazas`;
    items.push({
      id: `foryou-exp-${exp.id}`,
      kind: "experience",
      title: exp.title,
      // Skip clock text while stabilizing — locale/TZ formatting can diverge SSR vs client.
      subtitle: options.stabilizeTime
        ? [experienceActivityLabel(exp.title), peopleBit].join(" · ")
        : [experienceActivityLabel(exp.title), formatTimeLabel(exp.startsAt), peopleBit].join(
            " · ",
          ),
      imageUrl: exp.imageUrl,
      href: `/experiences/${exp.id}`,
      score,
    });
  }

  for (const place of listNearYou().slice(0, 8)) {
    const blob = textBlob(
      place.name,
      place.categoryLabel,
      place.areaLabel,
      place.story,
    );
    const score =
      12 +
      interestMatchScore(blob, tokens) +
      areaMatchScore(blob, member.areaLabel) +
      (place.recommendedBy ? 8 : 0) +
      (place.verified ? 6 : 0);
    items.push({
      id: `foryou-place-${place.id}`,
      kind: "local",
      title: place.name,
      subtitle: `${place.categoryLabel} · ${place.areaLabel}`,
      imageUrl: place.imageUrl,
      href: "/near/places",
      score,
    });
  }

  if (member.residencyStatusKind === "pending") {
    items.push({
      id: "foryou-welcome-community",
      kind: "welcome",
      title: "Termina de activar tu perfil",
      subtitle: "Así la comunidad puede mostrarte lo más útil para ti",
      href: "/me",
      score: 40,
    });
  } else if (member.residencyStatusKind === "other_area") {
    items.push({
      id: "foryou-welcome-neighbours",
      kind: "welcome",
      title: "Descubre lo que ocurre cerca",
      subtitle: `Planes y vecinos en ${member.areaLabel}`,
      href: "/community",
      score: 34,
    });
  }

  for (const notice of listOfficialContent().slice(0, 2)) {
    const blob = textBlob(notice.title, notice.body, notice.areaLabel);
    items.push({
      id: `foryou-notice-${notice.id}`,
      kind: "proposal",
      title: notice.title,
      subtitle: notice.areaLabel
        ? `Aviso · ${notice.areaLabel}`
        : "Aviso de la comunidad",
      imageUrl: notice.imageUrl,
      href: `/community/content/${notice.id}`,
      score:
        28 +
        interestMatchScore(blob, tokens) +
        areaMatchScore(blob, member.areaLabel),
    });
  }

  const proposal = listProposals()[0];
  if (proposal) {
    items.push({
      id: `foryou-proposal-${proposal.id}`,
      kind: "proposal",
      title: proposal.title,
      subtitle: "Propuesta comunitaria abierta",
      imageUrl: proposal.imageUrl,
      href: `/community/content/${proposal.id}`,
      score: 16 + areaMatchScore(textBlob(proposal.areaLabel), member.areaLabel),
    });
  }

  // Deterministic tie-break — unstable Array.sort caused SSR/client hydration mismatches.
  return items
    .sort(
      (a, b) => b.score - a.score || a.id.localeCompare(b.id, "en"),
    )
    .slice(0, limit);
}

/** Hoy — experiences today + important official notices. */
export function buildTodayMoments(
  options: HomeFrontDoorOptions = {},
): TodayMoment[] {
  const limit = options.limit ?? 5;
  const includeSession = options.includeSessionExperiences !== false;
  const now = new Date(options.nowMs ?? Date.now());
  const moments: TodayMoment[] = [];

  for (const exp of listDiscoverableExperiences({
    includeSessionCreated: includeSession,
  })) {
    if (!isSameLocalDay(exp.startsAt, now)) continue;
    moments.push({
      id: `today-exp-${exp.id}`,
      timeLabel: formatTimeLabel(exp.startsAt),
      title: exp.title,
      meta:
        exp.participantCount > 0
          ? `${exp.participantCount} vecinos · ${exp.location}`
          : exp.location,
      href: `/experiences/${exp.id}`,
      imageUrl: exp.imageUrl,
      source: "experience",
    });
  }

  for (const notice of listOfficialContent().slice(0, 2)) {
    moments.push({
      id: `today-official-${notice.id}`,
      timeLabel: "Aviso",
      title: notice.title,
      meta: notice.body.slice(0, 80),
      href: `/community/content/${notice.id}`,
      imageUrl: notice.imageUrl,
      source: "announcement",
    });
  }

  moments.sort((a, b) => {
    if (a.source === "experience" && b.source !== "experience") return -1;
    if (b.source === "experience" && a.source !== "experience") return 1;
    const timeCmp = a.timeLabel.localeCompare(b.timeLabel, "es");
    if (timeCmp !== 0) return timeCmp;
    return a.id.localeCompare(b.id, "en");
  });

  return moments.slice(0, limit);
}

/** Upcoming experiences for the discovery rail (not only today). */
export function listUpcomingHomeExperiences(
  options: HomeFrontDoorOptions = {},
): Experience[] {
  const limit = options.limit ?? 6;
  const includeSession = options.includeSessionExperiences !== false;
  const now = options.nowMs ?? Date.now();
  const list = listDiscoverableExperiences({
    includeSessionCreated: includeSession,
  });
  // While stabilizing SSR, skip the rolling “now” cutoff so server/client lists match.
  const filtered = options.stabilizeTime
    ? list.filter((e) => new Date(e.startsAt).getTime() >= now - 7 * 24 * 60 * 60 * 1000)
    : list.filter((e) => new Date(e.startsAt).getTime() >= now - 60 * 60 * 1000);
  return filtered
    .sort((a, b) => {
      if (options.stabilizeTime) {
        return a.id.localeCompare(b.id, "en");
      }
      const t =
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (t !== 0) return t;
      return a.id.localeCompare(b.id, "en");
    })
    .slice(0, limit);
}

/** Curated near-you — one of each vibe when possible, not a dump. */
export function listCuratedNearYou(
  member: DemoMemberProfile,
  options: { limit?: number; preferredAreaLabels?: string[] } = {},
): LocalEntity[] {
  const limit = options.limit ?? 4;
  const tokens = interestTokens(member.interests);
  const preferred = options.preferredAreaLabels ?? [];
  const ranked = listNearYou()
    .map((place) => {
      const blob = textBlob(
        place.name,
        place.categoryLabel,
        place.areaLabel,
        place.story,
      );
      const preferredBoost = preferred.some((label) =>
        normalizeToken(place.areaLabel).includes(normalizeToken(label)),
      )
        ? 14
        : 0;
      const score =
        interestMatchScore(blob, tokens) +
        areaMatchScore(blob, member.areaLabel) +
        preferredBoost +
        (place.recommendedBy ? 10 : 0) +
        (place.verified ? 4 : 0);
      return { place, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.place.id.localeCompare(b.place.id, "en"),
    );

  const picked: LocalEntity[] = [];
  const seenKinds = new Set<string>();
  for (const { place } of ranked) {
    if (picked.length >= limit) break;
    const kindKey =
      place.kind === "restaurant" || place.kind === "cafe"
        ? "food"
        : place.kind;
    if (seenKinds.has(kindKey) && picked.length + 1 < limit) continue;
    seenKinds.add(kindKey);
    picked.push(place);
  }
  return picked;
}

/**
 * Fixed catalog picks for Vida de comunidad — never derive from
 * listDiscoverableExperiences() order or localStorage (SSR/client hydrate).
 */
const COMMUNITY_LIFE_EXPERIENCE_IDS = [
  "exp-sunset-walk",
  "exp-sunrise-pines",
  "exp-coffee",
] as const;

/**
 * Vida de comunidad — people creating life (not a social feed).
 */
export function buildCommunityLifeItems(
  options: HomeFrontDoorOptions = {},
): CommunityLifeItem[] {
  const limit = options.limit ?? 5;
  const items: CommunityLifeItem[] = [];

  // Catalog-only lookup (ignore session creates even when “live”).
  const byId = new Map(
    listDiscoverableExperiences({ includeSessionCreated: false }).map((e) => [
      e.id,
      e,
    ]),
  );

  for (const id of COMMUNITY_LIFE_EXPERIENCE_IDS) {
    const exp = byId.get(id);
    if (!exp) continue;
    items.push({
      id: `life-exp-${exp.id}`,
      narrative: `${exp.organizer.name} creó “${exp.title}”`,
      context: [experienceActivityLabel(exp.title), exp.location]
        .filter(Boolean)
        .join(" · "),
      href: `/experiences/${exp.id}`,
      imageUrl: exp.imageUrl,
      personName: exp.organizer.name,
      personAvatarUrl: exp.organizer.avatarUrl,
    });
  }

  const tips = [...listNeighbourRecommendations()].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  );
  for (const tip of tips.slice(0, 2)) {
    items.push({
      id: `life-rec-${tip.id}`,
      narrative: tip.relatedLabel
        ? `${tip.authorName} recomendó ${tip.relatedLabel}`
        : `${tip.authorName} compartió una recomendación`,
      context: tip.body.slice(0, 72),
      href: "/services/recommendations",
      imageUrl: tip.imageUrl,
      personName: tip.authorName,
      personAvatarUrl: tip.authorAvatarUrl,
    });
  }

  const proposals = [...listProposals()].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  );
  for (const proposal of proposals.slice(0, 2)) {
    items.push({
      id: `life-proposal-${proposal.id}`,
      narrative: `Nueva propuesta: ${proposal.title}`,
      context: proposal.author.name,
      href: `/community/content/${proposal.id}`,
      imageUrl: proposal.imageUrl,
      personName: proposal.author.name,
      personAvatarUrl: proposal.author.avatarUrl,
    });
  }

  return items
    .sort((a, b) => a.id.localeCompare(b.id, "en"))
    .slice(0, limit);
}

/** Optional: scored pulse for Hoy when experiences-today is empty. */
export function buildPersonalizedPulse(
  member: DemoMemberProfile,
  input: Parameters<typeof buildCommunityPulse>[0] = {},
): CommunityActivity[] {
  const tokens = interestTokens(member.interests);
  const raw = buildCommunityPulse({ ...input, limit: 12 });
  return [...raw]
    .map((item) => {
      const blob = textBlob(item.headline, item.context, item.personName);
      const boost =
        interestMatchScore(blob, tokens) +
        areaMatchScore(blob, member.areaLabel);
      return { ...item, weight: (item.weight ?? 0) + boost };
    })
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, input.limit ?? 5);
}
