/**
 * Optional glTF load pipeline for Life Map spatial objects.
 * Soft-fails to null when path missing or load fails — procedural fallback.
 */

import { Group, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const cache = new Map<string, Promise<Group | null>>();

export function loadLifeMapGltfModel(
  modelPath: string,
  cdnBaseUrl?: string,
): Promise<Group | null> {
  const url =
    cdnBaseUrl && modelPath.startsWith("/")
      ? `${cdnBaseUrl.replace(/\/$/, "")}${modelPath}`
      : modelPath;

  const existing = cache.get(url);
  if (existing) return existing;

  const promise = new Promise<Group | null>((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const root = new Group();
        root.name = `gltf:${modelPath}`;
        root.add(gltf.scene);
        resolve(root);
      },
      undefined,
      () => resolve(null),
    );
  });

  cache.set(url, promise);
  return promise;
}

export function clearLifeMapGltfCache(): void {
  cache.clear();
}

export function disposeLoadedGltf(root: Object3D): void {
  root.traverse((child) => {
    const mesh = child as {
      isMesh?: boolean;
      geometry?: { dispose: () => void };
      material?: { dispose: () => void } | { dispose: () => void }[];
    };
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      for (const m of mesh.material) m.dispose();
    } else {
      mesh.material?.dispose();
    }
  });
}
