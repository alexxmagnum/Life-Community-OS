import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Real-estate unit located at an Address (ADR-007).
 * Does not own Person — use PropertyPersonRelationship (ADR-008).
 */
export type Property = {
  id: DomainId;
  addressId: DomainId;
  /** Display code / unit label, e.g. "14B". */
  unitLabel?: string;
  name?: string;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};
