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
import type { CommunityFeedItem, TerritoryAnnouncement } from "@life-community-os/types";
import { COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE } from "@life-community-os/types";
import { fetchCommunityHome } from "@/lib/community/community-client";
import { fetchTerritoryAnnouncements } from "@/lib/community/community-operations-client";
import {
  ANNOUNCEMENT_EMPTY_GLYPH,
  GROUP_EMPTY_GLYPH,
  HELP_EMPTY_GLYPH,
} from "@/lib/community/composer-glyphs";
import {
  COMMUNITY_PREVIEW_EMPTY_DESCRIPTION,
  COMMUNITY_PREVIEW_EMPTY_TITLE,
  COMMUNITY_PREVIEW_GROUPS_DESCRIPTION,
  COMMUNITY_PREVIEW_GROUPS_TITLE,
  COMMUNITY_PREVIEW_HELP_DESCRIPTION,
  COMMUNITY_PREVIEW_HELP_TITLE,
  COMMUNITY_PREVIEW_JOIN_LABEL,
  visitorConversionHref,
} from "@/lib/membership/visitor-experience";
import { useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

export type CommunityPreviewPanelProps = {
  membershipHint: "pending" | "registered" | "visitor";
};

export function CommunityPreviewPanel({ membershipHint }: CommunityPreviewPanelProps) {
  const router = useRouter();
  const { configuration, authenticated } = useTenant();
  const { context: territory } = useTerritory();
  const [moments, setMoments] = useState<CommunityFeedItem[]>([]);
  const [announcements, setAnnouncements] = useState<TerritoryAnnouncement[]>([]);
  const [places, setPlaces] = useState<
    Array<{ id: string; name: string; href: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    const territoryId = territory.territoryId;
    void fetchCommunityHome({
      tenantId: configuration.tenantId,
      territoryId,
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
    if (territoryId) {
      void fetchTerritoryAnnouncements({
        tenantId: configuration.tenantId,
        territoryId,
      }).then((rows) => {
        if (!cancelled) setAnnouncements(rows.slice(0, 6));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, territory.territoryId]);

  const hasPublicContent =
    announcements.length > 0 || moments.length > 0 || places.length > 0;

  const joinHref =
    membershipHint === "registered" || authenticated
      ? visitorConversionHref(authenticated)
      : "/register";

  return (
    <div className="space-y-5 pb-8">
      {!hasPublicContent ? (
        <EmptyState
          title={COMMUNITY_PREVIEW_EMPTY_TITLE}
          description={COMMUNITY_PREVIEW_EMPTY_DESCRIPTION}
          imageUrl={GROUP_EMPTY_GLYPH}
          actionLabel={COMMUNITY_PREVIEW_JOIN_LABEL}
          onAction={() => router.push(joinHref)}
        />
      ) : (
        <section className="rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[var(--shadow-elev-1)]">
          <p className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
            {COMMUNITY_PREVIEW_EMPTY_TITLE}
          </p>
          <p className="mt-2 text-[14px] leading-snug text-[var(--color-text-secondary)]">
            {COMMUNITY_PREVIEW_EMPTY_DESCRIPTION}
          </p>
          <button
            type="button"
            onClick={() => router.push(joinHref)}
            className="ui-press mt-4 min-h-[44px] rounded-full bg-[var(--color-action-primary)] px-5 text-[14px] font-semibold text-[var(--color-text-on-action)]"
          >
            {COMMUNITY_PREVIEW_JOIN_LABEL}
          </button>
        </section>
      )}

      {announcements.length > 0 ? (
        <HomeSection title={COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE}>
          <div className="space-y-2">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-3 text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Aviso público
                </p>
                <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                {item.body ? (
                  <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
                    {item.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </HomeSection>
      ) : (
        <EmptyState
          title="Avisos públicos"
          description="Los avisos oficiales del territorio aparecerán aquí."
          imageUrl={ANNOUNCEMENT_EMPTY_GLYPH}
          className="py-8"
        />
      )}

      {moments.length > 0 ? (
        <HomeSection title="Actividades públicas">
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

      <HomeSection title={COMMUNITY_PREVIEW_GROUPS_TITLE}>
        <EmptyState
          title={COMMUNITY_PREVIEW_GROUPS_TITLE}
          description={COMMUNITY_PREVIEW_GROUPS_DESCRIPTION}
          imageUrl={GROUP_EMPTY_GLYPH}
          className="py-8"
        />
      </HomeSection>

      <HomeSection title={COMMUNITY_PREVIEW_HELP_TITLE}>
        <EmptyState
          title={COMMUNITY_PREVIEW_HELP_TITLE}
          description={COMMUNITY_PREVIEW_HELP_DESCRIPTION}
          imageUrl={HELP_EMPTY_GLYPH}
          className="py-8"
        />
      </HomeSection>

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
