/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFrame } from "@react-three/fiber";
import { Float, Line, MeshDistortMaterial, Trail } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function RoutedSignal({
  path,
  color,
  speed,
  size = 0.11,
  trailLength = 4,
}: {
  path: THREE.Vector3[];
  color: string;
  speed: number;
  size?: number;
  trailLength?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path), [path]);

  useFrame((state) => {
    const t = (state.clock.getElapsedTime() * speed) % 1;
    curve.getPoint(t, ref.current.position);
  });

  return (
    <Trail width={1.8} length={trailLength} color={new THREE.Color(color)} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Trail>
  );
}

function GlowFrame({
  position,
  size,
  color,
  opacity = 0.18,
  wireframe = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity?: number;
  wireframe?: boolean;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={opacity} wireframe={wireframe} />
    </mesh>
  );
}

function PulseColumn({
  position,
  height,
  color,
  phase,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  phase: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const pulse = 0.88 + Math.sin(state.clock.getElapsedTime() * 1.8 + phase) * 0.14;
    ref.current.scale.y = pulse;
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.45, height, 0.45]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.78} />
    </mesh>
  );
}

function OrbitNode({
  radius,
  speed,
  color,
  offset,
  y = 0,
  scale = 0.16,
}: {
  radius: number;
  speed: number;
  color: string;
  offset: number;
  y?: number;
  scale?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const theta = state.clock.getElapsedTime() * speed + offset;
    ref.current.position.set(Math.cos(theta) * radius, y + Math.sin(theta * 0.6) * 0.3, Math.sin(theta) * radius);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[scale, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export function DataEngineerScene() {
  const group = useRef<THREE.Group>(null!);
  const lanes = useMemo(
    () => ({
      left: [
        new THREE.Vector3(-3.6, 1.15, -1.1),
        new THREE.Vector3(-2.4, 0.55, -0.45),
        new THREE.Vector3(-1.05, -0.95, 0),
        new THREE.Vector3(0.05, 0.1, 0),
        new THREE.Vector3(1.25, 1.2, 0),
        new THREE.Vector3(3.2, 0.55, 0.2),
      ],
      right: [
        new THREE.Vector3(-3.45, -1.05, 1.1),
        new THREE.Vector3(-2.25, -0.45, 0.55),
        new THREE.Vector3(-1.05, -0.95, 0),
        new THREE.Vector3(0.05, 0.1, 0),
        new THREE.Vector3(1.25, 1.2, 0),
        new THREE.Vector3(3.2, 0.55, 0.2),
      ],
      serve: [
        new THREE.Vector3(1.25, 1.2, 0),
        new THREE.Vector3(2.05, 1.65, -0.15),
        new THREE.Vector3(3.2, 0.55, 0.2),
      ],
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.18) * 0.26;
    group.current.rotation.x = Math.cos(t * 0.12) * 0.06;
  });

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.18}>
        <mesh position={[-1.05, -0.95, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[2.35, 2.35, 0.08, 48]} />
          <meshStandardMaterial color="#b45309" emissive="#b45309" emissiveIntensity={0.55} transparent opacity={0.2} wireframe />
        </mesh>
        <mesh position={[0.05, 0.1, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[1.75, 1.75, 0.08, 48]} />
          <meshStandardMaterial color="#94a3b8" emissive="#94a3b8" emissiveIntensity={0.45} transparent opacity={0.24} wireframe />
        </mesh>
        <mesh position={[1.25, 1.2, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[1.25, 1.25, 0.08, 48]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.65} transparent opacity={0.28} wireframe />
        </mesh>
      </Float>

      <GlowFrame position={[-3.6, 1.15, -1.1]} size={[0.75, 1.2, 0.75]} color="#22c55e" opacity={0.18} />
      <GlowFrame position={[-3.45, -1.05, 1.1]} size={[0.75, 1.2, 0.75]} color="#0ea5e9" opacity={0.18} />
      <GlowFrame position={[3.2, 0.55, 0.2]} size={[1.05, 1.75, 1.05]} color="#fbbf24" opacity={0.18} />

      <Line points={lanes.left} color="#34d399" transparent opacity={0.32} />
      <Line points={lanes.right} color="#38bdf8" transparent opacity={0.32} />
      <Line points={lanes.serve} color="#fbbf24" transparent opacity={0.38} />

      <RoutedSignal path={lanes.left} color="#34d399" speed={0.17} trailLength={5} />
      <RoutedSignal path={lanes.right} color="#38bdf8" speed={0.21} trailLength={5} />
      <RoutedSignal path={lanes.serve} color="#fde68a" speed={0.35} size={0.13} trailLength={3} />
    </group>
  );
}

export function SoftwareEngineerScene() {
  const group = useRef<THREE.Group>(null!);
  const services = useMemo(
    () => [
      new THREE.Vector3(-2.75, 1.5, -0.45),
      new THREE.Vector3(-2.9, -1.25, 0.9),
      new THREE.Vector3(-0.95, 2.35, 0.65),
      new THREE.Vector3(1.45, 2.1, -0.85),
      new THREE.Vector3(3, 0.55, 0.4),
      new THREE.Vector3(2.45, -1.55, -0.6),
      new THREE.Vector3(-0.45, -2.15, -0.95),
    ],
    []
  );
  const hub = useMemo(() => new THREE.Vector3(0.1, 0.05, 0), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.15) * 0.18;
    group.current.rotation.z = Math.cos(t * 0.09) * 0.03;
  });

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.22}>
        <mesh position={[0.1, 0.05, 0]}>
          <octahedronGeometry args={[0.82]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} transparent opacity={0.82} />
        </mesh>
        <mesh position={[0.1, 0.05, 0]} scale={[1.85, 1.85, 1.85]}>
          <torusGeometry args={[1.25, 0.05, 16, 72]} />
          <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.55} transparent opacity={0.34} />
        </mesh>
      </Float>

      {services.map((position, index) => (
        <Float key={`${position.x}-${position.y}`} speed={1.1 + index * 0.08} rotationIntensity={0.15} floatIntensity={0.16}>
          <GlowFrame
            position={[position.x, position.y, position.z]}
            size={[0.95, 0.58, 0.2]}
            color={index % 2 === 0 ? "#38bdf8" : "#22d3ee"}
            opacity={0.22}
          />
        </Float>
      ))}

      {services.map((position, index) => (
        <Line
          key={`line-${position.x}-${position.y}`}
          points={[hub, position]}
          color={index % 2 === 0 ? "#38bdf8" : "#22d3ee"}
          transparent
          opacity={0.24}
        />
      ))}

      <RoutedSignal path={[services[0], hub, services[4]]} color="#7dd3fc" speed={0.22} trailLength={4} />
      <RoutedSignal path={[services[1], hub, services[3]]} color="#22d3ee" speed={0.18} trailLength={4} />
      <RoutedSignal path={[services[6], hub, services[2]]} color="#bfdbfe" speed={0.25} trailLength={4} />
    </group>
  );
}

