"use client";

import {
  announcement,
  currentMember,
  formatExperienceTime,
  formatExperienceWhen,
  listDiscoverableExperiences,
  recommendations,
} from "@life-community-os/tenant-life-panoramica";
import {
  AnnouncementCard,
  ExperienceCard,
  QuickAction,
  RecommendationCard,
  SectionHeader,
} from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen() {
  const { theme, isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const router = useRouter();
  const hello = `${greeting()}, ${currentMember.displayName}`;
  const featured = listDiscoverableExperiences().slice(0, 2);

  const pulse = [
    ...joinedExperiences.slice(0, 2).map((exp) => ({
      id: exp.id,
      time: formatExperienceTime(exp.startsAt),
      title: exp.title,
      place: exp.location,
      href: `/experiences/${exp.id}`,
    })),
    ...featured
      .filter((e) => !joinedExperiences.some((j) => j.id === e.id))
      .slice(0, 3)
      .map((exp) => ({
        id: exp.id,
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        place: exp.areaLabel,
        href: `/experiences/${exp.id}`,
      })),
  ].slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[13px] font-semibold text-[var(--color-action-primary)] shadow-[var(--shadow-elev-1)]"
        >
          All Panoramica ▾
        </button>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-lg shadow-[var(--shadow-elev-1)]"
          aria-label="Notifications"
          onClick={() => router.push("/me")}
        >
          🔔
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-action-accent)]" />
        </button>
      </header>

      <section className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-elev-1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.imagery.homeHero}
          alt=""
          className="aspect-[5/4] w-full object-cover md:aspect-[21/9]"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-5 md:p-8"
          style={{
            background:
              "linear-gradient(transparent 30%, var(--color-hero-scrim))",
          }}
        >
          <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-inverse)]/90">
            {theme.logoText}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-[34px] font-semibold leading-10 text-[var(--color-text-inverse)] md:text-[40px]">
            {hello}
          </h1>
          <p className="mt-2 text-[16px] text-[var(--color-text-inverse)]/90">
            {joinedExperiences.length > 0
              ? `${joinedExperiences.length} upcoming for you`
              : "Discover something nearby this week"}
          </p>
        </div>
      </section>

      <section className="flex gap-3">
        {isFeatureEnabled("resources") ? (
          <QuickAction
            icon="▣"
            label="Reserve"
            onClick={() => router.push("/resources")}
          />
        ) : null}
        {isFeatureEnabled("incidents") ? (
          <QuickAction
            icon="📷"
            label="Report"
            onClick={() => router.push("/report")}
          />
        ) : null}
        {isFeatureEnabled("experiences") ? (
          <QuickAction
            icon="◎"
            label="Join"
            onClick={() => router.push("/discover?segment=experiences")}
          />
        ) : null}
      </section>

      <section>
        <SectionHeader title="Happening now" />
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {pulse.map((item) => (
            <button
              key={item.id}
              type="button"
              className="min-w-[148px] rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3 text-left shadow-[var(--shadow-elev-1)]"
              onClick={() => router.push(item.href)}
            >
              <p className="text-[13px] font-semibold text-[var(--color-action-primary)]">
                {item.time}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                {item.title}
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
                {item.place}
              </p>
            </button>
          ))}
        </div>
      </section>

      {isFeatureEnabled("feed") ? (
        <section>
          <SectionHeader title="From the community" />
          <AnnouncementCard
            title={announcement.title}
            preview={announcement.preview}
            area={announcement.area}
            imageUrl={announcement.imageUrl}
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="For you"
          action={
            <button
              type="button"
              className="text-[14px] font-semibold text-[var(--color-action-primary)]"
              onClick={() => router.push("/discover?segment=experiences")}
            >
              See more
            </button>
          }
        />
        {isFeatureEnabled("experiences")
          ? featured.map((exp) => (
              <ExperienceCard
                key={exp.id}
                title={exp.title}
                when={formatExperienceWhen(exp.startsAt)}
                where={exp.location}
                meta={`${exp.participantCount} going`}
                imageUrl={exp.imageUrl}
                organizerName={exp.organizer.name}
                ctaLabel="View & join"
                onClick={() => router.push(`/experiences/${exp.id}`)}
                onCta={() => router.push(`/experiences/${exp.id}`)}
              />
            ))
          : null}
        {isFeatureEnabled("recommendations")
          ? recommendations.map((tip) => (
              <RecommendationCard
                key={tip.id}
                quote={tip.quote}
                author={tip.author}
                imageUrl={tip.imageUrl}
                className="w-full min-w-0"
              />
            ))
          : null}
      </section>
    </div>
  );
}
