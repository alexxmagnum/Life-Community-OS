"use client";

/**
 * Thin durable bridge for place conversations.
 * Domain helpers stay in the tenant pack (localStorage); this hydrates/pushes
 * the same JSON blob via /api/durable/place-conversations (tenant-scoped).
 */

import { useEffect, type ReactNode } from "react";
import {
  PLACE_CONVERSATIONS_STORAGE_KEY,
  applyPlaceConversationStoreJson,
  setPlaceConversationDurableSync,
} from "@life-community-os/tenant-life-panoramica";
import {
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";
import { useTenant } from "@/providers/TenantProvider";

const DURABLE_KEY = "place-conversations";

type PlaceConversationStoreBlob = {
  conversations: unknown[];
  messages: unknown[];
  authors: Record<string, unknown>;
  participantsByPlace: Record<string, unknown>;
};

function isStoreBlob(value: unknown): value is PlaceConversationStoreBlob {
  if (!value || typeof value !== "object") return false;
  const v = value as PlaceConversationStoreBlob;
  return (
    Array.isArray(v.conversations) &&
    Array.isArray(v.messages) &&
    typeof v.authors === "object" &&
    v.authors !== null &&
    typeof v.participantsByPlace === "object" &&
    v.participantsByPlace !== null
  );
}

export function PlaceConversationsDurableProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantSlug } = useTenant();

  useEffect(() => {
    let cancelled = false;

    setPlaceConversationDurableSync((storeJson) => {
      try {
        const parsed: unknown = JSON.parse(storeJson);
        if (!isStoreBlob(parsed)) return;
        pushDurableState(DURABLE_KEY, parsed, tenantSlug);
      } catch {
        /* ignore malformed sync payloads */
      }
    });

    void (async () => {
      const remote = await hydrateDurableState<unknown>(
        DURABLE_KEY,
        tenantSlug,
      );
      if (cancelled) return;

      if (isStoreBlob(remote)) {
        applyPlaceConversationStoreJson(JSON.stringify(remote));
        return;
      }

      try {
        const local = window.localStorage.getItem(
          PLACE_CONVERSATIONS_STORAGE_KEY,
        );
        if (!local) return;
        const parsed: unknown = JSON.parse(local);
        if (isStoreBlob(parsed)) {
          pushDurableState(DURABLE_KEY, parsed, tenantSlug);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      setPlaceConversationDurableSync(null);
    };
  }, [tenantSlug]);

  return children;
}
