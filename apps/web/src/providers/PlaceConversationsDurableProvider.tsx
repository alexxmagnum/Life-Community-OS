"use client";

/**
 * Durable bridge for place / marketplace / experience conversations.
 * Pack helpers keep localStorage; this hydrates/pushes tenant-scoped JSON.
 */

import { useEffect, type ReactNode } from "react";
import {
  EXPERIENCE_CONVERSATIONS_STORAGE_KEY,
  GROUP_CONVERSATIONS_STORAGE_KEY,
  MARKETPLACE_CONVERSATIONS_STORAGE_KEY,
  NEIGHBOUR_CONVERSATIONS_STORAGE_KEY,
  OFFICIAL_CONVERSATIONS_STORAGE_KEY,
  PLACE_CONVERSATIONS_STORAGE_KEY,
  WORK_CONVERSATIONS_STORAGE_KEY,
  applyExperienceConversationStoreJson,
  applyGroupConversationStoreJson,
  applyMarketplaceConversationStoreJson,
  applyNeighbourConversationStoreJson,
  applyOfficialConversationStoreJson,
  applyPlaceConversationStoreJson,
  applyWorkConversationStoreJson,
  setExperienceConversationDurableSync,
  setGroupConversationDurableSync,
  setMarketplaceConversationDurableSync,
  setNeighbourConversationDurableSync,
  setOfficialConversationDurableSync,
  setPlaceConversationDurableSync,
  setWorkConversationDurableSync,
} from "@life-community-os/tenant-life-panoramica";
import {
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";
import { useTenant } from "@/providers/TenantProvider";

type Bridge = {
  durableKey: string;
  storageKey: string;
  setSync: (handler: ((json: string) => void) | null) => void;
  apply: (raw: string) => boolean;
  isBlob: (value: unknown) => boolean;
};

function hasConversationsAndMessages(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { conversations?: unknown; messages?: unknown };
  return Array.isArray(v.conversations) && Array.isArray(v.messages);
}

const BRIDGES: Bridge[] = [
  {
    durableKey: "place-conversations",
    storageKey: PLACE_CONVERSATIONS_STORAGE_KEY,
    setSync: setPlaceConversationDurableSync,
    apply: applyPlaceConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "marketplace-conversations",
    storageKey: MARKETPLACE_CONVERSATIONS_STORAGE_KEY,
    setSync: setMarketplaceConversationDurableSync,
    apply: applyMarketplaceConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "experience-conversations",
    storageKey: EXPERIENCE_CONVERSATIONS_STORAGE_KEY,
    setSync: setExperienceConversationDurableSync,
    apply: applyExperienceConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "group-conversations",
    storageKey: GROUP_CONVERSATIONS_STORAGE_KEY,
    setSync: setGroupConversationDurableSync,
    apply: applyGroupConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "neighbour-conversations",
    storageKey: NEIGHBOUR_CONVERSATIONS_STORAGE_KEY,
    setSync: setNeighbourConversationDurableSync,
    apply: applyNeighbourConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "official-conversations",
    storageKey: OFFICIAL_CONVERSATIONS_STORAGE_KEY,
    setSync: setOfficialConversationDurableSync,
    apply: applyOfficialConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
  {
    durableKey: "work-conversations",
    storageKey: WORK_CONVERSATIONS_STORAGE_KEY,
    setSync: setWorkConversationDurableSync,
    apply: applyWorkConversationStoreJson,
    isBlob: hasConversationsAndMessages,
  },
];

export function PlaceConversationsDurableProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantSlug } = useTenant();

  useEffect(() => {
    let cancelled = false;

    for (const bridge of BRIDGES) {
      bridge.setSync((storeJson) => {
        try {
          const parsed: unknown = JSON.parse(storeJson);
          if (!bridge.isBlob(parsed)) return;
          pushDurableState(bridge.durableKey, parsed, tenantSlug);
        } catch {
          /* ignore */
        }
      });
    }

    void (async () => {
      for (const bridge of BRIDGES) {
        const remote = await hydrateDurableState<unknown>(
          bridge.durableKey,
          tenantSlug,
        );
        if (cancelled) return;
        if (bridge.isBlob(remote)) {
          bridge.apply(JSON.stringify(remote));
          continue;
        }
        try {
          const local = window.localStorage.getItem(bridge.storageKey);
          if (!local) continue;
          const parsed: unknown = JSON.parse(local);
          if (bridge.isBlob(parsed)) {
            pushDurableState(bridge.durableKey, parsed, tenantSlug);
          }
        } catch {
          /* ignore */
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const bridge of BRIDGES) {
        bridge.setSync(null);
      }
    };
  }, [tenantSlug]);

  return children;
}
