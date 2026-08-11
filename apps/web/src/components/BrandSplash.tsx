"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/providers/TenantProvider";

let splashFinishedThisDocument = false;

/**
 * Lightbox-style open, then a soft straight glide into the header logo.
 * Position is fixed at the header slot; only `transform` animates (no left/top jump).
 */
export function BrandSplash() {
  const { theme, themeMode } = useTenant();
  /** Prefer the light mark on night chrome; fall back to the shared logo. */
  const logoUrl =
    (themeMode === "night"
      ? theme.imagery.logoLight ?? theme.imagery.logo
      : theme.imagery.logo) || undefined;
  const [visible, setVisible] = useState(false);
  const [leave, setLeave] = useState(false);

  useEffect(() => {
    if (!logoUrl || splashFinishedThisDocument) return;

    setVisible(true);
    setLeave(false);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = window.setTimeout(() => {
        splashFinishedThisDocument = true;
        setVisible(false);
      }, 400);
      return () => window.clearTimeout(t);
    }

    const startLeave = window.setTimeout(() => setLeave(true), 1100);
    const done = window.setTimeout(() => {
      splashFinishedThisDocument = true;
      setVisible(false);
    }, 1100 + 1100);

    return () => {
      window.clearTimeout(startLeave);
      window.clearTimeout(done);
    };
  }, [logoUrl]);

  if (!visible || !logoUrl) return null;

  const ease = "cubic-bezier(0.4, 0, 0.2, 1)";
  /** Header slot size — splash scales up from this anchor. */
  const slot = 48;
  /** Splash hold size ≈ 48 × 7.4 ≈ 355px. */
  const splashScale = 7.4;

  return (
    <div
      className="fixed inset-0 z-[35]"
      aria-hidden
      style={{ pointerEvents: leave ? "none" : "auto" }}
    >
      <div
        className="absolute inset-0 bg-black/88 backdrop-blur-[6px]"
        style={{
          opacity: leave ? 0 : 1,
          transition: leave ? `opacity 1s ${ease}` : undefined,
        }}
      />

      {/*
        Anchor = header logo box (48×48).
        Start: translate to viewport center + scale up.
        End: translate(0) scale(1) — one straight path, no left/top tween.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        className="fixed z-[37] object-contain will-change-transform"
        style={{
          left: 10,
          top: "calc(env(safe-area-inset-top, 0px) + 2px)",
          width: slot,
          height: slot,
          borderRadius: leave ? 8 : 12,
          transformOrigin: "center center",
          transform: leave
            ? "translate(0px, 0px) scale(1)"
            : `translate(calc(50vw - 34px), calc(50vh - env(safe-area-inset-top, 0px) - 26px)) scale(${splashScale})`,
          opacity: leave ? 0 : 1,
          boxShadow: leave ? "none" : "0 28px 90px rgba(0,0,0,0.55)",
          transition: leave
            ? [
                `transform 1.05s ${ease}`,
                `opacity 0.4s ${ease} 0.55s`,
                `box-shadow 0.6s ${ease}`,
                `border-radius 1.05s ${ease}`,
              ].join(", ")
            : undefined,
        }}
      />
    </div>
  );
}
