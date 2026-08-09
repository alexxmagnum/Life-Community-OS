"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
  communityAlertIcon,
  communityAlertKindLabel,
  experienceActivityLabel,
  listActiveCommunityAlerts,
  listCuratedNearYou,
  listUpcomingHomeExperiences,
  searchHomeCatalog,
  territoryDiscoveryAreaLabels,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  GlobalAppSearch,
  HomeSection,
  TerritoryHero,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

/** Belonging greeting — Spanish product copy; i18n catalogue later. */
function belongingGreeting(name: string, hour: number): string {
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation} ${name}`;
}

/** Stable hour in Europe/Madrid. */
function madridHour(nowMs = Date.now()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nowMs));
  return Number(hourStr);
}

function forYouIcon(
  kind: "experience" | "local" | "welcome" | "proposal",
): string {
  if (kind === "experience") return "✨";
  if (kind === "welcome") return "👋";
  if (kind === "proposal") return "📢";
  return "📍";
}

function todayMomentIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("vecin") || t.includes("bienven")) return "👋";
  if (t.includes("ilumin") || t.includes("aviso") || t.includes("actualiz"))
    return "💡";
  if (t.includes("convers") || t.includes("chat")) return "💬";
  if (t.includes("anuncio") || t.includes("comunica")) return "📢";
  return "🌿";
}

function nearPlaceIcon(kind: string, categoryLabel: string): string {
  const blob = `${kind} ${categoryLabel}`.toLowerCase();
  if (blob.includes("restaurant") || blob.includes("cafe") || blob.includes("café"))
    return "☕";
  if (blob.includes("service") || blob.includes("servicio") || blob.includes("taller"))
    return "🛠";
  if (blob.includes("shop") || blob.includes("negocio") || blob.includes("comer"))
    return "🏪";
  return "📍";
}

/** Experience discovery chips — category signal, not a directory. */
const DO_TODAY_CHIPS: ReadonlyArray<{
  id: string;
  icon: string;
  label: string;
  href: string;
}> = [
  { id: "golf", icon: "🏌", label: "Golf", href: "/experiences" },
  { id: "dining", icon: "🍽", label: "Restaurantes", href: "/near/restaurants" },
  { id: "sports", icon: "🎾", label: "Deportes", href: "/experiences" },
  { id: "events", icon: "🎭", label: "Eventos", href: "/community?tab=actualidad" },
  { id: "family", icon: "👨‍👩‍👧", label: "Familias", href: "/experiences" },
];

/** Shared first-paint options — identical on server and client hydrate. */
const HYDRATE_SAFE = {
  includeSessionExperiences: false,
  stabilizeTime: true,
} as const;

const LIVE_OPTS = {
  includeSessionExperiences: true,
  stabilizeTime: false,
} as const;

/**
 * Home = digital plaza of the community.
 * Scan in seconds: title → context → detail on tap.
 * Property / residency / territory stay internal for relevance — not Home UI.
 */
export function HomeScreen() {
  const router = useRouter();
  const {
    theme,
    isFeatureEnabled,
    hasCapability,
    demoMember,
    demoPersonId,
  } = useTenant();

  const [live, setLive] = useState(false);
  const [greeting, setGreeting] = useState(
    () => `Hola ${demoMember.displayName}`,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLive(true);
    setGreeting(belongingGreeting(demoMember.displayName, madridHour()));
  }, [demoMember.displayName]);

  const searchHits = useMemo(
    () => searchHomeCatalog(searchQuery, 8),
    [searchQuery],
  );

  const territoryName = theme.identity?.territoryName ?? theme.logoText;
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );
  /** Soft place line — not residency/property product UI. */
  const areaLine =
    demoMember.areaLabel || theme.identity?.defaultAreaName || undefined;
  const weatherLabel = theme.identity?.weatherLabel;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  const alerts = useMemo(() => {
    const nowMs = live
      ? Date.now()
      : Date.parse("2026-08-09T12:00:00.000Z");
    return listActiveCommunityAlerts(nowMs);
  }, [live]);

  const forYou = useMemo(
    () => buildForYouItems(demoMember, { limit: 3, ...frontDoorOpts }),
    [demoMember, frontDoorOpts],
  );

  const todaySquare = useMemo(() => {
    const moments = buildTodayMoments({ limit: 2, ...frontDoorOpts }).map(
      (moment) => ({
        id: moment.id,
        icon: todayMomentIcon(moment.title),
        title: moment.title,
        context: moment.meta,
        href: moment.href,
      }),
    );
    const stories = buildCommunityLifeItems({ limit: 2 }).map((item) => ({
      id: item.id,
      icon: todayMomentIcon(item.narrative),
      title: item.narrative,
      context: item.context ?? item.personName ?? "Comunidad",
      href: item.href,
    }));
    return [...moments, ...stories].slice(0, 3);
  }, [frontDoorOpts]);

  const experienceHints = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    if (!hasCapability(CAPABILITIES.experienceView)) return [];
    return listUpcomingHomeExperiences({ limit: 4, ...frontDoorOpts });
  }, [isFeatureEnabled, hasCapability, frontDoorOpts]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listCuratedNearYou(demoMember, {
      limit: 4,
      preferredAreaLabels: territoryDiscoveryAreaLabels(demoPersonId),
    });
  }, [canLocal, demoMember, demoPersonId]);

  return (
    <div className="space-y-5 overflow-x-hidden pb-8 md:space-y-7">
      <TerritoryHero
        variant="belonging"
        imageUrl={theme.imagery.homeHero}
        imageAlt={territoryName}
        greeting={greeting}
        areaLabel={areaLine}
        weatherLabel={weatherLabel}
        searchSlot={
          <GlobalAppSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Buscar en ${territoryName}`}
            hits={searchHits}
            onSelectHit={(hit) => {
              setSearchQuery("");
              router.push(hit.href);
            }}
          />
        }
      />

      <div className="space-y-7 pt-0.5 md:space-y-8">
        {/* ── PARA TI ── */}
        <HomeSection title="✨ Para ti" subtitle="Lo relevante para tu día.">
          {alerts.length === 0 && forYou.length === 0 ? (
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya avisos o planes para ti, los verás aquí."
            />
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() =>
                    router.push(alert.href ?? "/community?tab=actualidad")
                  }
                  className="flex w-full items-start gap-3 rounded-[16px] border border-[var(--color-warning)]/35 bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-surface-elevated))] px-3.5 py-3 text-left active:scale-[0.99]"
                >
                  <span className="mt-0.5 text-[18px] leading-none" aria-hidden>
                    {communityAlertIcon(alert.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">
                      {communityAlertKindLabel(alert.kind)}
                    </span>
                    <span className="mt-0.5 block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {alert.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
                      {alert.contextLabel}
                    </span>
                  </span>
                  <span className="mt-1 shrink-0 text-[12px] font-semibold text-[var(--color-action-primary)]">
                    Ver ›
                  </span>
                </button>
              ))}

              {forYou.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-left shadow-[var(--shadow-elev-1)] active:scale-[0.99]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[16px]"
                    aria-hidden
                  >
                    {forYouIcon(item.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </HomeSection>

        {/* ── HOY EN {territory} — community square, max 2–3 previews ── */}
        <HomeSection
          title={todayTitle}
          subtitle="Qué está pasando hoy."
          actionLabel="Ver comunidad"
          onAction={() => router.push("/community")}
        >
          {todaySquare.length === 0 ? (
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando haya planes o historias, aparecerán aquí."
              actionLabel={
                hasCapability(CAPABILITIES.experienceCreate)
                  ? "Crear experiencia"
                  : undefined
              }
              onAction={
                hasCapability(CAPABILITIES.experienceCreate)
                  ? () => router.push("/experiences/create")
                  : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {todaySquare.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-left shadow-[var(--shadow-elev-1)] active:scale-[0.99]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[16px]"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
                      {item.context}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </HomeSection>

        {/* ── QUÉ PUEDES HACER HOY — chips + light hints ── */}
        {isFeatureEnabled("experiences") ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            subtitle="Planes y encuentros cerca."
            actionLabel="Ver todas"
            onAction={() => router.push("/experiences")}
          >
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {DO_TODAY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => router.push(chip.href)}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-surface-elevated)] px-3.5 py-2.5 text-left shadow-[var(--shadow-elev-1)] active:scale-[0.98]"
                >
                  <span className="text-[16px] leading-none" aria-hidden>
                    {chip.icon}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {chip.label}
                  </span>
                </button>
              ))}
            </div>

            {experienceHints.length > 0 ? (
              <div className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {experienceHints.map((exp) => {
                  const category = experienceActivityLabel(exp.title).toLowerCase();
                  const icon = category.includes("golf")
                    ? "🏌"
                    : category.includes("padel") || category.includes("pádel")
                      ? "🎾"
                      : "✨";
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => router.push(`/experiences/${exp.id}`)}
                      className="w-[148px] shrink-0 rounded-[16px] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-left shadow-[var(--shadow-elev-1)] active:scale-[0.98]"
                    >
                      <span className="text-[15px] leading-none" aria-hidden>
                        {icon}
                      </span>
                      <span className="mt-2 block line-clamp-2 text-[13px] font-semibold leading-4 text-[var(--color-text-primary)]">
                        {exp.title}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-[var(--color-text-tertiary)]">
                        {exp.location}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Todavía no hay planes abiertos."
                description="Sé la primera persona en proponer algo."
                actionLabel={
                  hasCapability(CAPABILITIES.experienceCreate)
                    ? "Crear experiencia"
                    : undefined
                }
                onAction={
                  hasCapability(CAPABILITIES.experienceCreate)
                    ? () => router.push("/experiences/create")
                    : undefined
                }
              />
            )}
          </HomeSection>
        ) : null}

        {/* ── CERCA DE TI — discovery, not directory ── */}
        {canLocal ? (
          <HomeSection
            title="📍 Cerca de ti"
            subtitle="Descubre sitios útiles alrededor."
            actionLabel="Explorar"
            onAction={() => router.push("/near/restaurants")}
          >
            {nearYou.length === 0 ? (
              <EmptyState
                title="Aún no hay sitios cerca."
                description="Cuando la comunidad señale lugares, los verás aquí."
              />
            ) : (
              <div className="space-y-2">
                {nearYou.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      if (
                        place.kind === "restaurant" ||
                        place.kind === "cafe"
                      ) {
                        router.push("/near/restaurants");
                      } else if (place.kind === "shop") {
                        router.push("/near/businesses");
                      } else if (place.kind === "service") {
                        router.push("/near/services");
                      } else {
                        router.push("/near/places");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-left shadow-[var(--shadow-elev-1)] active:scale-[0.99]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[16px]"
                      aria-hidden
                    >
                      {nearPlaceIcon(place.kind, place.categoryLabel)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {place.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
                        {place.categoryLabel}
                        {place.areaLabel ? ` · ${place.areaLabel}` : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </HomeSection>
        ) : null}
      </div>
    </div>
  );
}
