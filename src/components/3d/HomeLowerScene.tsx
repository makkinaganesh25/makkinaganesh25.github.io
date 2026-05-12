import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  homeSceneData,
  homeSceneTuning,
  type HomeSceneRanges,
  type SceneFramePlane,
  type SceneHalo,
  type SceneTone,
  type SectionRange,
} from "../../data/homeSceneData";

const TONE_COLORS: Record<SceneTone, string> = {
  emerald: "#34d399",
  blue: "#38bdf8",
  amber: "#fbbf24",
  scarlet: "#e11d48",
};

const TONE_RGB: Record<SceneTone, string> = {
  emerald: "52,211,153",
  blue: "56,189,248",
  amber: "251,191,36",
  scarlet: "225,29,72",
};

type OpacityMaterial = THREE.Material & { opacity: number; transmission?: number };

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const boundedRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + boundedRadius, y);
  context.lineTo(x + width - boundedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + boundedRadius);
  context.lineTo(x + width, y + height - boundedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - boundedRadius, y + height);
  context.lineTo(x + boundedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius);
  context.lineTo(x, y + boundedRadius);
  context.quadraticCurveTo(x, y, x + boundedRadius, y);
  context.closePath();
}

function getRangePresence(offset: number, range: SectionRange, feather = 0.08) {
  const fadeIn = THREE.MathUtils.smoothstep(
    offset,
    Math.max(0, range.start - feather),
    Math.min(1, range.start + feather)
  );
  const fadeOut = 1 - THREE.MathUtils.smoothstep(
    offset,
    Math.max(0, range.end - feather),
    Math.min(1, range.end + feather)
  );
  return clamp01(fadeIn * fadeOut);
}

function getRangeProgress(offset: number, range: SectionRange) {
  return clamp01((offset - range.start) / Math.max(0.0001, range.end - range.start));
}

function getChapterArrivalPulse(progress: number) {
  const pulseIn = THREE.MathUtils.smoothstep(progress, 0.02, 0.22);
  const pulseOut = 1 - THREE.MathUtils.smoothstep(progress, 0.3, 0.62);
  return clamp01(pulseIn * pulseOut);
}

function getRangeDepth(range: SectionRange, bias = 0) {
  return -((range.start + range.end) / 2) * 160 + bias;
}

function createLabelTexture(label: string, tone: SceneTone) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 168;

  const context = canvas.getContext("2d");
  if (!context) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return { texture: fallbackTexture, aspect: canvas.width / canvas.height };
  }

  const toneRgb = TONE_RGB[tone];
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawRoundedRect(context, 8, 24, canvas.width - 16, canvas.height - 48, 30);
  context.fillStyle = "rgba(2, 8, 10, 0.5)";
  context.fill();
  context.strokeStyle = `rgba(${toneRgb}, 0.16)`;
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.moveTo(60, canvas.height / 2);
  context.lineTo(178, canvas.height / 2);
  context.lineWidth = 3;
  context.strokeStyle = `rgba(${toneRgb}, 0.55)`;
  context.stroke();

  context.beginPath();
  context.arc(42, canvas.height / 2, 8, 0, Math.PI * 2);
  context.fillStyle = `rgba(${toneRgb}, 0.95)`;
  context.fill();

  context.font = "600 48px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(244, 246, 247, 0.96)";
  context.fillText(label.toUpperCase(), 214, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: canvas.width / canvas.height };
}

function createHullBrandTexture(label: string, tone: SceneTone, sublabel?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 320;

  const context = canvas.getContext("2d");
  if (!context) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return { texture: fallbackTexture, aspect: canvas.width / canvas.height };
  }

  const toneRgb = TONE_RGB[tone];
  context.clearRect(0, 0, canvas.width, canvas.height);

  const panelGradient = context.createLinearGradient(0, 0, canvas.width, 0);
  panelGradient.addColorStop(0, "rgba(5, 7, 10, 0.0)");
  panelGradient.addColorStop(0.08, "rgba(5, 7, 10, 0.82)");
  panelGradient.addColorStop(0.92, "rgba(5, 7, 10, 0.82)");
  panelGradient.addColorStop(1, "rgba(5, 7, 10, 0.0)");

  drawRoundedRect(context, 18, 34, canvas.width - 36, canvas.height - 68, 46);
  context.fillStyle = panelGradient;
  context.fill();
  context.strokeStyle = `rgba(${toneRgb}, 0.3)`;
  context.lineWidth = 4;
  context.stroke();

  context.strokeStyle = `rgba(${toneRgb}, 0.12)`;
  context.lineWidth = 6;
  for (let offset = -220; offset < canvas.width + 220; offset += 86) {
    context.beginPath();
    context.moveTo(offset, 50);
    context.lineTo(offset + 120, canvas.height - 50);
    context.stroke();
  }

  context.fillStyle = `rgba(${toneRgb}, 0.22)`;
  context.fillRect(64, 58, 264, 18);
  context.fillRect(canvas.width - 328, canvas.height - 76, 264, 16);

  context.beginPath();
  context.arc(76, canvas.height / 2, 13, 0, Math.PI * 2);
  context.fillStyle = `rgba(${toneRgb}, 0.95)`;
  context.fill();

  context.textAlign = "left";
  context.textBaseline = "middle";
  context.shadowColor = `rgba(${toneRgb}, 0.2)`;
  context.shadowBlur = 24;
  context.font = "700 88px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillStyle = "rgba(244, 246, 247, 0.97)";
  context.fillText(label.toUpperCase(), 118, canvas.height / 2 - 14);

  if (sublabel) {
    context.font = "600 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.letterSpacing = "4px";
    context.fillStyle = `rgba(${toneRgb}, 0.84)`;
    context.fillText(sublabel.toUpperCase(), 122, canvas.height / 2 + 54);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: canvas.width / canvas.height };
}

function useMaterialRegistry() {
  const materialsRef = useRef<OpacityMaterial[]>([]);

  const registerMaterial = useCallback((material: OpacityMaterial | null) => {
    if (!material || materialsRef.current.includes(material)) return;
    material.transparent = true;
    material.userData.baseOpacity = material.opacity;
    if ("transmission" in material) {
      material.userData.baseTransmission = (material as THREE.MeshPhysicalMaterial).transmission;
    }
    materialsRef.current.push(material);
  }, []);

  return { materialsRef, registerMaterial };
}

