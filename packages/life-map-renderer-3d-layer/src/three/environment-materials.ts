/**
 * Environment materials — resort water, soft green, terrain.
 */

import { Color, MeshStandardMaterial } from "three";

export type EnvironmentMaterials = {
  water: MeshStandardMaterial;
  green: MeshStandardMaterial;
  vegetationCanopy: MeshStandardMaterial;
  vegetationTrunk: MeshStandardMaterial;
  terrain: MeshStandardMaterial;
};

export function createEnvironmentMaterials(options?: {
  waterColor?: string;
  greenColor?: string;
  terrainColor?: string;
}): EnvironmentMaterials {
  const waterColor = options?.waterColor ?? "#5f9bb8";
  const greenColor = options?.greenColor ?? "#7fa56e";
  const terrainColor = options?.terrainColor ?? "#e4dfd0";

  return {
    water: new MeshStandardMaterial({
      color: new Color(waterColor),
      roughness: 0.12,
      metalness: 0.42,
      transparent: true,
      opacity: 0.68,
      envMapIntensity: 1.1,
    }),
    green: new MeshStandardMaterial({
      color: new Color(greenColor),
      roughness: 0.86,
      metalness: 0.02,
      transparent: true,
      opacity: 0.5,
    }),
    vegetationCanopy: new MeshStandardMaterial({
      color: new Color("#6a8f5c"),
      roughness: 0.78,
      metalness: 0.02,
    }),
    vegetationTrunk: new MeshStandardMaterial({
      color: new Color("#8a7358"),
      roughness: 0.9,
      metalness: 0.02,
    }),
    terrain: new MeshStandardMaterial({
      color: new Color(terrainColor),
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.32,
    }),
  };
}

export function disposeEnvironmentMaterials(
  materials: EnvironmentMaterials,
): void {
  materials.water.dispose();
  materials.green.dispose();
  materials.vegetationCanopy.dispose();
  materials.vegetationTrunk.dispose();
  materials.terrain.dispose();
}
