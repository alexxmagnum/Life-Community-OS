"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
} from "@life-community-os/tenant-life-panoramica";
import { spotsLeft } from "@life-community-os/types";
import {
  Button,
  EmptyState,
  ExperienceMeta,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  ParticipationStatus,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ExperienceRegistrationScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getExperience, ready } = useReservations();
  const { getViewerState, join, getParticipation, setReminders } =
    useExperienceParticipation();
  const [reminders, setRemindersLocal] = useState(true);
  const [justJoined, setJustJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las experiencias no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!ready) {
    return <LoadingState label="Cargando experiencia..." />;
  }

  const experience = getExperience(experienceId);

  if (!experience) {
    return (
      <EmptyState
        title="Experiencia no encontrada"
        actionLabel="Ver experiencias"
        onAction={() => router.push("/experiences")}
      />
    );
  }

  const viewer = getViewerState(experience);
  const participation = getParticipation(experience.id);
  const alreadyJoined = viewer === "joined" || justJoined;
  const remaining = spotsLeft(experience);
  const isFull = viewer === "full" || remaining <= 0;
  const canJoin = hasCapability(CAPABILITIES.experienceJoin);

  if (!canJoin && !alreadyJoined) {
    return (
      <EmptyState
        title="No puedes participar ahora"
        description="Participar no está disponible para tu cuenta."
        actionLabel="Volver"
        onAction={() => router.push(`/experiences/${experience.id}`)}
      />
    );
  }

  if (viewer === "cancelled" || viewer === "expired") {
    return (
      <EmptyState
        title={
          viewer === "cancelled"
            ? "Esta experiencia se ha cancelado"
            : "Esta experiencia ha finalizado"
        }
        actionLabel="Ver experiencias"
        onAction={() => router.push("/experiences")}
      />
    );
  }

  const confirmJoin = () => {
    setJoining(true);
    void (async () => {
      const record = await join(experience.id, {
        reminders,
        waitlist: isFull && !alreadyJoined,
      });
      setJoining(false);
      if (record) {
        setJustJoined(true);
        setReminders(experience.id, reminders);
      }
    })();
  };

  const confirmed = alreadyJoined || justJoined;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={
          confirmed
            ? isFull && participation?.state === "waitlisted"
              ? "Lista de espera"
              : "Participación confirmada"
            : isFull
              ? "Lista de espera"
              : "Confirmar participación"
        }
        subtitle={experience.title}
        onBack={() => router.push(`/experiences/${experience.id}`)}
        onExit={() => router.push("/experiences")}
      />

      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        <ZoomableImage
          src={experience.imageUrl ?? ""}
          alt=""
          zoomable
          fill={false}
          className="aspect-[16/9] w-full"
          wrapperClassName="h-auto w-full"
        />
        <div className="space-y-3 p-5">
          <ParticipationStatus
            status={
              confirmed
                ? isFull && participation?.state === "waitlisted"
                  ? "waitlisted"
                  : "joined"
                : isFull
                  ? "full"
                  : "available"
            }
          />
          <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
            {confirmed
              ? "Lo hemos añadido a tu agenda."
              : `Participa en “${experience.title}” con vecinos de ${experience.areaLabel}.`}
          </p>
        </div>
      </div>

      <ExperienceMeta
        when={formatExperienceWhen(experience.startsAt)}
        location={experience.location}
        areaLabel={experience.areaLabel}
        capacityLabel={
          isFull
            ? "Ahora mismo completo"
            : `${remaining} plazas de ${experience.capacity}`
        }
      />

      {!confirmed ? (
        <label className="flex min-h-[52px] items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 shadow-[var(--shadow-elev-1)]">
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setRemindersLocal(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-action-primary)]"
          />
          <span className="text-[16px]">
            Recordarme en la app cuando se acerque
            <span className="block text-[15px] text-[var(--color-text-tertiary)]">
              Guarda la preferencia ahora; avisos push más adelante
            </span>
          </span>
        </label>
      ) : (
        <label className="flex min-h-[52px] items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 shadow-[var(--shadow-elev-1)]">
          <input
            type="checkbox"
            checked={participation?.reminders ?? reminders}
            onChange={(e) => {
              setRemindersLocal(e.target.checked);
              setReminders(experience.id, e.target.checked);
            }}
            className="h-5 w-5 accent-[var(--color-action-primary)]"
          />
          <span className="text-[16px]">Preferencia de aviso</span>
        </label>
      )}

      {!confirmed ? (
        <Button fullWidth disabled={joining} onClick={confirmJoin}>
          {joining
            ? "Apuntando…"
            : isFull
              ? "Apuntarme a la espera"
              : "Confirmar y participar"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button fullWidth onClick={() => router.push("/calendar")}>
            Ver en la agenda
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push(`/experiences/${experience.id}`)}
          >
            Volver a la actividad
          </Button>
        </div>
      )}
    </MobileScreen>
  );
}
