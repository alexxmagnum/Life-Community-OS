"use client";

import { useRouter } from "next/navigation";
import { getGroupById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
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
        <FlowScreenHeader
          title="Grupos"
          onBack={() => router.push("/community?tab=grupos")}
          onExit={() => router.push("/community")}
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
        <FlowScreenHeader
          title="Grupos"
          onBack={() => router.push("/community?tab=grupos")}
          onExit={() => router.push("/community")}
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
        <FlowScreenHeader
          title="Grupos"
          onBack={() => router.push("/community?tab=grupos")}
          onExit={() => router.push("/community")}
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
      <FlowScreenHeader
        title={group.name}
        subtitle={group.categoryLabel}
        onBack={() => router.push("/community?tab=grupos")}
        onExit={() => router.push("/community")}
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
        <p className="text-[16px] leading-7 text-[var(--color-text-secondary)]">
          {group.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
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
              Abrir conversación
            </span>
            <span className="mt-0.5 block text-[15px] text-[var(--color-text-secondary)]">
              Habla con los miembros del grupo
            </span>
          </span>
          <span className="text-[var(--color-text-tertiary)]" aria-hidden>
            ›
          </span>
        </button>
      ) : (
        <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-3.5 py-3 text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Puedes seguir el grupo desde Comunidad. La conversación se abrirá
          cuando tengas acceso.
        </p>
      )}
    </MobileScreen>
  );
}
