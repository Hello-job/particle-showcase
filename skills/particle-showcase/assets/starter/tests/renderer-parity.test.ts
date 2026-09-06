import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { Object3D, OrthographicCamera, Texture, Vector2, Vector3 } from "three";
import { INTERACTION_DEFAULTS } from "../src/particles/core/config";
import { AstraLensFlareEffect } from "../src/particles/core/postprocessing/LensFlare";
import {
  createDirtPixels,
  createDirtTexture,
} from "../src/particles/core/postprocessing/lens-dirt";
import * as shaders from "../src/particles/core/postprocessing/shaders";
import { resolveRendererQuality } from "../src/particles/core/renderer";
import { createAstraProfile } from "../src/particles/engine/profile";
import baseline from "./fixtures/renderer-baseline.json";

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

test("lens dirt preserves the compiled renderer's seeded pixels", () => {
  for (const { width, height, seed, sha256: expected } of baseline.dirt) {
    assert.equal(
      sha256(createDirtPixels(width, height, seed)),
      expected,
      `${width} × ${height}, seed ${seed}`,
    );
  }
});

test("bloom and lens GLSL remain byte-identical to the source programs", () => {
  for (const name of Object.keys(shaders) as (keyof typeof shaders)[]) {
    assert.equal(sha256(shaders[name]), baseline.shaders[name], name);
  }
});

test("GPU quality and DPR limits match the source across device and motion profiles", () => {
  for (const { tier, reducedMotion, dpr, width, height, expected } of baseline.quality) {
    assert.deepEqual(
      resolveRendererQuality(createAstraProfile(tier, reducedMotion), dpr, width, height),
      expected,
    );
  }
});

type UniformSnapshot = number | boolean | string | null | UniformSnapshot[];
function uniformSnapshot(value: unknown): UniformSnapshot {
  if (value instanceof Texture) return "texture";
  if (value instanceof Vector2 || value instanceof Vector3) return value.toArray();
  if (Array.isArray(value)) return value.map(uniformSnapshot);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
  )
    return value;
  throw new Error("Unexpected optical uniform value");
}
function opticalSnapshot(effect: AstraLensFlareEffect) {
  return Object.fromEntries(
    [...effect.uniforms].map(([name, uniform]) => [name, uniformSnapshot(uniform.value)]),
  );
}

test("optical source projection, pointer magnification and dirt drift match the compiled renderer", () => {
  const flare = {
    animated: true,
    enabled: true,
    ghosts: 0.1,
    halo: 0.12,
    intensity: 0.3,
    secondary: 0.25,
    streakLength: 1,
    streaks: 0.18,
    verticalStreaks: 0,
  };
  const dirt = {
    distortion: 0.68,
    drift: true,
    driftStrength: 0.28,
    enabled: true,
    grain: 0.031,
    procedural: 0,
    texture: 0,
  };
  const texture = createDirtTexture();
  const effect = new AstraLensFlareEffect(flare, texture, dirt, {
    secondarySourceCount: 3,
    distortion: false,
  });
  assert.deepEqual(opticalSnapshot(effect), baseline.lens.initial);
  effect.setConfig({ ...flare, animated: false, streakLength: 0.5, verticalStreaks: 0.3 });
  effect.setDirtyGlass({ ...dirt, grain: 0.055, texture: 0.15 });
  effect.setViewport(1440, 900);
  effect.updateDirtDrift(0.25, -0.72, 3.1, dirt, false);
  effect.setParticleMotion(texture, 0.4, new Vector3(0.2, 0.3, 2), [
    undefined,
    new Vector3(0.8, 0.7, 1.2),
  ]);
  assert.deepEqual(opticalSnapshot(effect), baseline.lens.updated);
  const primary = new Object3D();
  primary.position.set(42, 12, 0);
  primary.scale.setScalar(0.7);
  const secondary = [new Object3D(), new Object3D()];
  secondary[0].position.set(-800, 20, 0);
  secondary[1].position.set(130, -100, 0);
  const camera = new OrthographicCamera(-720, 720, 450, -450, 0.1, 40);
  camera.position.set(0, 1.2, 12);
  effect.updateSources(primary, secondary, camera, 3.2, false, 0.7, {
    config: { ...INTERACTION_DEFAULTS, radius: 160, magnification: 0.5 },
    lensPointer: new Vector2(0.1, 0.2),
    lensStrength: 0.9,
  });
  assert.deepEqual(opticalSnapshot(effect), baseline.lens.projected);
  effect.dispose();
  texture.dispose();
});
