"use client";

/**
 * Action Composer — contextual sheet. Not a new screen and not a domain.
 */

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
};

export function ActionComposer({
  open,
  onClose,
  actions,
  sections,
  locationName,
}: ActionComposerProps) {
  const place = locationName?.trim();
  return (
    <CreateSheet
      open={open}
      onClose={onClose}
      actions={actions}
      sections={sections}
      title="¿Qué quieres aportar?"
      contextLine={place ? `En ${place}` : undefined}
    />
  );
}
