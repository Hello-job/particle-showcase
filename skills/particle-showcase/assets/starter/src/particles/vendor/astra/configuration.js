// Extracted from the public OpenAI Astra source, 0xnf_9ewj1sr3.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (e) => {
    "use strict";
    var t = e.i(170825);
    let a = (e) => Math.min(1, Math.max(0, Number.isFinite(e) ? e : 0));
    function s(e, t) {
      let s = a(e);
      return "linear" === t ? s : s * s * (3 - 2 * s);
    }
    function r({
      easing: e,
      from: l,
      progress: i,
      reducedMotion: n = !1,
      to: o,
    }) {
      let c = (function e(a, s, r) {
        if (Object.is(a, s) || r <= 0) return a;
        if (r >= 1) return s;
        if (
          "number" == typeof a &&
          Number.isFinite(a) &&
          "number" == typeof s &&
          Number.isFinite(s)
        )
          return a + (s - a) * r;
        if (
          Array.isArray(a) &&
          Array.isArray(s) &&
          a.length === s.length &&
          a.every((e) => "number" == typeof e && Number.isFinite(e)) &&
          s.every((e) => "number" == typeof e && Number.isFinite(e))
        ) {
          let e = a.map((e, t) => e + (s[t] - e) * r);
          return e.every((e, t) => Object.is(e, a[t]))
            ? a
            : e.every((e, t) => Object.is(e, s[t]))
              ? s
              : e;
        }
        if ((0, t.isPlainRecord)(a) && (0, t.isPlainRecord)(s)) {
          let t = new Set([...Object.keys(a), ...Object.keys(s)]),
            l = [...t].map((t) => [t, e(a[t], s[t], r)]),
            i = t.size === Object.keys(a).length,
            n = t.size === Object.keys(s).length;
          return i && l.every(([e, t]) => Object.is(t, a[e]))
            ? a
            : n && l.every(([e, t]) => Object.is(t, s[e]))
              ? s
              : Object.fromEntries(l);
        }
        return r < 0.5 ? a : s;
      })(l, o, n ? (0.5 > a(i) ? 0 : 1) : s(i, e));
      return (0, t.markAstraKeyframeOverrides)(
        c,
        (0, t.selectAstraRuntimeOverrides)(l),
        (0, t.selectAstraRuntimeOverrides)(o),
      );
    }
    function l(e) {
      return (0, t.isPlainRecord)(e) ? e : {};
    }
    function i(e) {
      return {
        background: l(e.background),
        camera: l(e.camera),
        core: l(e.core),
        effects: l(e.effects),
        interaction: l(e.interaction),
        lighting: l(e.lighting),
        motion: l(e.motion),
        particles: l(e.particles),
        renderer: l(e.renderer),
      };
    }
    (e.s(["applyAstraEasing", 0, s, "interpolateAstraKeyframes", 0, r], 330592),
      e.s(
        [
          "getAstraBoolean",
          0,
          function (e, t, a) {
            return "boolean" == typeof e[t] ? e[t] : a;
          },
          "getAstraNumber",
          0,
          function (e, t, a, s) {
            let r = e[t],
              l = "number" == typeof r && Number.isFinite(r) ? r : a;
            return Math.min(s?.max ?? 1 / 0, Math.max(s?.min ?? -1 / 0, l));
          },
          "getAstraSceneValues",
          0,
          i,
          "getAstraString",
          0,
          function (e, t, a) {
            return "string" == typeof e[t] ? e[t] : a;
          },
        ],
        777124,
      ));
    var n = e.i(59820);
    function o(e, a) {
      if ((0, t.isPlainRecord)(e))
        return Object.getOwnPropertyDescriptor(e, a)?.value;
    }
    function c(e) {
      var t;
      let { effects: a, interaction: s, motion: r, particles: l } = i(e),
        n = o(a, "flareSize");
      return {
        animationPlaying: o(r, "autoplay"),
        animationPreset:
          "convergeTilt" === (t = o(r, "animation")) ? "converge-tilt" : t,
        bloomIntensity: o(a, "bloomIntensity"),
        bloomThreshold: o(a, "bloomThreshold"),
        colorPaletteColors: o(l, "colors"),
        convergeDuration: o(r, "revealDuration"),
        dirtyGlass: {
          enabled: o(a, "dirtyGlass"),
          texture: o(a, "textureIntensity"),
        },
        faceForward: o(s, "faceForward"),
        interaction: {
          followDamping: o(s, "followDamping"),
          particleRepel: o(s, "particleRepel"),
          repelDistance: o(s, "repelDistance"),
          repelFalloff: o(s, "repelFalloff"),
          repelHighlight: o(s, "repelHighlight"),
          repelHighlightRadius: o(s, "repelHighlightRadius"),
          repelPressMultiplier: o(s, "repelPressMultiplier"),
          repelRadius: o(s, "repelRadius"),
          repelReturnSpring: o(s, "repelReturnSpring"),
          repelSpring: o(s, "repelSpring"),
          rotationLag: o(s, "pathLag"),
          smearCurl: o(s, "smearCurl"),
          smearTrailLength: o(s, "smearTrailLength"),
        },
        interactionMode: o(s, "mode"),
        lensFlare: {
          enabled: o(a, "lensFlare"),
          intensity: o(a, "flareIntensity"),
          streakLength:
            "number" == typeof n && Number.isFinite(n) ? 0.085 * n : void 0,
        },
        pathShapeAutoRotate: o(r, "shapeAutoRotate"),
        pathShapeAutoRotateAmount: o(r, "shapeRotationAmount"),
        pathShapeAutoRotateSpeed: o(r, "shapeRotationSpeed"),
        rotationDepth: o(l, "pathDepth"),
        scrollDisperseDistance: o(r, "disperseDistance"),
        scrollStarDriftSpeed: o(r, "starDriftSpeed"),
        scrollStartOffset: o(r, "scrollStart"),
        scrollTextFadeDistance: o(r, "textFadeDistance"),
        showCenterCluster: o(l, "centerCluster"),
        stars: {
          density: o(l, "starDensity"),
          densityFalloff: o(l, "densityFalloff"),
          flowInward: o(l, "flowInward"),
          flowSpeed: o(l, "flowSpeed"),
          intensity: o(l, "starIntensity"),
          scatter: o(l, "scatter"),
          size: o(l, "starSize"),
          sizeFalloff: o(l, "sizeFalloff"),
          twinkleSpeed: o(l, "twinkleSpeed"),
        },
      };
    }
    e.s(
      [
        "prepareAstraRuntimeConfig",
        0,
        function (e, a) {
          let s = (0, t.selectAstraRuntimeOverrides)(a),
            r = o(s, "engine"),
            l = (0, t.mergeAstraValue)(
              (0, n.pickAstraRuntimeOverrides)(c(s)),
              (0, n.pickAstraRuntimeOverrides)(s),
            ),
            i = (0, t.mergeAstraValue)(
              l,
              (0, t.isPlainRecord)(r)
                ? (0, n.pickAstraRuntimeOverrides)(r)
                : void 0,
            );
          return {
            override: i,
            resolved: (0, n.resolveAstraRuntimeData)(i, e),
          };
        },
        "resolveAstraRendererConfig",
        0,
        function (e, a) {
          let s = o(a, "engine"),
            r = (0, t.mergeAstraValue)(c(e.scene), a);
          return (0, n.resolveAstraHeroData)(
            (0, t.mergeAstraValue)(r, (0, t.isPlainRecord)(s) ? s : void 0),
          );
        },
        "resolvePreparedAstraRuntimeConfig",
        0,
        function ({ base: e, from: t, progress: a, to: s }) {
          let l = Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 0;
          if (l <= 0 || t === s) return t.resolved;
          if (l >= 1) return s.resolved;
          let i = r({
            easing: "linear",
            from: t.override,
            progress: l,
            to: s.override,
          });
          return i === t.override
            ? t.resolved
            : i === s.override
              ? s.resolved
              : (0, n.resolveAstraRuntimeData)(i, e);
        },
      ],
      682025,
    );
  };
