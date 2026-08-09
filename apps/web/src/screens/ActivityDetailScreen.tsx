"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  filterAccessibleChannels,
  formatExperienceWhen,
  getExplorerActivityBySlug,
  listChannelsForActivity,
  listExperiencesForActivity,
  listGroupsForActivity,
  listResourcesForActivity,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperienceCard,
  FlowScreenHeader,
  GroupCard,
  MobileScreen,
  ResourceDiscoveryCard,
  ScreenPrimaryAction,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";

function statusLabelFor(
  viewer: ReturnType<
    ReturnType<typeof useExperienceParticipation>["getViewerState"]
  >,
  remaining: number,
): string {
  if (viewer === "joined") return "Vas a ir";
  if (viewer === "full") return "Completo";
  if (viewer === "cancelled") return "Cancelado";
  if (viewer === "expired") return "Finalizado";
  if (remaining <= 3) return `${remaining} plazas`;
  return "Abierto";
}

/**
 * Reusable Activity Hub — permanent interest area for a tenant.
 * Slug selects presentation + filters existing Channel / Group / Experience / Resource.
 */
export function ActivityDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability, demoPersonId } = useTenant();
  const { getViewerState } = useExperienceParticipation();
  /** After mount, merge localStorage session creates (SSR-safe). */
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const hub = useMemo(() => getExplorerActivityBySlug(slug), [slug]);

  const channels = useMemo(
    () =>
      hub
        ? filterAccessibleChannels(
            listChannelsForActivity(hub.slug),
            demoPersonId,
          )
        : [],
    [hub, demoPersonId],
  );
  const groups = useMemo(
    () => (hub ? listGroupsForActivity(hub.slug) : []),
    [hub],
  );
  const experiences = useMemo(
    () =>
      hub
        ? listExperiencesForActivity(hub.slug, {
            includeSessionCreated: sessionReady,
          })
        : [],
    [hub, sessionReady],
  );
  const resources = useMemo(
    () => (hub ? listResourcesForActivity(hub.slug) : []),
    [hub],
  );

  const openCreateExperience = () => {
    router.push(`/experiences/create?activity=${encodeURIComponent(slug)}`);
  };

  if (!hub) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Actividades"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Actividad no encontrada"
          description="Esta actividad no forma parte del explorador de tu comunidad."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  const canCreate =
    isFeatureEnabled("experiences") &&
    hasCapability(CAPABILITIES.experienceCreate);

  const participantHint =
    groups.reduce((sum, g) => sum + g.memberCount, 0) || undefined;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={hub.label}
        subtitle={hub.description}
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      {/* 1. Identity */}
      <section className="overflow-hidden rounded-[24px] bg-[var(--color-surface-muted)]">
        <div className="relative aspect-[16/10]">
          <ZoomableImage
            src={hub.imageUrl}
            alt={hub.label}
            zoomable
            wrapperClassName="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="space-y-2 px-4 py-4">
          {participantHint ? (
            <p className="text-[15px] font-medium text-[var(--color-text-tertiary)]">
              {participantHint} vecinos en grupos relacionados
            </p>
          ) : null}
        </div>
      </section>

      {/* 2. Community — Channel + Group */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Comunidad
        </h2>
        <p className="text-[15px] text-[var(--color-text-tertiary)]">
          Canales y grupos alrededor de {hub.label.toLowerCase()}.
        </p>
        {channels.length === 0 && groups.length === 0 ? (
          <EmptyState
            title="Aún no hay comunidad aquí"
            description={`Cuando haya un canal o grupo de ${hub.label.toLowerCase()}, lo verás en este apartado.`}
          />
        ) : (
          <div className="space-y-3">
            {channels.map((ch) => {
              const label = channelAccessLabel({
                allowed: true,
                reason: "accessible",
                requiresVerifiedResidency: ch.requiresVerifiedResidency,
                type: ch.type,
              });
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => router.push("/community?tab=canales")}
                  className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
                >
                  <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-action-primary)]">
                    Canal
                  </p>
                  <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                    {ch.name}
                  </p>
                  {ch.description ? (
                    <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
                      {ch.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[14px] text-[var(--color-text-tertiary)]">
                    {label.badge}
                  </p>
                </button>
              );
            })}
            {groups.map((g) => (
              <GroupCard
                key={g.id}
                name={g.name}
                members={g.memberCount}
                imageUrl={g.imageUrl}
                onOpen={() => router.push(`/community/groups/${g.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Upcoming experiences */}
      {isFeatureEnabled("experiences") ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
            Próximas experiencias
          </h2>
          <p className="text-[15px] text-[var(--color-text-tertiary)]">
            Momentos concretos relacionados con {hub.label.toLowerCase()}.
          </p>
          {experiences.length === 0 ? (
            <EmptyState
              title="No hay experiencias todavía. Sé la primera persona en crear una."
              description="Un momento concreto con fecha, lugar y vecinos."
              actionLabel={canCreate ? "Crear experiencia" : undefined}
              onAction={canCreate ? openCreateExperience : undefined}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {experiences.map((exp) => {
                const viewer = getViewerState(exp);
                const remaining = spotsLeft(exp);
                return (
                  <ExperienceCard
                    key={exp.id}
                    title={exp.title}
                    when={formatExperienceWhen(exp.startsAt)}
                    where={exp.location}
                    meta={`${exp.participantCount} van · ${remaining} plazas`}
                    imageUrl={exp.imageUrl}
                    organizerName={exp.organizer.name}
                    statusLabel={statusLabelFor(viewer, remaining)}
                    onClick={() => router.push(`/experiences/${exp.id}`)}
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* 4. Related resources */}
      {isFeatureEnabled("resources") &&
      hasCapability(CAPABILITIES.resourceView) ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
            Recursos relacionados
          </h2>
          <p className="text-[15px] text-[var(--color-text-tertiary)]">
            Espacios e instalaciones útiles para esta actividad.
          </p>
          {resources.length === 0 ? (
            <EmptyState
              title="Sin recursos vinculados"
              description="Cuando haya instalaciones relacionadas, aparecerán aquí."
            />
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <ResourceDiscoveryCard
                  key={resource.id}
                  name={resource.name}
                  description={resource.description}
                  availability={resource.availabilityPreview}
                  area={resource.areaLabel}
                  imageUrl={resource.imageUrl}
                  onClick={() => router.push(`/resources/${resource.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {canCreate ? (
        <ScreenPrimaryAction
          label="Crear experiencia"
          onClick={openCreateExperience}
        />
      ) : null}
    </MobileScreen>
  );
}
