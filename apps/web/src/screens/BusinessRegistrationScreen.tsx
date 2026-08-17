"use client";

/**
 * Business registration — name + category + address → geocode → Location → map.
 * Tenant-neutral; works for any community.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOCATION_TYPES,
  type AddressGeocodeResult,
  type LocationType,
} from "@life-community-os/types";
import {
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  getAddressGeocoder,
  LOCATION_CATEGORY_OPTIONS,
  saveLocation,
} from "@/lib/location";
import { useTenant } from "@/providers/TenantProvider";

const TYPE_LABEL: Record<LocationType, string> = {
  business: "Negocio",
  service: "Servicio",
  facility: "Instalación",
  event: "Evento",
  "community-place": "Lugar comunitario",
};

function defaultTypeForCategory(category: string): LocationType {
  if (category === "facility" || category === "sports") return "facility";
  if (
    category === "electrician" ||
    category === "veterinary" ||
    category === "service"
  ) {
    return "service";
  }
  if (category === "other") return "community-place";
  return "business";
}

export function BusinessRegistrationScreen() {
  const router = useRouter();
  const { configuration } = useTenant();
  const tenantId = configuration.tenantId;

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("business");
  const [category, setCategory] = useState<string>("restaurant");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [preview, setPreview] = useState<AddressGeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const canConfirm = Boolean(preview && name.trim().length >= 2);

  const confirmationLine = useMemo(() => {
    if (!preview) return null;
    return preview.displayName;
  }, [preview]);

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

  const onSave = async () => {
    if (!preview || !canConfirm) return;
    setSaving(true);
    setError(null);
    try {
      const location = saveLocation({
        tenantId,
        type,
        name: name.trim(),
        address: address.trim(),
        latitude: preview.latitude,
        longitude: preview.longitude,
        category,
        visibility: "public",
        geocodeProvider: preview.provider,
        geocodeSourceRef: preview.sourceRef,
        geocodeDisplayName: preview.displayName,
        ...(contact.trim() ? { contact: contact.trim() } : {}),
      });
      router.push(`/map?focus=${encodeURIComponent(location.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setSaving(false);
    }
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Registrar negocio"
        subtitle="Aparecerá en el mapa de tu comunidad"
        onBack={() => router.push("/map")}
        onExit={() => router.push("/map")}
      />

      <section className="mt-4 space-y-4 pb-28">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Nombre
          </span>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. IKON Sports & Lounge"
            autoComplete="organization"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Categoría
          </span>
          <select
            className={fieldClass}
            value={category}
            onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              setType(defaultTypeForCategory(next));
            }}
          >
            {LOCATION_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Tipo
          </span>
          <select
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value as LocationType)}
          >
            {LOCATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Dirección
          </span>
          <textarea
            className={`${fieldClass} min-h-[88px] py-3`}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setPreview(null);
            }}
            placeholder="Calle, ciudad, provincia, país"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Contacto (opcional)
          </span>
          <input
            className={fieldClass}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Teléfono, email o web"
            autoComplete="tel"
          />
        </label>

        <button
          type="button"
          onClick={() => void onSearchAddress()}
          disabled={searching}
          className="w-full rounded-[14px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] px-4 py-3 text-[15px] font-medium text-[var(--color-text-primary)] disabled:opacity-50"
        >
          {searching ? "Buscando ubicación…" : "Buscar ubicación"}
        </button>

        {preview ? (
          <div
            className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4"
            role="status"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Confirmación
            </p>
            <p className="mt-2 text-[16px] font-semibold text-[var(--color-text-primary)]">
              Esta ubicación aparecerá aquí
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {confirmationLine}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            className="text-[14px] text-[var(--color-feedback-danger,#b42318)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>

      <ScreenPrimaryAction
        label={saving ? "Publicando…" : "Publicar en el mapa"}
        onClick={() => void onSave()}
        disabled={!canConfirm || saving}
      />
    </MobileScreen>
  );
}
