/**
 * Environment materials — resort water, living green, soft terrain.
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
  const waterColor = options?.waterColor ?? "#2a7fad";
  const greenColor = options?.greenColor ?? "#569648";
  const terrainColor = options?.terrainColor ?? "#c5d4b0";

  return {
    water: new MeshStandardMaterial({
      color: new Color(waterColor),
      roughness: 0.06,
      metalness: 0.52,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.35,
    }),
    green: new MeshStandardMaterial({
      color: new Color(greenColor),
      roughness: 0.78,
      metalness: 0.02,
      transparent: true,
      opacity: 0.66,
    }),
    vegetationCanopy: new MeshStandardMaterial({
      color: new Color("#458840"),
      roughness: 0.72,
      metalness: 0.02,
    }),
    vegetationTrunk: new MeshStandardMaterial({
      color: new Color("#7a634c"),
      roughness: 0.88,
      metalness: 0.02,
    }),
    terrain: new MeshStandardMaterial({
      color: new Color(terrainColor),
      roughness: 0.92,
      metalness: 0.02,
      transparent: true,
      opacity: 0.28,
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
