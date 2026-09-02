/**
 * Required field label with red asterisk — Account / Join community forms.
 */

import type { ReactNode } from "react";

export function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
      {children}
      <span className="text-[var(--color-danger,#b42318)]" aria-hidden="true">
        {" "}
        *
      </span>
    </span>
  );
}
