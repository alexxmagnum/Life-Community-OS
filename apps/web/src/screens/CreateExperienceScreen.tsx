"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listExplorerActivityHubs } from "@life-community-os/tenant-life-panoramica";
import {
  dateFromWhenPreset,
  experienceComposerConfigForKind,
  EXPERIENCE_COMPOSER_AUDIENCE_OPTIONS,
  EXPERIENCE_COMPOSER_CATEGORY_OPTIONS,
  listExperienceComposerKindOptions,
  parseExperienceComposerKindParam,
  validateExperienceComposer,
  type ExperienceComposerAudience,
  type ExperienceComposerWhenPreset,
  type ExperienceKind,
  type ExperienceLifecycleStatus,
} from "@life-community-os/types";
import {
  EmptyState,
  FilterChipRow,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createExperienceRequest } from "@/lib/experiences/experience-client";
import { getLocation } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useReservations } from "@/providers/ReservationProvider";

function toDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function combineLocalDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

const WHEN_PRESETS: readonly {
  id: ExperienceComposerWhenPreset;
  label: string;
}[] = [
  { id: "today", label: "Hoy" },
  { id: "tomorrow", label: "Mañana" },
  { id: "weekend", label: "Este fin de semana" },
  { id: "custom", label: "Elegir fecha" },
];

const KIND_OPTIONS = listExperienceComposerKindOptions();

/**
 * Unified Experience composer — one route, one form shell, kind-driven fields.
 * Accepts `?kind=` and optional initialValues via query (title, date, time, …).
 */
