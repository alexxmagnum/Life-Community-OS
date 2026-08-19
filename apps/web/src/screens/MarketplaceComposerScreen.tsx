"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createMarketplaceListing,
  marketplaceKindLabel,
  type MarketplaceListingKind,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const KINDS: MarketplaceListingKind[] = ["sell", "buy", "give", "request"];

function isKind(value: string | null): value is MarketplaceListingKind {
  return value === "sell" || value === "buy" || value === "give" || value === "request";
}

/**
 * Marketplace listing composer — neighbour exchange (session persistence).
 */
export function MarketplaceComposerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, hasCapability, isProductCapabilityEnabled, demoMember, configuration } =
    useTenant();

  const initialKind = searchParams.get("kind");
  const [kind, setKind] = useState<MarketplaceListingKind>(
    isKind(initialKind) ? initialKind : "sell",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const canCreate =
    isFeatureEnabled("marketplace") &&
    isProductCapabilityEnabled("marketplace") &&
    hasCapability(CAPABILITIES.marketplaceCreate);

  const kindHint = useMemo(() => {
    switch (kind) {
      case "sell":
        return "Qué ofreces y en qué estado está.";
      case "buy":
        return "Qué estás buscando.";
      case "give":
        return "Qué regalas y cómo recogerlo.";
      case "request":
        return "Qué necesitas prestar o que te ayuden.";
    }
  }, [kind]);

  if (!isFeatureEnabled("marketplace") || !isProductCapabilityEnabled("marketplace")) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mercado"
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="El mercado no está disponible"
          description="Esta comunidad aún no ha activado el intercambio entre vecinos."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!canCreate) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Publicar anuncio"
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/marketplace")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes publicar anuncios con tu cuenta actual."
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
      setError("Cuenta un poco más para que tus vecinos entiendan el anuncio.");
      return;
    }

    setSubmitting(true);
    try {
      const created = createMarketplaceListing({
        kind,
        title: trimmedTitle,
        description: trimmedDescription,
        priceLabel: priceLabel.trim() || undefined,
        areaLabel: demoMember.areaLabel || configuration.branding.name || "Tu comunidad",
        authorName: demoMember.displayName,
        authorPersonId: demoMember.personId,
        authorAvatarUrl: demoMember.avatarUrl,
      });
      router.replace(`/marketplace/${created.id}`);
    } catch {
      setError("No se pudo publicar. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Publicar anuncio"
        subtitle="Entre vecinos · sin tienda"
        onBack={() => router.push("/marketplace")}
        onExit={() => router.push("/services")}
      />

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={
              kind === k
                ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
            }
          >
            {marketplaceKindLabel(k)}
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
          placeholder="Ej. Sofá de dos plazas"
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Detalle
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={kindHint}
          className={`${fieldClass} min-h-[120px] py-3 leading-6`}
        />
      </label>

      {kind === "sell" || kind === "buy" ? (
        <label className="block space-y-1.5">
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            Precio (opcional)
          </span>
          <input
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
            placeholder="Ej. 40 €"
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
        label={submitting ? "Publicando…" : "Publicar"}
        onClick={onPublish}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
