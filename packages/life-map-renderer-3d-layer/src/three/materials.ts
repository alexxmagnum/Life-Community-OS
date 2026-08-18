/**
 * Soft premium building materials — residential luxury, warm contrast.
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
  variants: MeshStandardMaterial[];
};

const FACADE_VARIANTS = ["#b5a288", "#a89878", "#c0ae90", "#9e8e72", "#b8a480"];

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
      roughness: extra?.roughness ?? 0.62,
      metalness: 0.06,
      transparent: opacity < 1,
      opacity,
      envMapIntensity: 0.55,
      ...(extra?.emissive
        ? {
            emissive: new Color(extra.emissive),
            emissiveIntensity: extra.emissiveIntensity ?? 0.07,
          }
        : {}),
    });

  return {
    default: mk(color, { roughness: 0.64 }),
    hover: mk(hoverColor, {
      emissive: hoverColor,
      emissiveIntensity: 0.1,
      roughness: 0.52,
    }),
    selected: mk(selectedColor, {
      emissive: selectedColor,
      emissiveIntensity: 0.16,
      roughness: 0.44,
    }),
    variants: FACADE_VARIANTS.map((hex) => mk(hex, { roughness: 0.66 })),
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
