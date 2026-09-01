"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  ExploreLink,
  HomeSection,
  HubRail,
  HubRailCard,
} from "@life-community-os/ui";
import type { CommunityFeedItem } from "@life-community-os/types";
import { fetchCommunityHome } from "@/lib/community/community-client";
import { useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

export type CommunityPreviewPanelProps = {
  membershipHint: "pending" | "registered" | "visitor";
};

export function CommunityPreviewPanel({ membershipHint }: CommunityPreviewPanelProps) {
  const router = useRouter();
  const { configuration } = useTenant();
  const { context: territory } = useTerritory();
  const [moments, setMoments] = useState<CommunityFeedItem[]>([]);
  const [places, setPlaces] = useState<
    Array<{ id: string; name: string; href: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    void fetchCommunityHome({
      tenantId: configuration.tenantId,
      territoryId: territory.territoryId,
    }).then((home) => {
      if (cancelled || !home) return;
      setMoments([...home.moments, ...home.upcomingActivities].slice(0, 6));
      setPlaces(
        (home.places ?? []).slice(0, 6).map((place) => ({
          id: place.id,
          name: place.name,
          href: place.href,
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, territory.territoryId]);

  const description =
    membershipHint === "pending"
      ? "Tu solicitud está en revisión. Mientras tanto, esto es lo público del territorio."
      : membershipHint === "registered"
        ? "Únete a la comunidad para participar en conversaciones y experiencias privadas."
        : "Vista previa del territorio. Regístrate para participar.";

  return (
    <div className="space-y-5 pb-8">
      <EmptyState
        title="Vista previa de la comunidad"
        description={description}
        actionLabel={
          membershipHint === "registered" ? "Unirme a la comunidad" : "Explorar territorio"
        }
        onAction={() =>
          membershipHint === "registered"
            ? router.push("/me")
            : router.push("/discover")
        }
      />

      {moments.length > 0 ? (
        <HomeSection title="Próximos momentos públicos">
          <HubRail>
            {moments.map((item) => (
              <HubRailCard
                key={item.id}
                title={item.title}
                meta={item.description ?? "Experiencia en el territorio"}
                onClick={() => router.push(item.metadata?.href ?? "/discover")}
              />
            ))}
          </HubRail>
        </HomeSection>
      ) : null}

      {places.length > 0 ? (
        <HomeSection title="Lugares del territorio">
          <div className="space-y-2">
            {places.map((place) => (
              <ExploreLink
                key={place.id}
                label={place.name}
                hint="Lugar público"
                onClick={() => router.push(place.href)}
              />
            ))}
          </div>
        </HomeSection>
      ) : null}

      <ExploreLink
        label="Descubrir más"
        hint="Lugares, experiencias y servicios cercanos"
        onClick={() => router.push("/discover")}
      />
    </div>
  );
}
