"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { asset, getAsset, hasAsset } from "@life-community-os/assets";
import {
  PROFESSIONALS_HEADER_ART_URL,
  PROFESSIONAL_TRADES,
  type ProfessionalTrade,
} from "@life-community-os/tenant-life-panoramica";
import {
  AssetPad,
  FlowScreenHeader,
  MobileScreen,
  type AssetPadTone,
} from "@life-community-os/ui";

/**
 * Caller-owned tones for professional trade pads.
 * AssetPad stays category-agnostic — never maps trade id → color internally.
 */
const PROFESSIONAL_TRADE_TONES: Record<string, AssetPadTone> = {
  gardening: "green",
  cleaning: "cyan",
  repairs: "copper",
  electrician: "blue",
  plumber: "teal",
  carpenter: "copper",
  painter: "purple",
  "locksmith-service": "berry",
  "air-conditioning": "cyan",
  "veterinary-doctor": "green",
  waiter: "purple",
};

const TONE_CYCLE: AssetPadTone[] = [
  "green",
  "cyan",
  "copper",
  "blue",
  "purple",
  "berry",
  "teal",
];

function toneForTrade(trade: ProfessionalTrade, index: number): AssetPadTone {
  return (
    PROFESSIONAL_TRADE_TONES[trade.id] ??
    TONE_CYCLE[index % TONE_CYCLE.length] ??
    "neutral"
  );
}

/**
 * Resolve CARD only. Scenes / symbols / objects never fill a pad.
 * Missing or absent CARD → undefined → AssetPad placeholder.
 */
function resolveTradeCardSrc(trade: ProfessionalTrade): string | undefined {
  const key = trade.cardAssetKey;
  if (!key || !hasAsset(key)) return undefined;
  const meta = getAsset(key);
  if (meta.type !== "card") return undefined;
  return asset(key);
}

/**
 * Professionals hub — index of trade pads (AssetPad shared primitive).
 * Does not implement individual trade pages or SCENEs.
 */
export function ProfessionalsHubScreen() {
  const router = useRouter();

  const entries = useMemo(
    () =>
      PROFESSIONAL_TRADES.map((trade, index) => ({
        trade,
        tone: toneForTrade(trade, index),
        assetSrc: resolveTradeCardSrc(trade),
      })),
    [],
  );

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Profesionales"
        onBack={() => router.push("/services")}
        onExit={() => router.push("/")}
      />

      <div className="-mt-10 flex flex-col gap-1">
        <div className="flex justify-center">
          <img
            src={PROFESSIONALS_HEADER_ART_URL}
            alt=""
            draggable={false}
            className="h-[280px] w-auto max-w-full object-contain object-bottom"
          />
        </div>
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 md:max-w-[720px]">
        {entries.map(({ trade, tone, assetSrc }, index) => (
          <li key={trade.id} className="min-w-0">
            <AssetPad
              assetSrc={assetSrc}
              title={trade.label}
              meta={trade.description}
              tone={tone}
              staggerIndex={index}
              onClick={() =>
                router.push(`/services/professionals/${trade.id}`)
              }
            />
          </li>
        ))}
      </ul>
    </MobileScreen>
  );
}
