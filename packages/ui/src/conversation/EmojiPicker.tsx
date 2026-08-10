"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "../lib/cn";
import {
  ALL_PICKER_EMOJIS,
  EMOJI_CATEGORIES,
  RECENT_EMOJIS_STORAGE_KEY,
  searchEmojis,
  type EmojiCategoryId,
} from "./emoji-catalog";

export const DEFAULT_COMPOSER_EMOJIS = [
  "😀",
  "🙂",
  "😊",
  "❤️",
  "👍",
  "🙏",
  "👏",
  "😂",
  "😮",
  "👋",
] as const;

export type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
  /** @deprecated Full catalog is used; kept for API compatibility. */
  emojis?: readonly string[];
};

const CATEGORY_GLYPH: Record<EmojiCategoryId, string> = {
  recent: "🕒",
  smileys: "😀",
  gestures: "👋",
  hearts: "❤️",
  animals: "🐶",
  food: "🍕",
  travel: "✈️",
  objects: "💡",
  symbols: "✨",
};

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, 24)
      : [];
  } catch {
    return [];
  }
}

function pushRecent(emoji: string) {
  if (typeof window === "undefined") return;
  const next = [emoji, ...readRecent().filter((e) => e !== emoji)].slice(0, 24);
  window.localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(next));
}

/**
 * Premium messenger emoji picker — search, categories, recent.
 */
export function EmojiPicker({ onSelect, onClose, className }: EmojiPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EmojiCategoryId>("smileys");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const visible = useMemo(() => {
    const raw = (() => {
      if (query.trim()) return searchEmojis(query);
      if (category === "recent") {
        return recent.length > 0 ? recent : [...DEFAULT_COMPOSER_EMOJIS];
      }
      return (
        EMOJI_CATEGORIES.find((c) => c.id === category)?.emojis ??
        ALL_PICKER_EMOJIS
      );
    })();
    return Array.from(new Set(raw));
  }, [category, query, recent]);

  const pick = (emoji: string) => {
    pushRecent(emoji);
    setRecent(readRecent());
    onSelect(emoji);
  };

  const categoryLabel =
    category === "recent"
      ? "Recientes"
      : (EMOJI_CATEGORIES.find((c) => c.id === category)?.label ?? "Emojis");

  return (
    <div
      className={cn(
        "flex h-[min(52vh,22rem)] flex-col overflow-hidden rounded-t-[18px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-2)]",
        className,
      )}
      role="dialog"
      aria-label="Emojis"
    >
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <div className="relative min-w-0 flex-1">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-text-tertiary)]"
            aria-hidden
          >
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar emoji"
            className="min-h-[40px] w-full rounded-[12px] bg-[var(--color-surface-muted)] pl-9 pr-3 text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-1 text-[13px] font-semibold text-[var(--color-action-primary)]"
          >
            Listo
          </button>
        ) : null}
      </div>

      {!query.trim() ? (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {categoryLabel}
        </p>
      ) : (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Resultados
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        <div className="grid grid-cols-7 gap-0.5">
          {visible.map((emoji, index) => (
            <button
              key={`${category}-${index}-${emoji}`}
              type="button"
              onClick={() => pick(emoji)}
              className="flex h-[3.25rem] w-full items-center justify-center rounded-[12px] text-[32px] leading-none active:scale-95 active:bg-[var(--color-surface-muted)]"
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-[var(--color-text-tertiary)]">
            Sin resultados
          </p>
        ) : null}
      </div>

      {!query.trim() ? (
        <div className="flex border-t border-[var(--color-border-subtle)] px-1 py-1.5">
          <button
            type="button"
            onClick={() => setCategory("recent")}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-[10px] text-[22px] leading-none",
              category === "recent"
                ? "bg-[var(--color-action-primary-subtle)]"
                : "",
            )}
            aria-label="Recientes"
            aria-pressed={category === "recent"}
          >
            {CATEGORY_GLYPH.recent}
          </button>
          {EMOJI_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "flex h-11 flex-1 items-center justify-center rounded-[10px] text-[22px] leading-none",
                category === c.id
                  ? "bg-[var(--color-action-primary-subtle)]"
                  : "",
              )}
              aria-label={c.label}
              aria-pressed={category === c.id}
            >
              {CATEGORY_GLYPH[c.id]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
