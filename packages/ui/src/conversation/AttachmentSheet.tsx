"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type AttachmentSheetItem = {
  id: string;
  label: string;
  description?: string;
  /** When false, shows as coming soon. */
  enabled?: boolean;
};

export type AttachmentSheetProps = {
  items?: AttachmentSheetItem[];
  onSelect: (id: string) => void;
  onClose?: () => void;
  className?: string;
};

const DEFAULT_ITEMS: AttachmentSheetItem[] = [
  { id: "camera", label: "Cámara", description: "Hacer foto", enabled: false },
  { id: "gallery", label: "Galería", description: "Fotos", enabled: true },
  {
    id: "document",
    label: "Documento",
    description: "PDF u otros",
    enabled: true,
  },
  {
    id: "location",
    label: "Ubicación",
    description: "Compartir sitio",
    enabled: false,
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Vecino o ficha",
    enabled: false,
  },
];

type IconTone = {
  wrap: string;
  ink: string;
};

function toneFor(id: string): IconTone {
  switch (id) {
    case "camera":
      return {
        wrap: "bg-[#E8F6EF]",
        ink: "text-[#1F7A4D]",
      };
    case "gallery":
    case "photo":
      return {
        wrap: "bg-[#EEF3FF]",
        ink: "text-[#3B5BDB]",
      };
    case "document":
      return {
        wrap: "bg-[#FFF4E5]",
        ink: "text-[#C47A12]",
      };
    case "location":
      return {
        wrap: "bg-[#FDECEC]",
        ink: "text-[#C0392B]",
      };
    case "contact":
      return {
        wrap: "bg-[#F3ECFF]",
        ink: "text-[#7C3AED]",
      };
    default:
      return {
        wrap: "bg-[var(--color-action-primary-subtle)]",
        ink: "text-[var(--color-action-primary)]",
      };
  }
}

function IconGlyph({ id }: { id: string }): ReactNode {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "camera":
      return (
        <svg {...common}>
          <path
            d="M4.5 8.2A2.2 2.2 0 0 1 6.7 6h2.1l.7-1.2A1.4 1.4 0 0 1 10.7 4h2.6a1.4 1.4 0 0 1 1.2.8L15.2 6h2.1a2.2 2.2 0 0 1 2.2 2.2v8.6a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2V8.2Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12.4"
            r="3.2"
            stroke="currentColor"
            strokeWidth="1.9"
          />
        </svg>
      );
    case "gallery":
    case "photo":
      return (
        <svg {...common}>
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <circle cx="9" cy="10" r="1.7" fill="currentColor" />
          <path
            d="M4.5 16.5 9 12.8l2.8 2.4 3.2-3.6 4.5 5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "document":
      return (
        <svg {...common}>
          <path
            d="M7 3.8h7.2L19 8.6V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path
            d="M14 3.9V8h4.2M8.5 12.2h7M8.5 15.5h7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path
            d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
            fill="currentColor"
          />
          <circle cx="12" cy="10.6" r="2.3" fill="white" />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.2" r="3.4" fill="currentColor" />
          <path
            d="M5.2 19.2a6.8 6.8 0 0 1 13.6 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path
            d="M14.5 6.5 8.2 12.9a3.2 3.2 0 0 0 4.5 4.5l7.1-7.2a4.6 4.6 0 0 0-6.5-6.5L6 11a6 6 0 0 0 8.5 8.5l.9-.9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/**
 * Attachment picker foundation — extension points only, no fake uploads.
 */
export function AttachmentSheet({
  items = DEFAULT_ITEMS,
  onSelect,
  onClose,
  className,
}: AttachmentSheetProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-elev-2)]",
        className,
      )}
      role="menu"
      aria-label="Adjuntar"
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {items.map((item) => {
          const enabled = item.enabled ?? false;
          const tone = toneFor(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                role="menuitem"
                disabled={!enabled}
                onClick={() => {
                  if (!enabled) return;
                  onSelect(item.id);
                  onClose?.();
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-[16px] px-1.5 py-2.5 text-center transition-transform",
                  enabled
                    ? "active:scale-[0.97]"
                    : "opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-sm",
                    tone.wrap,
                    tone.ink,
                  )}
                  aria-hidden
                >
                  <IconGlyph id={item.id} />
                </span>
                <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                  {item.label}
                </span>
                <span className="text-[10px] leading-3 text-[var(--color-text-tertiary)]">
                  {enabled ? item.description : "Próximamente"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full py-2 text-[12px] font-semibold text-[var(--color-text-tertiary)]"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  );
}
