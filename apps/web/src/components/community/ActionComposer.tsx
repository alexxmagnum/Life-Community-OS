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
};

export function ActionComposer({
  open,
  onClose,
  actions,
  sections,
}: ActionComposerProps) {
  return (
    <CreateSheet
      open={open}
      onClose={onClose}
      actions={actions}
      sections={sections}
      title="Crear en comunidad"
    />
  );
}
