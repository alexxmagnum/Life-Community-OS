"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  getExperienceById,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  ExperienceMeta,
  MobileScreen,
  ParticipationStatus,
  ScreenBack,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

export function ExperienceRegistrationScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState, join, getParticipation, setReminders } =
    useExperienceParticipation();
  const [reminders, setRemindersLocal] = useState(true);
  const [justJoined, setJustJoined] = useState(false);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las actividades no están disponibles"
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
        actionLabel="Ver actividades"
        onAction={() => router.push("/discover")}
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
            ? "Esta actividad se ha cancelado"
            : "Esta actividad ha finalizado"
        }
        actionLabel="Buscar otra cosa"
        onAction={() => router.push("/discover")}
      />
    );
  }

  const confirmJoin = () => {
    const record = join(experience.id, {
      reminders,
      waitlist: isFull && !alreadyJoined,
    });
    if (record) {
      setJustJoined(true);
      setReminders(experience.id, reminders);
    }
  };

  const confirmed = alreadyJoined || justJoined;

  return (
    <MobileScreen>
      <ScreenBack
        label="Volver al detalle"
        onClick={() => router.push(`/experiences/${experience.id}`)}
      />

      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={experience.imageUrl}
          alt=""
          className="aspect-[16/9] w-full object-cover"
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
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8">
            {confirmed
              ? isFull && participation?.state === "waitlisted"
                ? "Estás en lista de espera"
                : "Vas a ir"
              : isFull
                ? "¿Apuntarte a la lista de espera?"
                : "Confirma que quieres participar"}
          </h1>
          <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
            {confirmed
              ? "Lo hemos añadido a tu agenda en Life Panoramica. Lo verás en Mis actividades."
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
            Avísame antes de que empiece
            <span className="block text-[13px] text-[var(--color-text-tertiary)]">
              Las notificaciones se conectarán más adelante
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
        <Button fullWidth onClick={confirmJoin}>
          {isFull ? "Apuntarme a la espera" : "Confirmar y participar"}
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