function setRegisteredOpacity(materials: OpacityMaterial[], opacity: number) {
  const alpha = clamp01(opacity);
  materials.forEach((material) => {
    material.opacity = ((material.userData.baseOpacity as number | undefined) ?? 1) * alpha;
    if ("transmission" in material) {
      (material as THREE.MeshPhysicalMaterial).transmission =
        ((material.userData.baseTransmission as number | undefined) ?? 0) * alpha;
    }
  });
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return reducedMotion;
}

function useSceneProfile(forceLite = false) {
  const { size } = useThree();
  const reducedMotion = useReducedMotionPreference();

  return useMemo(() => {
    const simplified = forceLite || reducedMotion || size.width < homeSceneTuning.mobileBreakpoint;
    const tablet = !simplified && size.width < homeSceneTuning.tabletBreakpoint;

    return {
      projectLanes: simplified ? 2 : tablet ? 3 : homeSceneData.projects.lanes.length,
      projectCallouts: simplified ? 0 : tablet ? 3 : 6,
      projectNodes: simplified ? 2 : tablet ? 3 : homeSceneData.projects.nodes.length,
      projectOrbitNodes: simplified ? 0 : tablet ? 4 : 6,
      projectShardStacks: simplified ? 2 : tablet ? 3 : 4,
      packetsPerLane: simplified ? 1 : tablet ? 2 : 3,
      experienceCallouts: simplified ? 0 : tablet ? 2 : 4,
      experienceNodes: simplified ? 4 : tablet ? 5 : homeSceneData.experience.nodes.length,
      experienceConnections: simplified ? 4 : tablet ? 6 : homeSceneData.experience.connections.length,
      experiencePacketsPerRail: simplified ? 0 : tablet ? 1 : 2,
      serviceGridUnits: simplified ? 5 : tablet ? 8 : 12,
      observabilityPulses: simplified ? 0 : tablet ? 2 : 3,
      educationRibbons: simplified ? 1 : tablet ? 2 : homeSceneData.education.ribbons.length,
      educationNodes: simplified ? 2 : tablet ? 3 : homeSceneData.education.nodes.length,
      educationPackets: simplified ? 0 : tablet ? 1 : 2,
      contactSignals: simplified ? 2 : tablet ? 2 : homeSceneData.contact.signalLines.length,
      contactParticles: simplified ? 4 : tablet ? 5 : 6,
      simplified,
      tablet,
    };
  }, [forceLite, reducedMotion, size.width]);
}

