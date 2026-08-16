/**
 * Soft premium building materials — Apple Vision / spatial, not photoreal.
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
      roughness: 0.72,
      metalness: 0.05,
      transparent: opacity < 1,
      opacity,
      envMapIntensity: 0.4,
    }),
    hover: new MeshStandardMaterial({
      color: new Color(hoverColor),
      roughness: 0.62,
      metalness: 0.07,
      transparent: opacity < 1,
      opacity: Math.min(1, opacity + 0.03),
      emissive: new Color(hoverColor),
      emissiveIntensity: 0.07,
    }),
    selected: new MeshStandardMaterial({
      color: new Color(selectedColor),
      roughness: 0.5,
      metalness: 0.1,
      transparent: opacity < 1,
      opacity: Math.min(1, opacity + 0.05),
      emissive: new Color(selectedColor),
      emissiveIntensity: 0.14,
    }),
  };
}

export function disposeBuildingMaterials(materials: BuildingMaterials): void {
  materials.default.dispose();
  materials.hover.dispose();
  materials.selected.dispose();
}
