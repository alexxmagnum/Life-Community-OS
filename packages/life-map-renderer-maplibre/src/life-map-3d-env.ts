const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

/** Opt-in 3D accents via NEXT_PUBLIC_LIFE_MAP_3D=1 (set by web host). */
export function isLifeMap3dAccentEnabled(): boolean {
  return runtime.process?.env?.NEXT_PUBLIC_LIFE_MAP_3D === "1";
}
