/**
 * Auth package — Security Platform boundary.
 *
 * Responsibilities (ADR-001 / ADR-002):
 * - Identity: who is acting
 * - Authentication: verify identity
 *
 * Non-responsibilities:
 * - Tenant Context resolution / isolation (platform + data enforcement)
 * - Authorization decisions (Security Platform authz module — not here yet)
 * - Membership belonging (Domain)
 *
 * Authentication flows are intentionally not implemented yet.
 */

export type { ActingIdentityId, AuthenticationResult } from "@life-community-os/types";
