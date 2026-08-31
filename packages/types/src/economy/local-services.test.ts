import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReservationRecord } from "../domain/resource";
import { createReservationContext } from "../domain/reservation-context";
import {
  businessToLocalServiceCard,
  helpEconomyLabel,
  isOpaqueEconomyEntity,
  isProfessionalBusiness,
  neighborExchangeIsMarketplace,
  professionalCapabilitiesFrom,
  projectLocalServicesContext,
  sortLocalServiceCards,
  type LocalServiceCard,
} from "./local-services";
import { createBusinessProfile } from "../domain/business-profile";

const TERRITORY = "10000000-0000-4000-8000-000000000002";

describe("Local Services Context", () => {
  it("projects territorial counts without storing commerce", () => {
    const context = projectLocalServicesContext({
      tenantId: "life-panoramica",
      territoryId: TERRITORY,
      businesses: 4,
      professionals: 2,
      helpOffers: 3,
      availableReservations: 1,
    });
    assert.equal(context.services.professionals, 2);
    assert.equal(context.services.helpOffers, 3);
    assert.equal(isOpaqueEconomyEntity("EconomyEntity"), true);
    assert.equal(isOpaqueEconomyEntity("ServiceMarketplaceEntity"), true);
  });

  it("treats a published electrician as a professional of Business", () => {
    const business = createBusinessProfile({
      tenantId: "life-panoramica",
      ownerPersonId: "person-alex",
      locationId: "loc-1",
      name: "Taller Alex",
      category: "electrician",
      status: "published",
      hours: "09:00–18:00",
      contact: "alex@local",
      territoryId: TERRITORY,
    });
    assert.equal(isProfessionalBusiness(business, "service"), true);
    const caps = professionalCapabilitiesFrom(business, {
      type: "service",
      areaLabel: "Castelló",
    });
    assert.equal(caps?.professionalCategory, "electrician");
    assert.equal(caps?.serviceArea, "Castelló");
    assert.equal(caps?.availability, "09:00–18:00");
    const card = businessToLocalServiceCard(business, { type: "service" });
    assert.equal(card.kind, "professional");
    assert.equal(card.trustLabels.includes("Negocio registrado"), true);
  });

  it("keeps help distinct from marketplace sale", () => {
    assert.equal(helpEconomyLabel("offer_help"), "Ofrecer ayuda");
    assert.equal(helpEconomyLabel("need_help"), "Pedir ayuda");
    assert.equal(neighborExchangeIsMarketplace(), true);
  });

  it("orders by distance then availability then public trust, never a score", () => {
    const cards: LocalServiceCard[] = [
      {
        id: "far",
        name: "Lejos",
        kind: "professional",
        category: "plumber",
        href: "/locations/a",
        distanceMeters: 800,
        available: true,
        trustLabels: ["Negocio registrado"],
      },
      {
        id: "near",
        name: "Cerca",
        kind: "professional",
        category: "electrician",
        href: "/locations/b",
        distanceMeters: 80,
        available: true,
        trustLabels: ["Negocio registrado", "Ubicación confirmada"],
      },
    ];
    const sorted = sortLocalServiceCards(cards);
    assert.equal(sorted[0]?.id, "near");
  });

  it("books a service with the existing Reservation Context", () => {
    const reservation = createReservationRecord({
      tenantId: "life-panoramica",
      createdBy: "person-alex",
      resourceId: "massage-1",
      date: "2026-09-06",
      start: "11:00",
      end: "12:00",
      contextType: "service",
      contextId: "massage-1",
      territoryId: TERRITORY,
    });
    assert.equal(reservation.contextType, "service");
    assert.equal(
      createReservationContext({ type: "service", id: "massage-1" }).type,
      "service",
    );
  });
});