export function DataScientistScene() {
  const group = useRef<THREE.Group>(null!);
  const points = useMemo(() => {
    const clusterA = Array.from({ length: 24 }, (_, index) => ({
      position: new THREE.Vector3(-1.65 + ((index % 6) - 2.5) * 0.22, Math.floor(index / 6) * 0.22 - 0.6, ((index % 4) - 1.5) * 0.18),
      color: "#a855f7",
    }));
    const clusterB = Array.from({ length: 24 }, (_, index) => ({
      position: new THREE.Vector3(1.45 + ((index % 6) - 2.5) * 0.2, Math.floor(index / 6) * 0.2 - 0.55, ((index % 4) - 1.5) * 0.2),
      color: "#d946ef",
    }));
    const anomalies = [
      new THREE.Vector3(-0.15, 1.95, 1.25),
      new THREE.Vector3(0.45, -1.9, -1.35),
      new THREE.Vector3(2.25, 1.35, -1.55),
      new THREE.Vector3(-2.4, -1.2, 1.6),
    ];

    return {
      clusterA,
      clusterB,
      anomalies,
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.08;
    group.current.rotation.x = Math.sin(t * 0.18) * 0.08;
  });

  return (
    <group ref={group}>
      <Float speed={1.1} rotationIntensity={0.1} floatIntensity={0.18}>
        <mesh rotation-x={Math.PI / 2} position={[0, -0.2, 0]}>
          <planeGeometry args={[6.8, 6.8, 20, 20]} />
          <MeshDistortMaterial color="#581c87" distort={0.18} speed={1.1} transparent opacity={0.12} wireframe />
        </mesh>
      </Float>

      <mesh rotation-x={Math.PI / 2} position={[0, 0.35, 0]} scale={[1.1, 1.1, 1.1]}>
        <torusGeometry args={[2.35, 0.04, 16, 72]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.5} transparent opacity={0.32} />
      </mesh>

      {points.clusterA.concat(points.clusterB).map((point) => (
        <mesh key={`${point.position.x}-${point.position.y}-${point.position.z}`} position={point.position}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color={point.color} />
        </mesh>
      ))}

      {points.anomalies.map((position, index) => (
        <Float key={`${position.x}-${position.y}-${position.z}`} speed={2.2 + index * 0.3} rotationIntensity={0.3} floatIntensity={0.55}>
          <mesh position={position}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
        </Float>
      ))}

      <OrbitNode radius={2.25} speed={0.8} color="#e879f9" offset={0} y={0.2} />
      <OrbitNode radius={1.75} speed={-0.9} color="#a78bfa" offset={1.5} y={-0.15} scale={0.12} />
      <OrbitNode radius={2.65} speed={0.55} color="#c084fc" offset={3.2} y={0.45} scale={0.1} />
    </group>
  );
}

export function DataAnalystScene() {
  const group = useRef<THREE.Group>(null!);
  const trendPoints = useMemo(
    () => [
      new THREE.Vector3(-3.2, -1.2, 0),
      new THREE.Vector3(-1.7, -0.55, 0.25),
      new THREE.Vector3(-0.4, -0.35, 0.18),
      new THREE.Vector3(1.1, 0.4, -0.12),
      new THREE.Vector3(2.8, 1.35, -0.22),
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.14) * 0.12;
    group.current.position.y = Math.sin(t * 0.35) * 0.08;
  });

  return (
    <group ref={group}>
      <Float speed={1} rotationIntensity={0.08} floatIntensity={0.16}>
        <GlowFrame position={[0, 0.1, -0.85]} size={[6.3, 3.75, 0.14]} color="#0f766e" opacity={0.08} />
      </Float>

      <PulseColumn position={[-2.45, -0.55, -0.15]} height={1.45} color="#10b981" phase={0.1} />
      <PulseColumn position={[-1.55, -0.15, -0.15]} height={2.2} color="#14b8a6" phase={0.8} />
      <PulseColumn position={[-0.65, 0.2, -0.15]} height={2.95} color="#22c55e" phase={1.5} />
      <PulseColumn position={[0.35, 0.55, -0.15]} height={3.6} color="#34d399" phase={2.2} />

      <Line points={trendPoints} color="#99f6e4" transparent opacity={0.5} />
      <RoutedSignal path={trendPoints} color="#ccfbf1" speed={0.28} trailLength={3} />

      <mesh position={[2.1, 1.25, -0.1]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.85, 0.08, 12, 48, Math.PI * 1.45]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.55} transparent opacity={0.55} />
      </mesh>
      <mesh position={[2.2, -0.2, 0.05]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.58, 0.08, 12, 40, Math.PI * 1.1]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.45} transparent opacity={0.45} />
      </mesh>

      <OrbitNode radius={1.15} speed={0.85} color="#a7f3d0" offset={0.2} y={1.15} scale={0.08} />
      <OrbitNode radius={0.9} speed={-1} color="#5eead4" offset={2.1} y={-0.2} scale={0.07} />
    </group>
  );
}
