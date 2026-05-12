/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useScroll, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { HeroScene } from "./HeroScene";
import { HomeLowerScene } from "./HomeLowerScene";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { MotionValue } from "motion/react";
import type { HomeSceneRanges, SectionRange } from "../../data/homeSceneData";

interface HeroAnchor {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

function ScenePostEffects({ liteMode }: { liteMode: boolean }) {
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.00018, 0.00018), []);

  if (liteMode) return null;

  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.9} height={220} intensity={0.78} />
      <ChromaticAberration offset={chromaticOffset} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function InfrastructureBackplane({ liteMode }: { liteMode: boolean }) {
  const backplaneRef = useRef<THREE.Group>(null!);
  const railCount = liteMode ? 5 : 8;
  const rails = useMemo(
    () =>
      Array.from({ length: railCount }, (_, index) => ({
        width: 10 + index * 1.1,
        y: -2.9 + index * 0.48,
        z: -18 - index * 6,
        tone: index % 3 === 0 ? "#38bdf8" : index % 3 === 1 ? "#34d399" : "#fbbf24",
        opacity: liteMode ? 0.035 : 0.052,
      })),
    [liteMode, railCount]
  );

  useFrame((state) => {
    if (!backplaneRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    backplaneRef.current.rotation.z = Math.sin(elapsed * 0.035) * 0.018;
    backplaneRef.current.position.x = Math.sin(elapsed * 0.06) * 0.18;
  });

  return (
    <group ref={backplaneRef} position={[0, -0.25, -38]} rotation={[0.18, -0.16, 0]}>
      {rails.map((rail, index) => (
        <group key={`infrastructure-backplane-${index}`} position={[0, rail.y, rail.z]}>
          <mesh>
            <boxGeometry args={[rail.width, 0.012, 0.025]} />
            <meshBasicMaterial color={rail.tone} transparent opacity={rail.opacity} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[rail.width * -0.28, 0.22, 0]}>
            <boxGeometry args={[0.012, 0.44, 0.025]} />
            <meshBasicMaterial color={rail.tone} transparent opacity={rail.opacity * 0.82} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[rail.width * 0.24, -0.2, 0]}>
            <boxGeometry args={[0.012, 0.4, 0.025]} />
            <meshBasicMaterial color={rail.tone} transparent opacity={rail.opacity * 0.68} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ReactiveLight() {
  const lightRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!lightRef.current) return;
    const targetX = state.pointer.x * 30;
    const targetY = state.pointer.y * 20;

    lightRef.current.position.x = THREE.MathUtils.lerp(
      lightRef.current.position.x,
      targetX,
      0.05
    );
    lightRef.current.position.y = THREE.MathUtils.lerp(
      lightRef.current.position.y,
      targetY,
      0.05
    );
  });

  return (
    <group position={[0, 0, -170]}>
      <group ref={lightRef}>
        <pointLight color="#38bdf8" intensity={30} distance={76} decay={2} />
      </group>
    </group>
  );
}

function ndcToWorldAtZ(
  camera: THREE.PerspectiveCamera,
  ndcX: number,
  ndcY: number,
  targetZ: number,
  target: THREE.Vector3
) {
  const point = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
  const direction = point.sub(camera.position).normalize();
  const distance = (targetZ - camera.position.z) / direction.z;
  target.copy(camera.position).add(direction.multiplyScalar(distance));
  return target;
}

function getSectionProgress(offset: number, range: SectionRange) {
  return THREE.MathUtils.clamp((offset - range.start) / Math.max(0.0001, range.end - range.start), 0, 1);
}

function getSectionArrivalPulse(offset: number, range: SectionRange) {
  const progress = getSectionProgress(offset, range);
  const pulseIn = THREE.MathUtils.smoothstep(progress, 0.02, 0.22);
  const pulseOut = 1 - THREE.MathUtils.smoothstep(progress, 0.3, 0.62);
  return THREE.MathUtils.clamp(pulseIn * pulseOut, 0, 1);
}

function getStoryChapterPulse(offset: number, ranges: HomeSceneRanges) {
  return Math.max(
    getSectionArrivalPulse(offset, ranges.projects),
    getSectionArrivalPulse(offset, ranges.experience),
    getSectionArrivalPulse(offset, ranges.education),
    getSectionArrivalPulse(offset, ranges.contact)
  );
}

export function StoryScene({
  heroAnchor,
  heroIntroProgress,
  sectionRanges,
  liteMode = false,
}: {
  heroAnchor: HeroAnchor;
  heroIntroProgress: MotionValue<number>;
  sectionRanges: HomeSceneRanges;
  liteMode?: boolean;
}) {
  const scroll = useScroll();
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null!);
  const heroAnchorRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const offset = scroll.offset;
    const introProgress = heroIntroProgress.get();
    const heroReset = introProgress <= 0.02;
    const effectiveOffset = heroReset ? 0 : offset;
    const chapterPulse = heroReset ? 0 : getStoryChapterPulse(offset, sectionRanges);
    const targetZ = -effectiveOffset * 164 - chapterPulse * 2.8;
    const heroLock = heroReset ? 1 : 1 - THREE.MathUtils.smoothstep(introProgress, 0.72, 0.96);
    const heroDepth = heroReset ? 0 : THREE.MathUtils.smoothstep(introProgress, 0.04, 0.78);
    const cameraLerp = heroReset ? 0.16 : 0.05;
    const rollLerp = heroReset ? 0.12 : 0.04;

    ndcToWorldAtZ(
      camera as THREE.PerspectiveCamera,
      heroAnchor.x.get(),
      heroAnchor.y.get(),
      0,
      heroAnchorRef.current
    );

    const heroPushIn = heroDepth * 0.8;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ + 5 - heroPushIn, cameraLerp);

    const mouseX = state.pointer.x;
    const mouseY = state.pointer.y;
    const heroCameraX = 0;
    const heroCameraY = 0;
    const storyCameraX =
      Math.sin(effectiveOffset * Math.PI * 2) * (1.15 + chapterPulse * 0.28) +
      Math.sin(effectiveOffset * Math.PI * 7) * chapterPulse * 0.42 +
      mouseX * (1.45 + chapterPulse * 0.22);
    const storyCameraY =
      Math.cos(effectiveOffset * Math.PI * 2) * 0.58 +
      chapterPulse * 0.32 +
      mouseY * (1.45 + chapterPulse * 0.18);

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      THREE.MathUtils.lerp(storyCameraX, heroCameraX, heroLock),
      cameraLerp
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      THREE.MathUtils.lerp(storyCameraY, heroCameraY, heroLock),
      cameraLerp
    );

    const lookAtZ = targetZ - 20 - chapterPulse * 2.2;
    const lookAtX = THREE.MathUtils.lerp(camera.position.x * 0.16, heroAnchorRef.current.x * 0.2, heroLock);
    const lookAtY = THREE.MathUtils.lerp(camera.position.y * 0.16, heroAnchorRef.current.y * 0.26, heroLock);
    camera.lookAt(lookAtX, lookAtY, lookAtZ);

    const storyRoll =
      Math.sin(effectiveOffset * Math.PI * 0.8) * 0.015 +
      Math.sin(effectiveOffset * Math.PI * 3.2) * chapterPulse * 0.012;
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      THREE.MathUtils.lerp(storyRoll, 0, heroLock),
      rollLerp
    );
  });

  return (
    <>
      <fog attach="fog" args={["#000000", 8, 45]} />
      <Stars radius={50} depth={150} count={liteMode ? 420 : 950} factor={2.4} saturation={0} fade speed={liteMode ? 0.18 : 0.42} />
      <InfrastructureBackplane liteMode={liteMode} />

      <group ref={group}>
        <group position={[0, 0, 0]}>
          <HeroScene heroAnchor={heroAnchor} heroIntroProgress={heroIntroProgress} liteMode={liteMode} />
        </group>

        <HomeLowerScene sectionRanges={sectionRanges} liteMode={liteMode} />

        {!liteMode && <ReactiveLight />}
      </group>

      <ScenePostEffects liteMode={liteMode} />
    </>
  );
}
