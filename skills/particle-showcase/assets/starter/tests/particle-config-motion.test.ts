import assert from "node:assert/strict";
import test from "node:test";
import { Vector2, Vector3 } from "three";
import {
  getAstraScrollState,
  prepareAstraRuntimeConfig,
  resolveEngineConfig,
  resolveHeroLayout,
  resolveAstraRendererConfig,
  resolveCueKeyframe,
} from "../src/particles/core/config";
import {
  applyAstraIntroMotion,
  getAstraDispersedMotionOffset,
  particleMotionMass,
} from "../src/particles/core/motion";
import baseline from "./fixtures/config-motion-baseline.json";

function close(actual: number[], expected: number[]) {
  assert.equal(actual.length, expected.length);
  for (const [index, value] of actual.entries())
    assert.ok(
      Math.abs(value - expected[index]) < 1e-12,
      `index ${index}: expected ${expected[index]}, received ${value}`,
    );
}

test("runtime defaults match the preserved renderer baseline", () => {
  assert.deepEqual(resolveEngineConfig(), baseline.defaultConfig);
});

test("external controls clamp finite values and ignore accessors and inherited values", () => {
  let getterReads = 0;
  const controls = Object.create({ bloomIntensity: 2 });
  Object.defineProperty(controls, "animationPlaying", {
    get() {
      getterReads += 1;
      return false;
    },
  });
  Object.assign(controls, {
    stars: { size: 999, density: NaN, flowInward: false },
    interaction: { repelRadius: -2 },
    animationPreset: "missing",
  });
  const result = resolveEngineConfig(controls);
  assert.equal(getterReads, 0);
  assert.equal(result.animationPlaying, true);
  assert.equal(result.bloomIntensity, baseline.defaultConfig.bloomIntensity);
  assert.equal(result.stars.size, 3);
  assert.equal(result.stars.density, 4);
  assert.equal(result.stars.flowInward, false);
  assert.equal(result.interaction.repelRadius, 16);
  assert.equal(result.animationPreset, "converge-tilt");
});

test("scene settings survive cue resolution without becoming accidental keyframe overrides", () => {
  const data = { scene: { particles: { starSize: 1.25 }, motion: { revealDuration: 4 } } };
  const layout = resolveHeroLayout(data);
  const base = resolveAstraRendererConfig(layout, data);
  const cue = resolveCueKeyframe({
    cueIndex: 1,
    keyframes: layout.keyframes,
    data: { keyframe: { particles: { starIntensity: 0.85 } } },
  });
  const prepared = prepareAstraRuntimeConfig(base, cue);
  assert.equal(prepared.resolved.stars.size, 1.25);
  assert.equal(prepared.resolved.stars.intensity, 0.85);
  assert.equal(prepared.resolved.convergeDuration, 4);
});

test("scroll state preserves its fade, dispersion and reduced-motion thresholds", () => {
  const config = resolveEngineConfig();
  assert.deepEqual(getAstraScrollState(100, config), {
    textOpacity: 0.5,
    dispersion: 0.125,
    progress: 0.125,
  });
  assert.deepEqual(getAstraScrollState(1000, config), {
    textOpacity: 0,
    dispersion: 1,
    progress: 1.25,
  });
  assert.deepEqual(getAstraScrollState(399, config, true), {
    textOpacity: 0,
    dispersion: 0,
    progress: 0,
  });
  assert.deepEqual(getAstraScrollState(400, config, true), {
    textOpacity: 0,
    dispersion: 1,
    progress: 1,
  });
});

test("CPU intro, ambient drift and particle mass retain reference equations", () => {
  for (const { input, expected } of baseline.ambient) {
    const result = getAstraDispersedMotionOffset(
      new Vector2(),
      input[0],
      input[1],
      input[2],
      input[3],
      input[4],
      input[5],
    );
    close(result.toArray(), expected);
  }
  for (const { progress, expected } of baseline.intro) {
    const result = new Vector3(0.6, -0.3, 0.18);
    applyAstraIntroMotion(result, new Vector3(-1.2, 1.8, -0.4), progress, 0.42, 0.67);
    close(result.toArray(), expected);
  }
  for (const { size, expected } of baseline.masses) close([particleMotionMass(size)], [expected]);
});
