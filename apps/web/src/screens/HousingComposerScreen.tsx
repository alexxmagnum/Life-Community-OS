"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  canCreateHousingListing,
  housingModerationRequired,
  resolveHousingCreatePublisherKind,
  type HousingListingType,
} from "@life-community-os/types";
import {
  canRunHousingContentOperation,
  planHousingListingCreate,
} from "@life-community-os/tenant-life-panoramica";
import {
  createHousingListing,
  getHousingModuleConfig,
} from "@/lib/housing/catalog";
import { buildHousingActionActor } from "@/lib/housing/actor";
import { housingCategoryLabel } from "@/lib/housing/labels";
import { useTenant } from "@/providers/TenantProvider";

const TYPES: HousingListingType[] = ["rent", "sale", "land", "commercial"];

type CreatePath = "resident" | "professional" | "tenant_managed";

/**
 * Create housing listing — operations layer (resident / professional / tenant_managed).
 */
export function HousingComposerScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
    configuration,
  } = useTenant();

  const moduleOn =
    isModuleEnabled("housing") && isFeatureEnabled("housing");
  const config = useMemo(
    () => getHousingModuleConfig(configuration),
    [configuration],
  );
  const actor = useMemo(
    () =>
      buildHousingActionActor({
        personId: demoMember.personId,
        moduleEnabled: moduleOn,
        hasCapability,
        configuration,
        config,
      }),
    [demoMember.personId, moduleOn, hasCapability, configuration, config],
  );

  const canResident = canRunHousingContentOperation(actor, "create_resident");
  const canProfessional = canRunHousingContentOperation(
    actor,
    "create_professional",
  );
  const canTenantManaged = canRunHousingContentOperation(
    actor,
    "create_tenant_managed",
  );
  const defaultKind = resolveHousingCreatePublisherKind(actor) ?? "resident";
  const defaultPath: CreatePath = canResident
    ? "resident"
    : canProfessional
      ? "professional"
      : canTenantManaged
        ? "tenant_managed"
        : "resident";

  const enabledTypes = config.enabledCategories;
  const [createPath, setCreatePath] = useState<CreatePath>(defaultPath);
  const [type, setType] = useState<HousingListingType>(
    enabledTypes[0] ?? "rent",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const moderationOn = housingModerationRequired(config);
  const showPathChooser =
    [canResident, canProfessional, canTenantManaged].filter(Boolean).length > 1;

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Crear anuncio"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Vivienda no está disponible"
          actionLabel="Volver"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!canCreateHousingListing(actor) && !canTenantManaged) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Crear anuncio"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/housing")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes crear anuncios de vivienda con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  const activePath: CreatePath =
    createPath === "professional" && canProfessional
      ? "professional"
      : createPath === "tenant_managed" && canTenantManaged
        ? "tenant_managed"
        : canResident
          ? "resident"
          : defaultPath;

  const onPublish = () => {
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      setError("Pon un título corto y claro.");
      return;
    }
    if (trimmedDescription.length < 8) {
      setError("Describe un poco más el inmueble.");
      return;
    }

    const plan = planHousingListingCreate(actor, activePath, type);
    if (!plan.ok) {
      setError(plan.reason);
      return;
    }

    const priceAmount = price.trim()
      ? Number.parseFloat(price.replace(",", "."))
      : undefined;
    if (price.trim() && (priceAmount == null || Number.isNaN(priceAmount))) {
      setError("El precio no es válido.");
      return;
    }

    setSubmitting(true);
    try {
      const created = createHousingListing({
        type,
        title: trimmedTitle,
        description: trimmedDescription,
        priceAmount,
        currency: config.defaultCurrency ?? "EUR",
        pricePeriodLabel:
          type === "rent" || type === "commercial" ? "mes" : undefined,
        areaLabel: areaLabel.trim() || undefined,
        bedrooms: bedrooms.trim()
          ? Number.parseInt(bedrooms, 10)
          : undefined,
        createdByPersonId: demoMember.personId,
        publisherKind: plan.publisherKind,
        contentSource: plan.contentSource,
        status: plan.status,
      });
      router.replace(`/housing/${created.id}`);
    } catch {
      setError("No se pudo crear el anuncio. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear anuncio"
        subtitle={
          activePath === "tenant_managed"
            ? "Anuncio gestionado por el tenant"
            : moderationOn
              ? "Se enviará a revisión"
              : "Se publicará al guardar"
        }
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      {showPathChooser ? (
        <div className="flex flex-wrap gap-2">
          {(
            [
              canResident
                ? { id: "resident" as const, label: "Propietario" }
                : null,
              canProfessional
                ? { id: "professional" as const, label: "Inmobiliaria" }
                : null,
              canTenantManaged
                ? { id: "tenant_managed" as const, label: "Gestión tenant" }
                : null,
            ] as const
          )
            .filter(
              (option): option is { id: CreatePath; label: string } =>
                option != null,
            )
            .map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setCreatePath(option.id);
                }}
                aria-pressed={activePath === option.id}
                className={
                  activePath === option.id
                    ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                    : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
                }
              >
                {option.label}
              </button>
            ))}
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {activePath === "professional"
            ? "Publicación profesional autorizada"
            : activePath === "tenant_managed"
              ? "Publicación gestionada por el tenant"
              : "Publicación como propietario residente"}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TYPES.filter((t) => enabledTypes.includes(t)).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={
              type === t
                ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
            }
          >
            {housingCategoryLabel(t)}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Título
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Piso luminoso de 2 habitaciones"
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Descripción
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Superficie, estado, entorno…"
          className={`${fieldClass} min-h-[120px] py-3 leading-6`}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Precio (opcional)
        </span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="Ej. 1100"
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Zona (opcional)
        </span>
        <input
          value={areaLabel}
          onChange={(e) => setAreaLabel(e.target.value)}
          placeholder="Ej. Centro"
          className={fieldClass}
        />
      </label>

      {type === "rent" || type === "sale" ? (
        <label className="block space-y-1.5">
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            Habitaciones (opcional)
          </span>
          <input
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            inputMode="numeric"
            placeholder="Ej. 2"
            className={fieldClass}
          />
        </label>
      ) : null}

      {error ? (
        <p
          className="text-[14px] font-medium text-[var(--color-feedback-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ScreenPrimaryAction
        label={
          activePath === "tenant_managed"
            ? "Publicar (gestión tenant)"
            : moderationOn
              ? "Enviar a revisión"
              : "Publicar anuncio"
        }
        onClick={onPublish}
        disabled={
          submitting ||
          !planHousingListingCreate(actor, activePath, type).ok
        }
      />
    </MobileScreen>
  );
}
