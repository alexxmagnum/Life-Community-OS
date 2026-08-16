/**
 * Environment materials — water depth cue + soft vegetation (premium spatial, not photo-real).
 */

import { Color, MeshStandardMaterial } from "three";

export type EnvironmentMaterials = {
  water: MeshStandardMaterial;
  green: MeshStandardMaterial;
  vegetation: MeshStandardMaterial;
  terrain: MeshStandardMaterial;
};

export function createEnvironmentMaterials(options?: {
  waterColor?: string;
  greenColor?: string;
  terrainColor?: string;
}): EnvironmentMaterials {
  const waterColor = options?.waterColor ?? "#6ba8c4";
  const greenColor = options?.greenColor ?? "#8faf7a";
  const terrainColor = options?.terrainColor ?? "#e8e4d8";

  return {
    water: new MeshStandardMaterial({
      color: new Color(waterColor),
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.62,
      envMapIntensity: 0.8,
    }),
    green: new MeshStandardMaterial({
      color: new Color(greenColor),
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 0.42,
    }),
    vegetation: new MeshStandardMaterial({
      color: new Color("#6d8f5c"),
      roughness: 0.82,
      metalness: 0.02,
    }),
    terrain: new MeshStandardMaterial({
      color: new Color(terrainColor),
      roughness: 0.94,
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
  materials.vegetation.dispose();
  materials.terrain.dispose();
}
