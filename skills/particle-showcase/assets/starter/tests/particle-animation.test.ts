import assert from "node:assert/strict";
import test from "node:test";
import * as animation from "../src/particles/core/animation";
import baseline from "./fixtures/animation-baseline.json";
import { ANIMATION_SCENARIOS, runAnimationScenario } from "./helpers/animation-scenario";

for (const scenario of ANIMATION_SCENARIOS) {
  test(`reference frame behavior: ${scenario.name}`, () => {
    const reference = baseline.cases.find((entry) => entry.scenario.name === scenario.name);
    assert.ok(reference, "the immutable reference must cover this scenario");
    const actual = runAnimationScenario(animation, scenario);
    assert.equal(actual.length, reference.expected.length);
    for (const [frameIndex, frame] of actual.entries()) {
      const expected: readonly number[] = reference.expected[frameIndex];
      assert.equal(frame.length, expected.length);
      for (const [valueIndex, value] of frame.entries()) {
        const target = expected[valueIndex];
        assert.ok(
          Number.isFinite(value),
          `snapshot ${frameIndex}, value ${valueIndex} must be finite`,
        );
        assert.ok(
          Math.abs(value - target) <= 1e-12 * Math.max(1, Math.abs(target)),
          `snapshot ${frameIndex}, value ${valueIndex}: expected ${target}, received ${value}`,
        );
      }
    }
  });
}