function LabelSprite({
  label,
  position,
  tone,
  registerMaterial,
}: {
  label: string;
  position: [number, number, number];
  tone: SceneTone;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const { texture, aspect } = useMemo(() => createLabelTexture(label, tone), [label, tone]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[aspect * 0.35, 0.35, 1]} renderOrder={2}>
      <spriteMaterial
        ref={registerMaterial}
        map={texture}
        transparent
        opacity={0.82}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function BrandPlate({
  label,
  position,
  tone,
  opacity,
  size,
  rotation,
  sublabel,
  registerMaterial,
}: {
  label: string;
  position: [number, number, number];
  tone: SceneTone;
  opacity: number;
  size: [number, number];
  rotation?: [number, number, number];
  sublabel?: string;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const { texture } = useMemo(() => createHullBrandTexture(label, tone, sublabel), [label, tone, sublabel]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[size[0], size[1], 0.055]} />
        <meshPhysicalMaterial
          ref={registerMaterial}
          color="#090b10"
          metalness={0.42}
          roughness={0.36}
          transmission={0.12}
          thickness={0.08}
          transparent
          opacity={Math.min(0.52, opacity)}
          emissive="#19090f"
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial
          ref={registerMaterial}
          map={texture}
          transparent
          opacity={opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function SignalHalo({
  halo,
  registerMaterial,
}: {
  halo: SceneHalo;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!rotorRef.current) return;
    rotorRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.08) * 0.08;
  });

  return (
    <group position={halo.position} rotation={halo.rotation}>
      <group ref={rotorRef}>
        <mesh>
          <ringGeometry args={[halo.radius, halo.radius + 0.03, 96]} />
          <meshBasicMaterial
            ref={registerMaterial}
            color={TONE_COLORS[halo.tone]}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 5]}>
          <ringGeometry args={[halo.radius * 0.72, halo.radius * 0.72 + 0.018, 96]} />
          <meshBasicMaterial
            ref={registerMaterial}
            color={TONE_COLORS[halo.tone]}
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[halo.radius * 0.92, 48]} />
          <meshBasicMaterial
            ref={registerMaterial}
            color={TONE_COLORS[halo.tone]}
            transparent
            opacity={0.025}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function TierPlate({
  position,
  size,
  tone,
  registerMaterial,
}: {
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  tone: SceneTone;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  return (
    <group position={position as [number, number, number]}>
      <mesh>
        <boxGeometry args={size as [number, number, number]} />
        <meshPhysicalMaterial
          ref={registerMaterial}
          color={TONE_COLORS[tone]}
          metalness={0.08}
          roughness={0.12}
          transmission={0.52}
          thickness={0.34}
          ior={1.24}
          transparent
          opacity={0.18}
        />
      </mesh>
      <mesh scale={[1.012, 1.08, 1.012]}>
        <boxGeometry args={size as [number, number, number]} />
        <meshBasicMaterial
          ref={registerMaterial}
          color={TONE_COLORS[tone]}
          wireframe
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function GlassNode({
  position,
  size,
  tone,
  registerMaterial,
}: {
  position: readonly [number, number, number];
  size: number;
  tone: SceneTone;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const shellRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!shellRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    shellRef.current.rotation.x = elapsed * 0.12;
    shellRef.current.rotation.y = elapsed * 0.16;
  });

  return (
    <group position={position as [number, number, number]}>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[size, 1]} />
        <meshPhysicalMaterial
          ref={registerMaterial}
          color={TONE_COLORS[tone]}
          metalness={0.05}
          roughness={0.08}
          transmission={0.7}
          thickness={size * 1.2}
          ior={1.35}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh scale={0.42}>
        <icosahedronGeometry args={[size, 0]} />
        <meshBasicMaterial
          ref={registerMaterial}
          color={TONE_COLORS[tone]}
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function WireLatticePlane({
  plane,
  registerMaterial,
}: {
  plane: SceneFramePlane;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const wobbleRef = useRef<THREE.Group>(null!);

  const verticalOffsets = useMemo(
    () => Array.from({ length: 6 }, (_, index) => (index / 5 - 0.5) * plane.size[0]),
    [plane.size]
  );
  const horizontalOffsets = useMemo(
    () => Array.from({ length: 4 }, (_, index) => (index / 3 - 0.5) * plane.size[1]),
    [plane.size]
  );

  useFrame((state) => {
    if (!wobbleRef.current) return;
    wobbleRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.045;
  });

  return (
    <group position={plane.position} rotation={plane.rotation}>
      <group ref={wobbleRef}>
        <mesh>
          <planeGeometry args={plane.size as [number, number]} />
          <meshBasicMaterial
            ref={registerMaterial}
            color={TONE_COLORS[plane.tone]}
            transparent
            opacity={0.02}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {verticalOffsets.map((offset) => (
          <mesh key={`v-${offset}`} position={[offset, 0, 0.002]}>
            <planeGeometry args={[0.018, plane.size[1]]} />
            <meshBasicMaterial
              ref={registerMaterial}
              color={TONE_COLORS[plane.tone]}
              transparent
              opacity={0.055}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        {horizontalOffsets.map((offset) => (
          <mesh key={`h-${offset}`} position={[0, offset, 0.002]}>
            <planeGeometry args={[plane.size[0], 0.018]} />
            <meshBasicMaterial
              ref={registerMaterial}
              color={TONE_COLORS[plane.tone]}
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ProductOrbitSystem({
  nodeCount,
  registerMaterial,
}: {
  nodeCount: number;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null!);
  const nodes = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, index) => {
        const angle = (index / Math.max(1, nodeCount)) * Math.PI * 2;
        const radius = 1.34 + (index % 2) * 0.42;
        return {
          position: [Math.cos(angle) * radius, Math.sin(index * 1.4) * 0.18 + 0.2, Math.sin(angle) * radius] as const,
          tone: (index % 3 === 0 ? "blue" : index % 3 === 1 ? "emerald" : "amber") as SceneTone,
          scale: index % 2 === 0 ? 1 : 0.82,
        };
      }),
    [nodeCount]
  );

  useFrame((state) => {
    if (!orbitRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    orbitRef.current.rotation.y = elapsed * 0.075;
    orbitRef.current.rotation.x = Math.sin(elapsed * 0.16) * 0.045;
  });

  if (nodeCount === 0) return null;

  return (
    <group ref={orbitRef} position={[1.24, 0.38, 2.5]} rotation={[0.1, 0.2, -0.08]}>
      <mesh rotation={[Math.PI / 2.25, 0.14, 0]}>
        <torusGeometry args={[1.62, 0.01, 10, 96]} />
        <meshBasicMaterial
          ref={registerMaterial}
          color="#38bdf8"
          transparent
          opacity={0.13}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {nodes.map((node, index) => (
        <group key={`product-orbit-node-${index}`} position={node.position}>
          <mesh scale={[0.26 * node.scale, 0.16 * node.scale, 0.08 * node.scale]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              ref={registerMaterial}
              color={TONE_COLORS[node.tone]}
              metalness={0.12}
              roughness={0.22}
              transmission={0.36}
              thickness={0.08}
              transparent
              opacity={0.32}
            />
          </mesh>
          <mesh scale={[0.3 * node.scale, 0.2 * node.scale, 0.1 * node.scale]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              ref={registerMaterial}
              color={TONE_COLORS[node.tone]}
              wireframe
              transparent
              opacity={0.12}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DatabaseShardStack({
  position,
  tone,
  scale = 1,
  registerMaterial,
}: {
  position: readonly [number, number, number];
  tone: SceneTone;
  scale?: number;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  return (
    <group position={position as [number, number, number]} scale={scale}>
      {[0, 1, 2].map((index) => (
        <mesh key={`db-shard-${index}`} position={[0, index * 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28 - index * 0.025, 0.28 - index * 0.025, 0.08, 24]} />
          <meshPhysicalMaterial
            ref={registerMaterial}
            color={TONE_COLORS[tone]}
            metalness={0.18}
            roughness={0.2}
            transmission={0.38}
            thickness={0.08}
            transparent
            opacity={0.28 - index * 0.03}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]} scale={[0.72, 0.5, 0.72]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          ref={registerMaterial}
          color={TONE_COLORS[tone]}
          wireframe
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ServiceGrid({
  unitCount,
  registerMaterial,
}: {
  unitCount: number;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const gridRef = useRef<THREE.Group>(null!);
  const instancesRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const units = useMemo(
    () =>
      Array.from({ length: unitCount }, (_, index) => ({
        x: (index % 4 - 1.5) * 0.58,
        y: (Math.floor(index / 4) - 1) * 0.38,
        z: (index % 3) * 0.1,
      })),
    [unitCount]
  );

  useEffect(() => {
    if (!instancesRef.current) return;
    units.forEach((unit, index) => {
      dummy.position.set(unit.x, unit.y, unit.z);
      dummy.rotation.set(0.05, -0.16, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instancesRef.current.setMatrixAt(index, dummy.matrix);
    });
    instancesRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, units]);

  useFrame((state) => {
    if (!gridRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    gridRef.current.rotation.y = Math.sin(elapsed * 0.1) * 0.055;
    gridRef.current.position.y = Math.sin(elapsed * 0.22) * 0.035;
  });

  return (
    <group ref={gridRef} position={[0.78, 0.34, 1.75]} rotation={[0.08, -0.34, 0.06]}>
      <instancedMesh ref={instancesRef} args={[undefined, undefined, units.length]}>
        <boxGeometry args={[0.36, 0.2, 0.12]} />
        <meshPhysicalMaterial
          ref={registerMaterial}
          color="#38bdf8"
          metalness={0.1}
          roughness={0.28}
          transmission={0.34}
          thickness={0.08}
          transparent
          opacity={0.22}
        />
      </instancedMesh>
      <mesh position={[0, -0.58, -0.08]}>
        <boxGeometry args={[2.7, 0.025, 0.08]} />
        <meshBasicMaterial
          ref={registerMaterial}
          color="#fbbf24"
          transparent
          opacity={0.16}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ObservabilityPulseStack({
  count,
  registerMaterial,
}: {
  count: number;
  registerMaterial: (material: OpacityMaterial | null) => void;
}) {
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    pulseRefs.current.forEach((pulse, index) => {
      if (!pulse) return;
      const wave = (Math.sin(elapsed * 0.72 + index * 0.9) + 1) * 0.5;
      pulse.scale.setScalar(0.84 + wave * 0.18);
      pulse.rotation.z = elapsed * (0.025 + index * 0.008);
    });
  });

  if (count === 0) return null;

  return (
    <group position={[3.08, 0.22, 3.65]} rotation={[1.24, -0.2, -0.16]}>
      {Array.from({ length: count }, (_, index) => (
        <mesh
          key={`observability-pulse-${index}`}
          ref={(node) => {
            pulseRefs.current[index] = node;
          }}
          position={[0, 0, index * 0.018]}
        >
          <torusGeometry args={[0.72 + index * 0.28, 0.01, 10, 86]} />
          <meshBasicMaterial
            ref={registerMaterial}
            color={index % 2 === 0 ? "#38bdf8" : "#34d399"}
            transparent
            opacity={0.12 - index * 0.018}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ProjectsDataCosmos({
  ranges,
  profile,
}: {
  ranges: HomeSceneRanges;
  profile: ReturnType<typeof useSceneProfile>;
}) {
  const scroll = useScroll();
  const rootRef = useRef<THREE.Group>(null!);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const tempPointRef = useRef(new THREE.Vector3());
  const tempTangentRef = useRef(new THREE.Vector3());
  const tempLookRef = useRef(new THREE.Vector3());

  const rails = useMemo(
    () =>
      homeSceneData.projects.lanes.slice(0, profile.projectLanes).map((lane) => ({
        ...lane,
        curve: new THREE.CatmullRomCurve3(lane.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
      })),
    [profile.projectLanes]
  );

  const packetMeta = useMemo(
    () =>
      rails.flatMap((lane) => {
        const packetCount = Math.max(1, profile.packetsPerLane - (lane.emphasis === "support" ? 1 : 0));
        return lane.packetOffsets.slice(0, packetCount).map((offset) => ({
          curve: lane.curve,
          tone: lane.tone,
          offset,
          speed: lane.packetSpeed,
          emphasis: lane.emphasis ?? "primary",
        }));
      }),
    [profile.packetsPerLane, rails]
  );

  const visibleNodes = useMemo(
    () => homeSceneData.projects.nodes.slice(0, profile.projectNodes),
    [profile.projectNodes]
  );
  const visibleLabels = useMemo(
    () => homeSceneData.projects.labels.slice(0, profile.projectCallouts),
    [profile.projectCallouts]
  );
  const visibleShardStacks = useMemo(
    () =>
      [
        { position: [-2.72, -0.42, -1.76] as const, tone: "blue" as SceneTone, scale: 0.9 },
        { position: [-0.34, -0.72, 0.18] as const, tone: "emerald" as SceneTone, scale: 0.82 },
        { position: [1.96, -0.58, 2.48] as const, tone: "amber" as SceneTone, scale: 0.78 },
        { position: [3.46, -0.36, 4.2] as const, tone: "blue" as SceneTone, scale: 0.72 },
      ].slice(0, profile.projectShardStacks),
    [profile.projectShardStacks]
  );
  const anchorZ = useMemo(() => getRangeDepth(ranges.projects, 0), [ranges.projects.end, ranges.projects.start]);
  const [focusX, focusY, focusZ] = homeSceneData.projects.focalOffset;

  const { materialsRef: sceneMaterials, registerMaterial: registerSceneMaterial } = useMaterialRegistry();
  const { materialsRef: uiMaterials, registerMaterial: registerUiMaterial } = useMaterialRegistry();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const progress = getRangeProgress(scroll.offset, ranges.projects);
    const presence = getRangePresence(scroll.offset, ranges.projects, 0.055);
    const arrivalPulse = getChapterArrivalPulse(progress);
    const calm = THREE.MathUtils.smoothstep(
      scroll.offset,
      Math.max(0, ranges.contact.start - 0.1),
      Math.min(1, ranges.contact.start + 0.02)
    );
    const alpha = clamp01(presence * (0.98 + arrivalPulse * 0.24)) * (1 - calm * 0.82);

    const xDrift = Math.sin(progress * Math.PI * 1.7 + elapsed * 0.08) * presence * 0.5;
    const yEntrance = -(1 - presence) * 10 + Math.sin(progress * Math.PI) * presence * 0.36 + arrivalPulse * 0.85;
    const zEntrance = -(1 - presence) * 10 - arrivalPulse * 1.6;

    rootRef.current.visible = alpha > 0.01;
    rootRef.current.position.set(focusX + xDrift, focusY + yEntrance, anchorZ + focusZ + zEntrance);
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, -0.075 + arrivalPulse * 0.025, 0.04);
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      Math.sin(elapsed * 0.06) * 0.035 + Math.sin(progress * Math.PI * 2) * presence * 0.045,
      0.04
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      Math.sin(progress * Math.PI * 1.2) * presence * -0.035,
      0.04
    );
    rootRef.current.scale.setScalar(0.91 + presence * 0.09 + arrivalPulse * 0.055);

    setRegisteredOpacity(sceneMaterials.current, alpha);
    setRegisteredOpacity(uiMaterials.current, alpha * 0.92);

    packetRefs.current.forEach((packetMesh, index) => {
      if (!packetMesh) return;
      const packet = packetMeta[index];
      const t = (packet.offset + elapsed * packet.speed) % 1;
      packet.curve.getPoint(t, tempPointRef.current);
      packet.curve.getTangent(t, tempTangentRef.current);
      packetMesh.position.copy(tempPointRef.current);
      tempLookRef.current.copy(tempPointRef.current).add(tempTangentRef.current);
      packetMesh.lookAt(tempLookRef.current);

      const material = packetMesh.material as THREE.MeshBasicMaterial;
      material.opacity = alpha * (packet.emphasis === "support" ? 0.28 : 0.62);
    });
  });

  return (
    <group ref={rootRef}>
      {homeSceneData.projects.halos.map((halo) => (
        <SignalHalo
          key={`${halo.position.join(":")}-${halo.radius}`}
          halo={halo}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {homeSceneData.projects.tierPlanes.map((plane) => (
        <TierPlate
          key={`${plane.position.join(":")}-${plane.tone}`}
          position={plane.position}
          size={plane.size}
          tone={plane.tone}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      <ProductOrbitSystem nodeCount={profile.projectOrbitNodes} registerMaterial={registerSceneMaterial} />

      {visibleShardStacks.map((stack, index) => (
        <DatabaseShardStack
          key={`project-database-shard-${index}`}
          position={stack.position}
          tone={stack.tone}
          scale={stack.scale}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {rails.map((lane, index) => (
        <mesh key={`project-rail-${index}`}>
          <tubeGeometry
            args={[lane.curve, lane.emphasis === "support" ? 36 : 52, lane.radius, 10, false]}
          />
          <meshPhysicalMaterial
            ref={registerSceneMaterial}
            color={TONE_COLORS[lane.tone]}
            transmission={0.64}
            opacity={lane.emphasis === "support" ? 0.14 : 0.24}
            transparent
            ior={1.22}
            thickness={0.2}
            roughness={0.16}
            metalness={0.08}
          />
        </mesh>
      ))}

      {visibleNodes.map((position, index) => (
        <GlassNode
          key={`project-node-${index}`}
          position={position}
          size={0.16 + index * 0.018}
          tone={index % 3 === 0 ? "emerald" : index % 3 === 1 ? "blue" : "amber"}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {packetMeta.map((packet, index) => (
        <mesh
          key={`project-packet-${index}`}
          ref={(node) => {
            packetRefs.current[index] = node;
          }}
        >
          <capsuleGeometry args={[packet.emphasis === "support" ? 0.012 : 0.016, 0.2, 4, 8]} />
          <meshBasicMaterial
            color={TONE_COLORS[packet.tone]}
            transparent
            opacity={0.6}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {visibleLabels.map((label) => (
        <LabelSprite
          key={label.label}
          label={label.label}
          position={label.position}
          tone={label.tone}
          registerMaterial={registerUiMaterial}
        />
      ))}
    </group>
  );
}

function ExperienceSystemsField({
  ranges,
  profile,
}: {
  ranges: HomeSceneRanges;
  profile: ReturnType<typeof useSceneProfile>;
}) {
  const scroll = useScroll();
  const rootRef = useRef<THREE.Group>(null!);
  const railPacketRefs = useRef<Array<THREE.Mesh | null>>([]);
  const tempPointRef = useRef(new THREE.Vector3());
  const tempTangentRef = useRef(new THREE.Vector3());
  const tempLookRef = useRef(new THREE.Vector3());

  const visibleNodes = useMemo(
    () => homeSceneData.experience.nodes.slice(0, profile.experienceNodes),
    [profile.experienceNodes]
  );
  const visibleLabels = useMemo(
    () => homeSceneData.experience.labels.slice(0, profile.experienceCallouts),
    [profile.experienceCallouts]
  );
  const anchorZ = useMemo(
    () => getRangeDepth(ranges.experience, -4),
    [ranges.experience.end, ranges.experience.start]
  );
  const [focusX, focusY, focusZ] = homeSceneData.experience.focalOffset;

  const connections = useMemo(
    () =>
      homeSceneData.experience.connections
        .slice(0, profile.experienceConnections)
        .filter(([start, end]) => start < visibleNodes.length && end < visibleNodes.length)
        .map(([start, end], index) => {
          const pointA = new THREE.Vector3(...visibleNodes[start]);
          const pointB = new THREE.Vector3(...visibleNodes[end]);
          const mid = pointA.clone().lerp(pointB, 0.5);
          mid.y += index % 2 === 0 ? 0.26 : 0.18;
          return {
            curve: new THREE.CatmullRomCurve3([pointA, mid, pointB]),
            tone: index % 3 === 0 ? "blue" : "emerald" as SceneTone,
          };
        }),
    [profile.experienceConnections, visibleNodes]
  );

  const rails = useMemo(
    () =>
      homeSceneData.experience.rails.map((rail) => ({
        ...rail,
        curve: new THREE.CatmullRomCurve3(rail.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
      })),
    []
  );

  const railPackets = useMemo(
    () =>
      rails.flatMap((rail) => {
        if (profile.experiencePacketsPerRail === 0) return [];
        return rail.packetOffsets.slice(0, profile.experiencePacketsPerRail).map((offset) => ({
          curve: rail.curve,
          tone: rail.tone,
          offset,
          speed: rail.packetSpeed,
          emphasis: rail.emphasis ?? "primary",
        }));
      }),
    [profile.experiencePacketsPerRail, rails]
  );

  const { materialsRef: sceneMaterials, registerMaterial: registerSceneMaterial } = useMaterialRegistry();
  const { materialsRef: uiMaterials, registerMaterial: registerUiMaterial } = useMaterialRegistry();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const progress = getRangeProgress(scroll.offset, ranges.experience);
    const presence = getRangePresence(scroll.offset, ranges.experience, 0.055);
    const arrivalPulse = getChapterArrivalPulse(progress);
    const calm = THREE.MathUtils.smoothstep(
      scroll.offset,
      Math.max(0, ranges.contact.start - 0.08),
      Math.min(1, ranges.contact.start + 0.02)
    );
    const alpha = clamp01(presence * (0.96 + arrivalPulse * 0.2)) * (1 - calm * 0.72);

    const xDrift = Math.cos(progress * Math.PI * 1.45 + elapsed * 0.06) * presence * 0.42;
    const yEntrance = -(1 - presence) * 9 + Math.sin(progress * Math.PI) * presence * 0.28 + arrivalPulse * 0.7;
    const zEntrance = -(1 - presence) * 9 - arrivalPulse * 1.25;

    rootRef.current.visible = alpha > 0.01;
    rootRef.current.position.set(focusX + xDrift, focusY + yEntrance, anchorZ + focusZ + zEntrance);
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, -0.052 + arrivalPulse * 0.018, 0.04);
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      Math.sin(elapsed * 0.04) * 0.028 + Math.sin(progress * Math.PI * 2) * presence * 0.035,
      0.04
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      Math.cos(progress * Math.PI * 1.15) * presence * 0.028,
      0.04
    );
    rootRef.current.scale.setScalar(0.93 + presence * 0.07 + arrivalPulse * 0.045);

    setRegisteredOpacity(sceneMaterials.current, alpha);
    setRegisteredOpacity(uiMaterials.current, alpha * 0.9);

    railPacketRefs.current.forEach((packetMesh, index) => {
      if (!packetMesh) return;
      const packet = railPackets[index];
      const t = (packet.offset + elapsed * packet.speed) % 1;
      packet.curve.getPoint(t, tempPointRef.current);
      packet.curve.getTangent(t, tempTangentRef.current);
      packetMesh.position.copy(tempPointRef.current);
      tempLookRef.current.copy(tempPointRef.current).add(tempTangentRef.current);
      packetMesh.lookAt(tempLookRef.current);

      const material = packetMesh.material as THREE.MeshBasicMaterial;
      material.opacity = alpha * (packet.emphasis === "support" ? 0.24 : 0.42);
    });
  });

  return (
    <group ref={rootRef}>
      {homeSceneData.experience.halos.map((halo) => (
        <SignalHalo
          key={`${halo.position.join(":")}-${halo.radius}`}
          halo={halo}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {homeSceneData.experience.latticePlanes.map((plane) => (
        <WireLatticePlane
          key={`${plane.position.join(":")}-${plane.tone}`}
          plane={plane}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      <ServiceGrid unitCount={profile.serviceGridUnits} registerMaterial={registerSceneMaterial} />
      <ObservabilityPulseStack count={profile.observabilityPulses} registerMaterial={registerSceneMaterial} />

      {rails.map((rail, index) => (
        <mesh key={`experience-rail-${index}`}>
          <tubeGeometry args={[rail.curve, 48, rail.radius, 10, false]} />
          <meshPhysicalMaterial
            ref={registerSceneMaterial}
            color={TONE_COLORS[rail.tone]}
            transmission={0.58}
            opacity={rail.emphasis === "support" ? 0.12 : 0.18}
            transparent
            ior={1.2}
            thickness={0.16}
            roughness={0.22}
            metalness={0.06}
          />
        </mesh>
      ))}

      {connections.map((connection, index) => (
        <mesh key={`experience-connection-${index}`}>
          <tubeGeometry args={[connection.curve, 28, 0.006, 6, false]} />
          <meshBasicMaterial
            ref={registerSceneMaterial}
            color={TONE_COLORS[connection.tone]}
            transparent
            opacity={0.13}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {visibleNodes.map((position, index) => (
        <GlassNode
          key={`experience-node-${index}`}
          position={position}
          size={index === 4 ? 0.17 : 0.13}
          tone={index % 2 === 0 ? "blue" : "emerald"}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {railPackets.map((packet, index) => (
        <mesh
          key={`experience-packet-${index}`}
          ref={(node) => {
            railPacketRefs.current[index] = node;
          }}
        >
          <capsuleGeometry args={[0.01, 0.14, 4, 8]} />
          <meshBasicMaterial
            color={TONE_COLORS[packet.tone]}
            transparent
            opacity={0.4}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {visibleLabels.map((label) => (
        <LabelSprite
          key={label.label}
          label={label.label}
          position={label.position}
          tone={label.tone}
          registerMaterial={registerUiMaterial}
        />
      ))}
    </group>
  );
}

// --- RUTGERS EDUCATION SCENE ---

function RutgersAcademicCore({
  simplified,
  registerSceneMaterial,
}: {
  simplified: boolean;
  registerSceneMaterial: (material: OpacityMaterial | null) => void;
}) {
  const coreRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Group>(null!);
  const foundationBars = useMemo(
    () =>
      Array.from({ length: simplified ? 4 : 7 }, (_, index) => ({
        x: (index - (simplified ? 1.5 : 3)) * 0.42,
        z: (index % 2 === 0 ? -0.12 : 0.16) + index * 0.03,
        tone: (index % 3 === 0 ? "scarlet" : index % 3 === 1 ? "blue" : "amber") as SceneTone,
      })),
    [simplified]
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    coreRef.current.position.y = Math.sin(elapsed * 0.72) * 0.045;
    coreRef.current.rotation.y = Math.sin(elapsed * 0.1) * 0.055;
    ringRef.current.rotation.z = elapsed * 0.035;
  });

  return (
    <group ref={coreRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.32, simplified ? 40 : 56]} />
        <meshPhysicalMaterial
          ref={registerSceneMaterial}
          color="#240710"
          emissive="#e11d48"
          emissiveIntensity={0.45}
          metalness={0.18}
          roughness={0.22}
          transmission={0.24}
          thickness={0.18}
          transparent
          opacity={0.58}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 1.08, 1.08]}>
        <cylinderGeometry args={[0.78, 0.78, 0.34, simplified ? 32 : 56]} />
        <meshBasicMaterial
          ref={registerSceneMaterial}
          color="#e11d48"
          wireframe
          transparent
          opacity={0.14}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={ringRef}>
        {[0.98, 1.34, 1.72].slice(0, simplified ? 2 : 3).map((radius, index) => (
          <mesh
            key={`rutgers-core-ring-${radius}`}
            rotation={[Math.PI / 2.18 + index * 0.08, index * 0.12, index % 2 === 0 ? -0.14 : 0.2]}
          >
            <torusGeometry args={[radius, 0.012, 10, 110]} />
            <meshBasicMaterial
              ref={registerSceneMaterial}
              color={index === 1 ? "#38bdf8" : "#e11d48"}
              transparent
              opacity={index === 1 ? 0.1 : 0.14}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <group position={[0, -0.74, 0]} rotation={[-0.04, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.5, 0.035, 1.35]} />
          <meshBasicMaterial
            ref={registerSceneMaterial}
            color="#e11d48"
            transparent
            opacity={0.05}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {foundationBars.map((bar, index) => (
          <mesh key={`foundation-bar-${index}`} position={[bar.x, 0.04, bar.z]}>
            <boxGeometry args={[0.28, 0.06, 1.0]} />
            <meshBasicMaterial
              ref={registerSceneMaterial}
              color={TONE_COLORS[bar.tone]}
              transparent
              opacity={0.16}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <BrandPlate
        label="RUTGERS UNIVERSITY"
        sublabel="CS + DATA SCIENCE FOUNDATION"
        position={[0, 1.08, 0.52]}
        rotation={[-0.12, 0, 0]}
        tone="scarlet"
        size={[3.35, 0.68]}
        opacity={0.92}
        registerMaterial={registerSceneMaterial}
      />

      {!simplified && (
        <BrandPlate
          label="FOUNDATION GRID"
          position={[0, -1.08, 0.78]}
          rotation={[0.18, 0, 0]}
          tone="blue"
          size={[1.62, 0.3]}
          opacity={0.66}
          registerMaterial={registerSceneMaterial}
        />
      )}
    </group>
  );
}

function RutgersEducationScene({
  ranges,
  profile,
}: {
  ranges: HomeSceneRanges;
  profile: ReturnType<typeof useSceneProfile>;
}) {
  const scroll = useScroll();
  const rootRef = useRef<THREE.Group>(null!);
  const coreRigRef = useRef<THREE.Group>(null!);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const tempPointRef = useRef(new THREE.Vector3());
  const tempTangentRef = useRef(new THREE.Vector3());
  const tempLookRef = useRef(new THREE.Vector3());

  const visibleNodes = useMemo(
    () => homeSceneData.education.nodes.slice(0, profile.educationNodes),
    [profile.educationNodes]
  );
  
  const anchorZ = useMemo(
    () => getRangeDepth(ranges.education, -6),
    [ranges.education.end, ranges.education.start]
  );
  const [focusX, focusY, focusZ] = homeSceneData.education.focalOffset;
  const [coreOffsetX, coreOffsetY, coreOffsetZ] = homeSceneData.education.coreOffset;
  const [coreRotX, coreRotY, coreRotZ] = homeSceneData.education.coreRotation;

  const ribbons = useMemo(
    () =>
      homeSceneData.education.ribbons.slice(0, profile.educationRibbons).map((lane) => ({
        ...lane,
        curve: new THREE.CatmullRomCurve3(lane.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
      })),
    [profile.educationRibbons]
  );

  const ribbonPackets = useMemo(
    () =>
      ribbons.flatMap((ribbon) => {
        if (profile.educationPackets === 0) return [];
        return ribbon.packetOffsets.slice(0, profile.educationPackets).map((offset) => ({
          curve: ribbon.curve,
          tone: ribbon.tone,
          offset,
          speed: ribbon.packetSpeed,
          emphasis: ribbon.emphasis ?? "primary",
        }));
      }),
    [profile.educationPackets, ribbons]
  );

  const { materialsRef: sceneMaterials, registerMaterial: registerSceneMaterial } = useMaterialRegistry();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const progress = getRangeProgress(scroll.offset, ranges.education);
    const presence = getRangePresence(scroll.offset, ranges.education, 0.018);
    const arrivalPulse = getChapterArrivalPulse(progress);
    const rutgersCardExit = 1 - THREE.MathUtils.smoothstep(progress, 0.76, 0.96);
    const calm = THREE.MathUtils.smoothstep(
      scroll.offset,
      Math.max(0, ranges.contact.start - 0.08),
      Math.min(1, ranges.contact.start + 0.02)
    );
    const alpha = clamp01(presence * (0.96 + arrivalPulse * 0.22)) * rutgersCardExit * (1 - calm * 0.72);
    const foundationProgress = THREE.MathUtils.smoothstep(progress, 0.02, 0.36);
    const coreExit = THREE.MathUtils.smoothstep(progress, 0.72, 0.98);

    const xDrift = Math.sin(progress * Math.PI * 1.35 + elapsed * 0.05) * presence * 0.38;
    const yEntrance = -(1 - presence) * 9 + Math.sin(progress * Math.PI) * presence * 0.32 + arrivalPulse * 0.72;
    const zEntrance = -(1 - presence) * 8 - arrivalPulse * 1.4;

    rootRef.current.visible = alpha > 0.01;
    rootRef.current.position.set(focusX + xDrift, focusY + yEntrance + 0.18, anchorZ + focusZ + zEntrance);
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, -0.06 + arrivalPulse * 0.02, 0.04);
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      Math.sin(elapsed * 0.05) * 0.03 + Math.sin(progress * Math.PI * 2) * presence * 0.032,
      0.04
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      Math.sin(progress * Math.PI * 1.1) * presence * -0.026,
      0.04
    );
    rootRef.current.scale.setScalar(1.04 + presence * 0.18 + arrivalPulse * 0.08);

    const coreScaleBase = profile.simplified ? 0.78 : profile.tablet ? 0.98 : 1.14;

    coreRigRef.current.position.set(
      coreOffsetX,
      coreOffsetY + THREE.MathUtils.lerp(-0.26, 0.04, foundationProgress),
      coreOffsetZ + THREE.MathUtils.lerp(-5.8, 0.9, foundationProgress)
    );
    coreRigRef.current.rotation.x = THREE.MathUtils.lerp(
      coreRigRef.current.rotation.x,
      coreRotX + THREE.MathUtils.lerp(0.08, 0, foundationProgress),
      0.08
    );
    coreRigRef.current.rotation.y = THREE.MathUtils.lerp(
      coreRigRef.current.rotation.y,
      coreRotY + Math.sin(elapsed * 0.16) * 0.025,
      0.08
    );
    coreRigRef.current.rotation.z = THREE.MathUtils.lerp(
      coreRigRef.current.rotation.z,
      coreRotZ + Math.sin(elapsed * 0.22) * 0.012,
      0.08
    );
    coreRigRef.current.scale.setScalar(coreScaleBase * (1 + foundationProgress * 0.14 - coreExit * 0.12 + arrivalPulse * 0.05));

    setRegisteredOpacity(sceneMaterials.current, alpha);

    packetRefs.current.forEach((packetMesh, index) => {
      if (!packetMesh) return;
      const packet = ribbonPackets[index];
      const t = (packet.offset + elapsed * packet.speed) % 1;
      packet.curve.getPoint(t, tempPointRef.current);
      packet.curve.getTangent(t, tempTangentRef.current);
      packetMesh.position.copy(tempPointRef.current);
      tempLookRef.current.copy(tempPointRef.current).add(tempTangentRef.current);
      packetMesh.lookAt(tempLookRef.current);

      const material = packetMesh.material as THREE.MeshBasicMaterial;
      material.opacity = alpha * (packet.emphasis === "support" ? 0.35 : 0.65);
    });
  });

  return (
    <group ref={rootRef}>
      {homeSceneData.education.halos.map((halo) => (
        <SignalHalo
          key={`${halo.position.join(":")}-${halo.radius}`}
          halo={halo}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {homeSceneData.education.latticePlanes.map((plane) => (
        <WireLatticePlane
          key={`${plane.position.join(":")}-${plane.tone}`}
          plane={plane}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {ribbons.map((ribbon, index) => (
        <mesh key={`education-ribbon-${index}`}>
          <tubeGeometry args={[ribbon.curve, 48, ribbon.radius, 10, false]} />
          <meshPhysicalMaterial
            ref={registerSceneMaterial}
            color={TONE_COLORS[ribbon.tone]}
            transmission={0.65}
            opacity={ribbon.emphasis === "support" ? 0.15 : 0.25}
            transparent
            ior={1.25}
            thickness={0.25}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
      ))}

      {visibleNodes.map((position, index) => (
        <GlassNode
          key={`education-node-${index}`}
          position={position}
          size={0.18 + index * 0.02}
          tone={index % 2 === 0 ? "scarlet" : "blue"}
          registerMaterial={registerSceneMaterial}
        />
      ))}

      {ribbonPackets.map((packet, index) => (
        <mesh
          key={`education-packet-${index}`}
          ref={(node) => {
            packetRefs.current[index] = node;
          }}
        >
          <capsuleGeometry args={[0.015, 0.2, 4, 8]} />
          <meshBasicMaterial
            color={TONE_COLORS[packet.tone]}
            transparent
            opacity={0.5}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <group ref={coreRigRef}>
        <RutgersAcademicCore
          simplified={profile.simplified}
          registerSceneMaterial={registerSceneMaterial}
        />
      </group>
    </group>
  );
}

function ContactSignalField({
  ranges,
  profile,
}: {
  ranges: HomeSceneRanges;
  profile: ReturnType<typeof useSceneProfile>;
}) {
  const scroll = useScroll();
  const rootRef = useRef<THREE.Group>(null!);
  const signalNodeRefs = useRef<THREE.InstancedMesh>(null!);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempPointRef = useRef(new THREE.Vector3());
  const tempTangentRef = useRef(new THREE.Vector3());
  const tempLookRef = useRef(new THREE.Vector3());
  const anchorZ = useMemo(() => getRangeDepth(ranges.contact, -8), [ranges.contact.end, ranges.contact.start]);
  const [focusX, focusY, focusZ] = homeSceneData.contact.focalOffset;
  const { materialsRef: sceneMaterials, registerMaterial: registerSceneMaterial } = useMaterialRegistry();

  const signalLines = useMemo(
    () =>
      homeSceneData.contact.signalLines.slice(0, profile.contactSignals).map((line) => ({
        ...line,
        curve: new THREE.CatmullRomCurve3(line.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
      })),
    [profile.contactSignals]
  );

  const signalPackets = useMemo(
    () =>
      signalLines.flatMap((line) =>
        line.packetOffsets.map((offset) => ({
          curve: line.curve,
          tone: line.tone,
          offset,
          speed: line.packetSpeed,
          emphasis: line.emphasis ?? "support",
        }))
      ),
    [signalLines]
  );

  const signalNodes = useMemo(
    () =>
      homeSceneData.contact.particles.slice(0, profile.contactParticles).map((position, index) => ({
        position: new THREE.Vector3(...position),
        phase: index * 0.76,
        speed: 0.1 + index * 0.01,
      })),
    [profile.contactParticles]
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const progress = getRangeProgress(scroll.offset, ranges.contact);
    const presence = getRangePresence(scroll.offset, ranges.contact, 0.022);
    const arrivalPulse = getChapterArrivalPulse(progress);
    const footerFade = THREE.MathUtils.smoothstep(
      scroll.offset,
      Math.max(0, ranges.contact.end - 0.06),
      Math.min(1, ranges.contact.end + 0.05)
    );
    const alpha = clamp01(presence * (0.48 + arrivalPulse * 0.1)) * (1 - footerFade * 0.32);

    const xDrift = Math.sin(progress * Math.PI * 1.2 + elapsed * 0.04) * presence * 0.24;
    const yEntrance = -(1 - presence) * 8 + Math.sin(progress * Math.PI) * presence * 0.18 + arrivalPulse * 0.45;
    const zEntrance = -(1 - presence) * 6 - arrivalPulse * 0.9;

    rootRef.current.visible = alpha > 0.01;
    rootRef.current.position.set(focusX + xDrift, focusY + yEntrance, anchorZ + focusZ + zEntrance);
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      Math.sin(elapsed * 0.03) * 0.02 + Math.sin(progress * Math.PI * 2) * presence * 0.018,
      0.04
    );
    rootRef.current.scale.setScalar(0.9 + presence * 0.09 + arrivalPulse * 0.035);

    setRegisteredOpacity(sceneMaterials.current, alpha);

    signalPackets.forEach((packet, index) => {
      const packetMesh = packetRefs.current[index];
      if (!packetMesh) return;
      const t = (packet.offset + elapsed * packet.speed) % 1;
      packet.curve.getPoint(t, tempPointRef.current);
      packet.curve.getTangent(t, tempTangentRef.current);
      packetMesh.position.copy(tempPointRef.current);
      tempLookRef.current.copy(tempPointRef.current).add(tempTangentRef.current);
      packetMesh.lookAt(tempLookRef.current);
      const material = packetMesh.material as THREE.MeshBasicMaterial;
      material.opacity = alpha * (packet.emphasis === "primary" ? 0.32 : 0.2);
    });

    if (signalNodeRefs.current) {
      signalNodes.forEach((node, index) => {
        const time = elapsed * node.speed + node.phase;
        dummy.position.set(
          node.position.x + Math.sin(time) * 0.08,
          node.position.y + Math.cos(time * 0.8) * 0.06,
          node.position.z + Math.sin(time * 1.15) * 0.08
        );
        dummy.rotation.set(0.12, time * 0.18, 0.2);
        dummy.scale.setScalar(0.48 + alpha * 0.12);
        dummy.updateMatrix();
        signalNodeRefs.current!.setMatrixAt(index, dummy.matrix);
      });
      signalNodeRefs.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={rootRef}>
      {signalLines.map((line, index) => (
        <mesh key={`contact-signal-line-${index}`}>
          <tubeGeometry args={[line.curve, 34, line.radius, 6, false]} />
          <meshBasicMaterial
            ref={registerSceneMaterial}
            color={TONE_COLORS[line.tone]}
            transparent
            opacity={line.emphasis === "primary" ? 0.1 : 0.07}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {signalPackets.map((packet, index) => (
        <mesh
          key={`contact-signal-packet-${index}`}
          ref={(node) => {
            packetRefs.current[index] = node;
          }}
        >
          <capsuleGeometry args={[0.008, 0.12, 4, 6]} />
          <meshBasicMaterial
            color={TONE_COLORS[packet.tone]}
            transparent
            opacity={0.28}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <instancedMesh ref={signalNodeRefs} args={[undefined, undefined, signalNodes.length]}>
        <boxGeometry args={[0.06, 0.06, 0.025]} />
        <meshBasicMaterial
          ref={registerSceneMaterial}
          color="#38bdf8"
          transparent
          opacity={0.2}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

export function HomeLowerScene({
  sectionRanges,
  liteMode = false,
}: {
  sectionRanges: HomeSceneRanges;
  liteMode?: boolean;
}) {
  const profile = useSceneProfile(liteMode);

  return (
    <>
      <ProjectsDataCosmos ranges={sectionRanges} profile={profile} />
      <ExperienceSystemsField ranges={sectionRanges} profile={profile} />
      <RutgersEducationScene ranges={sectionRanges} profile={profile} />
      {!liteMode && <ContactSignalField ranges={sectionRanges} profile={profile} />}
    </>
  );
}
