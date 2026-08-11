"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Life Premium Home surfaces.
 *
 * Home opens as a dense mobile stage: four horizontal rails of small
 * photo-led cards over the night background. These components exist only for
 * Home so the shared cards used by Comunidad, Descubrir and Servicios keep
 * their own rhythm.
 */

export type HomeGlyphName =
  | "coffee"
  | "trail"
  | "golf"
  | "heart"
  | "people"
  | "ball"
  | "camera"
  | "calendar"
  | "dining"
  | "compass"
  | "spark"
  | "map"
  | "star"
  | "arrow";

export function HomeGlyph({
  name,
  size = 16,
  className,
}: {
  name: HomeGlyphName;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    className,
    "aria-hidden": true as const,
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "coffee":
      return (
        <svg {...common}>
          <path
            d="M5 9.2h11.2v5.2A3.8 3.8 0 0 1 12.4 18.2H8.8A3.8 3.8 0 0 1 5 14.4V9.2Z"
            fill="currentColor"
          />
          <path
            d="M16.2 10.2h1.9a2.1 2.1 0 1 1 0 4.2h-1.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M8 4.2c0 1.2-.6 1.8-.6 2.8M11 4.2c0 1.2-.6 1.8-.6 2.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "trail":
      return (
        <svg {...common}>
          <path
            d="M12 3.6 14.2 9.4h6.1l-4.9 3.6 1.9 5.8L12 15.4l-5.3 3.4 1.9-5.8-4.9-3.6h6.1L12 3.6Z"
            fill="currentColor"
            opacity="0.25"
          />
          <path
            d="m4 19 4.2-7.2L11.2 16l2.8-4.8L19.2 19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.4 6.2 15 3.8l1.6 2.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-ppl" x1="4" y1="4" x2="20" y2="20">
              <stop offset="0%" stopColor="#9AF0F5" />
              <stop offset="100%" stopColor="#2BB8C4" />
            </linearGradient>
          </defs>
          <circle cx="8.6" cy="8.4" r="3.1" fill="url(#hg-ppl)" />
          <circle cx="15.8" cy="9.2" r="2.5" fill="url(#hg-ppl)" opacity="0.9" />
          <path
            d="M3.2 19.2c.7-3 2.7-4.5 5.4-4.5s4.7 1.5 5.4 4.5"
            fill="url(#hg-ppl)"
          />
          <path
            d="M13.6 15.4c1.5-.5 3.1-.2 4.6 1.1V19.2h-4.4"
            fill="url(#hg-ppl)"
            opacity="0.85"
          />
        </svg>
      );
    case "golf":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-golf" x1="6" y1="4" x2="18" y2="22">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#D7FF8A" />
              <stop offset="100%" stopColor="#6FBF3A" />
            </linearGradient>
          </defs>
          <circle cx="9.2" cy="19.4" r="2.2" fill="#F4F7FA" />
          <path
            d="M9.2 17.4V5.2l8.4 3.2-8.4 3.1"
            fill="url(#hg-golf)"
          />
          <path d="M17.4 7.9 9.2 5.2" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 19.5S4.5 15 4.5 9.8A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7.5 1.8c0 5.2-7.5 9.7-7.5 9.7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id="hg-ball" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#D8DEE6" />
              <stop offset="100%" stopColor="#7A8494" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="8.2" fill="url(#hg-ball)" />
          <path
            d="m12 5.2 3.4 2.5-1.3 4.1H9.9L8.6 7.7 12 5.2Z"
            fill="none"
            stroke="rgba(20,28,36,0.55)"
            strokeWidth="1.1"
          />
          <path
            d="M8.6 7.7 5.8 9.4l1.4 3.2M15.4 7.7l2.8 1.7-1.4 3.2M9.9 11.8 8.4 16.4h7.2l-1.5-4.6"
            fill="none"
            stroke="rgba(20,28,36,0.45)"
            strokeWidth="1.05"
          />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-cam" x1="4" y1="6" x2="20" y2="20">
              <stop offset="0%" stopColor="#7FE7EE" />
              <stop offset="100%" stopColor="#1FA8B4" />
            </linearGradient>
          </defs>
          <path
            d="M4.2 9.2h3.1l1.3-2h7l1.3 2H19.8a1.6 1.6 0 0 1 1.6 1.6v7.4a1.6 1.6 0 0 1-1.6 1.6H4.2a1.6 1.6 0 0 1-1.6-1.6v-7.4a1.6 1.6 0 0 1 1.6-1.6Z"
            fill="url(#hg-cam)"
          />
          <circle cx="12" cy="14" r="3.4" fill="#04121A" opacity="0.35" />
          <circle cx="12" cy="14" r="2.2" fill="#E7FBFD" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-cal" x1="4" y1="4" x2="20" y2="22">
              <stop offset="0%" stopColor="#9AF0F5" />
              <stop offset="100%" stopColor="#2BB8C4" />
            </linearGradient>
          </defs>
          <rect
            x="4"
            y="6"
            width="16"
            height="14"
            rx="2.6"
            fill="url(#hg-cal)"
          />
          <path d="M4 10.2h16" stroke="rgba(4,18,26,0.35)" strokeWidth="1.4" />
          <path
            d="M8 3.8v3.2M16 3.8v3.2"
            stroke="#E8FBFD"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="14.2" r="1.1" fill="rgba(4,18,26,0.55)" />
          <circle cx="12.5" cy="14.2" r="1.1" fill="rgba(4,18,26,0.55)" />
          <circle cx="16" cy="14.2" r="1.1" fill="rgba(4,18,26,0.55)" />
        </svg>
      );
    case "dining":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-din" x1="4" y1="4" x2="20" y2="20">
              <stop offset="0%" stopColor="#FFD2A8" />
              <stop offset="100%" stopColor="#D4843E" />
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="15.2" rx="7.2" ry="2.2" fill="url(#hg-din)" />
          <path
            d="M5.2 14.6c1.1-4.4 3.6-6.6 6.8-6.6s5.7 2.2 6.8 6.6"
            stroke="url(#hg-din)"
            strokeWidth="1.7"
            fill="none"
          />
          <path
            d="M8.2 4.2v5.2M7 4.2v2.8a1.2 1.2 0 0 0 2.4 0V4.2"
            stroke="#F6C08A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16.4 4.2v16"
            stroke="#F6C08A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hg-cmp" x1="4" y1="4" x2="20" y2="20">
              <stop offset="0%" stopColor="#D7C2FF" />
              <stop offset="100%" stopColor="#7A52C7" />
            </linearGradient>
          </defs>
          <rect
            x="10.4"
            y="3.4"
            width="3.2"
            height="17.2"
            rx="1.2"
            fill="url(#hg-cmp)"
          />
          <path d="M6 8.2h8.4l-1.8 3.4H7.8L6 8.2Z" fill="#8FD3FF" />
          <path d="M12.8 11.4H20l-1.7 3.2h-5.5l1.7-3.2Z" fill="#FF8F9D" />
          <path d="M7.4 15H14l-1.6 3H9L7.4 15Z" fill="#B9F06A" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path
            d="M12 3.2 13.6 8.4 18.8 10l-5.2 1.6L12 16.8l-1.6-5.2L5.2 10l5.2-1.6L12 3.2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="m3 6.8 6-2.3 6 2.3 6-2.3v12.7l-6 2.3-6-2.3-6 2.3V6.8Z" {...stroke} />
          <path d="M9 4.5v14.2M15 6.8V21" {...stroke} />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path
            d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "arrow":
    default:
      return (
        <svg {...common}>
          <path d="M5 12h13M13 6.5 18.5 12 13 17.5" {...stroke} />
        </svg>
      );
  }
}

