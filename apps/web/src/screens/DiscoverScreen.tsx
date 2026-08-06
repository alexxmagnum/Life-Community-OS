"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  experiences,
  places,
  recommendations,
  services,
} from "@life-community-os/tenant-life-panoramica";
import {
  DiscoveryCard,
  EmptyState,
  ExperienceCard,
  RecommendationCard,
  ResourceCard,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { cn } from "@life-community-os/ui";

type Segment = "experiences" | "services" | "places";

export function DiscoverScreen() {
  const searchParams = useSearchParams();
  const { isFeatureEnabled } = useTenant();
  const initial = (searchParams.get("segment") as Segment | null) ?? "experiences";
  const [segment, setSegment] = useState<Segment>(
    initial === "places" || initial === "services" ? initial : "experiences",
  );
  const [query, setQuery] = useState("");

  const segments = useMemo(() => {
    const list: { id: Segment; label: string }[] = [];
    if (isFeatureEnabled("experiences")) {
      list.push({ id: "experiences", label: "Experiences" });
    }
    if (isFeatureEnabled("services")) {
      list.push({ id: "services", label: "Services" });
    }
    if (isFeatureEnabled("resources")) {
      list.push({ id: "places", label: "Places" });
    }
    return list;
  }, [isFeatureEnabled]);

  const active = segments.some((s) => s.id === segment)
    ? segment
    : segments[0]?.id;

  if (!active) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        description="This community hasn’t enabled discovery features."
      />
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
        Discover
      </h1>

      <label className="block">
        <span className="sr-only">Search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search experiences, services, places"
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none ring-[var(--color-action-primary)] focus:ring-2"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSegment(s.id)}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 text-[14px] font-semibold",
              active === s.id
                ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto text-[13px]">
        {["Area", "This week", "Outdoors"].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 font-semibold text-[var(--color-text-secondary)]"
          >
            {chip}
          </span>
        ))}
      </div>

      {active === "experiences" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {experiences
            .filter((e) =>
              query
                ? e.title.toLowerCase().includes(query.toLowerCase())
                : true,
            )
            .map((exp) => (
              <ExperienceCard
                key={exp.id}
                title={exp.title}
                when={exp.when}
                where={exp.where}
                meta={exp.meta}
                imageUrl={exp.imageUrl}
                ctaLabel={exp.cta}
                onCta={() => undefined}
              />
            ))}
        </div>
      ) : null}

      {active === "services" ? (
        <div className="space-y-5">
          {isFeatureEnabled("recommendations") ? (
            <div>
              <p className="mb-3 text-[16px] font-semibold">
                Neighbours recommend
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recommendations.map((tip) => (
                  <RecommendationCard
                    key={tip.id}
                    quote={tip.quote}
                    author={tip.author}
                    imageUrl={tip.imageUrl}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {services.map((service) => (
              <DiscoveryCard
                key={service.id}
                title={service.name}
                subtitle={service.category}
                imageUrl={service.imageUrl}
                badge={service.verified ? "Listed" : undefined}
              />
            ))}
          </div>
        </div>
      ) : null}

      {active === "places" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <ResourceCard
              key={place.id}
              name={place.name}
              availability={place.availability}
              area={place.area}
              imageUrl={place.imageUrl}
              onReserve={() => undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
