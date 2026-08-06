/**
 * Responsibility markers — documentation as types.
 * Prevents conflating Security Platform concerns with Tenant Isolation.
 */

/** Who is performing this action? — Security Platform */
export type ActingIdentityId = string;

/** Authentication verifies Identity — Security Platform */
export type AuthenticationResult = {
  identityId: ActingIdentityId;
  verified: true;
};

/**
 * Authorization decides whether an action is allowed
 * within an already-resolved Tenant Context — Security Platform.
 * This type is a contract placeholder only.
 */
export type AuthorizationDecision = {
  allowed: boolean;
  reason?: string;
};
