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
  MobileScreen,
  OrganizerCard,
  ParticipantList,
  ParticipationStatus,
  ScreenBack,
} from "@life-community-os/ui";
import { canOpenExperienceConversation } from "@/lib/experience-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

export function ExperienceDetailScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const {
    theme,
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
  } = useTenant();
  const { getViewerState } = useExperienceParticipation();

  if (!isFeatureEnabled("experiences") || !isModuleEnabled("experiences")) {
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
        onAction={() => router.push("/discover")}
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
  const showConversation = canOpenExperienceConversation({
    experience,
    configuration,
    isModuleEnabled,
    hasCapability,
  });
  const capacityLabel =
    viewer === "full" || remaining <= 0
      ? `Completo · ${experience.capacity} plazas`
      : `${experience.participantCount} van · ${remaining} de ${experience.capacity} libres`;

  const goJoin = () => {
    if (!canJoin) return;
    if (viewer === "cancelled" || viewer === "expired") return;
    router.push(`/experiences/${experience.id}/join`);
  };

  return (
    <MobileScreen>
      <ScreenBack onClick={() => router.back()} />

      <ExperienceHero
        imageUrl={experience.imageUrl}
        title={experience.title}
        brandOverline={theme.logoText}
      />

      <div className="flex flex-wrap items-center gap-3">
        <ParticipationStatus status={viewer} />
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

      {showConversation ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/experiences/${experience.id}/conversation`)
          }
          className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
        >
          <span className="text-[22px]" aria-hidden>
            💬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
              Conversación
            </span>
            <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
              Coordina con quienes van a la actividad
            </span>
          </span>
          <span className="text-[var(--color-text-tertiary)]" aria-hidden>
            ›
          </span>
        </button>
      ) : null}

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

      {/* Clears sticky action bar so neighbours stay fully visible */}
      <div className="h-[132px] shrink-0" aria-hidden />

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-2.5 md:left-1/2 md:max-w-[960px] md:-translate-x-1/2 md:px-8">
        <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-app)]/95 p-3 shadow-[var(--shadow-elev-2)] backdrop-blur">
          <JoinButton status={viewer} canJoin={canJoin} onClick={goJoin} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" type="button">
              Guardar
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
              Compartir
            </Button>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}
