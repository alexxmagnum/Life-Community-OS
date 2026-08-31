"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityParticipationContext } from "@life-community-os/types";
import { occupyingParticipationCount } from "@life-community-os/types";
import {
  inviteParticipationRequest,
  joinParticipationRequest,
} from "@/lib/community/participation-client";

export function CommunityParticipationBar({
  tenantId,
  context,
  onChanged,
}: {
  tenantId: string;
  context: CommunityParticipationContext;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [invitee, setInvitee] = useState("");
  const [openInvite, setOpenInvite] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const count = occupyingParticipationCount(context.participants);
  const joinAction = context.actions.find((item) => item.kind === "join");
  const inviteAction = context.actions.find((item) => item.kind === "invite");
  const converseAction = context.actions.find(
    (item) => item.kind === "converse" || item.kind === "respond",
  );

  return (
    <div className="space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
        {count === 1 ? "1 persona apuntada" : `${count} personas apuntadas`}
      </p>
      <div className="flex flex-wrap gap-2">
        {joinAction?.enabled ? (
          <button
            type="button"
            className="rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[13px] font-semibold text-white"
            onClick={() => {
              void joinParticipationRequest({
                tenantId,
                entityType: context.entityType,
                entityId: context.entityId,
              }).then((result) => {
                if ("error" in result) {
                  setNote("No se pudo unir ahora.");
                  return;
                }
                onChanged?.();
              });
            }}
          >
            {joinAction.label}
          </button>
        ) : null}
        {inviteAction?.enabled ? (
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)]"
            onClick={() => setOpenInvite((value) => !value)}
          >
            Invitar
          </button>
        ) : null}
        {converseAction?.enabled && converseAction.href ? (
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)]"
            onClick={() => router.push(converseAction.href!)}
          >
            {converseAction.label}
          </button>
        ) : null}
      </div>
      {openInvite ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const personId = invitee.trim();
            if (!personId) return;
            void inviteParticipationRequest({
              tenantId,
              entityType: context.entityType,
              entityId: context.entityId,
              inviteePersonId: personId,
            }).then((result) => {
              if ("error" in result) {
                setNote("No se pudo enviar la invitación.");
                return;
              }
              setInvitee("");
              setOpenInvite(false);
              setNote("Invitación enviada");
              onChanged?.();
            });
          }}
        >
          <input
            value={invitee}
            onChange={(event) => setInvitee(event.target.value)}
            placeholder="Identificador del vecino"
            className="min-h-[40px] flex-1 rounded-full border border-[var(--color-border-subtle)] px-3 text-[13px]"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
          >
            Enviar
          </button>
        </form>
      ) : null}
      {note ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">{note}</p>
      ) : null}
    </div>
  );
}
