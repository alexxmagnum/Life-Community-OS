"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

const EXIT_MS = 280;

export function useMediaLightbox() {
  return useContext(MediaLightboxContext);
}

export function MediaLightboxProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<LightboxState>(null);
  const [entered, setEntered] = useState(false);
  const closingRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((src: string, alt = "") => {
    if (!src) return;
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    closingRef.current = false;
    setMedia({ src, alt });
    setEntered(false);
  }, []);

  const close = useCallback(() => {
    if (!media || closingRef.current) return;
    closingRef.current = true;
    setEntered(false);
    exitTimerRef.current = setTimeout(() => {
      setMedia(null);
      closingRef.current = false;
      exitTimerRef.current = null;
    }, EXIT_MS);
  }, [media]);

  useEffect(() => {
    if (!media) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [media]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className={cn(
              "absolute inset-0 bg-black/88 backdrop-blur-[6px] transition-[opacity,backdrop-filter] duration-300 ease-out motion-reduce:transition-none",
              entered ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />

          <button
            type="button"
            onClick={close}
            className={cn(
              "absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[18px] font-semibold text-white transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              entered
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            )}
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.src}
            alt={media.alt}
            className={cn(
              "relative z-[1] max-h-[min(90vh,900px)] max-w-[min(94vw,720px)] rounded-[16px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
              entered
                ? "scale-100 opacity-100"
                : "scale-[0.88] opacity-0",
            )}
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
  /**
   * Open lightbox on tap. Default false — card thumbs should navigate to the item.
   * Enable for published media (product / announcement photos) and similar.
   * Avatars use `Avatar` (zoomable by default).
   */
  zoomable?: boolean;
};

/**
 * Media image. Card list thumbs: zoomable={false} (default) so the card opens.
 * Published photos: zoomable — opens lightbox without navigating.
 */
export function ZoomableImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  fill = true,
  zoomable = false,
}: ZoomableImageProps) {
  const lightbox = useMediaLightbox();

  const open = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lightbox?.open(src, alt);
  };

  if (!zoomable || !lightbox) {
    return (
      <span
        className={cn(
          "block overflow-hidden p-0",
          wrapperClassName ?? "h-full w-full",
        )}
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

  return (
    <span
      role="button"
      tabIndex={0}
      className={cn(
        "block cursor-zoom-in overflow-hidden p-0 text-left transition-transform duration-200 ease-out active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100",
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
