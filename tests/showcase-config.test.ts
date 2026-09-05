import assert from "node:assert/strict";
import test from "node:test";
import { parseShowcaseConfig, selectShowcase, showcase } from "../src/config/showcase";
import { ASTRA_SHAPE_SVGS, resolveAstraPathShape } from "../src/particles/shapes/registry";

test("unknown or inherited query keys fall back to a configured version", () => {
  for (const search of ["", "?shape=missing", "?shape=constructor", "?shape=__proto__"]) {
    const selected = selectShowcase(search);
    assert.equal(selected.variant, showcase.defaultVariant);
    assert.equal(selected.version, showcase.versions[showcase.defaultVariant]);
  }
  assert.equal(selectShowcase("?shape=kimi").version.name, "Kimi");
});

test("all configured versions point to usable registered geometry", () => {
  for (const version of Object.values(showcase.versions)) {
    for (const id of [version.hero, version.ending]) {
      if (!id) continue;
      const shape = ASTRA_SHAPE_SVGS[id];
      assert.ok(shape.width > 0 && shape.height > 0);
      assert.ok(shape.paths.length > 0);
      assert.ok(shape.paths.every((path) => path.trim().startsWith("M")));
      assert.ok(
        (shape.accentPaths ?? []).every((index) => index >= 0 && index < shape.paths.length),
      );
    }
  }
  assert.equal(resolveAstraPathShape("blossom"), "openai-knot");
  assert.equal(resolveAstraPathShape("constructor"), null);
});

test("editable configuration rejects incomplete or unknown shapes before mounting", () => {
  const invalidShape = structuredClone(showcase);
  Object.assign(invalidShape.versions.deepseek, { ending: "not-registered" });
  assert.throws(() => parseShowcaseConfig(invalidShape), /Unknown particle shape/);

  const invalidHero = structuredClone(showcase);
  delete invalidHero.versions.kimi.hero;
  assert.throws(() => parseShowcaseConfig(invalidHero), /requires a hero/);

  assert.throws(() => parseShowcaseConfig({ ...showcase, defaultVariant: "missing" }), /default/);
  assert.throws(() => parseShowcaseConfig({ ...showcase, showVersionSwitch: "false" }), /boolean/);
});

test("custom titles and single-brand configuration remain literal data", () => {
  const title = '星辰 <One> & "Two" $HOME `literal`';
  const custom = parseShowcaseConfig({
    defaultVariant: "orion",
    showVersionSwitch: false,
    versions: { orion: { ...showcase.versions.kimi, name: "Orion", modelName: title } },
  });
  assert.equal(selectShowcase("?shape=orion", custom).version.modelName, title);
  assert.equal(custom.showVersionSwitch, false);
});
