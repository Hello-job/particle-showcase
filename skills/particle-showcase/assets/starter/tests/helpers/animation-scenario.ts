import {
  BufferGeometry,
  Group,
  Object3D,
  OrthographicCamera,
  Points,
  Vector2,
  Vector3,
} from "three";
import type { IUniform } from "three";
import type { AstraInput } from "../../src/particles/engine/types";
import type { AnimationFrame, AnimationState } from "../../src/particles/core/animation";
import type {
  RuntimeConfig,
  AnimationPreset,
  InteractionMode,
} from "../../src/particles/core/config";
import type { ParticleField, ParticlePathLayer } from "../../src/particles/core/field";
import { createDustMaterial, createStarMaterial } from "../../src/particles/core/field-materials";
import { resolveEngineConfig } from "../../src/particles/core/config";

export interface AnimationImplementation {
  createAstraAnimationState(config: RuntimeConfig, progress?: number): AnimationState;
  updateAstraAnimation(frame: AnimationFrame, animationDelta: number, inputDelta: number): boolean;
}
export interface AnimationScenario {
  name: string;
  preset: AnimationPreset;
  interaction: InteractionMode;
  custom?: boolean;
  filled?: boolean;
  reducedMotion?: boolean;
  paused?: boolean;
  mobile?: boolean;
}
export const ANIMATION_SCENARIOS: AnimationScenario[] = [
  { name: "astra-converge-scroll-drag-reverse", preset: "converge-tilt", interaction: "rotate" },
  { name: "legacy-zoom-pointer-lens", preset: "legacy-zoom", interaction: "depth-lens" },
  { name: "accretion-core-dust-flare", preset: "accretion-exhale", interaction: "rotate" },
  { name: "grow-forward-and-backward-layers", preset: "grow", interaction: "rotate" },
  {
    name: "custom-filled-mobile",
    preset: "converge-tilt",
    interaction: "rotate",
    custom: true,
    filled: true,
    mobile: true,
  },
  {
    name: "reduced-motion-custom",
    preset: "converge-tilt",
    interaction: "none",
    custom: true,
    reducedMotion: true,
  },
  {
    name: "paused-lens-settling",
    preset: "converge-tilt",
    interaction: "depth-lens",
    paused: true,
  },
];
function samples(count: number): Float32Array {
  const data = new Float32Array(count * 4);
  for (let index = 0; index < count; index += 1) {
    const progress = index / (count - 1);
    data[index * 4] = Math.cos(progress * Math.PI * 2) * 0.65;
    data[index * 4 + 1] = Math.sin(progress * Math.PI * 2) * 0.4;
    data[index * 4 + 2] = progress < 0.5 ? 0 : 0.5;
    data[index * 4 + 3] = progress < 0.5 ? 0.5 : 1;
  }
  return data;
}
function createField(config: RuntimeConfig): ParticleField {
  const pathLayers: ParticlePathLayer[] = [0.025, -0.018, 0].map((speed, index) => ({
    curve: null,
    dustMaterial:
      index === 2
        ? null
        : createDustMaterial(config, { phase: 0.16, strong: index === 0 }, speed, 1),
    starMaterial: createStarMaterial(config, 1),
    flareAcrossOffset: 0.02 + index * 0.01,
    flareBasePosition: new Vector3(0.04, -0.06, 0.1),
    flareClearanceSeed: index === 0 ? 0.2 : 0.82,
    flareDepthOffset: 0.025,
    flarePathSamples: index === 2 ? null : samples(512),
    flareProgress: 0.16 + index * 0.17,
    flareScatter: new Vector3(0.12 + 0.23 * index, 0.68 - 0.19 * index, 0.4 + 0.11 * index),
    flareShapeAcrossScatter: 0.02,
    flareShapeDepthScatter: 0.014,
    flareShapeSeed: 0.28 + index * 0.21,
    flareSource: new Object3D(),
    isCore: index === 2,
    outwardSpeed: -Math.abs(speed),
    phase: 0.16,
    motionOffset: 0,
    speed,
    strong: index === 0,
    pathShapeDepth: 0.18,
    pathShapeDepthPhase: 0.52,
    pathShapeTravel: 0,
    travel: 0.16,
  }));
  const coreCluster = new Points(new BufferGeometry(), pathLayers[2].starMaterial);
  return {
    coreCluster,
    coreSource: new Object3D(),
    disposables: [],
    group: new Group(),
    orbits: [
      { group: new Group(), lag: 0.1, spin: new Vector2() },
      { group: new Group(), lag: 0.84, spin: new Vector2() },
    ],
    pathLayers,
    secondarySources: [],
    particleCount: 3,
    particleMotionEnabled: true,
    dispose() {
      for (const layer of pathLayers) {
        layer.starMaterial.dispose();
        layer.dustMaterial?.dispose();
      }
      coreCluster.geometry.dispose();
    },
  };
}
function captureNumbers(frame: AnimationFrame, pending: boolean): number[] {
  const { state, camera, animationRoot, spinRoot, field } = frame;
  const result = [
    Number(pending),
    state.elapsed,
    state.introProgress,
    state.scrollProgress,
    state.tiltProgress,
    state.scatter,
    state.scatterPositionProgress,
    state.shapeProgress,
    state.shapePositionProgress,
    state.starsOpacity,
    state.coreRotation,
    state.railPresence,
    ...state.shapeRotation.toArray(),
    state.lensStrength,
    ...state.lensPointer.toArray(),
    state.particleMotion.epoch,
    state.particleMotion.remaining,
    ...state.particleMotion.impulse.toArray(),
    ...animationRoot.position.toArray(),
    ...animationRoot.scale.toArray(),
    animationRoot.rotation.x,
    animationRoot.rotation.y,
    animationRoot.rotation.z,
    spinRoot.rotation.x,
    spinRoot.rotation.y,
    camera.zoom,
    ...camera.position.toArray(),
  ];
  for (const orbit of field.orbits) result.push(orbit.group.rotation.x, orbit.group.rotation.y);
  for (const layer of field.pathLayers) {
    const uniforms = layer.starMaterial.uniforms;
    result.push(
      layer.motionOffset,
      layer.pathShapeTravel,
      layer.travel,
      uniforms.uIntensity.value,
      uniforms.uPathShapeProgress.value,
      uniforms.uScrollPositionProgress.value,
      uniforms.uPathShapePointScale.value,
      uniforms.uGrowthProgress.value,
      uniforms.uFlowSpeed.value,
    );
    if (layer.flareSource)
      result.push(...layer.flareSource.position.toArray(), ...layer.flareSource.scale.toArray());
    if (layer.dustMaterial)
      result.push(
        layer.dustMaterial.uniforms.uHeadProgress.value,
        layer.dustMaterial.uniforms.uIntensity.value,
      );
  }
  return result;
}

