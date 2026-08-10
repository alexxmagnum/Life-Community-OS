import type { ReactNode } from "react";

export type NotificationInboxItemProps = {
  title: string;
  body: string;
  /** ISO timestamp or preformatted relative label. */
  whenLabel?: string;
  unread?: boolean;
  onClick?: () => void;
};

/**
 * Reusable in-app notification row (Shared Product Package).
 * No tenant imports. Title/body come from resolved Notification display fields.
 */
export function NotificationInboxItem({
  title,
  body,
  whenLabel,
  unread = false,
  onClick,
}: NotificationInboxItemProps) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span
          className={
            unread
              ? "text-[15px] font-semibold text-[var(--color-text-primary)]"
              : "text-[15px] font-medium text-[var(--color-text-primary)]"
          }
        >
          {title}
        </span>
        {unread ? (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-action-primary)]"
            aria-label="Sin leer"
          />
        ) : null}
      </span>
      <span className="mt-1 block text-[13px] leading-5 text-[var(--color-text-secondary)]">
        {body}
      </span>
      {whenLabel ? (
        <span className="mt-1.5 block text-[12px] text-[var(--color-text-tertiary)]">
          {whenLabel}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col rounded-[14px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col rounded-[14px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]">
      {content}
    </div>
  );
}

export type NotificationInboxEmptyProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Allow product shells to inject EmptyState without coupling. */
  children?: ReactNode;
};
