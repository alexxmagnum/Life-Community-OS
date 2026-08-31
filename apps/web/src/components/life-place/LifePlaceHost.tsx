"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LifePlaceAction, LifePlaceContext } from "@life-community-os/types";
import { fetchLifePlace } from "@/lib/life-place/life-place-client";
import { openActionComposer } from "@/lib/community/action-composer-client";
import { LifePlaceSheet } from "./LifePlaceSheet";

export type LifePlaceHostProps = {
  tenantId: string;
  locationId: string | null;
  territoryId?: string | null;
  onClose: () => void;
};

export function LifePlaceHost({
  tenantId,
  locationId,
  territoryId,
  onClose,
}: LifePlaceHostProps) {
  const router = useRouter();
  const [context, setContext] = useState<LifePlaceContext | null>(null);

  useEffect(() => {
    if (!locationId) {
      setContext(null);
      return;
    }
    let cancelled = false;
    void fetchLifePlace({ tenantId, locationId, territoryId }).then((data) => {
      if (!cancelled) setContext(data);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, locationId, territoryId]);

  if (!locationId || !context) return null;

  const onAction = (action: LifePlaceAction) => {
    if (action.kind === "contact") {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(action.href);
  };

  return (
    <LifePlaceSheet
      context={context}
      onAction={onAction}
      onClose={onClose}
      onCompose={() =>
        openActionComposer({
          locationId: context.location.id,
          locationName: context.location.name,
        })
      }
    />
  );
}
