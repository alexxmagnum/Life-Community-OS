"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGroupById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { canOpenGroupConversation } from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Group entry — opens Conversation Experience directly when allowed.
 * Group info lives in the chat header info sheet (not a pre-chat page).
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
  const group = groupsOn ? getGroupById(groupId) : undefined;

  const canChat =
    Boolean(group) &&
    hasCapability(CAPABILITIES.contentView) &&
    canOpenGroupConversation({
      group: group!,
      configuration,
      isModuleEnabled,
      hasCapability,
    });

  useEffect(() => {
    if (canChat) {
      router.replace(`/community/groups/${groupId}/conversation`);
    }
  }, [canChat, groupId, router]);

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

  if (!hasCapability(CAPABILITIES.contentView) || !canChat) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title={group.name}
          onBack={() => router.push("/community?tab=grupos")}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="Sin acceso a la conversación"
          description="Puedes seguir el grupo desde Comunidad. La conversación se abrirá cuando tengas acceso."
          actionLabel="Volver a Comunidad"
          onAction={() => router.push("/community?tab=grupos")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={group.name}
        onBack={() => router.push("/community?tab=grupos")}
        onExit={() => router.push("/community")}
      />
      <p className="px-1 py-8 text-center text-[13px] text-[var(--color-text-tertiary)]">
        Abriendo conversación…
      </p>
    </MobileScreen>
  );
}
