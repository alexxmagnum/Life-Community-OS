"use client";

import { useRouter } from "next/navigation";
import {
  expressWorkInterest,
  formatContentWhen,
  getWorkPostById,
  workPostTypeLabel,
} from "@life-community-os/tenant-life-panoramica";
import {
  Avatar,
  EmptyState,
  MobileScreen,
  ScreenBack,
} from "@life-community-os/ui";
import { canOpenWorkConversation } from "@/lib/work-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Work post detail — contextual entry to Communication Layer (D.0.6.1).
 */
export function WorkPostDetailScreen({ workPostId }: { workPostId: string }) {
  const router = useRouter();
  const {
    theme,
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();

  const workEnabled =
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services"));

  if (!workEnabled) {
    return (
      <MobileScreen>
        <ScreenBack label="Trabajo" onClick={() => router.push("/services/work")} />
        <EmptyState
          title="Trabajo no disponible"
          description="Este tablón no está activo en tu comunidad ahora mismo."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  const workPost = getWorkPostById(workPostId);

  if (!workPost) {
    return (
      <MobileScreen>
        <ScreenBack label="Trabajo" onClick={() => router.push("/services/work")} />
        <EmptyState
          title="Anuncio no encontrado"
          description="Puede haberse cerrado o el enlace no es válido."
          actionLabel="Ver Trabajo"
          onAction={() => router.push("/services/work")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.localView)) {
    return (
      <MobileScreen>
        <ScreenBack label="Trabajo" onClick={() => router.push("/services/work")} />
        <EmptyState
          title="Sin acceso"
          description="No puedes ver este anuncio con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  const showContact = canOpenWorkConversation({
    workPost,
    configuration,
    isModuleEnabled,
    hasCapability,
  });

  const openConversation = () => {
    expressWorkInterest({
      workPostId: workPost.id,
      personId: demoMember.personId,
    });
    router.push(`/services/work/${workPost.id}/conversation`);
  };

  return (
    <MobileScreen>
      <ScreenBack
        label="Trabajo"
        onClick={() => router.push("/services/work")}
      />

      <header className="space-y-3">
        <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
          {theme.logoText} · Trabajo
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-text-primary)]">
            {workPostTypeLabel(workPost.type)}
          </span>
          <span className="text-[12px] font-medium text-[var(--color-text-tertiary)]">
            {workPost.categoryLabel}
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
          {workPost.title}
        </h1>
        <p className="text-[16px] leading-7 text-[var(--color-text-secondary)]">
          {workPost.description}
        </p>
      </header>

      <section className="flex items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]">
        <Avatar
          src={workPost.authorAvatarUrl}
          alt={workPost.authorName}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {workPost.authorName}
          </p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {[workPost.location, workPost.availability]
              .filter(Boolean)
              .join(" · ") || "Vecino de la comunidad"}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {formatContentWhen(workPost.createdAt)}
          </p>
        </div>
      </section>

      {showContact ? (
        <button
          type="button"
          onClick={openConversation}
          className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
        >
          <span className="text-[22px]" aria-hidden>
            💬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
              Contactar
            </span>
            <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
              Habla con quien publicó el anuncio
            </span>
          </span>
          <span className="text-[var(--color-text-tertiary)]" aria-hidden>
            ›
          </span>
        </button>
      ) : null}
    </MobileScreen>
  );
}
