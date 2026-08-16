/**
 * Three.js adapter for {@link LifeMap3DLayer}.
 *
 * Transparent WebGL overlay intended to sit above a territorial MapLibre map.
 * Does not fetch data, does not replace MapLibre, does not know tenants.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import {
  LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS,
  LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL,
  type LifeMap3DBuildingFeature,
} from "../buildings";
import type {
  LifeMap3DLayer,
  LifeMap3DLayerHost,
  LifeMap3DLayerInput,
  LifeMap3DLayerOptions,
  LifeMap3DRenderableObject,
} from "../contract";
import { resolveProjectionOrigin, type LifeMap3DProjectionOrigin } from "../projection";
import {
  applyMapLibreViewToPerspective,
  type LifeMap3DMapLibreView,
} from "../maplibre-sync";
import {
  createBuildingExtrusionMesh,
  disposeObject3D,
} from "./building-meshes";
import {
  createBuildingMaterials,
  disposeBuildingMaterials,
  type BuildingMaterials,
} from "./materials";
import { pickBuildingIdAt } from "./selection";

function resolveHostElement(host: LifeMap3DLayerHost): HTMLElement {
  if (host.element instanceof HTMLElement) return host.element;
  if (host.elementId) {
    const el = document.getElementById(host.elementId);
    if (!el) {
      throw new Error(
        `[life-map-renderer-3d-layer] Host element #${host.elementId} not found`,
      );
    }
    return el;
  }
  throw new Error(
    "[life-map-renderer-3d-layer] mount() requires host.element or host.elementId",
  );
}

function applyCameraToPerspective(
  perspective: PerspectiveCamera,
  camera: LifeMapRendererCamera,
  originLatSpan: number,
): void {
  const distance = camera.pose.distance ?? 1400;
  const pitch = ((camera.pose.pitchDegrees ?? 45) * Math.PI) / 180;
  const heading = ((camera.pose.headingDegrees ?? 0) * Math.PI) / 180;

  // Keep overlay framing roughly aligned with neighbourhood scale.
  const radius = Math.max(distance * 0.35, originLatSpan * 0.6, 80);
  perspective.position.set(
    Math.sin(heading) * radius * Math.cos(pitch),
    Math.max(radius * Math.sin(pitch), 40),
    Math.cos(heading) * radius * Math.cos(pitch),
  );
  perspective.lookAt(0, 0, 0);
  perspective.updateProjectionMatrix();
}

/**
 * Create a Three.js hybrid 3D layer (building extrusions + selection).
 */
