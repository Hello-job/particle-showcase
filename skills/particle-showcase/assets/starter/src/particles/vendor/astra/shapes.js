// Compatibility factory for the extracted renderer's original module ID.
// The editable, typed geometry registry lives outside this vendor boundary.
import {
  ASTRA_CURSOR_PATH,
  ASTRA_OPENAI_KNOT_PATHS,
  ASTRA_SHAPE_SVGS,
  resolveAstraPathShape,
} from "../../shapes/registry";

export default (module) => {
  module.s([
    "ASTRA_CURSOR_PATH", 0, ASTRA_CURSOR_PATH,
    "ASTRA_OPENAI_KNOT_PATHS", 0, ASTRA_OPENAI_KNOT_PATHS,
    "ASTRA_SHAPE_SVGS", 0, ASTRA_SHAPE_SVGS,
    "resolveAstraPathShape", 0, resolveAstraPathShape,
  ]);
};
