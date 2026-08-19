import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Authentication identity (Security Platform).
 * Separate from domain Person.
 * Source: public.identities + ADR-001
 *
 * Do not mix:
 * - **User** — technical login (Auth provider id / email).
 * - **Person** — human in the community (`persons`).
 * - **Membership** — Person + Tenant + Role.
 * - **Identity** — this record: User → Person (`provider_reference`).
 */
export interface Identity {
  id: DomainId;
  providerReference: string;
  personId: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
