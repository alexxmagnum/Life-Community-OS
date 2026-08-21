/**
 * Optional glTF load pipeline for Life Map spatial objects.
 * Templates are cached and cloned per instance — never share a live scene graph.
 * Soft-fails to null when path missing or load fails.
 */

import { Group, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const templateCache = new Map<string, Promise<Group | null>>();

export function shouldBindGltfToMarker(input: {
  modelPath?: string;
  visible?: boolean;
}): boolean {
  if (input.visible === false) return false;
  const path = input.modelPath?.toLowerCase() ?? "";
  return path.endsWith(".glb") || path.endsWith(".gltf");
}

export function loadLifeMapGltfModel(
  modelPath: string,
  cdnBaseUrl?: string,
): Promise<Group | null> {
  const url =
    cdnBaseUrl && modelPath.startsWith("/")
      ? `${cdnBaseUrl.replace(/\/$/, "")}${modelPath}`
      : modelPath;

  let templatePromise = templateCache.get(url);
  if (!templatePromise) {
    templatePromise = new Promise<Group | null>((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const root = new Group();
          root.name = `gltf-template:${modelPath}`;
          root.add(gltf.scene);
          resolve(root);
        },
        undefined,
        () => resolve(null),
      );
    });
    templateCache.set(url, templatePromise);
  }

  return templatePromise.then((template) => {
    if (!template) return null;
    const instance = template.clone(true);
    instance.name = `gltf:${modelPath}`;
    return instance;
  });
}

export function clearLifeMapGltfCache(): void {
  for (const pending of templateCache.values()) {
    void pending.then((root) => {
      if (root) disposeLoadedGltf(root);
    });
  }
  templateCache.clear();
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
