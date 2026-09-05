// Extracted from the public OpenAI Astra source, 28nbglk5oli9p.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (e) => {
  "use strict";
  let t = Object.freeze({
      animationPlaying: !0,
      animationRestartKey: 0,
      bloomIntensity: 0.7,
      bloomThreshold: 0.08,
      colorMode: !0,
      convergeDuration: 5.5,
      faceForward: !0,
      pathShapeAutoRotate: !0,
      pathShapeAutoRotateAmount: 0.42,
      pathShapeAutoRotateSpeed: 0.22,
      pathShapeScatter: 1,
      rotationDepth: 1.4,
      scrollDisperseDistance: 800,
      scrollEffects: !0,
      scrollStarDriftSpeed: 3,
      scrollStartOffset: 0,
      scrollTextFadeDistance: 200,
      showCenterCluster: !0,
    }),
    a = Object.freeze({
      density: 4,
      densityFalloff: 0.22,
      flowInward: !0,
      flowSpeed: 0.8,
      intensity: 1.35,
      scatter: 0.4,
      size: 2.05,
      sizeFalloff: 0.45,
      twinkleSpeed: 0.62,
    }),
    s = Object.freeze({
      depthDisplacement: 0.5,
      followDamping: 6,
      illumination: 0.55,
      magnification: 0.18,
      particleRepel: !0,
      repelDistance: 52,
      repelFalloff: 2,
      repelHighlight: 0.16,
      repelHighlightRadius: 196,
      repelPressMultiplier: 2.2,
      repelRadius: 176,
      repelReturnSpring: 2.8,
      repelSpring: 7,
      rotationLag: 0.68,
      radius: 156,
      smearCurl: 0.24,
      smearTrailLength: 2.25,
    }),
    r = Object.freeze({
      density: 0.55,
      driftSpeed: 0.2,
      enabled: !1,
      intensity: 2,
      reach: 0.17,
      spread: 0.4,
      tightSpread: 0.03,
    }),
    l = Object.freeze({
      animated: !0,
      enabled: !0,
      ghosts: 0.1,
      halo: 0.12,
      intensity: 0.28,
      secondary: 0.55,
      streakLength: 0.03485,
      streaks: 0.18,
      verticalStreaks: 1,
    }),
    i = Object.freeze({
      distortion: 0.68,
      drift: !0,
      driftStrength: 0.28,
      enabled: !0,
      grain: 0.031,
      procedural: 0,
      texture: 0,
    }),
    n = Object.freeze({
      accretionRatio: 0.42,
      ambientAmount: 0.04,
      ambientSpeed: 0.55,
      coreIntensity: 1.45,
      duration: 8,
      exhaleStrength: 0.42,
      inwardStrength: 1.2,
      propagationSoftness: 0.16,
      settleDuration: 1.2,
      startScale: 0.58,
    }),
    o = Object.freeze({
      duration: 8,
      growthSpeed: 0.55,
      softness: 0.075,
      startZoom: 4,
    }),
    c = Object.freeze({
      astra: Object.freeze([
        "#6DCBF4",
        "#7AB1FE",
        "#F87915",
        "#FA994C",
        "#F5F6FB",
      ]),
      aurora: Object.freeze([
        "#47E2C2",
        "#6DCBF4",
        "#B06DFF",
        "#E96AC8",
        "#F5F6FB",
      ]),
      ember: Object.freeze([
        "#F7CB59",
        "#FA994C",
        "#F67576",
        "#B06DFF",
        "#F5F6FB",
      ]),
    }),
    d = Object.freeze({
      ...t,
      accretionExhale: n,
      animationPreset: "converge-tilt",
      colorPalette: "astra",
      colorPaletteColors: c.astra,
      dirtyGlass: i,
      grow: o,
      interaction: s,
      interactionMode: "rotate",
      lensFlare: l,
      orbitalDust: r,
      stars: a,
    }),
    u = {
      animationRestartKey: [0, Number.MAX_SAFE_INTEGER],
      bloomIntensity: [0, 2],
      bloomThreshold: [0, 1],
      convergeDuration: [1, 10],
      pathShapeAutoRotateAmount: [0, 1.2],
      pathShapeAutoRotateSpeed: [0, 2],
      pathShapeScatter: [0, 3],
      rotationDepth: [0, 2],
      scrollDisperseDistance: [200, 2400],
      scrollStarDriftSpeed: [0, 3],
      scrollStartOffset: [0, 1600],
      scrollTextFadeDistance: [50, 1600],
    },
    m = {
      density: [0.25, 4],
      densityFalloff: [0, 1],
      flowSpeed: [0, 3],
      intensity: [0.1, 3],
      scatter: [0, 0.4],
      size: [0.25, 3],
      sizeFalloff: [0, 1],
      twinkleSpeed: [0, 2],
    },
    p = {
      depthDisplacement: [-1.5, 1.5],
      followDamping: [1, 30],
      illumination: [0, 2],
      magnification: [-0.3, 0.8],
      repelDistance: [0, 160],
      repelFalloff: [0.5, 6],
      repelHighlight: [0, 1],
      repelHighlightRadius: [16, 480],
      repelPressMultiplier: [1, 4],
      repelRadius: [16, 360],
      repelReturnSpring: [1, 40],
      repelSpring: [1, 40],
      rotationLag: [0, 1],
      radius: [32, 360],
      smearCurl: [0, 1],
      smearTrailLength: [0.5, 4],
    },
    h = {
      density: [0.25, 4],
      driftSpeed: [0, 3],
      intensity: [0, 2],
      reach: [0, 1],
      spread: [0, 1],
      tightSpread: [0, 1],
    },
    f = {
      ghosts: [0, 1],
      halo: [0, 1],
      intensity: [0, 1.5],
      secondary: [0, 1],
      streakLength: [0.025, 0.2],
      streaks: [0, 1],
      verticalStreaks: [0, 1],
    },
    g = {
      distortion: [0, 1],
      driftStrength: [0, 1],
      grain: [0, 1],
      procedural: [0, 1],
      texture: [0, 1],
    },
    x = {
      accretionRatio: [0.12, 0.72],
      ambientAmount: [0, 0.16],
      ambientSpeed: [0, 3],
      coreIntensity: [0.5, 3],
      duration: [2, 20],
      exhaleStrength: [0, 1.5],
      inwardStrength: [0, 3],
      propagationSoftness: [0, 0.6],
      settleDuration: [0.2, 3],
      startScale: [0.3, 1.25],
    },
    v = {
      duration: [2, 20],
      growthSpeed: [0.2, 2],
      softness: [0.005, 0.3],
      startZoom: [1, 8],
    };
  function y(e, t) {
    if (!("object" != typeof e || null === e || Array.isArray(e)))
      return Object.getOwnPropertyDescriptor(e, t)?.value;
  }
  function b(e, t, [a, s]) {
    return "number" == typeof e && Number.isFinite(e)
      ? Math.min(Math.max(e, a), s)
      : t;
  }
  function w(e, t, a, s = t) {
    let r = { ...t };
    for (let l of Object.keys(t)) {
      let i = t[l],
        n = y(s, l),
        o =
          "number" == typeof i ? b(n, i, a[l]) : "boolean" == typeof n ? n : i,
        c = y(e, l);
      r[l] =
        "number" == typeof i
          ? b(c, "number" == typeof o ? o : i, a[l])
          : "boolean" == typeof c
            ? c
            : o;
    }
    return Object.freeze(r);
  }
  function j(e, t, a) {
    return "string" == typeof e && t.includes(e) ? e : a;
  }
  function M(e, t) {
    if (!Array.isArray(e) || 5 !== e.length) return t;
    let a = Array.from(
      { length: 5 },
      (t, a) => Object.getOwnPropertyDescriptor(e, String(a))?.value,
    );
    return a.every(
      (e) => "string" == typeof e && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(e),
    )
      ? Object.freeze(a)
      : t;
  }
  function _(e, t) {
    let a = {};
    for (let s of Object.keys(t)) {
      let t = y(e, s);
      void 0 !== t && (a[s] = t);
    }
    return a;
  }
  function k(e) {
    return Math.min(Math.max(e, 0), 1);
  }
  function N(e, t) {
    return Number.isFinite(e) ? e : t;
  }
  e.s(
    [
      "DEFAULT_ASTRA_HERO_DATA",
      0,
      d,
      "getAstraScrollState",
      0,
      function (e, a = d, s = !1) {
        if (!a.scrollEffects)
          return { textOpacity: 1, dispersion: 0, progress: 0 };
        let r =
            N(e, 0) - Math.max(N(a.scrollStartOffset, t.scrollStartOffset), 0),
          l = k(
            r /
              Math.max(
                N(a.scrollTextFadeDistance, t.scrollTextFadeDistance),
                1,
              ),
          ),
          i = Math.max(
            r /
              Math.max(
                N(a.scrollDisperseDistance, t.scrollDisperseDistance),
                1,
              ),
            0,
          ),
          n = k(i);
        if (s) {
          let e = n < 0.5 ? 0 : 1;
          return { textOpacity: +(l < 0.5), dispersion: e, progress: e };
        }
        return {
          textOpacity: 1 - l * l * l * (l * (6 * l - 15) + 10),
          dispersion: n,
          progress: i,
        };
      },
      "pickAstraRuntimeOverrides",
      0,
      function (e) {
        let c = _(e, t);
        for (let [t, d] of [
          ["accretionExhale", n],
          ["dirtyGlass", i],
          ["grow", o],
          ["interaction", s],
          ["lensFlare", l],
          ["orbitalDust", r],
          ["stars", a],
        ]) {
          let a = _(y(e, t), d);
          Object.keys(a).length > 0 && (c[t] = a);
        }
        for (let t of [
          "animationPreset",
          "colorPalette",
          "colorPaletteColors",
          "interactionMode",
        ]) {
          let a = y(e, t);
          void 0 !== a && (c[t] = a);
        }
        return c;
      },
      "resolveAstraHeroData",
      0,
      function (e) {
        let b = j(
          y(e, "colorPalette"),
          ["astra", "aurora", "ember"],
          d.colorPalette,
        );
        return Object.freeze({
          ...w(e, t, u),
          accretionExhale: w(y(e, "accretionExhale"), n, x),
          animationPreset: j(
            y(e, "animationPreset"),
            [
              "none",
              "legacy-zoom",
              "converge-tilt",
              "accretion-exhale",
              "grow",
            ],
            d.animationPreset,
          ),
          colorPalette: b,
          colorPaletteColors: M(y(e, "colorPaletteColors"), c[b]),
          dirtyGlass: w(y(e, "dirtyGlass"), i, g),
          grow: w(y(e, "grow"), o, v),
          interaction: w(y(e, "interaction"), s, p),
          interactionMode: j(
            y(e, "interactionMode"),
            ["rotate", "depth-lens", "none"],
            d.interactionMode,
          ),
          lensFlare: w(y(e, "lensFlare"), l, f),
          orbitalDust: w(y(e, "orbitalDust"), r, h),
          stars: w(y(e, "stars"), a, m),
        });
      },
      "resolveAstraRuntimeData",
      0,
      function (e, c) {
        let d = j(
          y(e, "colorPalette"),
          ["astra", "aurora", "ember"],
          c.colorPalette,
        );
        return Object.freeze({
          ...w(e, t, u, c),
          accretionExhale: w(y(e, "accretionExhale"), n, x, c.accretionExhale),
          animationPreset: j(
            y(e, "animationPreset"),
            [
              "none",
              "legacy-zoom",
              "converge-tilt",
              "accretion-exhale",
              "grow",
            ],
            c.animationPreset,
          ),
          colorPalette: d,
          colorPaletteColors: M(
            y(e, "colorPaletteColors"),
            c.colorPaletteColors,
          ),
          dirtyGlass: w(y(e, "dirtyGlass"), i, g, c.dirtyGlass),
          grow: w(y(e, "grow"), o, v, c.grow),
          interaction: w(y(e, "interaction"), s, p, c.interaction),
          interactionMode: j(
            y(e, "interactionMode"),
            ["rotate", "depth-lens", "none"],
            c.interactionMode,
          ),
          lensFlare: w(y(e, "lensFlare"), l, f, c.lensFlare),
          orbitalDust: w(y(e, "orbitalDust"), r, h, c.orbitalDust),
          stars: w(y(e, "stars"), a, m, c.stars),
        });
      },
    ],
    59820,
  );
  let C = {
      background: {
        ambientColor: "#23435F",
        ambientOpacity: 0.55,
        bottom: "#000000",
        top: "#000000",
      },
      camera: {
        far: 80,
        fov: 42,
        near: 0.1,
        position: [0, 0, 8],
        target: [0, 0, 0],
      },
      effects: {
        bloomIntensity: 0.7,
        bloomThreshold: 0.08,
        dirtyGlass: !0,
        flareIntensity: 0.28,
        flareSize: 0.41,
        lensFlare: !0,
        textureIntensity: 0,
      },
      interaction: {
        enabled: !0,
        faceForward: !0,
        followDamping: 6,
        mode: "rotate",
        particleRepel: !0,
        pathLag: 0.68,
        repelDistance: 52,
        repelFalloff: 2,
        repelHighlight: 0.16,
        repelHighlightRadius: 196,
        repelPressMultiplier: 2.2,
        repelRadius: 176,
        repelReturnSpring: 2.8,
        repelSpring: 7,
        smearCurl: 0.24,
        smearTrailLength: 2.25,
      },
      motion: {
        animation: "convergeTilt",
        autoplay: !0,
        disperseDistance: 800,
        headingParallaxDistance: 240,
        headingParallaxDistanceMobile: 144,
        headingTrailingSpaceVh: 7,
        labelRevealDelay: 0.85,
        labelRevealDuration: 1,
        labelStagger: 0.1,
        revealDelay: 2.2,
        revealDuration: 5.5,
        scrollStart: 0,
        shapeAutoRotate: !0,
        shapeRotationAmount: 0.42,
        shapeRotationSpeed: 0.22,
        starDriftSpeed: 3,
        textFadeDistance: 200,
      },
      opacity: 1,
      particles: {
        centerCluster: !0,
        centerClusterStrength: 0.66,
        colors: ["#6DCBF4", "#7AB1FE", "#F87915", "#FA994C", "#F5F6FB"],
        colorWeights: [0.15, 0.18, 0.07, 0.08, 0.52],
        count: 12e3,
        densityFalloff: 0.22,
        disperse: 0,
        flowInward: !0,
        flowSpeed: 0.8,
        heroStarKnots: [0.15, 0.28, 0.38, 0.52, 0.62, 0.84, 0.94],
        maxPointSize: 40,
        pathDepth: 1.4,
        paths: [
          [
            [0, 0, 0],
            [0.37, -0.19, 0.08],
            [0.31, -0.45, -0.12],
            [-0.14, -0.58, 0.16],
            [-0.59, -0.32, -0.1],
            [-0.72, 0.13, 0.12],
            [-0.46, 0.58, -0.16],
            [0.12, 0.77, 0.14],
            [0.69, 0.58, -0.08],
            [1.01, 0.06, 0.18],
            [0.88, -0.58, -0.14],
            [0.31, -1.03, 0.08],
            [-0.53, -1.03, -0.18],
            [-1.23, -0.58, 0.12],
            [-1.49, 0.13, -0.08],
            [-1.3, 0.9, 0.16],
            [-0.65, 1.47, -0.12],
            [0.12, 1.6, 0.1],
            [0.95, 1.28, -0.16],
            [1.59, 0.58, 0.12],
            [1.72, -0.38, -0.1],
            [1.33, -1.22, 0.18],
            [0.5, -1.73, -0.16],
            [-0.53, -1.67, 0.12],
            [-1.42, -1.09, -0.08],
            [-1.81, -0.19, 0.16],
            [-1.74, 0.9, -0.12],
            [-1.49, 1.86, 0.1],
            [-0.97, 2.69, -0.08],
            [-0.14, 3.46, 0.04],
          ],
          [
            [-1.25, 1.05, 0.06],
            [-1.2, 1.62, -0.08],
            [-0.9, 2.18, 0.1],
            [-0.4, 2.66, -0.1],
            [0.2, 3.02, 0.08],
            [0.92, 3.14, -0.06],
            [1.66, 3.07, 0.02],
          ],
        ],
        pathSpread: 1,
        pointScale: 16,
        position: [0, -0.62, 0],
        rotation: [0.08, -0.06, -0.025],
        scale: [1, 1, 1],
        scatter: 0.4,
        seed: 27,
        sizeFalloff: 0.45,
        shapeDepth: 0.18,
        shapeDamping: 4,
        shapeScatter: 0.035,
        sphere: 0,
        starDensity: 4,
        starIntensity: 1.35,
        starSize: 2.05,
        tailRatio: 0.08,
        turns: 2.35,
        twinkleSpeed: 0.62,
      },
      renderer: {
        antialias: !0,
        maxDpr: 2,
        postprocessing: !0,
        shaderSamples: 24,
      },
    },
    S = {
      activationLine: 0.5,
      content: {
        description: "A luminous field of intelligence, converging into focus.",
        eyebrow: "",
        headline: "GPT-6 Astra",
        interactionLabel:
          "Drag or use arrow keys to rotate the Astra star field",
        leftLabel: "GPT",
        parallaxHeadingId: "",
        replayLabel: "Replay spiral field animation",
        rightLabel: "Astra",
        scrollLabel: "",
        showReplay: !0,
      },
      easing: "smoothstep",
      engine: d,
      keyframes: [
        { ...C },
        { ...C, particles: { ...C.particles, disperse: 1 } },
        { ...C, particles: { ...C.particles, disperse: 1 } },
        { ...C, particles: { ...C.particles, disperse: 1 } },
        { ...C, particles: { ...C.particles, disperse: 1 } },
        { ...C, particles: { ...C.particles, disperse: 1 } },
        {
          ...C,
          opacity: 0,
          particles: { ...C.particles, disperse: 1, flowSpeed: 0 },
        },
      ],
      scene: C,
      version: 3,
    };
  e.s(["DEFAULT_ASTRA_HERO_DATA", 0, S], 651217);
  let E = new Set(["__proto__", "constructor", "prototype"]),
    A = Symbol("no-astra-override"),
    P = Symbol("astra-keyframe-overrides");
  function L(e) {
    if (!e || "object" != typeof e || Array.isArray(e)) return !1;
    let t = Object.getPrototypeOf(e);
    return t === Object.prototype || null === t;
  }
  function I(e) {
    return Array.isArray(e)
      ? e.map(I)
      : L(e)
        ? Object.fromEntries(
            Object.entries(e)
              .filter(([e]) => !E.has(e))
              .map(([e, t]) => [e, I(t)]),
          )
        : e;
  }
  function T(e, ...t) {
    return (
      Object.defineProperty(e, P, {
        configurable: !0,
        value: t.reduce((e, t) => D(e, t), {}),
      }),
      e
    );
  }
  function R(e) {
    let t = e[P];
    return t
      ? (function e(t, a) {
          return Object.fromEntries(
            Object.entries(a).flatMap(([a, s]) => {
              if (E.has(a) || !(a in t)) return [];
              let r = t[a];
              return L(s) && L(r) ? [[a, e(r, s)]] : [[a, I(r)]];
            }),
          );
        })(e, t)
      : e;
  }
  function D(e, t) {
    if (void 0 === t || ("number" == typeof t && !Number.isFinite(t)))
      return I(e);
    if (Array.isArray(t))
      return t.map((t, a) => D(Array.isArray(e) ? e[a] : void 0, t));
    if (L(t)) {
      let a = L(e) ? e : {};
      return Object.fromEntries(
        [...new Set([...Object.keys(a), ...Object.keys(t)])]
          .filter((e) => !E.has(e))
          .map((e) => [e, D(a[e], t[e])]),
      );
    }
    return I(t);
  }
  e.s(
    [
      "isPlainRecord",
      0,
      L,
      "markAstraKeyframeOverrides",
      0,
      T,
      "mergeAstraValue",
      0,
      D,
      "resolveAstraHeroData",
      0,
      function (e) {
        let t = D(S, L(e) ? e : void 0),
          a = Number.isFinite(t.activationLine)
            ? Math.min(0.9, Math.max(0.1, t.activationLine))
            : S.activationLine,
          s = D(S.scene, L(e?.scene) ? e.scene : void 0),
          r = D(S.engine, L(e?.engine) ? e.engine : void 0),
          l = Array.isArray(e?.keyframes) ? e.keyframes.filter(L) : null,
          i = !!l?.length,
          n = (l?.length ? l : S.keyframes).map((e) => {
            let t,
              a = i
                ? e
                : ((t = (function e(t, a) {
                    if (Array.isArray(a))
                      return Array.isArray(t) &&
                        a.length === t.length &&
                        a.every((a, s) => e(t[s], a) === A)
                        ? A
                        : I(a);
                    if (L(a)) {
                      let s = L(t) ? t : {},
                        r = Object.entries(a).flatMap(([t, a]) => {
                          if (E.has(t)) return [];
                          let r = e(s[t], a);
                          return r === A ? [] : [[t, r]];
                        });
                      return 0 === r.length ? A : Object.fromEntries(r);
                    }
                    return Object.is(t, a) ? A : I(a);
                  })(S.scene, e)),
                  L(t) ? t : {});
            return T(D(s, a), a);
          });
        return {
          ...t,
          activationLine: a,
          content: { ...S.content, ...(L(t.content) ? t.content : {}) },
          easing: "linear" === t.easing ? "linear" : "smoothstep",
          engine: r,
          keyframes: n,
          scene: s,
          version: Number.isFinite(t.version) ? t.version : S.version,
        };
      },
      "resolveCueKeyframe",
      0,
      function ({ cueIndex: e, data: t, keyframes: a }) {
        let s = Math.min(e + 1, a.length - 1),
          r = a[Math.max(0, s)] ?? {},
          l = L(t?.keyframe) ? t.keyframe : void 0;
        return T(D(r, l), R(r), l ?? {});
      },
      "selectAstraRuntimeOverrides",
      0,
      R,
    ],
    170825,
  );
};
