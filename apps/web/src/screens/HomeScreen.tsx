"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_HOME_FEED_CATEGORY_LABELS,
  HOME_FEED_FILTER_ORDER,
  placeHomeSponsor,
  type HomeFeedCategoryFilter,
} from "@life-community-os/types";
import {
  currentMember,
  formatHomeFeedWhen,
  getHomeSponsorSlot,
  listHomeFeedFiltered,
} from "@life-community-os/tenant-life-panoramica";
import {
  CategoryFilterSelect,
  ContentBlock,
  HomeFeedCard,
  HomeFeedSection,
  SponsoredFeedCard,
  TerritoryHero,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

function greetingFor(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${name}`;
  if (hour < 18) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled } = useTenant();
  const [category, setCategory] =
    useState<HomeFeedCategoryFilter>("all");

  const brandName = theme.logoText;
  const territoryName =
    theme.identity?.territoryName ?? theme.logoText;
  const areaLabel =
    currentMember.areaLabel ||
    theme.identity?.defaultAreaName ||
    theme.logoText;
  const homeCallout =
    theme.identity?.homeCallout ?? "Qué pasa hoy cerca de ti";
  const feedTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );

  const feedFeatures = useMemo(
    () => ({
      feed: isFeatureEnabled("feed"),
      experiences: isFeatureEnabled("experiences"),
      marketplace: isFeatureEnabled("marketplace"),
      recommendations: isFeatureEnabled("recommendations"),
      localLife: isFeatureEnabled("localLife"),
    }),
    [isFeatureEnabled],
  );

  const feedItems = useMemo(
    () => listHomeFeedFiltered(category, { features: feedFeatures }),
    [category, feedFeatures],
  );

  const sponsor = useMemo(() => getHomeSponsorSlot(), []);

  const timeline = useMemo(() => {
    type FeedItem = (typeof feedItems)[number];
    type TimelineEntry =
      | { kind: "item"; item: FeedItem }
      | {
          kind: "sponsor";
          sponsor: NonNullable<typeof sponsor> & {
            id: string;
            kind: "sponsor";
          };
        };

    if (category !== "all") {
      return feedItems.map(
        (item): TimelineEntry => ({ kind: "item", item }),
      );
    }

    const placed = placeHomeSponsor(
      feedItems,
      sponsor ? { ...sponsor, id: "home-sponsor" } : null,
    );

    return placed.map((entry): TimelineEntry => {
      if ("kind" in entry && entry.kind === "sponsor") {
        return { kind: "sponsor", sponsor: entry };
      }
      return { kind: "item", item: entry as FeedItem };
    });
  }, [category, feedItems, sponsor]);

  const filterOptions = HOME_FEED_FILTER_ORDER.map((value) => ({
    value,
    label: DEFAULT_HOME_FEED_CATEGORY_LABELS[value],
  }));

  return (
    <div className="-mx-4 -mt-3 md:-mx-8 md:-mt-8">
      <TerritoryHero
        brandName={brandName}
        greeting={greetingFor(currentMember.displayName)}
        callout={homeCallout}
        areaLabel={areaLabel}
        imageUrl={theme.imagery.homeHero}
      />

      <ContentBlock className="space-y-6 pt-6 pb-4">
        <HomeFeedSection
          title={feedTitle}
          filter={
            <CategoryFilterSelect
              label="Filtrar por categoría"
              value={category}
              options={filterOptions}
              onChange={(value) =>
                setCategory(value as HomeFeedCategoryFilter)
              }
            />
          }
          emptyLabel={
            timeline.length === 0
              ? "Hoy todavía no hay novedades en esta categoría."
              : undefined
          }
        >
          {timeline.map((entry) => {
            if (entry.kind === "sponsor") {
              const s = entry.sponsor;
              return (
                <SponsoredFeedCard
                  key={s.id}
                  badgeLabel={s.badgeLabel}
                  title={s.title}
                  authorName={s.authorName}
                  imageUrl={s.imageUrl}
                  onClick={
                    s.href ? () => router.push(s.href!) : undefined
                  }
                />
              );
            }

            const item = entry.item;
            return (
              <HomeFeedCard
                key={item.id}
                categoryLabel={item.categoryLabel}
                title={item.title}
                authorName={item.authorName}
                authorAvatarUrl={item.authorAvatarUrl}
                timeLabel={formatHomeFeedWhen(item.publishedAt)}
                imageUrl={item.imageUrl}
                onClick={
                  item.href ? () => router.push(item.href!) : undefined
                }
              />
            );
          })}
        </HomeFeedSection>
      </ContentBlock>
    </div>
  );
}
