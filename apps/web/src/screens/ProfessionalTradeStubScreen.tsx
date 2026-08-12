"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getProfessionalTradeById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";

/**
 * Minimal trade stub — navigation target from Professionals hub pads.
 * Does NOT implement SCENE, listings, or full category page (future phase).
 */
export function ProfessionalTradeStubScreen({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const trade = useMemo(() => getProfessionalTradeById(tradeId), [tradeId]);

  if (!trade) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Profesionales"
          onBack={() => router.push("/services/professionals")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Categoría no encontrada"
          description="Esta profesión no forma parte de tu comunidad."
          actionLabel="Ver profesionales"
          onAction={() => router.push("/services/professionals")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={trade.label}
        subtitle={trade.description}
        onBack={() => router.push("/services/professionals")}
        onExit={() => router.push("/")}
      />
      <EmptyState
        title={`Pronto: ${trade.label}`}
        description="Estamos preparando esta categoría. Mientras tanto, vuelve al hub de profesionales."
        actionLabel="Volver a profesionales"
        onAction={() => router.push("/services/professionals")}
      />
    </MobileScreen>
  );
}
