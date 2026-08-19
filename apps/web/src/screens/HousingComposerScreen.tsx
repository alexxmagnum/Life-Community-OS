"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  housingPropertyTypeLabel,
  type HousingAvailability,
  type HousingPropertyType,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createHousingPropertyRequest } from "@/lib/housing/housing-client";
import { getAddressGeocoder } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const TYPES: HousingPropertyType[] = [
  "apartment",
  "villa",
  "townhouse",
  "plot",
  "other",
];

const AVAIL: { id: HousingAvailability; label: string }[] = [
  { id: "private", label: "Uso privado" },
  { id: "rent", label: "En alquiler" },
  { id: "sale", label: "En venta" },
];

export function HousingComposerScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
    personId,
  } = useTenant();

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  const [propertyType, setPropertyType] =
    useState<HousingPropertyType>("apartment");
  const [availability, setAvailability] =
    useState<HousingAvailability>("private");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<{
    latitude: number;
    longitude: number;
    displayName?: string;
    provider?: string;
    sourceRef?: string;
  } | null>(null);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const canCreate =
    moduleOn &&
    Boolean(personId) &&
    hasCapability(CAPABILITIES.housingCreateOwnListing);

  const confirmationLine = useMemo(
    () => preview?.displayName ?? null,
    [preview],
  );

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Registrar vivienda"
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

  if (!canCreate) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Registrar vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/housing")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes registrar una vivienda con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  const onSearchAddress = async () => {
    setError(null);
    setPreview(null);
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      setError("Introduce una dirección completa.");
      return;
    }
    setSearching(true);
    try {
      const geocoder = getAddressGeocoder();
      const result = await geocoder.geocode({
        address: trimmed,
        country: "ES",
        language: "es",
      });
      if (!result) {
        setError(
          "No encontramos esa dirección. Prueba con más detalle (calle, ciudad, país).",
        );
        return;
      }
      setPreview(result);
    } catch {
      setError("No se pudo consultar la ubicación. Inténtalo de nuevo.");
    } finally {
      setSearching(false);
    }
  };

  const onPublish = async () => {
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      setError("Pon un título corto y claro.");
      return;
    }
    if (trimmedDescription.length < 8) {
      setError("Describe un poco más la vivienda.");
      return;
    }
    if (!preview) {
      setError("Confirma la dirección en el mapa antes de guardar.");
      return;
    }
    setSubmitting(true);
    const created = await createHousingPropertyRequest({
      tenantId: configuration.tenantId,
      title: trimmedTitle,
      description: trimmedDescription,
      propertyType,
      address: address.trim(),
      latitude: preview.latitude,
      longitude: preview.longitude,
      availability,
      areaLabel: areaLabel.trim() || undefined,
      bedrooms: bedrooms.trim()
        ? Number.parseInt(bedrooms, 10)
        : undefined,
      geocodeProvider: preview.provider,
      geocodeSourceRef: preview.sourceRef,
      geocodeDisplayName: preview.displayName,
    });
    if ("error" in created) {
      setError("No se pudo registrar. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }
    router.replace(`/housing/${created.property.id}`);
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Registrar vivienda"
        subtitle="Hogar de la comunidad · no es un negocio"
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      <div className="flex flex-wrap gap-2">
        {TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPropertyType(item)}
            aria-pressed={propertyType === item}
            className={
              propertyType === item
                ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
            }
          >
            {housingPropertyTypeLabel(item)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAIL.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAvailability(item.id)}
            aria-pressed={availability === item.id}
            className={
              availability === item.id
                ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
            }
          >
            {item.label}
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
          placeholder="Ej. Piso en la aldea"
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
          Dirección
        </span>
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setPreview(null);
          }}
          placeholder="Calle, número, ciudad"
          className={fieldClass}
        />
      </label>

      <button
        type="button"
        onClick={() => void onSearchAddress()}
        disabled={searching}
        className="min-h-[44px] rounded-[14px] border border-[var(--color-border-subtle)] px-4 text-[14px] font-semibold"
      >
        {searching ? "Buscando dirección…" : "Confirmar dirección"}
      </button>
      {confirmationLine ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {confirmationLine}
        </p>
      ) : null}

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

      {propertyType !== "plot" ? (
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
        label="Guardar vivienda"
        onClick={() => void onPublish()}
        disabled={submitting || !preview}
      />
    </MobileScreen>
  );
}
