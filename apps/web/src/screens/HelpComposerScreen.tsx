"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HelpRequestType } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createHelpRequestRequest } from "@/lib/marketplace/commerce-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function HelpComposerScreen() {
  const router = useRouter();
  const { hasCapability, configuration } = useTenant();
  const [type, setType] = useState<HelpRequestType>("need_help");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("neighbour");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  if (!hasCapability(CAPABILITIES.localView) && !hasCapability(CAPABILITIES.marketplaceView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Ayuda"
          onBack={() => router.push("/services/neighbour-help")}
          onExit={() => router.push("/services")}
        />
        <EmptyState title="Sin acceso" />
      </MobileScreen>
    );
  }

  const onPublish = async () => {
    if (title.trim().length < 3 || description.trim().length < 8) {
      setError("Cuenta un poco más para que tus vecinos puedan ayudarte.");
      return;
    }
    setSubmitting(true);
    const created = await createHelpRequestRequest({
      tenantId: configuration.tenantId,
      type,
      title: title.trim(),
      description: description.trim(),
      category,
    });
    if ("error" in created) {
      setError("No se pudo publicar.");
      setSubmitting(false);
      return;
    }
    router.replace("/services/neighbour-help");
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Pedir o ofrecer ayuda"
        onBack={() => router.push("/services/neighbour-help")}
        onExit={() => router.push("/services")}
      />
      <div className="flex flex-wrap gap-2">
        {(["need_help", "offer_help"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={
              type === value
                ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold"
            }
          >
            {value === "need_help" ? "Pido ayuda" : "Ofrezco ayuda"}
          </button>
        ))}
      </div>
      <label className="mt-4 block space-y-1.5">
        <span className="text-[14px] font-semibold">Título</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
          placeholder="¿Alguien presta un taladro?"
        />
      </label>
      <label className="mt-3 block space-y-1.5">
        <span className="text-[14px] font-semibold">Detalle</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${fieldClass} min-h-[120px] py-3`}
        />
      </label>
      <label className="mt-3 block space-y-1.5">
        <span className="text-[14px] font-semibold">Categoría</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="mt-3 text-[14px] text-[var(--color-feedback-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <ScreenPrimaryAction
        label={submitting ? "Publicando…" : "Publicar"}
        onClick={() => void onPublish()}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