export function createThreeLifeMap3DLayer(
  options: LifeMap3DLayerOptions = {},
): LifeMap3DLayer {
  const selectable = options.selectable !== false;
  const quality = options.quality ?? "desktop";
  const softShadows = quality === "desktop";
  const pixelRatioCap =
    options.pixelRatio ?? (quality === "mobile" ? 1.5 : 2);
  const defaultHeight =
    options.defaultBuildingHeightMeters ??
    LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS;

  let hostEl: HTMLElement | null = null;
  let renderer: WebGLRenderer | null = null;
  let threeScene: Scene | null = null;
  let perspective: PerspectiveCamera | null = null;
  let buildingsGroup: Group | null = null;
  let materials: BuildingMaterials | null = null;
  let raf = 0;
  let resizeObserver: ResizeObserver | null = null;

  let input: LifeMap3DLayerInput | null = null;
  let camera: LifeMapRendererCamera | null = null;
  let selectedId: string | null = null;
  let hoveredId: string | null = null;
  let volumePresence = 1;
  let lockedOrigin: LifeMap3DProjectionOrigin | null = null;
  let renderables = new Map<string, LifeMap3DRenderableObject>();
  let meshesById = new Map<string, ReturnType<typeof createBuildingExtrusionMesh>>();

  const info = {
    id: options.id ?? "life-map.3d-layer.three",
    label: "Three.js Life Map 3D Layer (hybrid overlay)",
    capabilities: {
      supportsBuildingExtrusion: true,
      supportsSelection: selectable,
      supportsRealtimeRender: true,
    },
  } as const;

  function resize(): void {
    if (!hostEl || !renderer || !perspective) return;
    const w = Math.max(hostEl.clientWidth, 1);
    const h = Math.max(hostEl.clientHeight, 1);
    renderer.setSize(w, h, false);
    perspective.aspect = w / h;
    perspective.updateProjectionMatrix();
  }

  function loop(): void {
    raf = requestAnimationFrame(loop);
    if (!renderer || !threeScene || !perspective) return;
    renderer.render(threeScene, perspective);
  }

  function clearMeshes(): void {
    if (!buildingsGroup) return;
    for (const mesh of meshesById.values()) {
      if (!mesh) continue;
      buildingsGroup.remove(mesh);
      disposeObject3D(mesh);
      mesh.geometry.dispose();
    }
    meshesById.clear();
    renderables.clear();
  }

  function rebuild(): void {
    if (!buildingsGroup || !materials || !camera) return;
    clearMeshes();

    if (!lockedOrigin) {
      lockedOrigin = resolveProjectionOrigin(camera);
    }
    const origin = lockedOrigin;
    if (!origin || !input) return;

    const buildings: readonly LifeMap3DBuildingFeature[] = input.buildings;
    for (const feature of buildings) {
      const height = feature.heightMeters ?? defaultHeight;
      const mesh = createBuildingExtrusionMesh(
        feature,
        origin,
        height,
        materialForId(feature.id) ?? materials.default,
      );
      if (!mesh) continue;
      mesh.userData.selectable = selectable;
      mesh.castShadow = softShadows;
      mesh.receiveShadow = softShadows;
      buildingsGroup.add(mesh);
      meshesById.set(feature.id, mesh);
      renderables.set(feature.id, {
        id: feature.id,
        kind: "building-extrusion",
        selectable,
        selected: selectedId === feature.id,
        heightMeters: height,
        handle: mesh,
      });
    }

    const frame = camera.frame;
    const latSpan = frame
      ? Math.max((frame.north - frame.south) * 111_320, 1)
      : 400;
    applyCameraToPerspective(perspective!, camera, latSpan);
    applyVolumePresence();
  }

  function materialForId(id: string) {
    if (!materials) return null;
    if (selectedId === id) return materials.selected;
    if (hoveredId === id) return materials.hover;
    return materials.default;
  }

  function applySelectionMaterials(): void {
    if (!materials) return;
    for (const [id, mesh] of meshesById) {
      if (!mesh) continue;
      const mat = materialForId(id);
      if (mat) mesh.material = mat;
      const r = renderables.get(id);
      if (r) {
        renderables.set(id, { ...r, selected: selectedId === id });
      }
    }
  }

  function applyVolumePresence(): void {
    if (!buildingsGroup || !materials) return;
    const amount = Math.min(1, Math.max(0, volumePresence));
    buildingsGroup.visible = amount > 0.04;
    buildingsGroup.scale.set(1, Math.max(amount, 0.04), 1);
    const baseOpacity =
      options.buildingMaterial?.opacity ??
      LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL.opacity;
    const opacity = baseOpacity * Math.max(amount, 0.15);
    for (const mat of [
      materials.default,
      materials.hover,
      materials.selected,
    ]) {
      mat.opacity = opacity;
      mat.transparent = opacity < 1;
      mat.needsUpdate = true;
    }
  }

  return {
    info,

    mount(host) {
      hostEl = resolveHostElement(host);
      hostEl.style.position = hostEl.style.position || "relative";

      materials = createBuildingMaterials(options.buildingMaterial);

      threeScene = new Scene();
      threeScene.background = null;

      perspective = new PerspectiveCamera(50, 1, 1, 50_000);
      buildingsGroup = new Group();
      buildingsGroup.name = "life-map-3d-buildings";
      threeScene.add(buildingsGroup);

      // Soft resort atmosphere — hemisphere sky/ground + gentle sun.
      threeScene.add(new HemisphereLight(0xf2efe6, 0xc4b8a4, 0.55));
      threeScene.add(new AmbientLight(0xffffff, 0.28));
      const sun = new DirectionalLight(0xfff6e8, quality === "mobile" ? 0.7 : 0.9);
      sun.position.set(140, 260, 90);
      if (softShadows) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 800;
        sun.shadow.camera.left = -220;
        sun.shadow.camera.right = 220;
        sun.shadow.camera.top = 220;
        sun.shadow.camera.bottom = -220;
        sun.shadow.bias = -0.0002;
      }
      threeScene.add(sun);

      renderer = new WebGLRenderer({
        antialias: quality === "desktop",
        alpha: true,
        powerPreference: quality === "mobile" ? "low-power" : "high-performance",
      });
      renderer.setClearColor(new Color(0x000000), 0);
      renderer.setPixelRatio(
        Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          pixelRatioCap,
        ),
      );
      if (softShadows) {
        renderer.shadowMap.enabled = true;
      }
      const canvas = renderer.domElement;
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.dataset.lifeMap3dLayer = "three";
      hostEl.appendChild(canvas);

      resize();
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(hostEl);

      if (input && camera) rebuild();
      cancelAnimationFrame(raf);
      loop();
    },

    unmount() {
      cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver?.disconnect();
      resizeObserver = null;
      clearMeshes();
      if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
      }
      renderer = null;
      threeScene = null;
      perspective = null;
      buildingsGroup = null;
      hostEl = null;
    },

    setInput(next) {
      input = next;
      camera = next.camera;
      if (renderer) rebuild();
      else {
        // Pre-mount: remember features only.
        renderables.clear();
        for (const feature of next.buildings) {
          renderables.set(feature.id, {
            id: feature.id,
            kind: "building-extrusion",
            selectable,
            selected: selectedId === feature.id,
            heightMeters: feature.heightMeters ?? defaultHeight,
          });
        }
      }
    },

    setCamera(next) {
      camera = next;
      if (input) input = { ...input, camera: next };
      if (renderer && perspective && camera) {
        const frame = camera.frame;
        const latSpan = frame
          ? Math.max((frame.north - frame.south) * 111_320, 1)
          : 400;
        applyCameraToPerspective(perspective, camera, latSpan);
      }
    },

    getRenderables() {
      return [...renderables.values()];
    },

    setSelected(objectId) {
      selectedId = objectId;
      applySelectionMaterials();
    },

    getSelected() {
      return selectedId;
    },

    setHovered(objectId) {
      hoveredId = objectId;
      applySelectionMaterials();
    },

    getHovered() {
      return hoveredId;
    },

    setVolumePresence(amount) {
      volumePresence = amount;
      applyVolumePresence();
    },

    pickAt(ndcX, ndcY) {
      if (!selectable || !perspective || !buildingsGroup) return null;
      if (volumePresence < 0.08) return null;
      const id = pickBuildingIdAt(ndcX, ndcY, perspective, [buildingsGroup]);
      if (!id) return null;
      return renderables.get(id) ?? null;
    },

    syncMapLibreView(view: LifeMap3DMapLibreView) {
      if (!perspective || !lockedOrigin) return;
      applyMapLibreViewToPerspective(perspective, {
        ...view,
        viewportHeightPx:
          view.viewportHeightPx ?? hostEl?.clientHeight ?? 480,
      }, lockedOrigin);
    },

    dispose() {
      this.unmount();
      if (materials) disposeBuildingMaterials(materials);
      materials = null;
      input = null;
      camera = null;
      lockedOrigin = null;
      selectedId = null;
      hoveredId = null;
      volumePresence = 1;
      renderables.clear();
      meshesById.clear();
    },
  };
}
