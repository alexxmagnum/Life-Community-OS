"use client";

/**
 * React Three Fiber Life Map canvas — premium maquette placeholders.
 * Interaction: hover lift/highlight, click → open intention.
 * No map SDK. No GLB loading yet.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type {
  LifeMapRenderableObject,
  LifeMapRendererCamera,
  LifeMapScene,
} from "@life-community-os/life-map-renderer";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Group } from "three";
import { Color } from "three";

import { lifeMapCameraToThreePose } from "./camera-adapter";
import { THREE_LIFE_MAP_PALETTE as P } from "./palette";
import { lifeMapPositionToThree } from "./position";

export type LifeMapObjectPointerEvent = {
  object: LifeMapRenderableObject;
  intention: "open";
};

function accentForObject(object: LifeMapRenderableObject): string {
  const key = object.asset?.assetKey ?? "";
  if (key.startsWith("recreation.")) return "#8FBF7A";
  if (key.startsWith("building.") || object.type === "housing") return "#C4B5A0";
  if (key.startsWith("place.") || object.type === "place") return "#7EB8C4";
  if (object.state === "active") return P.objectActive;
  if (object.state === "unavailable") return P.objectMuted;
  return P.objectIdle;
}

function yOffsetForObject(object: LifeMapRenderableObject): number {
  const key = object.asset?.assetKey ?? "";
  if (key.startsWith("recreation.")) return 0.2;
  if (key.startsWith("building.") || object.type === "housing") return 0.05;
  if (object.type === "place") return 0.05;
  return 0.4;
}

function MaquetteMaterial({
  color,
  hovered,
}: {
  color: string;
  hovered: boolean;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={hovered ? 0.46 : 0.7}
      metalness={hovered ? 0.2 : 0.08}
      emissive={hovered ? "#1E333C" : "#000000"}
      emissiveIntensity={hovered ? 0.5 : 0}
    />
  );
}

/** Soft architectural massing — not debug primitives. */
function PremiumPlaceholderGeometry({
  object,
  color,
  hovered,
}: {
  object: LifeMapRenderableObject;
  color: string;
  hovered: boolean;
}) {
  const key = object.asset?.assetKey ?? "";

  if (key.startsWith("recreation.") || key.includes(".golf.")) {
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[2.4, 2.85, 0.36, 48]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.95, 0.58, -0.35]}>
          <sphereGeometry args={[0.55, 28, 20]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh castShadow receiveShadow position={[-0.75, 0.45, 0.55]}>
          <sphereGeometry args={[0.38, 24, 16]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
      </group>
    );
  }

  if (key.startsWith("building.") || object.type === "housing") {
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
          <boxGeometry args={[2.45, 1.7, 2.15]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[0, 1.85, 0]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <coneGeometry args={[1.9, 0.95, 4]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.0, 0.65, 1.2]}>
          <boxGeometry args={[0.75, 1.2, 0.6]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
      </group>
    );
  }

  if (object.type === "place" || key.startsWith("place.")) {
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 1.1, 32]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.14, 32]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.4, 24, 16]} />
          <MaquetteMaterial color={color} hovered={hovered} />
        </mesh>
      </group>
    );
  }

  if (object.type === "experience") {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.05, 28, 20]} />
        <MaquetteMaterial color={color} hovered={hovered} />
      </mesh>
    );
  }

  if (object.type === "official") {
    return (
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 2.2, 20]} />
        <MaquetteMaterial color={color} hovered={hovered} />
      </mesh>
    );
  }

  return (
    <mesh castShadow receiveShadow>
      <capsuleGeometry args={[0.75, 1.0, 8, 16]} />
      <MaquetteMaterial color={color} hovered={hovered} />
    </mesh>
  );
}

function InteractiveObject({
  object,
  onOpen,
}: {
  object: LifeMapRenderableObject;
  onOpen?: (event: LifeMapObjectPointerEvent) => void;
}) {
  const root = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const lift = useRef(0);
  const color = useMemo(() => accentForObject(object), [object]);

  useFrame((_, delta) => {
    const target = hovered ? 1 : 0;
    lift.current += (target - lift.current) * Math.min(1, delta * 10);
    if (root.current) {
      root.current.position.y =
        lifeMapPositionToThree(object.position).y +
        yOffsetForObject(object) +
        lift.current * 0.42;
      root.current.scale.setScalar(1 + lift.current * 0.045);
    }
  });

  if (object.state === "hidden") return null;

  const pos = lifeMapPositionToThree(object.position);
  const interactive = object.availableActions.includes("open");

  return (
    <group
      ref={root}
      position={[pos.x, pos.y + yOffsetForObject(object), pos.z]}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              setHovered(false);
              document.body.style.cursor = "auto";
            }
          : undefined
      }
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onOpen?.({ object, intention: "open" });
            }
          : undefined
      }
    >
      <PremiumPlaceholderGeometry
        object={object}
        color={
          hovered
            ? new Color(color).lerp(new Color("#E8F4F7"), 0.32).getStyle()
            : color
        }
        hovered={hovered}
      />
    </group>
  );
}

function TerritoryGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[118, 64]} />
        <meshStandardMaterial
          color={P.ground}
          roughness={0.94}
          metalness={0.03}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[42, 96, 64]} />
        <meshStandardMaterial
          color="#162028"
          roughness={0.98}
          metalness={0}
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <circleGeometry args={[124, 64]} />
        <meshStandardMaterial
          color={P.groundRim}
          roughness={1}
          metalness={0}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[38, 48]} />
        <meshStandardMaterial
          color="#1A262E"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

function SoftLights() {
  return (
    <>
      <ambientLight color={P.ambient} intensity={0.38} />
      <hemisphereLight args={[P.keyLight, P.ground, 0.42]} />
      <directionalLight
        color={P.keyLight}
        intensity={1.15}
        position={[22, 34, 14]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight
        color={P.fillLight}
        intensity={0.4}
        position={[-16, 12, -10]}
      />
      <directionalLight
        color={P.rimLight}
        intensity={0.32}
        position={[-8, 10, 22]}
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

function SceneContent({
  scene,
  onObjectOpen,
}: {
  scene: LifeMapScene;
  onObjectOpen?: (event: LifeMapObjectPointerEvent) => void;
}) {
  const visibleLayers = new Set(
    scene.layers.filter((l) => l.visible).map((l) => l.id),
  );

  return (
    <>
      <color attach="background" args={[P.background]} />
      <fog attach="fog" args={[P.fog, 55, 175]} />
      <CameraRig camera={scene.camera} />
      <SoftLights />
      <TerritoryGround />
      {scene.objects
        .filter((o) => visibleLayers.has(String(o.layerId)))
        .map((object) => (
          <InteractiveObject
            key={object.objectId}
            object={object}
            onOpen={onObjectOpen}
          />
        ))}
    </>
  );
}

export type ThreeLifeMapCanvasProps = {
  scene: LifeMapScene;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Fired when an object with `open` is activated. */
  onObjectOpen?: (event: LifeMapObjectPointerEvent) => void;
};

/**
 * Declarative R3F surface for Life Map vertical slice / future product shells.
 */
export function ThreeLifeMapCanvas({
  scene,
  className,
  style,
  children,
  onObjectOpen,
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
        camera={{ fov: 40, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <SceneContent scene={scene} onObjectOpen={onObjectOpen} />
        {children}
      </Canvas>
    </div>
  );
}
