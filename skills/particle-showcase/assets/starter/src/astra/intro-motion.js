// Extracted from the public OpenAI Astra source, 1rfzm7jt1igp4.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418);
    let a = `
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
    t.s([
      "ASTRA_INTRO_MOTION_GLSL",
      0,
      a,
      "applyAstraIntroMotion",
      0,
      function (t, a, r, o, i) {
        if (r >= 1) return;
        let s = 0.14 + 0.18 * o,
          n = e.MathUtils.smootherstep(r, s, s + (0.58 + 0.1 * i)),
          l = e.MathUtils.lerp(n, Math.sin(n * Math.PI * 0.5), 0.5),
          u = Math.sin(l * Math.PI) * (0.44 + 0.22 * o),
          c = Math.cos(u),
          h = Math.sin(u);
        t.set(
          e.MathUtils.lerp(a.x * c - a.y * h, t.x, l),
          e.MathUtils.lerp(a.x * h + a.y * c, t.y, l),
          e.MathUtils.lerp(a.z, t.z, l),
        );
      },
    ]);
  };
