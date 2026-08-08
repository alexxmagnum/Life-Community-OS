"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { cn } from "../lib/cn";

type LightboxState = { src: string; alt: string } | null;

type MediaLightboxContextValue = {
  open: (src: string, alt?: string) => void;
  close: () => void;
};

const MediaLightboxContext = createContext<MediaLightboxContextValue | null>(
  null,
);

export function useMediaLightbox() {
  return useContext(MediaLightboxContext);
}

export function MediaLightboxProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<LightboxState>(null);

  const open = useCallback((src: string, alt = "") => {
    if (!src) return;
    setMedia({ src, alt });
  }, []);

  const close = useCallback(() => setMedia(null), []);

  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [media, close]);

  return (
    <MediaLightboxContext.Provider value={{ open, close }}>
      {children}
      {media ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={media.alt || "Foto ampliada"}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[18px] font-semibold text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.src}
            alt={media.alt}
            className="max-h-[min(90vh,900px)] max-w-[min(94vw,720px)] rounded-[16px] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </MediaLightboxContext.Provider>
  );
}

export type ZoomableImageProps = {
  src: string;
  alt?: string;
  className?: string;
  /** Wrapper classes (defaults to block fill for card media) */
  wrapperClassName?: string;
  /**
   * When true (default), image fills the wrapper (`h-full w-full`).
   * Set false for intrinsic / aspect-ratio heroes.
   */
  fill?: boolean;
};

/** Photo that opens full-screen on tap. Stops parent card navigation.
 * Uses a span (not button) so it can live inside clickable cards without nested buttons.
 */
export function ZoomableImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  fill = true,
}: ZoomableImageProps) {
  const lightbox = useMediaLightbox();

  const open = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lightbox?.open(src, alt);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      className={cn(
        "block cursor-zoom-in overflow-hidden p-0 text-left",
        wrapperClassName ?? "h-full w-full",
      )}
      aria-label={alt ? `Ampliar foto: ${alt}` : "Ampliar foto"}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(fill && "h-full w-full", "object-cover", className)}
      />
    </span>
  );
}
