"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import type { CommunityGroupRecord } from "@life-community-os/types";
import { canOpenGroupConversation } from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Group entry — opens Conversation Experience directly when allowed.
 */
export function GroupDetailScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    tenantSlug,
  } = useTenant();
  const [group, setGroup] = useState<CommunityGroupRecord | null | undefined>(
    undefined,
  );

  const groupsOn =
    isModuleEnabled("community.groups") && isFeatureEnabled("groups");

  useEffect(() => {
    if (!groupsOn) {
      setGroup(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/community/groups?tenantId=${encodeURIComponent(tenantSlug)}`,
        { cache: "no-store", headers: { "x-tenant-slug": tenantSlug } },
      );
      if (!res.ok || cancelled) {
        setGroup(null);
        return;
      }
      const data = (await res.json()) as { groups?: CommunityGroupRecord[] };
      const found = (data.groups ?? []).find((item) => item.id === groupId);
      setGroup(found ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, groupsOn, tenantSlug]);

  const hubGroup = group
    ? {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: 0,
        imageUrl: group.imageUrl ?? "",
        categoryLabel: group.categoryLabel ?? "Grupo",
        tenantId: group.tenantId,
        ownerPersonId: group.createdBy,
        status: group.status,
      }
    : undefined;

  const canChat =
    Boolean(hubGroup) &&
    hasCapability(CAPABILITIES.contentView) &&
    canOpenGroupConversation({
      group: hubGroup!,
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

  if (group === undefined) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Grupos"
          onBack={() => router.push("/community?tab=grupos")}
          onExit={() => router.push("/community")}
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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={group.name}
        onBack={() => router.push("/community?tab=grupos")}
        onExit={() => router.push("/community")}
      />
      <EmptyState
        title={group.name}
        description={group.description || "Abre la conversación del grupo."}
        actionLabel="Volver a grupos"
        onAction={() => router.push("/community?tab=grupos")}
      />
    </MobileScreen>
  );
}
