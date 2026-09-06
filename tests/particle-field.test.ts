import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { DOMParser } from "@xmldom/xmldom";
import {
  BufferGeometry,
  Color,
  DataTexture,
  Matrix4,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { resolveEngineConfig } from "../src/particles/core/config";
import { generateAstraField } from "../src/particles/core/field";
import type { ParticleField } from "../src/particles/core/field";
import {
  ASTRA_ORBIT_SVG,
  SVGLoader,
  createPathShapeTexture,
  getAstraParticleRevealProgress,
  samplePath,
  samplePathRange,
  writeStarColor,
} from "../src/particles/core/geometry";
import baseline from "./fixtures/field-baseline.json";
import geometryBaseline from "./fixtures/geometry-baseline.json";

// SVGLoader only needs an XML document in these CPU tests; no WebGL context is created.
Object.defineProperty(globalThis, "DOMParser", { value: DOMParser, configurable: true });

function hash(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashArray(value: ArrayBufferView): string {
  return hash(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
}

function summarizeUniform(value: unknown): unknown {
  if (value instanceof DataTexture) {
    return {
      kind: "texture",
      width: value.image.width,
      height: value.image.height,
      data: hashArray(value.image.data),
      magFilter: value.magFilter,
      minFilter: value.minFilter,
    };
  }
  if (
    value instanceof Vector2 ||
    value instanceof Vector3 ||
    value instanceof Matrix4 ||
    value instanceof Color
  ) {
    return value.toArray();
  }
  return value;
}

function summarizeField(field: ParticleField) {
  const points: Array<{
    renderOrder: number;
    count: number;
    attributesSha256: string;
    uniformsSha256: string;
    vertexShader: string;
    fragmentShader: string;
  }> = [];
  field.group.traverse((object) => {
    if (
      !(object instanceof Points) ||
      !(object.geometry instanceof BufferGeometry) ||
      !(object.material instanceof ShaderMaterial)
    )
      return;
    const geometry: BufferGeometry = object.geometry;
    points.push({
      renderOrder: object.renderOrder,
      count: geometry.getAttribute("position").count,
      attributesSha256: hash(
        JSON.stringify(
          Object.fromEntries(
            Object.entries(geometry.attributes).map(([name, attribute]) => [
              name,
              {
                count: attribute.count,
                itemSize: attribute.itemSize,
                sha256: hashArray(attribute.array),
              },
            ]),
          ),
        ),
      ),
      uniformsSha256: hash(
        JSON.stringify(
          Object.fromEntries(
            Object.entries(object.material.uniforms).map(([name, uniform]) => [
              name,
              summarizeUniform(uniform.value),
            ]),
          ),
        ),
      ),
      vertexShader: hash(object.material.vertexShader),
      fragmentShader: hash(object.material.fragmentShader),
    });
  });
  const layers = field.pathLayers.map((layer) => ({
    ...Object.fromEntries(
      Object.entries(layer).filter(
        ([, value]) => typeof value === "number" || typeof value === "boolean",
      ),
    ),
    flareBasePosition: layer.flareBasePosition.toArray(),
    flareScatter: layer.flareScatter.toArray(),
    flarePathSamples: layer.flarePathSamples ? hashArray(layer.flarePathSamples) : null,
    flareSource: layer.flareSource
      ? { position: layer.flareSource.position.toArray(), scale: layer.flareSource.scale.toArray() }
      : null,
  }));
  return {
    particleCount: field.particleCount,
    secondarySources: field.secondarySources.length,
    corePosition: field.coreSource.position.toArray(),
    coreScale: field.coreSource.scale.toArray(),
    points,
    layers,
  };
}

function assertFlarePosition(
  actual: readonly number[],
  expected: readonly number[],
  label: string,
) {
  assert.equal(actual.length, 3, `${label} must remain a 3D position`);
  assert.equal(expected.length, 3);
  for (let axis = 0; axis < 3; axis += 1) {
    // Float64 world coordinates can differ by a few ULPs across Node/CPU platforms.
    // Keep this absolute tolerance away from seeds, buffers, uniforms and shaders.
    assert.ok(
      Number.isFinite(actual[axis]) &&
        Number.isFinite(expected[axis]) &&
        Math.abs(actual[axis] - expected[axis]) <= 1e-12,
      `${label}[${axis}]: ${actual[axis]} differs from ${expected[axis]} by more than 1e-12`,
    );
  }
}

function assertFieldMatchesBaseline(
  actual: ReturnType<typeof summarizeField>,
  expected: (typeof baseline.cases)[number]["expected"],
) {
  assert.equal(actual.layers.length, expected.layers.length);
  const layers = actual.layers.map((layer, index) => {
    const reference = expected.layers[index];
    assertFlarePosition(
      layer.flareBasePosition,
      reference.flareBasePosition,
      `layers[${index}].flareBasePosition`,
    );
    if (layer.flareSource && reference.flareSource) {
      assertFlarePosition(
        layer.flareSource.position,
        reference.flareSource.position,
        `layers[${index}].flareSource.position`,
      );
    }
    // Only the already-checked positions are normalized for the exact comparison.
    return {
      ...layer,
      flareBasePosition: reference.flareBasePosition,
      flareSource:
        layer.flareSource && reference.flareSource
          ? { ...layer.flareSource, position: reference.flareSource.position }
          : layer.flareSource,
    };
  });
  assert.deepEqual({ ...actual, layers }, expected);
}

for (const scenario of baseline.cases) {
  test(`particle field preserves pre-refactor attributes and shaders: ${scenario.name}`, () => {
    const field = generateAstraField(resolveEngineConfig(scenario.config), scenario.options);
    try {
      assertFieldMatchesBaseline(summarizeField(field), scenario.expected);
    } finally {
      field.dispose();
    }
  });
}

test("flare position tolerance accepts platform rounding and rejects coordinate drift", () => {
  const expected = [-0.9434153017464224, -1.5566287035698994, 0.09243813446200107];
  const linuxPosition = [-0.9434153017464152, -1.5566287035698998, 0.09243813446200075];
  assertFlarePosition(linuxPosition, expected, "flare");
  for (const invalid of [
    [expected[0] + 2e-12, expected[1], expected[2]],
    [NaN, expected[1], expected[2]],
    [Infinity, expected[1], expected[2]],
    [...expected, 0],
  ]) {
    assert.throws(() => assertFlarePosition(invalid, expected, "flare"), assert.AssertionError);
  }
});

test("invalid and fractional budgets cannot produce unbounded or fractional particle counts", () => {
  const config = resolveEngineConfig({});
  for (const budget of [NaN, -Infinity, -1]) {
    const field = generateAstraField(config, { maxParticleCount: budget });
    assert.equal(field.particleCount, 0);
    field.dispose();
  }
  const fractional = generateAstraField(config, { maxParticleCount: 17.9 });
  assert.equal(fractional.particleCount, 17);
  fractional.dispose();
  const unbounded = generateAstraField(config, { maxParticleCount: Infinity });
  assert.equal(unbounded.particleCount, baseline.cases[0].expected.particleCount);
  unbounded.dispose();
});

test("the dependency SVG parser preserves all five original orbit contour samples", () => {
  const contours = new SVGLoader().parse(ASTRA_ORBIT_SVG).paths.map((path) => path.subPaths[0]);
  const samples = contours.map((contour) => {
    const points = contour.getSpacedPoints(256);
    return {
      length: contour.getLength(),
      samples: hashArray(new Float64Array(points.flatMap((point) => [point.x, point.y]))),
    };
  });
  assert.deepEqual(samples, geometryBaseline.orbitContours);
});

test("palette thresholds, override colors and reveal delay preserve baseline values", () => {
  for (const scenario of geometryBaseline.colors) {
    const output = new Float32Array(5);
    writeStarColor(
      output,
      1,
      scenario.colorMode,
      scenario.seed,
      scenario.palette,
      scenario.overrides,
    );
    assert.deepEqual(Array.from(output), scenario.expected);
  }
  for (const scenario of geometryBaseline.reveal) {
    assert.equal(
      getAstraParticleRevealProgress(scenario.progress, scenario.seed),
      scenario.expected,
    );
  }
  assert.equal(getAstraParticleRevealProgress(NaN, Infinity), 0);
});

test("path interpolation and scanline interval selection preserve endpoint behavior", () => {
  const samples = Float32Array.from(geometryBaseline.pathSamples);
  for (const scenario of geometryBaseline.pathReads) {
    assert.deepEqual(
      samplePath(samples, scenario.progress, new Vector3()).toArray(),
      scenario.position,
    );
    assert.deepEqual(
      samplePathRange(samples, scenario.progress, new Vector2()).toArray(),
      scenario.range,
    );
  }
  assert.deepEqual(samplePath(new Float32Array(), 0.5, new Vector3()).toArray(), [0, 0, 0]);
  assert.deepEqual(samplePathRange(new Float32Array(), 0.5, new Vector2()).toArray(), [0, 1]);
});

test("field disposal releases each resource once and clears the scene", () => {
  const field = generateAstraField(
    resolveEngineConfig({ orbitalDust: { enabled: true }, showCenterCluster: true }),
  );
  let disposedResources = 0;
  for (const resource of field.disposables) {
    const dispose = resource.dispose.bind(resource);
    resource.dispose = () => {
      disposedResources += 1;
      dispose();
    };
  }
  const count = field.disposables.length;
  field.dispose();
  field.dispose();
  assert.equal(disposedResources, count);
  assert.equal(field.group.children.length, 0);
  const texture = createPathShapeTexture();
  assert.ok(texture.image.data instanceof Float32Array);
  assert.equal(texture.image.data.length, 4096);
  texture.dispose();
});
