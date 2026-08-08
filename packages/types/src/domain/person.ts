import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Stable human domain identity (ADR-010).
 * No tenant ownership. Not an auth account.
 * Source: public.persons + ADR-001
 *
 * Do not attach durable Community Area permission lists here (ADR-037).
 */
export interface Person {
  id: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