/** Exhaustive numeric snapshot is used only by the migration comparison, not the stored goldens. */
function captureFullNumbers(frame: AnimationFrame, pending: boolean): number[] {
  const result = captureNumbers(frame, pending);
  const append = (value: unknown) => {
    if (typeof value === "number") result.push(value);
    else if (typeof value === "boolean") result.push(Number(value));
    else if (value instanceof Vector2 || value instanceof Vector3) result.push(...value.toArray());
  };
  Object.values(frame.state).forEach(append);
  Object.values(frame.state.particleMotion).forEach(append);
  Object.values(frame.state.scratch).forEach(append);
  for (const layer of frame.field.pathLayers) {
    Object.values(layer).forEach(append);
    const uniforms: IUniform<unknown>[] = Object.values(layer.starMaterial.uniforms);
    uniforms.forEach(({ value }) => append(value));
    if (layer.dustMaterial)
      Object.values(layer.dustMaterial.uniforms).forEach(({ value }) => append(value));
  }
  return result;
}
export function runAnimationScenario(
  implementation: AnimationImplementation,
  scenario: AnimationScenario,
  exhaustive = false,
): number[][] {
  const config = resolveEngineConfig({
    animationPreset: scenario.preset,
    interactionMode: scenario.interaction,
    animationPlaying: !scenario.paused,
  });
  const field = createField(config);
  const state = implementation.createAstraAnimationState(config);
  const shapeSamples = samples(1024);
  const input: AstraInput = {
    contentBounds: { left: 0.28, right: 0.72 },
    heroViewportHeight: scenario.mobile ? 700 : 820,
    reducedMotion: scenario.reducedMotion ?? false,
    heroShapeEnabled: scenario.custom ?? false,
    progress: 0,
    scatterProgress: null,
    tiltProgress: null,
    starsOpacity: 1,
    scrolling: false,
    returning: false,
    rotation: { x: 0, y: 0 },
    pointer: { active: false, pressed: false, reset: false, x: 0, y: 0 },
    shape: {
      centerNdc: { x: 0.08, y: -0.1 },
      id: scenario.custom ? "hero:custom" : null,
      samples: scenario.custom ? shapeSamples : null,
      sizeNdc: { x: 1.25, y: 0.9 },
      strength: scenario.custom ? 1 : 0,
      hero: scenario.custom ?? false,
      filled: scenario.filled ?? false,
      accentRange: [0.65, 0.78],
      flowScale: 0.75,
      rowSpacing: 0.02,
    },
  };
  const frame: AnimationFrame = {
    config,
    state,
    field,
    input,
    camera: new OrthographicCamera(),
    animationRoot: new Group(),
    spinRoot: new Group(),
    viewport: scenario.mobile ? { width: 360, height: 780 } : { width: 1440, height: 900 },
  };
  const snapshots: number[][] = [];
  try {
    for (let step = 0; step < 660; step += 1) {
      input.progress =
        step < 360
          ? 0
          : step < 450
            ? (step - 360) / 90
            : step < 510
              ? 1
              : Math.max(0, 1 - (step - 510) / 100);
      input.scrolling = step >= 360 && step < 450;
      input.returning = step >= 540;
      input.rotation = { x: Math.sin(step * 0.037) * 0.24, y: Math.cos(step * 0.029) * 0.48 };
      input.pointer = {
        active: step > 20 && step < 580,
        pressed: step >= 70 && step < 90,
        reset: step === 600,
        x: Math.sin(step * 0.06) * 0.6,
        y: Math.cos(step * 0.04) * 0.4,
      };
      if (step === 440)
        Object.assign(input.shape, {
          id: "ending:fixture",
          samples: shapeSamples,
          hero: false,
          strength: 0.87,
        });
      if (step === 560) input.starsOpacity = 0.72;
      const pending = implementation.updateAstraAnimation(
        frame,
        scenario.paused ? 0 : 1 / 60,
        1 / 60,
      );
      if (exhaustive || [29, 359, 479, 599, 659].includes(step))
        snapshots.push(
          exhaustive ? captureFullNumbers(frame, pending) : captureNumbers(frame, pending),
        );
    }
    return snapshots;
  } finally {
    state.dispose();
    field.dispose();
  }
}
