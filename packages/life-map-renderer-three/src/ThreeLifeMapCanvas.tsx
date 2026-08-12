"use client";

/**
 * React Three Fiber prototype canvas — same visual language as the
 * imperative ThreeLifeMapRenderer. Not wired to /map.
 */

import { Canvas, useThree } from "@react-three/fiber";
import type {
  LifeMapRenderableObject,
  LifeMapRendererCamera,
  LifeMapScene,
} from "@life-community-os/life-map-renderer";
import type { LifeMapObjectType } from "@life-community-os/types";
import { useLayoutEffect, type CSSProperties, type ReactNode } from "react";

import { lifeMapCameraToThreePose } from "./camera-adapter";
import { THREE_LIFE_MAP_PALETTE as P } from "./palette";
import { lifeMapPositionToThree } from "./position";

function objectColor(state: LifeMapRenderableObject["state"]): string {
  if (state === "active") return P.objectActive;
  if (state === "unavailable") return P.objectMuted;
  return P.objectIdle;
}

function yOffsetForType(type: LifeMapObjectType): number {
  switch (type) {
    case "housing":
      return 0.7;
    case "place":
      return 0.55;
    case "official":
      return 1.1;
    case "resource":
      return 0.28;
    case "experience":
      return 1.05;
    default:
      return 0.7;
  }
}

function PlaceholderGeometry({ type }: { type: LifeMapObjectType }) {
  switch (type) {
    case "housing":
      return <boxGeometry args={[2.2, 1.4, 2.2]} />;
    case "place":
      return <cylinderGeometry args={[1.05, 1.2, 1.1, 24]} />;
    case "service":
      return <boxGeometry args={[1.6, 1.6, 1.6]} />;
    case "experience":
      return <sphereGeometry args={[1.05, 28, 20]} />;
    case "resource":
      return <boxGeometry args={[2.4, 0.55, 2.4]} />;
    case "official":
      return <cylinderGeometry args={[0.85, 0.85, 2.2, 20]} />;
    default:
      return <boxGeometry args={[1.4, 1.4, 1.4]} />;
  }
}

function PlaceholderObject({ object }: { object: LifeMapRenderableObject }) {
  if (object.state === "hidden") return null;
  const pos = lifeMapPositionToThree(object.position);

  return (
    <mesh
      position={[pos.x, pos.y + yOffsetForType(object.type), pos.z]}
      castShadow
      receiveShadow
    >
      <PlaceholderGeometry type={object.type} />
      <meshStandardMaterial
        color={objectColor(object.state)}
        roughness={0.72}
        metalness={0.08}
      />
    </mesh>
  );
}

function TerritoryGround() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={P.ground} roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[228, 228]} />
        <meshStandardMaterial
          color={P.groundRim}
          roughness={1}
          metalness={0}
          transparent
          opacity={0.55}
        />
      </mesh>
    </>
  );
}

function SoftLights() {
  return (
    <>
      <ambientLight color={P.ambient} intensity={0.42} />
      <hemisphereLight args={[P.keyLight, P.ground, 0.35]} />
      <directionalLight
        color={P.keyLight}
        intensity={1.05}
        position={[18, 28, 12]}
        castShadow
      />
      <directionalLight
        color={P.fillLight}
        intensity={0.35}
        position={[-14, 10, -8]}
      />
      <directionalLight
        color={P.rimLight}
        intensity={0.28}
        position={[-6, 8, 20]}
      />
    </>
  );
}

function CameraRig({ camera }: { camera: LifeMapRendererCamera }) {
  const { camera: threeCamera } = useThree();
  useLayoutEffect(() => {
    const pose = lifeMapCameraToThreePose(camera);
    threeCamera.position.copy(pose.position);
    threeCamera.lookAt(pose.lookAt);
    threeCamera.updateProjectionMatrix();
  }, [camera, threeCamera]);
  return null;
}

function SceneContent({ scene }: { scene: LifeMapScene }) {
  const visibleLayers = new Set(
    scene.layers.filter((l) => l.visible).map((l) => l.id),
  );

  return (
    <>
      <color attach="background" args={[P.background]} />
      <fog attach="fog" args={[P.fog, 40, 160]} />
      <CameraRig camera={scene.camera} />
      <SoftLights />
      <TerritoryGround />
      {scene.objects
        .filter((o) => visibleLayers.has(String(o.layerId)))
        .map((object) => (
          <PlaceholderObject key={object.objectId} object={object} />
        ))}
    </>
  );
}

export type ThreeLifeMapCanvasProps = {
  scene: LifeMapScene;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Declarative R3F surface for prototypes / future product shells.
 */
export function ThreeLifeMapCanvas({
  scene,
  className,
  style,
  children,
}: ThreeLifeMapCanvasProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 280,
        background: P.background,
        ...style,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 42, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <SceneContent scene={scene} />
        {children}
      </Canvas>
    </div>
  );
}
