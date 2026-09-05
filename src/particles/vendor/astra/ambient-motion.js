// Extracted from the public OpenAI Astra source, 1rfzm7jt1igp4.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418);
    let a = 2 * Math.PI;
    t.s([
      "ASTRA_AMBIENT_DRIFT_MAX",
      0,
      0.12,
      "ASTRA_AMBIENT_DRIFT_MIN",
      0,
      0.035,
      "ASTRA_AMBIENT_SPEED_MAX",
      0,
      0.8,
      "ASTRA_AMBIENT_SPEED_MIN",
      0,
      0.4,
      "ASTRA_PARALLAX_MAX",
      0,
      0.28,
      "ASTRA_PARALLAX_MIN",
      0,
      0.08,
      "getAstraDispersedMotionOffset",
      0,
      function (t, r, o, i, s, n, l) {
        let u = e.MathUtils.clamp(s, 0, 1),
          c = e.MathUtils.clamp(l, 0, 1);
        if (0 === c) return t.set(0, 0);
        let h = e.MathUtils.lerp(0.4, 0.8, u),
          p = e.MathUtils.lerp(0.035, 0.12, u) * c,
          f = o * a + 2.7 * i,
          d = i * a + 3.1 * s,
          m = n * e.MathUtils.lerp(0.08, 0.28, u * u) * c;
        return t.set(
          (Math.sin(f + r * h) - Math.sin(f)) * p,
          (Math.cos(d + r * h * 0.73) - Math.cos(d)) * p + m,
        );
      },
    ]);
  };
