"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createCommunityGroupRequest } from "@/lib/community/community-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function CreateCommunityGroupScreen() {
  const router = useRouter();
  const { hasCapability, isFeatureEnabled, configuration } = useTenant();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate =
    isFeatureEnabled("groups") && hasCapability(CAPABILITIES.groupCreate);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  if (!canCreate) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Crear grupo"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin permiso para crear"
          description="Tu cuenta no puede crear grupos ahora mismo."
          actionLabel="Volver a comunidad"
          onAction={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  const onSubmit = async () => {
    if (name.trim().length < 3) {
      setError("Pon un nombre para el grupo.");
      return;
    }
    setSubmitting(true);
    const created = await createCommunityGroupRequest({
      tenantId: configuration.tenantId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
    if ("error" in created) {
      setError("No se pudo crear el grupo.");
      setSubmitting(false);
      return;
    }
    const group = (created as { group?: { id?: string } }).group;
    router.push(
      group?.id
        ? `/community/groups/${group.id}/conversation`
        : "/community",
    );
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear grupo"
        subtitle="Forma una comunidad alrededor de un interés."
        onBack={() => router.push("/community")}
        onExit={() => router.push("/")}
      />
      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Nombre
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Vecinos del valle"
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Descripción
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`${fieldClass} min-h-[120px] resize-none py-3`}
        />
      </label>
      {error ? (
        <p className="text-[14px] font-medium text-[var(--color-action-destructive)]">
          {error}
        </p>
      ) : null}
      <ScreenPrimaryAction
        label={submitting ? "Creando…" : "Crear grupo"}
        onClick={() => void onSubmit()}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
