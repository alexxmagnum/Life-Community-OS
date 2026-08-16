/**
 * Three.js adapter for {@link LifeMap3DLayer}.
 *
 * Transparent WebGL overlay above territorial MapLibre.
 * Owns volume, terrain foundation, environment, atmosphere, spatial markers.
 * Does not fetch data, replace MapLibre, or invent DEM heights.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import { resolveBuildingHeight } from "../building-height";
import {
  LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS,
  LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL,
} from "../buildings";
import type {
  LifeMap3DLayer,
  LifeMap3DLayerHost,
  LifeMap3DLayerInput,
  LifeMap3DLayerOptions,
  LifeMap3DRenderableObject,
} from "../contract";
import {
  LIFE_MAP_3D_DEFAULT_LOD_POLICY,
  LIFE_MAP_3D_MOBILE_LOD_POLICY,
  horizontalDistanceMeters,
  resolveLifeMap3DLod,
} from "../lod";
import {
  applyMapLibreViewToPerspective,
  type LifeMap3DMapLibreView,
} from "../maplibre-sync";
import {
  resolveProjectionOrigin,
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import { spatialObjectsFromSceneObjects } from "../spatial-object";
import {
  createFlatElevationSource,
  terrainBoundsFromCamera,
  type LifeMap3DElevationSource,
} from "../terrain";
import {
  createBuildingExtrusionMesh,
  disposeObject3D,
} from "./building-meshes";
import {
  createEnvironmentMaterials,
  disposeEnvironmentMaterials,
  type EnvironmentMaterials,
} from "./environment-materials";
import {
  createEnvironmentGroup,
  createEnvironmentPadMesh,
  createVegetationInstances,
} from "./environment-meshes";
import {
  createBuildingMaterials,
  disposeBuildingMaterials,
  type BuildingMaterials,
} from "./materials";
import { pickBuildingIdAt } from "./selection";
import {
  createSpatialObjectMarker,
  createSpatialObjectsGroup,
} from "./spatial-markers";
import { createFlatTerrainMesh } from "./terrain-mesh";

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
 * Create a Three.js hybrid 3D world layer.
 */
