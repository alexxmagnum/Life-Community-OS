import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Authentication identity (Security Platform).
 * Separate from domain Person.
 * Source: public.identities + ADR-001
 */
export interface Identity {
  id: DomainId;
  providerReference: string;
  personId: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
