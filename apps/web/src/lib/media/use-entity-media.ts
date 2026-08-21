"use client";

import { useEffect, useState } from "react";
import type { MediaEntityType } from "@life-community-os/types";
import {
  coverUrlFromItems,
  fetchEntityMedia,
  type EntityMediaItem,
} from "./media-client";

export function useEntityMedia(
  entityType: MediaEntityType,
  entityId?: string | null,
) {
  const [items, setItems] = useState<EntityMediaItem[]>([]);

  useEffect(() => {
    if (!entityId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    void fetchEntityMedia({ entityType, entityId }).then((rows) => {
      if (!cancelled) setItems(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  return {
    items,
    coverUrl: coverUrlFromItems(items),
    urls: items.map((item) => item.url),
  };
}

export function useEntityMediaIndex(entityType: MediaEntityType) {
  const [byId, setById] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void fetchEntityMedia({ entityType }).then((rows) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const item of rows) {
        const current = next[item.reference.entityId];
        if (!current || item.reference.purpose === "cover") {
          next[item.reference.entityId] = item.url;
        }
      }
      setById(next);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType]);

  return byId;
}