export function createThreeLifeMap3DLayer(
  options: LifeMap3DLayerOptions = {},
): LifeMap3DLayer {
  const selectable = options.selectable !== false;
  const quality = options.quality ?? "desktop";
  const softShadows = quality === "desktop";
  const showTerrain = options.showTerrain !== false;
  const showEnvironment = options.showEnvironment !== false;
  const showSpatialObjects = options.showSpatialObjects !== false;
  const pixelRatioCap =
    options.pixelRatio ?? (quality === "mobile" ? 1.5 : 2);
  const defaultHeight =
    options.defaultBuildingHeightMeters ??
    LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS;
  const elevationSource: LifeMap3DElevationSource =
    options.elevationSource ?? createFlatElevationSource();
  const lodPolicy =
    quality === "mobile"
      ? LIFE_MAP_3D_MOBILE_LOD_POLICY
      : LIFE_MAP_3D_DEFAULT_LOD_POLICY;

  let hostEl: HTMLElement | null = null;
  let renderer: WebGLRenderer | null = null;
  let threeScene: Scene | null = null;
  let perspective: PerspectiveCamera | null = null;
  let rootGroup: Group | null = null;
  let terrainGroup: Group | null = null;
  let buildingsGroup: Group | null = null;
  let environmentGroup: Group | null = null;
  let spatialGroup: Group | null = null;
  let materials: BuildingMaterials | null = null;
  let envMaterials: EnvironmentMaterials | null = null;
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
  let lastLodZoom = -1;

  const info = {
    id: options.id ?? "life-map.3d-layer.three",
    label: "Three.js Life Map 3D World (hybrid overlay)",
    capabilities: {
      supportsBuildingExtrusion: true,
      supportsSelection: selectable,
      supportsRealtimeRender: true,
      supportsTerrain: true,
      supportsEnvironment: true,
      supportsSpatialObjects: true,
      supportsLod: true,
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

  function clearGroup(group: Group | null): void {
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0];
      if (!child) break;
      group.remove(child);
      disposeObject3D(child);
    }
  }

  function clearMeshes(): void {
    clearGroup(terrainGroup);
    clearGroup(buildingsGroup);
    clearGroup(environmentGroup);
    clearGroup(spatialGroup);
    meshesById.clear();
    renderables.clear();
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
    if (!rootGroup || !materials) return;
    const amount = Math.min(1, Math.max(0, volumePresence));
    if (buildingsGroup) {
      buildingsGroup.visible = amount > 0.04;
      buildingsGroup.scale.set(1, Math.max(amount, 0.04), 1);
    }
    if (environmentGroup) {
      environmentGroup.visible = amount > 0.08;
      environmentGroup.scale.set(1, Math.max(amount * 0.85, 0.04), 1);
    }
    if (spatialGroup) {
      spatialGroup.visible = amount > 0.2;
    }
    if (terrainGroup) {
      terrainGroup.visible = amount > 0.02;
    }

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
    if (envMaterials) {
      envMaterials.water.opacity = 0.62 * Math.max(amount, 0.2);
      envMaterials.green.opacity = 0.42 * Math.max(amount, 0.2);
      envMaterials.terrain.opacity = 0.28 * Math.max(amount, 0.15);
      envMaterials.water.needsUpdate = true;
      envMaterials.green.needsUpdate = true;
      envMaterials.terrain.needsUpdate = true;
    }
  }

  function rebuild(): void {
    if (!buildingsGroup || !materials || !camera || !envMaterials) return;
    clearMeshes();

    if (!lockedOrigin) {
      lockedOrigin = resolveProjectionOrigin(camera);
    }
    const origin = lockedOrigin;
    if (!origin || !input) return;

    // Flat terrain foundation — DEM source reserved; never invent heights.
    void elevationSource;
    if (showTerrain && terrainGroup) {
      const bounds = terrainBoundsFromCamera(camera);
      if (bounds) {
        const terrain = createFlatTerrainMesh(bounds, envMaterials.terrain);
        terrainGroup.add(terrain);
        renderables.set("terrain:flat", {
          id: "terrain:flat",
          kind: "terrain",
          selectable: false,
          selected: false,
        });
      }
    }

    const camX = perspective?.position.x ?? 0;
    const camZ = perspective?.position.z ?? 0;

    const maxBuildings = quality === "mobile" ? 120 : 400;
    const buildingList =
      input.buildings.length > maxBuildings
        ? input.buildings.slice(0, maxBuildings)
        : input.buildings;

    for (const feature of buildingList) {
      const resolved = resolveBuildingHeight(feature, defaultHeight);
      const local = lngLatToLocalMeters(
        feature.footprint[0]?.[0] ?? origin.lng,
        feature.footprint[0]?.[1] ?? origin.lat,
        origin,
      );
      const distance = horizontalDistanceMeters(local.x, local.z, camX, camZ);
      const lod = resolveLifeMap3DLod(distance, lodPolicy);
      if (lod === "culled") continue;

      const mesh = createBuildingExtrusionMesh(
        feature,
        origin,
        resolved.heightMeters,
        materialForId(feature.id) ?? materials.default,
        { lod },
      );
      if (!mesh) continue;
      mesh.userData.selectable = selectable;
      mesh.castShadow = softShadows && lod === "full";
      mesh.receiveShadow = softShadows;
      buildingsGroup.add(mesh);
      meshesById.set(feature.id, mesh);
      renderables.set(feature.id, {
        id: feature.id,
        kind: "building-extrusion",
        selectable,
        selected: selectedId === feature.id,
        heightMeters: resolved.heightMeters,
        handle: mesh,
      });
    }

    if (showEnvironment && environmentGroup) {
      for (const feature of input.water ?? []) {
        const mesh = createEnvironmentPadMesh(
          feature,
          origin,
          envMaterials.water,
          0.35,
        );
        if (!mesh) continue;
        environmentGroup.add(mesh);
        renderables.set(feature.id, {
          id: feature.id,
          kind: "water-pad",
          selectable: false,
          selected: false,
          handle: mesh,
        });
      }
      for (const feature of input.green ?? []) {
        const mesh = createEnvironmentPadMesh(
          feature,
          origin,
          envMaterials.green,
          0.12,
        );
        if (!mesh) continue;
        environmentGroup.add(mesh);
        renderables.set(feature.id, {
          id: feature.id,
          kind: "green-pad",
          selectable: false,
          selected: false,
          handle: mesh,
        });
      }
      const vegetation = createVegetationInstances(
        input.green ?? [],
        origin,
        envMaterials.vegetation,
      );
      if (vegetation) {
        environmentGroup.add(vegetation);
        renderables.set("vegetation:instances", {
          id: "vegetation:instances",
          kind: "vegetation",
          selectable: false,
          selected: false,
          handle: vegetation,
        });
      }
    }

    if (showSpatialObjects && spatialGroup) {
      const fromInput = input.spatialObjects ?? [];
      const fromScene = spatialObjectsFromSceneObjects(
        (input.scene.objects ?? []) as Parameters<
          typeof spatialObjectsFromSceneObjects
        >[0],
      );
      const seen = new Set<string>();
      const merged = [...fromInput, ...fromScene];
      const maxMarkers = quality === "mobile" ? 24 : 80;
      let count = 0;
      for (const obj of merged) {
        if (seen.has(obj.id)) continue;
        seen.add(obj.id);
        if (count >= maxMarkers) break;
        count += 1;
        const marker = createSpatialObjectMarker(obj, origin);
        spatialGroup.add(marker);
        renderables.set(obj.id, {
          id: obj.id,
          kind: "spatial-marker",
          selectable: obj.interactionType !== "none",
          selected: selectedId === obj.id,
          handle: marker,
        });
      }
    }

    const frame = camera.frame;
    const latSpan = frame
      ? Math.max((frame.north - frame.south) * 111_320, 1)
      : 400;
    if (perspective && !lockedOrigin) {
      applyCameraToPerspective(perspective, camera, latSpan);
    }
    applyVolumePresence();
  }

  return {
    info,

    mount(host) {
      hostEl = resolveHostElement(host);
      hostEl.style.position = hostEl.style.position || "relative";

      materials = createBuildingMaterials(options.buildingMaterial);
      envMaterials = createEnvironmentMaterials();

      threeScene = new Scene();
      threeScene.background = null;
      threeScene.fog = new FogExp2(0xe8e4d8, quality === "mobile" ? 0.0018 : 0.0012);

      perspective = new PerspectiveCamera(50, 1, 1, 50_000);
      rootGroup = new Group();
      rootGroup.name = "life-map-3d-world";
      threeScene.add(rootGroup);

      terrainGroup = new Group();
      terrainGroup.name = "life-map-3d-terrain";
      buildingsGroup = new Group();
      buildingsGroup.name = "life-map-3d-buildings";
      environmentGroup = createEnvironmentGroup();
      spatialGroup = createSpatialObjectsGroup();
      rootGroup.add(terrainGroup);
      rootGroup.add(environmentGroup);
      rootGroup.add(buildingsGroup);
      rootGroup.add(spatialGroup);

      threeScene.add(new HemisphereLight(0xf5f1e8, 0xb8a990, 0.62));
      threeScene.add(new AmbientLight(0xffffff, 0.3));
      const sun = new DirectionalLight(
        0xfff4e6,
        quality === "mobile" ? 0.72 : 0.95,
      );
      sun.position.set(160, 280, 100);
      if (softShadows) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 900;
        sun.shadow.camera.left = -260;
        sun.shadow.camera.right = 260;
        sun.shadow.camera.top = 260;
        sun.shadow.camera.bottom = -260;
        sun.shadow.bias = -0.0002;
      }
      threeScene.add(sun);

      renderer = new WebGLRenderer({
        antialias: quality === "desktop",
        alpha: true,
        powerPreference:
          quality === "mobile" ? "low-power" : "high-performance",
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
      rootGroup = null;
      terrainGroup = null;
      buildingsGroup = null;
      environmentGroup = null;
      spatialGroup = null;
      hostEl = null;
    },

    setInput(next) {
      input = next;
      camera = next.camera;
      if (renderer) rebuild();
      else {
        renderables.clear();
        for (const feature of next.buildings) {
          const resolved = resolveBuildingHeight(feature, defaultHeight);
          renderables.set(feature.id, {
            id: feature.id,
            kind: "building-extrusion",
            selectable,
            selected: selectedId === feature.id,
            heightMeters: resolved.heightMeters,
          });
        }
      }
    },

    setCamera(next) {
      camera = next;
      if (input) input = { ...input, camera: next };
      if (renderer && perspective && camera && !lockedOrigin) {
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
      const id = pickBuildingIdAt(ndcX, ndcY, perspective, [
        buildingsGroup,
        ...(spatialGroup ? [spatialGroup] : []),
      ]);
      if (!id) return null;
      return renderables.get(id) ?? null;
    },

    syncMapLibreView(view: LifeMap3DMapLibreView) {
      if (!perspective || !lockedOrigin) return;
      applyMapLibreViewToPerspective(
        perspective,
        {
          ...view,
          viewportHeightPx:
            view.viewportHeightPx ?? hostEl?.clientHeight ?? 480,
        },
        lockedOrigin,
      );
      // Refresh LOD when zoom moves enough (SaaS scale safety).
      if (Math.abs(view.zoom - lastLodZoom) >= 0.4) {
        lastLodZoom = view.zoom;
        if (input && camera) rebuild();
      }
    },

    dispose() {
      this.unmount();
      if (materials) disposeBuildingMaterials(materials);
      materials = null;
      if (envMaterials) disposeEnvironmentMaterials(envMaterials);
      envMaterials = null;
      input = null;
      camera = null;
      lockedOrigin = null;
      selectedId = null;
      hoveredId = null;
      volumePresence = 1;
      lastLodZoom = -1;
      renderables.clear();
      meshesById.clear();
    },
  };
}
