// Extracted from the public OpenAI Astra source, 1rfzm7jt1igp4.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418);
    let a = `
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
    t.s([
      "PARTICLE_MOTION_COAST_GLSL",
      0,
      a,
      "PARTICLE_MOTION_SETTLE_SECONDS",
      0,
      6,
      "particleMotionMass",
      0,
      function (t) {
        return e.MathUtils.lerp(0.65, 2.4, e.MathUtils.smoothstep(t, 1, 14));
      },
    ]);
  };
