import { NextResponse } from "next/server";
import { createAddressGeocoder } from "@life-community-os/address-geocoder";

/**
 * Server-side geocode proxy — Nominatim (or configured provider).
 * Keeps User-Agent / rate policy on the server; browsers call this route.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("q")?.trim() ?? "";
  const country = url.searchParams.get("country")?.trim();
  const language = url.searchParams.get("language")?.trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 5;

  if (!address) {
    return NextResponse.json(
      { error: "q (address) is required", results: [], result: null },
      { status: 400 },
    );
  }

  const provider =
    process.env.ADDRESS_GEOCODER_PROVIDER?.trim() ||
    process.env.NEXT_PUBLIC_ADDRESS_GEOCODER_PROVIDER?.trim() ||
    "nominatim";

  const geocoder = createAddressGeocoder({
    provider,
    endpoint: process.env.ADDRESS_GEOCODER_ENDPOINT,
    userAgent:
      process.env.ADDRESS_GEOCODER_USER_AGENT ??
      "LifeCommunityOS/0.1 (api/geocode; location-foundation)",
  });

  try {
    const results = geocoder.search
      ? await geocoder.search({ address, country, language, limit })
      : [];
    const result =
      results[0] ??
      (await geocoder.geocode({ address, country, language, limit: 1 }));

    return NextResponse.json({
      provider: geocoder.providerId,
      result: result ?? null,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "geocode_failed",
        result: null,
        results: [],
      },
      { status: 502 },
    );
  }
}
