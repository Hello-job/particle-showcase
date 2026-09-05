import * as THREE from "three";
import * as POSTPROCESSING from "postprocessing";
import renderer from "./renderer.js";
import particle_motion from "./particle-motion.js";
import field from "./field.js";
import geometry from "./geometry.js";
import intro_motion from "./intro-motion.js";
import ambient_motion from "./ambient-motion.js";
import animation from "./animation.js";
import defaults from "./defaults.js";
import configuration from "./configuration.js";
import shapes from "./shapes.js";

// Adapt the original compiled modules to local ES module dependencies.
const groups = [
  { ids: [947344], factory: renderer },
  { ids: [384051], factory: particle_motion },
  { ids: [861045], factory: field },
  { ids: [63295, 396522, 642671], factory: geometry },
  { ids: [83007], factory: intro_motion },
  { ids: [471772], factory: ambient_motion },
  { ids: [324944], factory: animation },
  { ids: [170825, 59820, 651217], factory: defaults },
  { ids: [682025, 330592, 777124], factory: configuration },
  { ids: [333074], factory: shapes },
];
const modules = new Map([
  [695418, THREE],
  [361489, THREE],
  [409703, POSTPROCESSING],
]);
const definitions = new Map();
for (const group of groups)
  for (const id of group.ids) definitions.set(id, group);

function load(id) {
  if (modules.has(id)) return modules.get(id);
  const group = definitions.get(id);
  if (!group) throw new Error("Unknown Astra module: " + id);
  for (const member of group.ids) modules.set(member, {});
  group.factory({
    i: load,
    s(values, target = id) {
      const exports = modules.get(target);
      for (let index = 0; index < values.length;) {
        const key = values[index++];
        const kind = values[index++];
        if (kind === 0)
          Object.defineProperty(exports, key, {
            enumerable: true,
            value: values[index++],
          });
        else if (typeof kind === "function")
          Object.defineProperty(exports, key, { enumerable: true, get: kind });
        else throw new Error("Unsupported Astra export: " + key);
      }
    },
  });
  return modules.get(id);
}

export const { createAstraRenderer } = load(947344);
export const { createAstraAnimationState, updateAstraAnimation } = load(324944);
export const { resolveAstraHeroData: resolveHeroLayout, resolveCueKeyframe } =
  load(170825);
export const {
  resolveAstraHeroData: resolveEngineConfig,
  resolveAstraRuntimeData,
  pickAstraRuntimeOverrides,
  getAstraScrollState,
} = load(59820);
export const {
  resolveAstraRendererConfig,
  prepareAstraRuntimeConfig,
  resolvePreparedAstraRuntimeConfig,
} = load(682025);
export const {
  ASTRA_SHAPE_SVGS,
  ASTRA_CURSOR_PATH,
  ASTRA_OPENAI_KNOT_PATHS,
  resolveAstraPathShape,
} = load(333074);
export const { generateAstraField, createPathShapeTexture } = load(861045);
export const sceneMath = load(777124);
export const interpolateAstra = load(330592);
