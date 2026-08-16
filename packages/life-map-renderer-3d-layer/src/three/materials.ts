/**
 * Soft resort building materials for the Three.js 3D layer.
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
};

export function createBuildingMaterials(
  hint: LifeMap3DBuildingMaterialHint = {},
): BuildingMaterials {
  const color = hint.color ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.color;
  const selectedColor =
    hint.selectedColor ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.selectedColor;
  const hoverColor =
    hint.hoverColor ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.hoverColor;
  const opacity = hint.opacity ?? LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.opacity;

  return {
    default: new MeshStandardMaterial({
      color: new Color(color),
      roughness: 0.78,
      metalness: 0.04,
      transparent: opacity < 1,
      opacity,
      envMapIntensity: 0.35,
    }),
    hover: new MeshStandardMaterial({
      color: new Color(hoverColor),
      roughness: 0.68,
      metalness: 0.06,
      transparent: opacity < 1,
      opacity: Math.min(1, opacity + 0.03),
      emissive: new Color(hoverColor),
      emissiveIntensity: 0.06,
    }),
    selected: new MeshStandardMaterial({
      color: new Color(selectedColor),
      roughness: 0.55,
      metalness: 0.08,
      transparent: opacity < 1,
      opacity: Math.min(1, opacity + 0.04),
      emissive: new Color(selectedColor),
      emissiveIntensity: 0.12,
    }),
  };
}

export function disposeBuildingMaterials(materials: BuildingMaterials): void {
  materials.default.dispose();
  materials.hover.dispose();
  materials.selected.dispose();
}
