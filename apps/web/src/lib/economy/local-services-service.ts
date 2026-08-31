/**
 * Local Services Service — projects Business, Help and Reservations
 * into LocalServicesContext. Does not persist a commerce aggregate.
 */

import type {
  LocalServiceAction,
  LocalServiceCard,
  LocalServicesContext,
} from "@life-community-os/types";
import {
  businessToLocalServiceCard,
  isProfessionalBusiness,
  localServiceActionLabel,
  projectLocalServicesContext,
  recordMatchesTerritoryScope,
  resourceIsBookable,
  sortLocalServiceCards,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { getLocationServer } from "@/lib/location/server-location-repository";
import { listResourcesServer } from "@/lib/reservations/server-reservations-repository";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export class EconomyDeniedError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "EconomyDeniedError";
  }
}

function requireActor(actor: RequestActor, tenantId: string): string {
  if (!actor.authenticated || !actor.hasMembership || !actor.personId) {
    throw new EconomyDeniedError("unauthorized");
  }
  if (
    resolveTenantPublicId(actor.tenantSlug) !==
    resolveTenantPublicId(tenantId)
  ) {
    throw new EconomyDeniedError("forbidden");
  }
  return actor.personId;
}

export const LocalServicesService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<LocalServicesContext> {
    requireActor(input.actor, input.tenantId);
    const { cards, actions, counts } = await this.collect(input);
    void cards;
    return projectLocalServicesContext({
      tenantId: resolveTenantPublicId(input.tenantId),
      territoryId: input.territoryId,
      businesses: counts.businesses,
      professionals: counts.professionals,
      helpOffers: counts.helpOffers,
      availableReservations: counts.availableReservations,
      actions,
    });
  },

  async cards(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<LocalServiceCard[]> {
    requireActor(input.actor, input.tenantId);
    const { cards } = await this.collect(input);
    return sortLocalServiceCards(cards);
  },

  async collect(input: {
    tenantId: string;
    territoryId: string;
  }): Promise<{
    cards: LocalServiceCard[];
    actions: LocalServiceAction[];
    counts: LocalServicesContext["services"];
  }> {
    const businesses = (await listBusinessesServer(input.tenantId)).filter(
      (item) =>
        item.status === "published" &&
        recordMatchesTerritoryScope(item.territoryId, input.territoryId),
    );
    const cards: LocalServiceCard[] = [];
    let professionals = 0;
    for (const business of businesses) {
      const location = business.locationId
        ? await getLocationServer(input.tenantId, business.locationId)
        : null;
      if (isProfessionalBusiness(business, location?.type)) {
        professionals += 1;
      }
      cards.push(
        businessToLocalServiceCard(business, {
          type: location?.type,
          areaLabel: location?.areaLabel,
        }),
      );
    }
    const help = (await listHelpRequestsServer(input.tenantId)).filter(
      (item) =>
        item.type === "offer_help" &&
        item.status === "open" &&
        recordMatchesTerritoryScope(item.territoryId, input.territoryId),
    );
    for (const offer of help) {
      cards.push({
        id: offer.id,
        name: offer.title,
        kind: "help",
        category: offer.category,
        href: `/help/${encodeURIComponent(offer.id)}`,
        available: true,
        trustLabels: [],
      });
    }
    const resources = (await listResourcesServer(input.tenantId)).filter(
      (item) =>
        resourceIsBookable(item) &&
        recordMatchesTerritoryScope(item.territoryId, input.territoryId),
    );
    const actions: LocalServiceAction[] = cards.slice(0, 8).map((card) => ({
      kind:
        card.kind === "professional"
          ? "hire"
          : card.kind === "help"
            ? "ask_help"
            : "view_business",
      label: localServiceActionLabel(
        card.kind === "professional"
          ? "hire"
          : card.kind === "help"
            ? "ask_help"
            : "view_business",
      ),
      href: card.href,
      entityType: card.kind === "help" ? "help" : "business",
      entityId: card.id,
    }));
    for (const resource of resources.slice(0, 4)) {
      actions.push({
        kind: "reserve",
        label: "Reservar",
        href: `/resources/${encodeURIComponent(resource.id)}/reserve`,
        entityType: "resource",
        entityId: resource.id,
      });
    }
    return {
      cards,
      actions,
      counts: {
        businesses: businesses.length,
        professionals,
        helpOffers: help.length,
        availableReservations: resources.length,
      },
    };
  },
};
