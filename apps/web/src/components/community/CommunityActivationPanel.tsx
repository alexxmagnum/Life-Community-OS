"use client";

/**
 * CommunityActivationPanel — orient new/quiet communities without fake content.
 */

import {
  COMMUNITY_ACTIVATION_PANEL_DESCRIPTION,
  COMMUNITY_ACTIVATION_PANEL_TITLE,
  COMMUNITY_ACTIVATION_VISITOR_CTA,
  LIVING_EMPTY_CTA,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA,
} from "@life-community-os/types";

export type CommunityActivationPanelProps = {
  variant: "member" | "visitor";
  onCreateExperience?: () => void;
  onCreateAnnouncement?: () => void;
  onAddBusiness?: () => void;
  onInviteNeighbors?: () => void;
  onJoin?: () => void;
};

export function CommunityActivationPanel({
  variant,
  onCreateExperience,
  onCreateAnnouncement,
  onAddBusiness,
  onInviteNeighbors,
  onJoin,
}: CommunityActivationPanelProps) {
  if (variant === "visitor") {
    return (
      <div className="rounded-[18px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 py-4">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {COMMUNITY_ACTIVATION_PANEL_TITLE}
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {COMMUNITY_ACTIVATION_PANEL_DESCRIPTION}
        </p>
        {onJoin ? (
          <button
            type="button"
            onClick={onJoin}
            className="ui-press mt-3 min-h-[44px] rounded-full bg-[var(--color-action-primary)] px-4 text-[14px] font-semibold text-white"
          >
            {COMMUNITY_ACTIVATION_VISITOR_CTA}
          </button>
        ) : null}
      </div>
    );
  }

  const options = [
    onCreateExperience
      ? { label: LIVING_EMPTY_CTA, onClick: onCreateExperience }
      : null,
    onCreateAnnouncement
      ? { label: COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA, onClick: onCreateAnnouncement }
      : null,
    onAddBusiness
      ? { label: "Añadir negocio", onClick: onAddBusiness }
      : null,
    onInviteNeighbors
      ? { label: "Invitar vecinos", onClick: onInviteNeighbors }
      : null,
  ].filter(Boolean) as { label: string; onClick: () => void }[];

  return (
    <div className="rounded-[18px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[var(--shadow-elev-1)]">
      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
        {COMMUNITY_ACTIVATION_PANEL_TITLE}
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {COMMUNITY_ACTIVATION_PANEL_DESCRIPTION}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onClick}
            className="ui-press min-h-[40px] rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3.5 text-[13px] font-semibold text-[var(--color-text-primary)]"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
