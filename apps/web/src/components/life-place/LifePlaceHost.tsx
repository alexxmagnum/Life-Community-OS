"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LifePlaceAction, LifePlaceContext } from "@life-community-os/types";
import { fetchLifePlace } from "@/lib/life-place/life-place-client";
import {
  LIFE_PLACE_MEMBER_ACTION_KINDS,
  visitorConversionHref,
} from "@/lib/membership/visitor-experience";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
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
  const { currentUser } = useCurrentUser();
  const [context, setContext] = useState<LifePlaceContext | null>(null);
  const isVisitor = !currentUser.hasMembership;

  useEffect(() => {
    if (!locationId) {
      setContext(null);
      return;
    }
    let cancelled = false;
    setContext(null);
    void fetchLifePlace({ tenantId, locationId, territoryId }).then((data) => {
      if (!cancelled) setContext(data);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, locationId, territoryId]);

  if (!locationId) return null;

  const onAction = (action: LifePlaceAction) => {
    if (isVisitor && LIFE_PLACE_MEMBER_ACTION_KINDS.has(action.kind)) {
      router.push(visitorConversionHref(currentUser.authenticated));
      return;
    }
    if (action.kind === "contact") {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(action.href);
  };

  return (
    <div className="fixed inset-0 z-[45] flex items-end justify-center md:items-center">
      <button
        type="button"
        className="ui-fade ui-backdrop absolute inset-0"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md px-3 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
        {context ? (
          <LifePlaceSheet
            context={context}
            onAction={onAction}
            onClose={onClose}
            isVisitor={isVisitor}
            onExploreExperiences={() =>
              router.push(
                `/discover?place=${encodeURIComponent(context.location.id)}`,
              )
            }
            onJoin={() =>
              router.push(visitorConversionHref(currentUser.authenticated))
            }
          />
        ) : (
          <div
            className="ui-sheet overflow-hidden rounded-[20px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-2)]"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Cargando el lugar</span>
            <div className="h-28 animate-pulse rounded-[16px] bg-[var(--color-surface-muted)]" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          </div>
        )}
      </div>
    </div>
  );
}
