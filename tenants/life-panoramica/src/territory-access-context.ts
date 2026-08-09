/**
 * Residency & Territory Access Experience (D.0.7.2.2).
 *
 * Answers: "Where do I belong?" — not "What properties do I own?"
 *
 * Reuses PropertyPersonRelationship → CommunityArea derivation (ADR-037/038)
 * plus existing channel/resource gates. Does NOT replace Membership or RBAC.
 * Ownership never becomes community administration.
 */

import { listAccessibleChannels } from "./channel-access";
import { listChannels } from "./channels";
import { getCommunityAreaById } from "./community-areas";
import { getMyHomeContext, type MyHomeContext } from "./property-home-context";
import {
  evaluateDemoResourceAccessForPerson,
  listResources,
} from "./resources";

export type TerritoryAccessInsight = {
  id: string;
  tone: "ok" | "pending" | "info";
  title: string;
  body: string;
  href?: string;
};

export type TerritoryAccessContext = {
  personId: string;
  /** Primary belonging line for UX. */
  belongingHeadline: string;
  /** Supporting sentence — territory relationship, not inventory. */
  belongingSummary: string;
  hasVerifiedResidency: boolean;
  verifiedAreaLabels: string[];
  home: MyHomeContext;
  accessiblePrivateChannelCount: number;
  lockedPrivateChannelCount: number;
  eligibleResourceCount: number;
  visibleResourceCount: number;
  insights: TerritoryAccessInsight[];
};

export type TerritoryAccessOptions = {
  /** RBAC capability — kept separate from residency eligibility. */
  canReservePermission?: boolean;
};

/**
 * Builds residency-aware territory access context for community experiences.
 */
export function getTerritoryAccessContext(
  personId: string,
  options: TerritoryAccessOptions = {},
): TerritoryAccessContext {
  const home = getMyHomeContext(personId);
  const canReservePermission = options.canReservePermission ?? true;

  const verifiedAreaLabels = home.verifiedCommunityAreaIds
    .map((id) => getCommunityAreaById(id)?.name)
    .filter((name): name is string => Boolean(name));

  const hasVerifiedResidency = verifiedAreaLabels.length > 0;

  const privateChannels = listChannels().filter(
    (ch) => ch.status === "active" && ch.requiresVerifiedResidency,
  );
  const accessiblePrivate = listAccessibleChannels(personId).filter((ch) =>
    privateChannels.some((p) => p.id === ch.id),
  );
  const lockedPrivateChannelCount = Math.max(
    0,
    privateChannels.length - accessiblePrivate.length,
  );

  const resources = listResources();
  let eligibleResourceCount = 0;
  let visibleResourceCount = 0;
  for (const resource of resources) {
    const access = evaluateDemoResourceAccessForPerson(
      resource.id,
      personId,
      canReservePermission,
    );
    if (access.canViewPublicInfo) visibleResourceCount += 1;
    if (access.canReserve) eligibleResourceCount += 1;
  }

  const belonging = resolveBelonging(home, verifiedAreaLabels);
  const insights = buildInsights({
    home,
    hasVerifiedResidency,
    verifiedAreaLabels,
    accessiblePrivateChannelCount: accessiblePrivate.length,
    lockedPrivateChannelCount,
    eligibleResourceCount,
  });

  return {
    personId,
    belongingHeadline: belonging.headline,
    belongingSummary: belonging.summary,
    hasVerifiedResidency,
    verifiedAreaLabels,
    home,
    accessiblePrivateChannelCount: accessiblePrivate.length,
    lockedPrivateChannelCount,
    eligibleResourceCount,
    visibleResourceCount,
    insights,
  };
}

function resolveBelonging(
  home: MyHomeContext,
  verifiedAreaLabels: string[],
): { headline: string; summary: string } {
  if (verifiedAreaLabels.length > 0) {
    const areas = verifiedAreaLabels.join(", ");
    return {
      headline: `Perteneces a ${areas}`,
      summary:
        "Tu residencia verificada abre información y espacios de tu zona — la propiedad no administra la comunidad.",
    };
  }

  const primary = home.primary;
  if (primary?.statusKind === "pending") {
    return {
      headline: "Tu lugar está pendiente de verificación",
      summary:
        "Ya tienes un vínculo con una propiedad, pero el acceso de zona se activa solo tras verificar la residencia.",
    };
  }

  if (primary) {
    return {
      headline: primary.headline,
      summary:
        "Ves el contexto de tu propiedad. El acceso comunitario de área requiere residencia verificada activa.",
    };
  }

  return {
    headline: "Eres parte del territorio",
    summary:
      "La membresía te une a la comunidad. Vincula y verifica tu hogar para desbloquear espacios de tu zona.",
  };
}

function buildInsights(input: {
  home: MyHomeContext;
  hasVerifiedResidency: boolean;
  verifiedAreaLabels: string[];
  accessiblePrivateChannelCount: number;
  lockedPrivateChannelCount: number;
  eligibleResourceCount: number;
}): TerritoryAccessInsight[] {
  const insights: TerritoryAccessInsight[] = [];

  if (input.home.primary?.statusKind === "pending") {
    insights.push({
      id: "verify-home",
      tone: "pending",
      title: "Completa tu verificación",
      body: "Así desbloqueas canales y reservas de tu zona.",
      href: "/me",
    });
  }

  if (input.hasVerifiedResidency) {
    insights.push({
      id: "area-belonging",
      tone: "ok",
      title: `Tu zona · ${input.verifiedAreaLabels.join(", ")}`,
      body: "Información y espacios elegibles según tu residencia verificada.",
      href: "/community",
    });
  }

  if (input.accessiblePrivateChannelCount > 0) {
    insights.push({
      id: "private-channels",
      tone: "ok",
      title: "Canales de tu zona",
      body: `${input.accessiblePrivateChannelCount} canal(es) privado(s) disponibles con tu residencia.`,
      href: "/community?tab=canales",
    });
  } else if (input.lockedPrivateChannelCount > 0) {
    insights.push({
      id: "locked-channels",
      tone: "info",
      title: "Canales de zona",
      body: "Hay espacios privados que requieren residencia verificada en su área.",
      href: "/community?tab=canales",
    });
  }

  if (input.eligibleResourceCount > 0) {
    insights.push({
      id: "eligible-resources",
      tone: "ok",
      title: "Espacios que puedes reservar",
      body: `${input.eligibleResourceCount} instalación(es) elegible(s) con tu residencia y permisos.`,
      href: "/resources",
    });
  } else if (input.hasVerifiedResidency) {
    insights.push({
      id: "resources-other-area",
      tone: "info",
      title: "Reservas por zona",
      body: "Algunas instalaciones pertenecen a otras áreas — puedes verlas, pero no siempre reservarlas.",
      href: "/resources",
    });
  }

  return insights.slice(0, 4);
}

/**
 * Soft area labels for local discovery ranking — verified areas first,
 * else claimed/primary home area label. Not a security gate.
 */
export function territoryDiscoveryAreaLabels(personId: string): string[] {
  const access = getTerritoryAccessContext(personId);
  if (access.verifiedAreaLabels.length > 0) return access.verifiedAreaLabels;
  const claimed = access.home.primary?.communityAreaLabel;
  return claimed ? [claimed] : [];
}
