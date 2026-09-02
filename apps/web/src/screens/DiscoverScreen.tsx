"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  discoverQueryFromActive,
  sortLocalServiceCards,
  businessToLocalServiceCard,
  isProfessionalBusiness,
} from "@life-community-os/types";
import {
  CommunityLifeSection,
  EmptyState,
  FlowScreenHeader,
  LocalLifeRail,
  LocalPlaceCard,
  MobileScreen,
  ScreenSearch,
} from "@life-community-os/ui";
import { useTenantLocations } from "@/lib/location";
import { fetchBusinesses } from "@/lib/business/business-client";
import { PLACE_EMPTY_GLYPH } from "@/lib/community/composer-glyphs";
import { locationCardImageUrl } from "@/lib/location/location-card-asset";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import type { BusinessProfile } from "@life-community-os/types";
import { useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTerritory } from "@/providers/TerritoryProvider";
import {
  VISITOR_JOIN_HEADLINE,
  visitorConversionHref,
  visitorConversionLabel,
} from "@/lib/membership/visitor-experience";

/**
 * Descubrir = explore the territory.
 * Places, POI and local businesses as context — not Community or Services workflows.
 */
export function DiscoverScreen() {
  const router = useRouter();
  const { isFeatureEnabled, configuration, authenticated, hasMembership } = useTenant();
  const { sessionReady } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();
  const discoverQuery = discoverQueryFromActive(activeTerritory);
  const { allLocations } = useTenantLocations(
    configuration.tenantId,
    discoverQuery.territoryId,
  );
  const [query, setQuery] = useState("");
  const [localBusinesses, setLocalBusinesses] = useState<BusinessProfile[]>([]);
  const [placeLocationId, setPlaceLocationId] = useState<string | null>(null);

  const canBrowsePublicTerritory = isFeatureEnabled("localLife");
  const isVisitor = !hasMembership;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!canBrowsePublicTerritory || !sessionReady) {
        if (!cancelled) setLocalBusinesses([]);
        return;
      }
      const rows = await fetchBusinesses({
        tenantId: configuration.tenantId,
        territoryId: discoverQuery.territoryId,
        status: "published",
      });
      if (cancelled) return;
      const q = query.trim().toLowerCase();
      const filtered = rows.filter((item) => {
        if (isProfessionalBusiness(item)) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });
      const ordered = sortLocalServiceCards(
        filtered.map((item) => businessToLocalServiceCard(item)),
      );
      setLocalBusinesses(
        ordered
          .map((card) => filtered.find((item) => item.id === card.id))
          .filter((item): item is BusinessProfile => Boolean(item)),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [
    canBrowsePublicTerritory,
    sessionReady,
    configuration.tenantId,
    query,
    discoverQuery.territoryId,
  ]);

  const nearYou = useMemo(() => {
    if (!canBrowsePublicTerritory) return [];
    const q = query.trim().toLowerCase();
    return allLocations
      .filter((loc) => {
        if (loc.visibility === "private") return false;
        if (!q) return true;
        return (
          loc.name.toLowerCase().includes(q) ||
          (loc.areaLabel ?? "").toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 12)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        categoryLabel: loc.category,
        areaLabel: loc.areaLabel ?? configuration.branding.name,
        story: loc.summary ?? "",
        imageUrl:
          loc.imageUrl?.trim() ||
          locationCardImageUrl({
            category: loc.category,
            type: loc.type,
            imageUrl: loc.imageUrl,
          }),
        recommendedBy: undefined as string | undefined,
        verified: true,
        trustNote: undefined as string | undefined,
      }));
  }, [canBrowsePublicTerritory, query, allLocations, configuration.branding.name]);

  const hasAnything = nearYou.length > 0 || localBusinesses.length > 0;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Descubrir"
        subtitle="Explora el territorio: lugares, instalaciones y puntos de interés."
        onBack={() => router.push("/")}
        onExit={() => router.push("/map")}
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar lugares, instalaciones, comercios…"
        label="Buscar"
      />

      {!hasAnything ? (
        <EmptyState
          title={query ? "Sin resultados" : "Explora el territorio"}
          description={
            query
              ? "Prueba con otras palabras."
              : "Aún no hay lugares publicados cerca. Abre el mapa para orientarte."
          }
          imageUrl={query ? undefined : PLACE_EMPTY_GLYPH}
          actionLabel={query ? "Limpiar búsqueda" : "Ver el mapa"}
          onAction={
            query ? () => setQuery("") : () => router.push("/map")
          }
        />
      ) : (
        <div className="space-y-10">
          {nearYou.length > 0 ? (
            <CommunityLifeSection
              title="Lugares"
              subtitle="Contexto del territorio: abre cada lugar para ver qué ocurre."
            >
              <LocalLifeRail>
                {nearYou.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    blurb={place.story}
                    imageUrl={place.imageUrl ?? ""}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                    onClick={() => {
                      if (place.id) setPlaceLocationId(place.id);
                    }}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}

          {localBusinesses.length > 0 ? (
            <CommunityLifeSection
              title="Comercios del territorio"
              subtitle="Negocios locales como contexto — no un directorio de servicios."
            >
              <LocalLifeRail>
                {localBusinesses.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.category}
                    areaLabel={configuration.branding.name}
                    blurb={place.description}
                    imageUrl={place.imageUrl ?? ""}
                    onClick={() => setPlaceLocationId(place.locationId)}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}

          {isVisitor ? (
            <section className="rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[var(--shadow-elev-1)]">
              <p className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
                {VISITOR_JOIN_HEADLINE}
              </p>
              <p className="mt-2 text-[14px] leading-snug text-[var(--color-text-secondary)]">
                Crea tu cuenta para participar en experiencias, reservar y crear
                acciones útiles en el territorio.
              </p>
              <button
                type="button"
                onClick={() => router.push(visitorConversionHref(authenticated))}
                className="ui-press mt-4 min-h-[44px] rounded-full bg-[var(--color-action-primary)] px-5 text-[14px] font-semibold text-[var(--color-text-on-action)]"
              >
                {visitorConversionLabel(authenticated)}
              </button>
            </section>
          ) : null}
        </div>
      )}

      <LifePlaceHost
        tenantId={configuration.tenantId}
        locationId={placeLocationId}
        territoryId={activeTerritory.territoryId}
        onClose={() => setPlaceLocationId(null)}
      />
    </MobileScreen>
  );
}