export function CreateExperienceScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, hasCapability, tenantSlug } = useTenant();
  const { currentUser } = useCurrentUser();
  const { resources } = useReservations();

  const hubs = listExplorerActivityHubs();
  const locationId = searchParams.get("locationId")?.trim() ?? "";
  const locationNameParam = searchParams.get("locationName")?.trim() ?? "";
  const initialActivity = searchParams.get("activity")?.trim() ?? "";
  const initialKind = parseExperienceComposerKindParam(
    searchParams.get("kind"),
  );

  const [kind, setKind] = useState<ExperienceKind>(initialKind);
  const [title, setTitle] = useState(searchParams.get("title")?.trim() ?? "");
  const [description, setDescription] = useState(
    searchParams.get("description")?.trim() ?? "",
  );
  const [category, setCategory] = useState(
    searchParams.get("category")?.trim() ?? "",
  );
  const [activitySlug, setActivitySlug] = useState(
    hubs.some((h) => h.slug === initialActivity) ? initialActivity : "",
  );
  const [format, setFormat] = useState(searchParams.get("format")?.trim() ?? "");
  const [whenPreset, setWhenPreset] =
    useState<ExperienceComposerWhenPreset>("custom");
  const [date, setDate] = useState(
    searchParams.get("date")?.trim() || toDateInputValue(),
  );
  const [startTime, setStartTime] = useState(
    searchParams.get("time")?.trim() || "10:00",
  );
  const [endTime, setEndTime] = useState(
    searchParams.get("endTime")?.trim() ?? "",
  );
  const [location, setLocation] = useState(locationNameParam);
  const [resourceId, setResourceId] = useState("");
  const [capacity, setCapacity] = useState(
    searchParams.get("capacity")?.trim() || "4",
  );
  const [audience, setAudience] = useState<ExperienceComposerAudience>(
    "territory",
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const config = experienceComposerConfigForKind(kind);
  const actorLabel =
    currentUser.displayName?.trim() ||
    currentUser.email?.split("@")[0] ||
    "Vecino";

  const linkedResources = useMemo(() => {
    const rows = resources.filter((item) => item.category !== "activity");
    if (!locationId) return rows;
    const atPlace = rows.filter((item) => item.locationId === locationId);
    return atPlace.length > 0 ? atPlace : rows;
  }, [resources, locationId]);

  useEffect(() => {
    const next = parseExperienceComposerKindParam(searchParams.get("kind"));
    setKind(next);
  }, [searchParams]);

  useEffect(() => {
    if (!locationId) return;
    const loc = getLocation(tenantSlug, locationId);
    if (loc?.name && !location.trim()) setLocation(loc.name);
    const match = linkedResources.find((item) => item.locationId === locationId);
    if (match && !resourceId) {
      setResourceId(match.id);
      if (!location.trim()) setLocation(match.location);
    }
  }, [locationId, tenantSlug, linkedResources, location, resourceId]);

  const syncKindToUrl = (next: ExperienceKind) => {
    setKind(next);
    setError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("kind", next);
    router.replace(`/experiences/create?${params.toString()}`, {
      scroll: false,
    });
  };

  const formState = {
    title,
    description,
    category,
    activitySlug,
    format,
    date,
    time: startTime,
    endTime,
    location,
    resourceId,
    capacity,
    audience,
  };

  const shows = (id: string) =>
    (config.visible as readonly string[]).includes(id) ||
    (detailsOpen && (config.optionalDetails as readonly string[]).includes(id));

  const inOptional = (id: string) =>
    (config.optionalDetails as readonly string[]).includes(id);

  const submit = (mode: "publish" | "draft") => {
    setError(null);
    const validation = validateExperienceComposer(config, formState, mode);
    if (validation) {
      setError(validation);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim() || trimmedTitle;
    const trimmedLocation = location.trim();
    const cap = Number(capacity);
    const dateValue =
      date.trim() ||
      (mode === "draft" ? dateFromWhenPreset("tomorrow") : date.trim());
    const timeValue = startTime.trim() || "10:00";
    const startsAt = combineLocalDateTime(dateValue, timeValue);
    if (Number.isNaN(new Date(startsAt).getTime())) {
      setError("La fecha u hora no es válida.");
      return;
    }

    let endsAt: string | undefined;
    if (endTime.trim()) {
      endsAt = combineLocalDateTime(dateValue, endTime.trim());
    }

    const categoryValue =
      activitySlug.trim() ||
      category.trim() ||
      (format.trim() ? "custom" : undefined);

    const status: ExperienceLifecycleStatus =
      mode === "draft" ? "draft" : "published";

    setSubmitting(true);
    void (async () => {
      const result = await createExperienceRequest({
        tenantId: tenantSlug,
        title: trimmedTitle,
        description: trimmedDescription,
        kind,
        category: categoryValue,
        status,
        startsAt,
        endsAt,
        location: trimmedLocation || undefined,
        resourceId: resourceId || undefined,
        capacity: Number.isFinite(cap) && cap >= 2 ? cap : config.minCapacity,
        publishToCommunity: mode === "publish",
        metadata: {
          ...(format.trim() ? { format: format.trim() } : {}),
          ...(audience ? { audience } : {}),
          ...(category.trim() && activitySlug.trim()
            ? { typeCategory: category.trim() }
            : {}),
        },
      });
      if ("error" in result) {
        setError(
          result.error === "forbidden"
            ? "No tienes permiso para crear."
            : "No se pudo guardar. Inténtalo de nuevo.",
        );
        setSubmitting(false);
        return;
      }
      router.push(`/experiences/${result.experience.id}`);
    })();
  };

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las experiencias no están disponibles"
        description="Esta comunidad aún no ha activado las experiencias."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceCreate)) {
    return (
      <EmptyState
        title="Sin permiso para crear"
        description="Tu cuenta no puede crear ahora mismo."
        actionLabel="Ver experiencias"
        onAction={() => router.push("/experiences")}
      />
    );
  }

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const contextLabel = locationNameParam.trim() || location.trim();

  const renderField = (id: string) => {
    if (!shows(id)) return null;
    switch (id) {
      case "title":
        return (
          <label key="title" className="block space-y-2">
            <span className="block font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">
              {config.question}
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={config.titlePlaceholder}
              className={`${fieldClass} min-h-[56px] text-[17px] font-semibold`}
            />
          </label>
        );
      case "description":
        return (
          <label key="description" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Descripción
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué vais a hacer, para quién es…"
              rows={3}
              className={`${fieldClass} min-h-[100px] resize-none py-3`}
            />
          </label>
        );
      case "category":
        return (
          <label key="category" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Tipo
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              <option value="">Elegir</option>
              {EXPERIENCE_COMPOSER_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {kind === "plan" ? (
              <span className="mt-3 block space-y-1.5">
                <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                  Actividad
                </span>
                <select
                  value={activitySlug}
                  onChange={(e) => setActivitySlug(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Elegir</option>
                  {hubs.map((hub) => (
                    <option key={hub.slug} value={hub.slug}>
                      {hub.label}
                    </option>
                  ))}
                </select>
              </span>
            ) : null}
          </label>
        );
      case "format":
        return (
          <label key="format" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Formato
            </span>
            <input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Ej. Música en directo"
              className={fieldClass}
            />
          </label>
        );
      case "whenPreset":
        return (
          <div key="whenPreset" className="space-y-2">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Cuándo
            </span>
            <FilterChipRow
              items={WHEN_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
              activeId={whenPreset}
              onChange={(id) => {
                const preset = id as ExperienceComposerWhenPreset;
                setWhenPreset(preset);
                if (preset !== "custom") {
                  setDate(dateFromWhenPreset(preset));
                }
              }}
            />
          </div>
        );
      case "date":
        return (
          <label key="date" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setWhenPreset("custom");
              }}
              className={fieldClass}
            />
          </label>
        );
      case "time":
        return (
          <label key="time" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Hora
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={fieldClass}
            />
          </label>
        );
      case "endTime":
        return (
          <label key="endTime" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Hora de fin
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={fieldClass}
            />
          </label>
        );
      case "location":
        return (
          <label key="location" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              {kind === "event" ? "Lugar" : "Dónde"}
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Punto de encuentro"
              className={fieldClass}
            />
          </label>
        );
      case "resource":
        return linkedResources.length > 0 ? (
          <label key="resource" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Recurso
            </span>
            <select
              value={resourceId}
              onChange={(e) => {
                const id = e.target.value;
                setResourceId(id);
                const res = linkedResources.find((r) => r.id === id);
                if (res && !location.trim()) setLocation(res.location);
              }}
              className={fieldClass}
            >
              <option value="">Ninguno</option>
              {linkedResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        ) : null;
      case "capacity":
        return (
          <label key="capacity" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              {kind === "event" ? "Participación" : "Cuántas personas"}
            </span>
            <input
              type="number"
              min={config.minCapacity}
              max={200}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={fieldClass}
            />
          </label>
        );
      case "audience":
        return (
          <label key="audience" className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              {kind === "event" ? "Quién puede verlo" : "Quién puede unirse"}
            </span>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as ExperienceComposerAudience)
              }
              className={fieldClass}
            >
              {EXPERIENCE_COMPOSER_AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        );
      default:
        return null;
    }
  };

  const primaryFields = config.visible.filter((id) => id !== "title");
  const optionalFields = config.optionalDetails;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear"
        subtitle="Haz que pase."
        onBack={() => router.back()}
        onExit={() => router.push("/")}
      />

      <section className="space-y-3">
        <FilterChipRow
          items={KIND_OPTIONS.map((opt) => ({
            id: opt.id,
            label: opt.label,
          }))}
          activeId={kind}
          onChange={(id) => syncKindToUrl(id as ExperienceKind)}
        />
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Creando como ·{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">
            {actorLabel}
          </span>
        </p>
        {contextLabel ? (
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Creando en ·{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {contextLabel}
            </span>
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        {renderField("title")}
        {primaryFields.map((id) => renderField(id))}
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="flex min-h-[48px] w-full items-center justify-between rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 text-left text-[15px] font-semibold text-[var(--color-text-primary)]"
          aria-expanded={detailsOpen}
        >
          Detalles opcionales
          <span aria-hidden className="text-[var(--color-text-tertiary)]">
            {detailsOpen ? "▴" : "▾"}
          </span>
        </button>
        {detailsOpen ? (
          <div className="space-y-4">
            {optionalFields.map((id) =>
              inOptional(id) ? renderField(id) : null,
            )}
          </div>
        ) : null}
      </section>

      {error ? (
        <p className="text-[14px] font-medium text-[var(--color-action-destructive)]">
          {error}
        </p>
      ) : null}

      <div className="space-y-3 pb-6">
        <ScreenPrimaryAction
          label={submitting ? "Guardando…" : config.primaryCta}
          onClick={() => submit("publish")}
          disabled={submitting}
        />
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit("draft")}
          className="flex min-h-[56px] w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-action-primary)] bg-transparent text-[16px] font-semibold text-[var(--color-action-primary)] transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {config.draftCta}
        </button>
      </div>
    </MobileScreen>
  );
}