export type HomeSectionHeadProps = {
  title: string;
  /** Lime sparkle after the title, as in the reference. */
  sparkle?: boolean;
  actionLabel?: string;
  actionGlyph?: HomeGlyphName;
  onAction?: () => void;
};

export function HomeSectionHead({
  title,
  sparkle = false,
  actionLabel,
  actionGlyph,
  onAction,
}: HomeSectionHeadProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 font-sans text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
        {title}
        {sparkle ? (
          <HomeGlyph
            name="spark"
            size={14}
            className="text-[var(--color-accent-lime)]"
          />
        ) : null}
      </h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-white/55 active:opacity-70"
        >
          {actionLabel}
          {actionGlyph ? (
            <HomeGlyph name={actionGlyph} size={12} />
          ) : (
            <span aria-hidden className="text-[15px] leading-none">
              ›
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}

export function HomeRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex gap-3 overflow-x-auto px-4 pb-0.5 scroll-pl-4 scroll-pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type HomeMomentTone = "open" | "soon" | "calm";

const MOMENT_BADGE: Record<HomeMomentTone, string> = {
  open: "bg-[#00D8E8] text-[#001219] shadow-[0_0_8px_rgba(0,216,232,0.4)]",
  soon: "bg-[#B7F22A] text-[#001219] shadow-[0_0_8px_rgba(183,242,42,0.4)]",
  calm: "bg-[#E4F224] text-[#001219] shadow-[0_0_8px_rgba(228,242,36,0.35)]",
};

const MOMENT_CTA: Record<HomeMomentTone, string> = {
  open: "bg-[image:var(--gradient-brand)] text-[#001219] shadow-[0_0_12px_rgba(0,216,232,0.35)]",
  soon: "bg-[linear-gradient(120deg,#56D93A,#B7F22A)] text-[#001219] shadow-[0_0_12px_rgba(183,242,42,0.3)]",
  calm: "bg-[linear-gradient(120deg,#E4F224,#B7F22A)] text-[#001219] shadow-[0_0_12px_rgba(228,242,36,0.3)]",
};

/** Premium 3D clay glyphs — transparent assets, never flat icons in cyan discs. */
const HOME_GLYPH_3D: Partial<Record<HomeGlyphName, string>> = {
  coffee: "/tenants/life-panoramica/glyphs/coffee.png?v=premium-ref2",
  trail: "/tenants/life-panoramica/glyphs/trail.png?v=premium-ref2",
  golf: "/tenants/life-panoramica/glyphs/golf.png?v=premium-ref2",
  calendar: "/tenants/life-panoramica/glyphs/calendar.png?v=premium-ref2",
  dining: "/tenants/life-panoramica/intents/dining.png?v=premium-ref2",
  compass: "/tenants/life-panoramica/intents/discover.png?v=premium-ref2",
  people: "/tenants/life-panoramica/glyphs/people.png?v=premium-ref9",
  ball: "/tenants/life-panoramica/glyphs/ball.png?v=premium-ref9",
  camera: "/tenants/life-panoramica/glyphs/camera.png?v=premium-ref9",
};

export type HomeMomentPerson = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type HomeMomentCardProps = {
  tone: HomeMomentTone;
  badgeLabel: string;
  glyph: HomeGlyphName;
  glyphImageUrl?: string;
  title: string;
  where: string;
  peopleLabel?: string;
  people?: ReadonlyArray<HomeMomentPerson>;
  statusLabel?: string;
  imageUrl: string;
  ctaLabel: string;
  onClick?: () => void;
  onCta?: () => void;
};

/** One open moment — full-bleed photo card with glass footer (reference Home). */
export function HomeMomentCard({
  tone,
  badgeLabel,
  glyph,
  glyphImageUrl,
  title,
  where,
  peopleLabel,
  people = [],
  statusLabel,
  imageUrl,
  ctaLabel,
  onClick,
  onCta,
}: HomeMomentCardProps) {
  const faces = people.slice(0, 3);
  const glyph3d = glyphImageUrl ?? HOME_GLYPH_3D[glyph];
  return (
    <article className="relative flex h-[200px] w-[148px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-white/12 shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,12,18,0.1) 0%, rgba(0,12,18,0.06) 40%, rgba(0,12,18,0.72) 70%, rgba(0,12,18,0.92) 100%)",
        }}
      />

      <span
        className={cn(
          "absolute left-2 top-2 z-[2] rounded-[7px] px-1.5 py-[2px] text-[9px] font-bold leading-none",
          MOMENT_BADGE[tone],
        )}
      >
        {badgeLabel}
      </span>

      <span className="absolute left-2 top-[34px] z-[2] flex h-9 w-9 items-center justify-center">
        {glyph3d ? (
          <img
            src={glyph3d}
            alt=""
            className="h-9 w-9 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
          />
        ) : (
          <HomeGlyph name={glyph} size={22} className="text-white drop-shadow" />
        )}
      </span>

      <div className="relative z-[2] mt-auto flex flex-col px-2 pb-2 pt-6">
        <button type="button" onClick={onClick} className="block w-full text-left">
          <span className="block truncate text-[12px] font-semibold leading-4 text-[#F7FAFA]">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[9px] leading-3 text-white/70">
            {where}
          </span>
        </button>

        <div className="mt-1 flex h-[14px] items-center gap-1">
          {statusLabel ? (
            <>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B7F22A]"
                aria-hidden
              />
              <span className="truncate text-[9px] leading-3 text-white/75">
                {statusLabel}
              </span>
            </>
          ) : (
            <>
              {faces.length > 0 ? (
                <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                  {faces.map((person) =>
                    person.avatarUrl ? (
                      <img
                        key={person.id}
                        src={person.avatarUrl}
                        alt=""
                        className="h-[14px] w-[14px] rounded-full object-cover ring-[1.5px] ring-[#001219]"
                      />
                    ) : (
                      <span
                        key={person.id}
                        className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white/20 text-[6px] font-bold text-white ring-[1.5px] ring-[#001219]"
                      >
                        {person.name.slice(0, 1)}
                      </span>
                    ),
                  )}
                </span>
              ) : null}
              {peopleLabel ? (
                <span className="truncate text-[8.5px] leading-3 text-white/75">
                  {peopleLabel}
                </span>
              ) : null}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onCta ?? onClick}
          className={cn(
            "mt-1.5 flex h-[24px] w-full items-center justify-between rounded-full pl-2 pr-[2px] transition-transform active:scale-[0.97]",
            MOMENT_CTA[tone],
          )}
        >
          <span className="text-[10px] font-bold leading-none">{ctaLabel}</span>
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[rgba(0,18,26,0.22)]">
            <HomeGlyph name="arrow" size={10} />
          </span>
        </button>
      </div>
    </article>
  );
}

export type HomeMoveCardTone = "green" | "cyan" | "violet" | "default";

export type HomeMoveCardProps = {
  /** @deprecated Dark-glass cards no longer use per-tone fills. Kept for API stability. */
  tone?: HomeMoveCardTone;
  glyph: HomeGlyphName;
  glyphImageUrl?: string;
  headline: string;
  meta: string;
  quote?: string;
  personName?: string;
  personAvatarUrl?: string;
  liked?: boolean;
  onClick?: () => void;
};

/** Dark-glass community movement card — pixel-faithful to the reference rail. */
export function HomeMoveCard({
  glyph,
  glyphImageUrl,
  headline,
  meta,
  quote,
  personName,
  personAvatarUrl,
  liked = false,
  onClick,
}: HomeMoveCardProps) {
  const glyph3d = glyphImageUrl ?? HOME_GLYPH_3D[glyph];
  const isPerson = Boolean(personName);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-[152px] w-[142px] min-w-[142px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.12] p-3 text-left transition-transform active:scale-[0.98]"
      style={{
        background: "rgba(255,255,255,0.04)",
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(255,255,255,0.02)",
      }}
    >
      {isPerson ? (
        <>
          <span className="flex h-10 items-start">
            {personAvatarUrl ? (
              <img
                src={personAvatarUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-[14px] font-semibold text-white">
                {(personName ?? "?").slice(0, 1)}
              </span>
            )}
          </span>
          {liked ? (
            <span
              className="absolute right-3 top-3 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
              aria-hidden
            >
              <HomeGlyph name="heart" size={14} className="text-[#FF3B5C]" />
            </span>
          ) : null}
          <span className="mt-2 line-clamp-2 font-sans text-[15px] font-semibold leading-[1.22] text-white">
            {headline}
          </span>
          {quote ? (
            <span className="mt-1 line-clamp-2 font-sans text-[12px] leading-[1.25] text-white/55">
              &ldquo;{quote}&rdquo;
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span className="flex h-10 items-center">
            {glyph3d ? (
              <img
                src={glyph3d}
                alt=""
                className="h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              />
            ) : (
              <HomeGlyph name={glyph} size={36} className="text-white/90" />
            )}
          </span>
          <span className="mt-2 line-clamp-3 font-sans text-[15px] font-semibold leading-[1.22] text-white">
            {headline}
          </span>
        </>
      )}

      <span className="mt-auto whitespace-pre-line font-sans text-[12px] leading-[1.25] text-white/45">
        {meta}
      </span>
    </button>
  );
}

export type HomeIntentTone = "plans" | "dining" | "golf" | "discover";

/** Warm metallic top fills — dining matches the copper reference card. */
const INTENT_METAL: Record<HomeIntentTone, string> = {
  plans:
    "radial-gradient(ellipse 130% 100% at 60% 8%, #7AF0F8 0%, #3BC4D0 30%, #0F5C68 68%, #041C22 100%)",
  dining:
    "radial-gradient(ellipse 130% 100% at 60% 8%, #F0D2A8 0%, #D4A574 22%, #B07A48 48%, #6E4A30 78%, #2A1C14 100%)",
  golf:
    "radial-gradient(ellipse 130% 100% at 60% 8%, #B8F08A 0%, #68C850 30%, #2E7038 68%, #0C2014 100%)",
  discover:
    "radial-gradient(ellipse 130% 100% at 60% 8%, #F0C0FF 0%, #C078E8 30%, #6E3A9E 68%, #1E1028 100%)",
};

const INTENT_GLOW: Record<HomeIntentTone, string> = {
  plans: "rgba(90, 235, 245, 0.48)",
  dining: "rgba(236, 180, 120, 0.52)",
  golf: "rgba(130, 225, 110, 0.45)",
  discover: "rgba(220, 150, 245, 0.45)",
};

const INTENT_BORDER: Record<HomeIntentTone, string> = {
  plans: "rgba(90, 220, 230, 0.22)",
  dining: "rgba(200, 160, 120, 0.32)",
  golf: "rgba(120, 200, 120, 0.22)",
  discover: "rgba(190, 140, 220, 0.24)",
};

export type HomeIntentCardProps = {
  tone: HomeIntentTone;
  glyph: HomeGlyphName;
  title: string;
  subtitle: string;
  imageUrl?: string;
  /** Optional photographic / metallic wash under the glass panel. */
  bgImageUrl?: string;
  onClick?: () => void;
};

/**
 * Intent door — exact chrome from the Comer reference:
 * metallic top, frosted glass bottom, 3D icon top-right, copy bottom-left.
 * Reference card is 218×195 → scaled to 172×154 for the Home rail.
 */
export function HomeIntentCard({
  tone,
  glyph,
  title,
  subtitle,
  imageUrl,
  bgImageUrl,
  onClick,
}: HomeIntentCardProps) {
  const glyph3d = imageUrl ?? HOME_GLYPH_3D[glyph];

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-[154px] w-[172px] min-w-[172px] shrink-0 overflow-hidden rounded-[28px] border text-left transition-transform active:scale-[0.98]"
      style={{
        background: INTENT_METAL[tone],
        borderColor: INTENT_BORDER[tone],
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.06), 0 14px 28px rgba(0,0,0,0.30)",
      }}
    >
      {bgImageUrl ? (
        <img
          src={bgImageUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-[48%] w-full object-cover opacity-65"
        />
      ) : null}

      {/* Soft depth glow / ghost behind the 3D icon */}
      <span
        className="pointer-events-none absolute right-1 top-2 h-[92px] w-[92px] rounded-full blur-[22px]"
        style={{ background: INTENT_GLOW[tone] }}
        aria-hidden
      />

      {/* 3D icon — top right, overlaps the glass edge */}
      {glyph3d ? (
        <img
          src={glyph3d}
          alt=""
          className="pointer-events-none absolute right-[-6px] top-[-4px] z-[2] h-[112px] w-[112px] object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,0.38)]"
        />
      ) : (
        <HomeGlyph
          name={glyph}
          size={82}
          className="absolute right-1 top-1 z-[2] opacity-90"
        />
      )}

      {/* Frosted glass bottom — hard top edge like the reference */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[52%]"
        style={{
          background: "rgba(8, 8, 8, 0.66)",
          backdropFilter: "blur(20px) saturate(120%)",
          WebkitBackdropFilter: "blur(20px) saturate(120%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
        aria-hidden
      />

      <div className="absolute bottom-[16px] left-[16px] z-[4] max-w-[108px]">
        <h3 className="font-sans text-[18px] font-semibold leading-none tracking-[-0.02em] text-white">
          {title}
        </h3>
        <p className="mt-[7px] whitespace-pre-line font-sans text-[13px] leading-[1.25] text-white/75">
          {subtitle.includes(" y ")
            ? subtitle.replace(" y ", " y\n")
            : subtitle}
        </p>
      </div>

      <span
        className="absolute bottom-[16px] right-[16px] z-[4] grid h-[32px] w-[32px] place-items-center rounded-full border border-white/40 bg-black/30 text-white shadow-[0_0_0_3px_rgba(255,255,255,0.06)] backdrop-blur-[10px]"
        aria-hidden
      >
        <HomeGlyph name="arrow" size={15} />
      </span>
    </button>
  );
}
export type HomeNearbyCardProps = {
  name: string;
  imageUrl: string;
  distanceLabel: string;
  statusLabel?: string;
  ratingLabel?: string;
  ratingCountLabel?: string;
  badgeLabel?: string;
  onClick?: () => void;
};

/** A place the community points at, with its quick signals. */
export function HomeNearbyCard({
  name,
  imageUrl,
  distanceLabel,
  statusLabel,
  ratingLabel,
  ratingCountLabel,
  badgeLabel,
  onClick,
}: HomeNearbyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[112px] shrink-0 overflow-hidden rounded-[16px] border border-[var(--color-border-glass)] bg-[#08222A] text-left shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform active:scale-[0.98]"
    >
      <span className="relative block h-[72px] w-full overflow-hidden bg-[#071D25]">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        {badgeLabel ? (
          <span className="absolute left-1 top-1 rounded-[6px] bg-[var(--color-accent-lime)] px-1 py-[2px] text-[7.5px] font-bold leading-none text-[var(--color-text-on-action)] shadow-[0_0_10px_rgba(182,237,36,0.65)]">
            {badgeLabel}
          </span>
        ) : null}
      </span>
      <span className="block px-1.5 pb-1.5 pt-1">
        <span className="block truncate text-[10px] font-semibold leading-3 text-white">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[8.5px] leading-3 text-white/55">
          {distanceLabel}
        </span>
        <span className="mt-0.5 flex items-center gap-1">
          {ratingLabel ? (
            <span className="flex shrink-0 items-center gap-0.5 text-[8.5px] font-semibold leading-3 text-[var(--color-feedback-warning)]">
              <HomeGlyph name="star" size={9} />
              {ratingLabel}
            </span>
          ) : null}
          {statusLabel ? (
            <span className="truncate text-[8.5px] leading-3 text-[var(--color-accent-lime)]">
              {statusLabel}
            </span>
          ) : ratingCountLabel ? (
            <span className="truncate text-[8.5px] leading-3 text-white/45">
              {ratingCountLabel}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
