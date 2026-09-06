import { MathUtils } from "three";
import type { Vector2, Vector3 } from "three";

/** Shared CPU/GLSL motion equations, retaining the reference arithmetic and constants. */
export const PARTICLE_MOTION_SETTLE_SECONDS = 6;
export const PARTICLE_MOTION_COAST_GLSL = `
  vec4 astraCoast(vec4 state, float mass, float age) {
    float drag = 2.3 / sqrt(mass);
    float velocityDecay = exp(-drag * age);
    float returnDecay = exp(-age);
    state.xy = state.xy * returnDecay
      + state.zw * (returnDecay - velocityDecay) / (drag - 1.0);
    state.zw *= velocityDecay;
    return state;
  }
`;
export const ASTRA_INTRO_MOTION_GLSL = `
  vec3 astraIntroMotion(
    vec3 position, vec3 scattered, float progress,
    float seed, float travelSeed
  ) {
    if (progress >= 1.0) return position;
    float start = 0.14 + seed * 0.18;
    float duration = 0.58 + travelSeed * 0.1;
    float local = clamp((progress - start) / duration, 0.0, 1.0);
    float smoothPull = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);
    float pull = mix(smoothPull, sin(smoothPull * 3.14159265359 * 0.5), 0.5);
    float angle = sin(pull * 3.14159265359) * (0.44 + seed * 0.22);
    float c = cos(angle);
    float s = sin(angle);
    vec3 orbiting = vec3(
      scattered.x * c - scattered.y * s,
      scattered.x * s + scattered.y * c,
      scattered.z
    );
    return mix(orbiting, position, pull);
  }
`;
export const ASTRA_AMBIENT_DRIFT_MAX = 0.12;
export const ASTRA_AMBIENT_DRIFT_MIN = 0.035;
export const ASTRA_AMBIENT_SPEED_MAX = 0.8;
export const ASTRA_AMBIENT_SPEED_MIN = 0.4;
export const ASTRA_PARALLAX_MAX = 0.28;
export const ASTRA_PARALLAX_MIN = 0.08;
const FULL_TURN = 2 * Math.PI;

export function particleMotionMass(pointSize: number): number {
  return MathUtils.lerp(0.65, 2.4, MathUtils.smoothstep(pointSize, 1, 14));
}

/** Mutates a reusable offset vector; seeded oscillation starts at zero displacement. */
export function getAstraDispersedMotionOffset(
  target: Vector2,
  elapsed: number,
  xSeed: number,
  ySeed: number,
  depthSeed: number,
  scrollDrift: number,
  amount: number,
): Vector2 {
  const depth = MathUtils.clamp(depthSeed, 0, 1);
  const strength = MathUtils.clamp(amount, 0, 1);
  if (strength === 0) return target.set(0, 0);
  const speed = MathUtils.lerp(0.4, 0.8, depth);
  const distance = MathUtils.lerp(0.035, 0.12, depth) * strength;
  const xPhase = xSeed * FULL_TURN + 2.7 * ySeed;
  const yPhase = ySeed * FULL_TURN + 3.1 * depthSeed;
  const parallax = scrollDrift * MathUtils.lerp(0.08, 0.28, depth * depth) * strength;
  return target.set(
    (Math.sin(xPhase + elapsed * speed) - Math.sin(xPhase)) * distance,
    (Math.cos(yPhase + elapsed * speed * 0.73) - Math.cos(yPhase)) * distance + parallax,
  );
}

/** Pull a scattered point into its destination with the same staggered orbit as the shader. */
export function applyAstraIntroMotion(
  position: Vector3,
  scattered: Vector3,
  progress: number,
  seed: number,
  travelSeed: number,
): void {
  if (progress >= 1) return;
  const start = 0.14 + 0.18 * seed;
  const smoothPull = MathUtils.smootherstep(progress, start, start + (0.58 + 0.1 * travelSeed));
  const pull = MathUtils.lerp(smoothPull, Math.sin(smoothPull * Math.PI * 0.5), 0.5);
  const angle = Math.sin(pull * Math.PI) * (0.44 + 0.22 * seed);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  position.set(
    MathUtils.lerp(scattered.x * cosine - scattered.y * sine, position.x, pull),
    MathUtils.lerp(scattered.x * sine + scattered.y * cosine, position.y, pull),
    MathUtils.lerp(scattered.z, position.z, pull),
  );
}
