/**
 * Foundation domain type placeholders.
 * No business logic. Shapes only.
 */

export type DomainId = string;

export interface Tenant {
  id: DomainId;
}
