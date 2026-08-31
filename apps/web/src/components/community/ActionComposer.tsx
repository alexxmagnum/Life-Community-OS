"use client";

/**
 * Action Composer — contextual sheet. Not a new screen and not a domain.
 */

import {
  composerTitleForSource,
  type CommunityCreationSource,
} from "@life-community-os/types";
import {
  CreateSheet,
  type CreateAction,
  type CreateActionSection,
} from "@life-community-os/ui";

export type ActionComposerProps = {
  open: boolean;
  onClose: () => void;
  actions?: CreateAction[];
  sections?: CreateActionSection[];
  locationName?: string;
  source?: CommunityCreationSource;
};

export function ActionComposer({
  open,
  onClose,
  actions,
  sections,
  locationName,
  source,
}: ActionComposerProps) {
  const place = locationName?.trim();
  return (
    <CreateSheet
      open={open}
      onClose={onClose}
      actions={actions}
      sections={sections}
      title={composerTitleForSource(source)}
      contextLine={
        source === "life_place" && place
          ? `En ${place}`
          : source === "home"
            ? "Para hoy, en tu territorio"
            : place
              ? `En ${place}`
              : undefined
      }
      subtitle="Comparte algo que haga mejor tu comunidad"
    />
  );
}
