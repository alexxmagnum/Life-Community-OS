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
  type HousingListingType,
} from "@life-community-os/types";
import {
  createHousingListing,
  getHousingModuleConfig,
} from "@/lib/housing/catalog";
import { buildHousingActionActor } from "@/lib/housing/actor";
import { housingCategoryLabel } from "@/lib/housing/labels";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const TYPES: HousingListingType[] = ["rent", "sale", "land", "commercial"];

/**
 * Create housing listing — permissions + lifecycle aware.
 */
export function HousingComposerScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();

  const moduleOn =
    isModuleEnabled("housing") && isFeatureEnabled("housing");
  const config = useMemo(() => getHousingModuleConfig(), []);
  const actor = useMemo(
    () =>
      buildHousingActionActor({
        personId: demoMember.personId,
        moduleEnabled: moduleOn,
        hasCapability,
        config,
      }),
    [demoMember.personId, moduleOn, hasCapability, config],
  );

  const enabledTypes = config.enabledCategories;
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

  if (!canCreateHousingListing(actor)) {
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
    if (!enabledTypes.includes(type)) {
      setError("Esta categoría no está habilitada.");
      return;
    }

    const priceAmount = price.trim()
      ? Number.parseFloat(price.replace(",", "."))
      : undefined;
    if (price.trim() && (priceAmount == null || Number.isNaN(priceAmount))) {
      setError("El precio no es válido.");
      return;
    }

    const status = config.requireModerationBeforePublish
      ? "pending_review"
      : "published";

    setSubmitting(true);
    try {
      const created = createHousingListing({
        type,
        title: trimmedTitle,
        description: trimmedDescription,
        priceAmount,
        currency: config.defaultCurrency ?? "EUR",
        pricePeriodLabel: type === "rent" || type === "commercial" ? "mes" : undefined,
        areaLabel: areaLabel.trim() || undefined,
        bedrooms: bedrooms.trim()
          ? Number.parseInt(bedrooms, 10)
          : undefined,
        createdByPersonId: demoMember.personId,
        status,
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
          config.requireModerationBeforePublish
            ? "Se enviará a revisión"
            : "Se publicará al guardar"
        }
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

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
          config.requireModerationBeforePublish
            ? "Enviar a revisión"
            : "Publicar anuncio"
        }
        onClick={onPublish}
        disabled={submitting || !hasCapability(CAPABILITIES.housingCreateListing)}
      />
    </MobileScreen>
  );
}
