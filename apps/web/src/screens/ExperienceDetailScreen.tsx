"use client";

import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  getExperienceById,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  ExperienceHero,
  ExperienceMeta,
  JoinButton,
  OrganizerCard,
  ParticipantList,
  ParticipationStatus,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

export function ExperienceDetailScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las actividades no están disponibles"
        description="Esta comunidad aún no ha activado las actividades."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  const experience = getExperienceById(experienceId);

  if (!experience) {
    return (
      <EmptyState
        title="Actividad no encontrada"
        description="Puede haberse eliminado o el enlace no es válido."
        actionLabel="Ver actividades"
        onAction={() => router.push("/discover?segment=experiences")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="No puedes ver esta actividad ahora mismo."
      />
    );
  }

  const viewer = getViewerState(experience);
  const remaining = spotsLeft(experience);
  const canJoin = hasCapability(CAPABILITIES.experienceJoin);
  const capacityLabel =
    viewer === "full" || remaining <= 0
      ? `Full · ${experience.capacity} spots`
      : `${experience.participantCount} going · ${remaining} of ${experience.capacity} left`;

  const goJoin = () => {
    if (!canJoin) return;
    if (viewer === "joined") {
      router.push(`/experiences/${experience.id}/join`);
      return;
    }
    if (viewer === "cancelled" || viewer === "expired") return;
    router.push(`/experiences/${experience.id}/join`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Back
      </button>

      <ExperienceHero
        imageUrl={experience.imageUrl}
        title={experience.title}
        brandOverline={theme.logoText}
      />

      <div className="flex flex-wrap items-center gap-3">
        <ParticipationStatus status={viewer} />
        {hasCapability(CAPABILITIES.experienceManage) ? (
          <span className="text-[13px] font-semibold text-[var(--color-text-tertiary)]">
            Manage available
          </span>
        ) : null}
      </div>

      <p className="text-[17px] leading-7 text-[var(--color-text-secondary)]">
        {experience.description}
      </p>

      <ExperienceMeta
        when={formatExperienceWhen(experience.startsAt)}
        location={experience.location}
        areaLabel={experience.areaLabel}
        capacityLabel={capacityLabel}
      />

      <OrganizerCard
        name={experience.organizer.name}
        roleLabel={experience.organizer.roleLabel}
        avatarUrl={experience.organizer.avatarUrl}
      />

      <ParticipantList
        participants={experience.participants}
        totalCount={
          viewer === "joined"
            ? experience.participantCount + 1
            : experience.participantCount
        }
      />

      <div className="sticky bottom-[88px] z-20 space-y-3 rounded-[var(--radius-xl)] bg-[var(--color-surface-app)]/95 p-3 backdrop-blur md:static md:bg-transparent md:p-0 md:backdrop-blur-none">
        <JoinButton
          status={viewer}
          canJoin={canJoin}
          onClick={goJoin}
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" type="button">
            Save
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            type="button"
            onClick={async () => {
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({
                    title: experience.title,
                    text: experience.description,
                    url: window.location.href,
                  });
                } catch {
                  /* user cancelled */
                }
              }
            }}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
