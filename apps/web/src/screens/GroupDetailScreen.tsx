"use client";

import { useRouter } from "next/navigation";
import { getGroupById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  MobileScreen,
  ScreenBack,
  ZoomableImage,
} from "@life-community-os/ui";
import { canOpenGroupConversation } from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Community Group detail — entry to long-lived group conversation (D.0.6.2).
 */
export function GroupDetailScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const {
    theme,
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
  } = useTenant();

  const groupsOn =
    isModuleEnabled("community.groups") && isFeatureEnabled("groups");

  if (!groupsOn) {
    return (
      <MobileScreen>
        <ScreenBack
          label="Comunidad"
          onClick={() => router.push("/community?tab=grupos")}
        />
        <EmptyState
          title="Grupos no disponibles"
          description="Los grupos no están activos en tu comunidad ahora mismo."
          actionLabel="Volver a Comunidad"
          onAction={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  const group = getGroupById(groupId);

  if (!group) {
    return (
      <MobileScreen>
        <ScreenBack
          label="Comunidad"
          onClick={() => router.push("/community?tab=grupos")}
        />
        <EmptyState
          title="Grupo no encontrado"
          description="Puede haberse archivado o el enlace no es válido."
          actionLabel="Ver grupos"
          onAction={() => router.push("/community?tab=grupos")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.contentView)) {
    return (
      <MobileScreen>
        <ScreenBack
          label="Comunidad"
          onClick={() => router.push("/community?tab=grupos")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes ver este grupo con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  const showConversation = canOpenGroupConversation({
    group,
    configuration,
    isModuleEnabled,
    hasCapability,
  });

  return (
    <MobileScreen>
      <ScreenBack
        label="Grupos"
        onClick={() => router.push("/community?tab=grupos")}
      />

      <div className="overflow-hidden rounded-[20px] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        <div className="aspect-[16/10] bg-[var(--color-surface-muted)]">
          <ZoomableImage
            src={group.imageUrl}
            alt=""
            wrapperClassName="h-full w-full"
          />
        </div>
      </div>

      <header className="space-y-2">
        <p className="text-[15px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
          {theme.logoText} · Grupo
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
          {group.name}
        </h1>
        <p className="text-[16px] leading-7 text-[var(--color-text-secondary)]">
          {group.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-action-primary)]">
            {group.categoryLabel}
          </span>
          <span className="text-[15px] text-[var(--color-text-tertiary)]">
            {group.memberCount} miembros
            {group.areaLabel ? ` · ${group.areaLabel}` : ""}
          </span>
        </div>
      </header>

      {showConversation ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/community/groups/${group.id}/conversation`)
          }
          className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
        >
          <span className="text-[22px]" aria-hidden>
            💬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
              Conversación
            </span>
            <span className="mt-0.5 block text-[15px] text-[var(--color-text-secondary)]">
              Habla con los miembros del grupo
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
