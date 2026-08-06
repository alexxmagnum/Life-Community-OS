import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Stable human domain identity.
 * No tenant ownership. Not an auth account.
 * Source: public.persons + ADR-001
 */
export interface Person {
  id: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
