/**
 * Soft premium building materials — residential luxury, not photoreal.
 * Includes facade variation for community depth.
 */

import { Color, MeshStandardMaterial } from "three";

import {
  LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL,
  type LifeMap3DBuildingMaterialHint,
} from "../buildings";

export type BuildingMaterials = {
  default: MeshStandardMaterial;
  hover: MeshStandardMaterial;
  selected: MeshStandardMaterial;
  /** Soft facade variants for residential rhythm. */
  variants: MeshStandardMaterial[];
};

const FACADE_VARIANTS = ["#d9d2c5", "#d4cbb8", "#cfc6b6", "#e0d8cc", "#c8bfb0"];

export function createBuildingMaterials(
  hint: LifeMap3DBuildingMaterialHint = {},
): BuildingMaterials {
  const color = hint.color ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.color;
  const selectedColor =
    hint.selectedColor ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.selectedColor;
  const hoverColor =
    hint.hoverColor ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.hoverColor;
  const opacity = hint.opacity ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.opacity;

  const mk = (
    hex: string,
    extra?: { emissive?: string; emissiveIntensity?: number; roughness?: number },
  ) =>
    new MeshStandardMaterial({
      color: new Color(hex),
      roughness: extra?.roughness ?? 0.68,
      metalness: 0.04,
      transparent: opacity < 1,
      opacity,
      envMapIntensity: 0.45,
      ...(extra?.emissive
        ? {
            emissive: new Color(extra.emissive),
            emissiveIntensity: extra.emissiveIntensity ?? 0.06,
          }
        : {}),
    });

  return {
    default: mk(color, { roughness: 0.7 }),
    hover: mk(hoverColor, {
      emissive: hoverColor,
      emissiveIntensity: 0.08,
      roughness: 0.58,
    }),
    selected: mk(selectedColor, {
      emissive: selectedColor,
      emissiveIntensity: 0.14,
      roughness: 0.48,
    }),
    variants: FACADE_VARIANTS.map((hex) => mk(hex, { roughness: 0.72 })),
  };
}

export function buildingVariantIndex(id: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % Math.max(count, 1);
}

export function disposeBuildingMaterials(materials: BuildingMaterials): void {
  materials.default.dispose();
  materials.hover.dispose();
  materials.selected.dispose();
  for (const v of materials.variants) v.dispose();
}
