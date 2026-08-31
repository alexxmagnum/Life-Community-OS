"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
} from "@life-community-os/tenant-life-panoramica";
import { spotsLeft } from "@life-community-os/types";
import {
  Button,
  EmptyState,
  ExperienceHero,
  ExperienceMeta,
  FlowScreenHeader,
  JoinButton,
  LoadingState,
  MobileScreen,
  OrganizerCard,
  ParticipantList,
  ParticipationStatus,
} from "@life-community-os/ui";
import { canOpenExperienceConversation } from "@/lib/experience-conversation-access";
import { useTenantLocations } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";
import { CommunityParticipationBar } from "@/components/community/CommunityParticipationBar";
import { fetchParticipationContext } from "@/lib/community/participation-client";
import type { CommunityParticipationContext } from "@life-community-os/types";
import { occupyingParticipationCount } from "@life-community-os/types";
import { fetchPublicTrustLabels } from "@/lib/trust/trust-client";

export function ExperienceDetailScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const { configuration, isFeatureEnabled, isModuleEnabled, hasCapability, tenantSlug } =
    useTenant();
  const { getExperience, ready } = useReservations();
  const { allLocations } = useTenantLocations(configuration.tenantId);
  const { getViewerState, isSaved, toggleSave } = useExperienceParticipation();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [loop, setLoop] = useState<CommunityParticipationContext | null>(null);
  const [organizerTrust, setOrganizerTrust] = useState<string | undefined>();

  const experience = getExperience(experienceId);

  const loadLoop = useCallback(() => {
    void fetchParticipationContext({
      tenantId: tenantSlug,
      entityType: "experience",
      entityId: experienceId,
    }).then((result) => {
      setLoop(result?.context ?? null);
    });
  }, [tenantSlug, experienceId]);

  const venueLocationId = useMemo(() => {
    if (!experience?.location) return null;
    const needle = experience.location.trim().toLowerCase();
    if (!needle) return null;
    const hit = allLocations.find(
      (loc) =>
        loc.name.toLowerCase() === needle ||
        loc.name.toLowerCase().includes(needle) ||
        needle.includes(loc.name.toLowerCase()),
    );
    return hit?.id ?? null;
  }, [experience, allLocations]);

  useEffect(() => {
    loadLoop();
  }, [loadLoop]);

  useEffect(() => {
    const organizerId = experience?.organizer.id;
    if (!organizerId) {
      setOrganizerTrust(undefined);
      return;
    }
    let cancelled = false;
    void fetchPublicTrustLabels({
      tenantId: tenantSlug,
      personId: organizerId,
    }).then((labels) => {
      if (!cancelled) setOrganizerTrust(labels[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, experience?.organizer.id]);

  if (!isFeatureEnabled("experiences") || !isModuleEnabled("experiences")) {
    return (
      <EmptyState
        title="Las experiencias no están disponibles"
        description="Esta comunidad aún no ha activado las experiencias."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!ready) {
    return <LoadingState label="Cargando experiencia..." />;
  }

  if (!experience) {
    return (
      <EmptyState
        title="Experiencia no encontrada"
        description="Puede haberse eliminado o el enlace no es válido."
        actionLabel="Ver experiencias"
        onAction={() => router.push("/experiences")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="No puedes ver esta experiencia ahora mismo."
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

  const onShare = async () => {
    const shareData = {
      title: experience.title,
      text: experience.description,
      url: window.location.href,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* cancelled — try clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareNote("Enlace copiado");
      window.setTimeout(() => setShareNote(null), 2000);
    } catch {
      setShareNote("No se pudo compartir");
      window.setTimeout(() => setShareNote(null), 2000);
    }
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={experience.title}
        onBack={() => router.push("/experiences")}
        onExit={() => router.push("/")}
      />

      <ExperienceHero
        imageUrl={experience.imageUrl ?? ""}
        title={experience.title}
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

      {venueLocationId ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/map?focus=${encodeURIComponent(venueLocationId)}`)
          }
          className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
        >
          <span className="text-[22px]" aria-hidden>
            📍
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
              Ver en el mapa
            </span>
            <span className="block text-[13px] text-[var(--color-text-tertiary)]">
              {experience.location}
            </span>
          </span>
        </button>
      ) : null}

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
            <span className="mt-0.5 block text-[15px] text-[var(--color-text-secondary)]">
              Coordina con quienes van
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
        trustLabel={organizerTrust}
      />

      {loop ? (
        <CommunityParticipationBar
          tenantId={tenantSlug}
          context={loop}
          onChanged={loadLoop}
        />
      ) : null}

      <ParticipantList
        participants={
          loop && loop.viewerParticipation.status === "joined"
            ? experience.participants ?? []
            : []
        }
        totalCount={
          loop
            ? occupyingParticipationCount(loop.participants)
            : viewer === "joined"
              ? experience.participantCount + 1
              : experience.participantCount
        }
      />

      <div className="h-[132px] shrink-0" aria-hidden />

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-2.5 md:left-1/2 md:max-w-[960px] md:-translate-x-1/2 md:px-8">
        <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-app)]/95 p-3 shadow-[var(--shadow-elev-2)] backdrop-blur">
          {shareNote ? (
            <p
              className="text-center text-[13px] font-medium text-[var(--color-success)]"
              role="status"
            >
              {shareNote}
            </p>
          ) : null}
          <JoinButton status={viewer} canJoin={canJoin} onClick={goJoin} />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              type="button"
              onClick={() => toggleSave(experience.id)}
              aria-pressed={isSaved(experience.id)}
            >
              {isSaved(experience.id) ? "Guardada" : "Guardar"}
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              type="button"
              onClick={onShare}
            >
              Compartir
            </Button>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}
