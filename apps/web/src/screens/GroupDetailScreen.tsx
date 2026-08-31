"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import type {
  CommunityGroupRecord,
  CommunityParticipationContext,
} from "@life-community-os/types";
import { CommunityParticipationBar } from "@/components/community/CommunityParticipationBar";
import { fetchParticipationContext } from "@/lib/community/participation-client";
import { useTenant } from "@/providers/TenantProvider";

export function GroupDetailScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { isFeatureEnabled, isModuleEnabled, tenantSlug } = useTenant();
  const [group, setGroup] = useState<CommunityGroupRecord | null | undefined>(
    undefined,
  );
  const [loop, setLoop] = useState<CommunityParticipationContext | null>(null);

  const groupsOn =
    isModuleEnabled("community.groups") && isFeatureEnabled("groups");

  const loadLoop = useCallback(() => {
    void fetchParticipationContext({
      tenantId: tenantSlug,
      entityType: "group",
      entityId: groupId,
    }).then((result) => setLoop(result?.context ?? null));
  }, [tenantSlug, groupId]);

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

  useEffect(() => {
    if (group?.id) loadLoop();
  }, [group?.id, loadLoop]);

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
      <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
        {group.description || "Forma parte de este grupo de vecinos."}
      </p>
      {loop ? (
        <CommunityParticipationBar
          tenantId={tenantSlug}
          context={loop}
          onChanged={loadLoop}
        />
      ) : null}
    </MobileScreen>
  );
}
