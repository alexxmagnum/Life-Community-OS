"use client";

/**
 * Conversations persist in Communication Core (Postgres / fixture).
 * Durable + localStorage are no longer the runtime source of truth.
 */

import type { ReactNode } from "react";

export function PlaceConversationsDurableProvider({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
