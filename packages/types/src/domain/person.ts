import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Stable human domain identity (ADR-010).
 * No tenant ownership. Not an auth account (that is User / Identity).
 * Source: public.persons + ADR-001
 *
 * Community access is Membership (person + tenant + role), never Person alone.
 *
 * Do not attach durable Community Area permission lists here (ADR-037).
 */
export interface Person {
  id: DomainId;
  displayName?: string | null;
  email?: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
