// Extracted from the public OpenAI Astra source, 0kyg3mclnp-m6.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418),
      a = t.i(384051),
      s = t.i(471772),
      r = t.i(83007),
      i = t.i(861045),
      o = t.i(642671);
    let l = e.MathUtils.degToRad(-52);
    function n(t, a, s, r = 6) {
      let i = e.MathUtils.damp(t, a, r, s);
      return 1e-4 >= Math.abs(a - i) ? a : i;
    }
    function h(t, e) {
      return Math.abs(t - e) > 0.001;
    }
    function c(t, a, s, r, i, o, l, n, h, c, p, u, M, m, d, f) {
      let g = t.uniforms;
      ((g.uAccretionRatio.value = e.MathUtils.clamp(
        c.accretionRatio,
        0.12,
        0.72,
      )),
        (g.uAmbientPulse.value = n),
        (g.uCoreIntensity.value = e.MathUtils.clamp(c.coreIntensity, 0.5, 3)),
        (g.uExhaleStrength.value = e.MathUtils.clamp(c.exhaleStrength, 0, 1.5)),
        (g.uFormationEnabled.value = Number(a)),
        (g.uFormationProgress.value = s),
        (g.uIntroProgress.value = r),
        (g.uGrowthEnabled.value = Number(i)),
        (g.uGrowthProgress.value = o),
        (g.uGrowthSoftness.value = e.MathUtils.clamp(l, 0.005, 0.3)),
        (g.uInwardStrength.value = e.MathUtils.clamp(c.inwardStrength, 0, 3)),
        (g.uPropagationSoftness.value = e.MathUtils.clamp(
          c.propagationSoftness,
          0,
          0.6,
        )),
        (g.uSettleRatio.value = h),
        (g.uLensActive.value = p),
        (g.uLensDepth.value = e.MathUtils.clamp(
          f.depthDisplacement,
          -1.5,
          1.5,
        )),
        (g.uLensIllumination.value = e.MathUtils.clamp(f.illumination, 0, 2)),
        (g.uLensMagnification.value = e.MathUtils.clamp(
          f.magnification,
          -0.3,
          0.8,
        )),
        g.uLensPointer.value.copy(u),
        (g.uLensRadius.value = M),
        (g.uPointerRepelRadius.value =
          (2 * e.MathUtils.clamp(f.repelRadius, 16, 360)) / Math.max(d, 1)),
        (g.uViewportAspect.value = m));
    }
    t.s(
      [
        "createAstraAnimationState",
        0,
        function (t, a = 0) {
          let s =
              "accretion-exhale" === t.animationPreset
                ? t.accretionExhale.duration
                : "grow" === t.animationPreset
                  ? t.grow.duration
                  : "converge-tilt" === t.animationPreset
                    ? e.MathUtils.clamp(t.convergeDuration, 1, 10)
                    : 10,
            r = t.animationPlaying && 0 === a,
            o = (0, i.createPathShapeTexture)();
          return {
            elapsed: 0,
            introElapsed: r ? 0 : s,
            growthElapsed: r ? 0 : s / t.grow.growthSpeed,
            coreTargetRotation: 0,
            coreRotation: 0,
            scrollProgress: e.MathUtils.clamp(a, 0, 1),
            tiltProgress: e.MathUtils.clamp(a, 0, 1),
            scatterScrollProgress: e.MathUtils.clamp(a, 0, 1.1875),
            scatterPositionProgress: 0,
            shapePositionProgress: 0,
            starsOpacity: 1,
            hasResolvedInitialPose: !1,
            lastShapeId: null,
            lastShapeSamples: null,
            shapeProgress: 0,
            shapeAutoRotation: 0,
            introProgress: "converge-tilt" === t.animationPreset && r ? 0 : 1,
            scatter: 0,
            railPresence: 0,
            railContentBounds: new e.Vector2(0, 1),
            spinRotation: new e.Vector2(),
            shapePointerRotation: new e.Vector2(),
            shapeRotation: new e.Vector2(),
            lensPointer: new e.Vector2(),
            lensStrength: 0,
            particleMotion: {
              pointer: new e.Vector2(),
              previous: new e.Vector2(),
              impulse: new e.Vector2(),
              active: !1,
              pressed: !1,
              remaining: 0,
              scrollCooldown: 0,
              epoch: 0,
              frame: 0,
              delta: 0,
            },
            pathShapeTexture: o,
            scratch: {
              normal: new e.Vector3(),
              tangent: new e.Vector3(),
              next: new e.Vector3(),
              previous: new e.Vector3(),
              euler: new e.Euler(),
              formed: new e.Vector3(),
              relative: new e.Vector3(),
              position: new e.Vector3(),
              scattered: new e.Vector3(),
              dispersedOffset: new e.Vector2(),
              range: new e.Vector2(),
              center: new e.Vector2(),
              size: new e.Vector2(),
            },
            dispose: () => o.dispose(),
          };
        },
        "updateAstraAnimation",
        0,
        function (
          {
            state: t,
            config: p,
            input: u,
            camera: M,
            animationRoot: m,
            spinRoot: d,
            field: f,
            viewport: g,
          },
          P,
          U = P,
        ) {
          var S, v;
          if (!m || !d) return !1;
          let x = {
              width: Number.isFinite(g.width) ? Math.max(g.width, 1) : 1,
              height: Number.isFinite(g.height) ? Math.max(g.height, 1) : 1,
            },
            w = Number.isFinite(P) ? e.MathUtils.clamp(P, 0, 0.05) : 0,
            y = Number.isFinite(U) ? e.MathUtils.clamp(U, 0, 0.05) : 0,
            R = p.scrollEffects ? Math.max(u.progress, 0) : 0,
            E = R > 0,
            b = !1;
          u.reducedMotion || (t.elapsed += w);
          let I =
              "accretion-exhale" === p.animationPreset
                ? e.MathUtils.clamp(p.accretionExhale.duration, 1, 30)
                : "grow" === p.animationPreset
                  ? e.MathUtils.clamp(p.grow.duration, 1, 30)
                  : "converge-tilt" === p.animationPreset
                    ? e.MathUtils.clamp(p.convergeDuration, 1, 10)
                    : 10,
            T = I / e.MathUtils.clamp(p.grow.growthSpeed, 0.2, 2);
          if (
            E &&
            (!t.hasResolvedInitialPose || "converge-tilt" !== p.animationPreset)
          )
            ((t.introElapsed = I), (t.growthElapsed = T));
          else if (
            !u.reducedMotion &&
            p.animationPlaying &&
            "none" !== p.animationPreset
          ) {
            let e = Math.min(t.introElapsed + w, I);
            t.introElapsed = I - e <= 1e-4 ? I : e;
          }
          E ||
            u.reducedMotion ||
            !p.animationPlaying ||
            "grow" !== p.animationPreset ||
            (t.growthElapsed = Math.min(t.growthElapsed + w, T));
          let z =
              u.reducedMotion ||
              !p.animationPlaying ||
              "none" === p.animationPreset
                ? 1
                : e.MathUtils.clamp(t.introElapsed / I, 0, 1),
            A = "converge-tilt" === p.animationPreset ? z : 1;
          t.introProgress = A;
          let O =
              "legacy-zoom" === p.animationPreset ? (0, i.easeOutExpo)(z) : 1,
            V =
              "accretion-exhale" === p.animationPreset
                ? e.MathUtils.smootherstep(z, 0, 1)
                : 1,
            D =
              "grow" === p.animationPreset
                ? e.MathUtils.smootherstep(z, 0, 1)
                : 1,
            C =
              "grow" === p.animationPreset
                ? u.reducedMotion || !p.animationPlaying
                  ? 1
                  : e.MathUtils.smootherstep(
                      e.MathUtils.clamp(t.growthElapsed / T, 0, 1),
                      0,
                      1,
                    )
                : 1,
            N =
              "grow" === p.animationPreset
                ? e.MathUtils.smootherstep(C, 0.72, 1)
                : 1,
            F = e.MathUtils.clamp(R, 0, 1),
            L = u.reducedMotion || !t.hasResolvedInitialPose,
            B = e.MathUtils.clamp(u.starsOpacity, 0, 1),
            _ = L ? B : n(t.starsOpacity, B, y);
          ((t.starsOpacity = _), _ !== B && (b = !0));
          let k = L ? F : n(t.scrollProgress, F, y);
          ((t.scrollProgress = k), k !== F && (b = !0));
          let G =
              p.scrollEffects && !u.reducedMotion && null !== u.tiltProgress
                ? e.MathUtils.clamp(u.tiltProgress, 0, 1)
                : F,
            q = L ? G : n(t.tiltProgress, G, y);
          ((t.tiltProgress = q), q !== G && (b = !0));
          let j = u.reducedMotion ? 0.5 : 0.375,
            H = u.reducedMotion ? 1 : 1.1875,
            K =
              p.scrollEffects && !u.reducedMotion && null !== u.scatterProgress
                ? e.MathUtils.lerp(
                    j,
                    H,
                    e.MathUtils.clamp(u.scatterProgress, 0, 1),
                  )
                : e.MathUtils.clamp(R, 0, H),
            Y = L ? K : n(t.scatterScrollProgress, K, y);
          ((t.scatterScrollProgress = Y), Y !== K && (b = !0));
          let Z = e.MathUtils.smootherstep(k, 0, 0.5),
            X = Math.sin(e.MathUtils.clamp(q / 0.75, 0, 1) * Math.PI * 0.5),
            J = 1 - e.MathUtils.smootherstep(q, 0.75, 1),
            Q = e.MathUtils.smootherstep(Y, j, H),
            W = e.MathUtils.smoothstep(e.MathUtils.smootherstep(K, j, H), 0, 1),
            $ = L ? W : n(t.scatterPositionProgress, W, y, 4);
          ((t.scatterPositionProgress = $), $ !== W && (b = !0));
          let tt = (1 - Q) * e.MathUtils.smoothstep(A, 0.55, 1);
          t.scatter = Q;
          let te = p.scrollEffects ? e.MathUtils.lerp(1, 0.45, Z) : 1;
          if ("legacy-zoom" === p.animationPreset)
            (m.scale.setScalar(e.MathUtils.lerp(2.35, 1, O)),
              m.rotation.set(
                e.MathUtils.lerp(e.MathUtils.degToRad(-42), 0, O),
                e.MathUtils.lerp(Math.PI, 0, O),
                e.MathUtils.lerp(e.MathUtils.degToRad(5), 0, O),
              ));
          else if ("accretion-exhale" === p.animationPreset) {
            let t = e.MathUtils.smootherstep(
              V,
              e.MathUtils.clamp(p.accretionExhale.accretionRatio, 0.12, 0.72),
              1,
            );
            (m.scale.setScalar(
              e.MathUtils.lerp(
                e.MathUtils.clamp(p.accretionExhale.startScale, 0.3, 1.25),
                1,
                t,
              ),
            ),
              m.rotation.set(0, 0, 0));
          } else (m.scale.setScalar(1), m.rotation.set(0, 0, 0));
          (m.scale.setScalar(e.MathUtils.lerp(m.scale.x, 1, Q)),
            (m.rotation.x = e.MathUtils.lerp(m.rotation.x, 0, Z) + l * X * J),
            (m.rotation.y = e.MathUtils.lerp(m.rotation.y, 0, Z)),
            (m.rotation.z = e.MathUtils.lerp(m.rotation.z, 0, Z)));
          let ta = +("rotate" === p.interactionMode);
          if (u.reducedMotion)
            (t.spinRotation.set(0, 0), d.rotation.set(0, 0, 0));
          else {
            let a = 1 - Math.exp(-(u.returning ? 5.5 : 14) * y),
              s = ta * u.rotation.x,
              r = ta * u.rotation.y;
            ((t.spinRotation.x = e.MathUtils.lerp(t.spinRotation.x, s, a)),
              (t.spinRotation.y = e.MathUtils.lerp(t.spinRotation.y, r, a)),
              d.rotation.set(t.spinRotation.x * tt, t.spinRotation.y * tt, 0),
              (h(t.spinRotation.x, s) || h(t.spinRotation.y, r)) && (b = !0));
          }
          let ts = u.pointer,
            tr = (function (t, e, s, r, i = !1) {
              ((t.frame += 1),
                (t.delta = r),
                t.impulse.set(0, 0),
                (t.scrollCooldown = i
                  ? 0.12
                  : Math.max(0, t.scrollCooldown - r)),
                (e.reset || (!s && (t.active || t.remaining > 0))) &&
                  ((t.epoch += 1), (t.remaining = 0), (t.active = !1)));
              let o = s && e.active && !e.pressed && 0 === t.scrollCooldown;
              return (
                o &&
                  (t.previous.copy(t.pointer),
                  t.pointer.set(e.x, e.y),
                  t.active
                    ? (t.impulse.subVectors(t.pointer, t.previous),
                      t.impulse.lengthSq() > 1e-8 &&
                        (t.remaining = a.PARTICLE_MOTION_SETTLE_SECONDS))
                    : t.previous.copy(t.pointer)),
                (t.active = o),
                (t.pressed = e.pressed),
                (t.remaining = Math.max(0, t.remaining - r)),
                t.remaining > 0
              );
            })(
              t.particleMotion,
              ts,
              !0 === f.particleMotionEnabled &&
                !u.reducedMotion &&
                p.interaction.particleRepel &&
                "none" !== p.interactionMode,
              y,
              u.scrolling,
            );
          ts.reset &&
            (t.lensPointer.set(0, 0), (t.lensStrength = 0), (ts.reset = !1));
          let ti = !u.reducedMotion && "depth-lens" === p.interactionMode,
            to =
              1 -
              Math.exp(
                -e.MathUtils.clamp(p.interaction.followDamping, 1, 30) * y,
              );
          if (u.reducedMotion) (t.lensPointer.set(0, 0), (t.lensStrength = 0));
          else {
            let a = ti && ts.active ? 1 : 0;
            ((t.lensPointer.x = e.MathUtils.lerp(t.lensPointer.x, ts.x, to)),
              (t.lensPointer.y = e.MathUtils.lerp(t.lensPointer.y, ts.y, to)),
              (t.lensStrength = e.MathUtils.lerp(t.lensStrength, a, to)),
              (h(t.lensStrength, a) ||
                (a > 0 &&
                  (h(t.lensPointer.x, ts.x) || h(t.lensPointer.y, ts.y)))) &&
                (b = !0));
          }
          let tl = +!!ts.active,
            tn =
              !u.reducedMotion &&
              "depth-lens" === p.interactionMode &&
              (Math.abs(t.lensStrength - tl) > 1e-4 ||
                (ts.active &&
                  (Math.abs(t.lensPointer.x - ts.x) > 1e-4 ||
                    Math.abs(t.lensPointer.y - ts.y) > 1e-4)));
          !tn &&
            "depth-lens" === p.interactionMode &&
            ((t.lensStrength = tl), ts.active && t.lensPointer.set(ts.x, ts.y));
          let th = "depth-lens" === p.interactionMode ? t.lensStrength : 0,
            tc = x.width / Math.max(x.height, 1),
            tp = x.width / Math.max(x.height, 1) < 0.72 ? 12.7 : 10.9,
            tu = tp * tc,
            tM = u.shape,
            heroShape = tM.hero === !0,
            customHero = u.heroShapeEnabled === !0;
          tM.id &&
            tM.samples &&
            (tM.id !== t.lastShapeId || tM.samples !== t.lastShapeSamples) &&
            (t.pathShapeTexture.image.data.set(tM.samples),
            (t.pathShapeTexture.needsUpdate = !0),
            (t.lastShapeId = tM.id),
            (t.lastShapeSamples = tM.samples));
          // A custom opening shape is the initial destination. Reuse the
          // original scatter envelopes to release it without revealing six.
          let tm = heroShape ? 1 - Q : L ? tM.strength : n(t.shapeProgress, tM.strength, y);
          t.shapeProgress = tm;
          let td = e.MathUtils.smoothstep(tM.strength, 0, 1),
            tf = heroShape ? 1 - $ : L ? td : n(t.shapePositionProgress, td, y, 4);
          ((t.shapePositionProgress = tf), tf !== td && (b = !0));
          let tg = p.scrollEffects ? e.MathUtils.clamp(heroShape ? Q : Q * (1 - tm), 0, 1) : 0,
            tP = u.reducedMotion ? 0 : tg;
          t.railPresence = tg;
          let tU = u.reducedMotion
              ? 0
              : R * e.MathUtils.clamp(p.scrollStarDriftSpeed, 0, 3),
            tS = e.MathUtils.lerp(1, 0.18, tg),
            tv = e.MathUtils.lerp(1, 0.1, tg),
            tx = e.MathUtils.lerp(1, 0.1, tg);
          if (
            ((t.hasResolvedInitialPose = !0),
            tm !== tM.strength && (b = !0),
            u.reducedMotion)
          )
            ((t.shapeAutoRotation = 0),
              t.shapePointerRotation.set(0, 0),
              t.shapeRotation.set(0, 0));
          else {
            let a = e.MathUtils.smootherstep(tm, 0.05, 0.4),
              s = 1 - Math.exp(-(u.returning ? 5.5 : 14) * y),
              r = heroShape ? 0 : ta * u.rotation.x,
              i = heroShape ? 0 : ta * u.rotation.y;
            ((t.shapePointerRotation.x = e.MathUtils.lerp(
              t.shapePointerRotation.x,
              r,
              s,
            )),
              (t.shapePointerRotation.y = e.MathUtils.lerp(
                t.shapePointerRotation.y,
                i,
                s,
              )));
            let o = e.MathUtils.clamp(p.pathShapeAutoRotateAmount, 0, 1.2);
            t.shapeAutoRotation = 0;
            let l = e.MathUtils.smootherstep(tm, 0.001, 0.12),
              n = e.MathUtils.smootherstep(tm, 0.04, 0.82),
              c = Number(!heroShape && p.pathShapeAutoRotate && p.animationPlaying),
              M = e.MathUtils.lerp(-o, 0, n) * l * c,
              m = n > 0 && n < 1 ? Math.sin(n * Math.PI) : 0;
            (t.shapeRotation.set(
              t.shapePointerRotation.x * a + -m * o * 0.34 * l * c,
              t.shapePointerRotation.y * a + M,
            ),
              (h(t.shapePointerRotation.x, r) ||
                h(t.shapePointerRotation.y, i)) &&
                (b = !0));
          }
          (t.scratch.center.set(
            tM.centerNdc.x * tu * 0.5,
            tM.centerNdc.y * tp * 0.5,
          ),
            t.scratch.size.set(
              tM.sizeNdc.x * tu * 0.5,
              tM.sizeNdc.y * tp * 0.5,
            ));
          let tw =
            (Math.min(
              0.5 * Math.min(676, Math.max(x.width - 48, 0)) + 48,
              0.36 * x.width,
            ) /
              Math.max(x.width, 1)) *
            tu;
          t.railContentBounds.set(
            u.contentBounds?.left ?? 0.5 - tw / tu,
            u.contentBounds?.right ?? 0.5 + tw / tu,
          );
          let ty = (t.railContentBounds.x - 0.5) * tu,
            tR = (t.railContentBounds.y - 0.5) * tu,
            tE =
              "grow" === p.animationPreset
                ? e.MathUtils.smootherstep(D, 0, 1)
                : 1,
            tb =
              "grow" === p.animationPreset ? e.MathUtils.lerp(0, 1.2, tE) : 1.2,
            tI = customHero ? 0 : e.MathUtils.lerp(tb, 0, Z);
          (M.position.set(0, tI, 12), M.lookAt(0, tI, 0));
          let tT =
            "grow" === p.animationPreset
              ? e.MathUtils.lerp(
                  e.MathUtils.clamp(p.grow.startZoom, 1, 8),
                  1,
                  tE,
                )
              : 1;
          ((M.zoom = (x.height / tp) * e.MathUtils.lerp(tT, 1, Q)),
            M.updateProjectionMatrix());
          let tz = e.MathUtils.clamp(
            u.heroViewportHeight ?? x.height,
            1,
            x.height,
          );
          m.position.y = ((x.height - tz) / (2 * M.zoom)) * (1 - Q) * (1 - tm);
          let tA = tp * tc * 1.12,
            tO = 1.12 * tp,
            tV =
              "legacy-zoom" === p.animationPreset
                ? e.MathUtils.lerp(8, 1, O)
                : "accretion-exhale" === p.animationPreset
                  ? e.MathUtils.lerp(
                      Math.max(1, 4 * p.accretionExhale.inwardStrength),
                      1,
                      V,
                    )
                  : 1,
            tD = e.MathUtils.clamp(
              p.accretionExhale.settleDuration / I,
              0.03,
              0.4,
            ),
            tC =
              "accretion-exhale" === p.animationPreset &&
              V >= 0.999 &&
              !u.reducedMotion
                ? 1 +
                  Math.sin(
                    t.elapsed *
                      e.MathUtils.clamp(p.accretionExhale.ambientSpeed, 0, 3) *
                      Math.PI *
                      2,
                  ) *
                    e.MathUtils.clamp(p.accretionExhale.ambientAmount, 0, 0.16)
                : 1,
            tN =
              (2 * e.MathUtils.clamp(p.interaction.radius, 32, 360)) /
              Math.max(x.height, 1);
          if (f.coreCluster) {
            let a = 0.36 * e.MathUtils.clamp(p.stars.flowSpeed, 0, 3),
              s = "grow" !== p.animationPreset && p.stars.flowInward ? 1 : -1;
            if (u.reducedMotion)
              ((t.coreTargetRotation = 0), (t.coreRotation = 0));
            else {
              t.coreTargetRotation =
                (0, i.positiveModulo)(
                  t.coreTargetRotation + w * a * s + Math.PI,
                  2 * Math.PI,
                ) - Math.PI;
              let e = 1 - Math.exp(-14 * y),
                r = Math.atan2(
                  Math.sin(t.coreTargetRotation - t.coreRotation),
                  Math.cos(t.coreTargetRotation - t.coreRotation),
                );
              ((t.coreRotation =
                (0, i.positiveModulo)(
                  t.coreRotation + r * e + Math.PI,
                  2 * Math.PI,
                ) - Math.PI),
                !p.animationPlaying &&
                  0 === w &&
                  ((S = t.coreRotation),
                  Math.abs(
                    Math.atan2(
                      Math.sin((v = t.coreTargetRotation) - S),
                      Math.cos(v - S),
                    ),
                  ) > 0.001) &&
                  (b = !0));
            }
            f.coreCluster.rotation.set(
              u.reducedMotion || customHero ? 0 : 0.08 * Math.sin(0.22 * t.elapsed) * tt,
              u.reducedMotion || customHero ? 0 : 0.14 * Math.cos(0.28 * t.elapsed) * tt,
              customHero ? 0 : t.coreRotation * tt,
            );
          }
          let tF = e.MathUtils.clamp(p.interaction.rotationLag, 0, 1),
            tL = u.returning ? 5.5 : 14;
          for (let t of f.orbits) {
            if (u.reducedMotion) t.spin.set(0, 0);
            else {
              let a = 1 - Math.exp(-(tL / (1 + t.lag * tF * 2.5)) * y),
                s = ta * u.rotation.x,
                r = ta * u.rotation.y;
              ((t.spin.x = e.MathUtils.lerp(t.spin.x, s, a)),
                (t.spin.y = e.MathUtils.lerp(t.spin.y, r, a)),
                (h(t.spin.x, s) || h(t.spin.y, r)) && (b = !0));
            }
            let a = 0,
              s = 0;
            if ("legacy-zoom" === p.animationPreset) {
              let r = O - O ** (1 + 0.9 * t.lag);
              ((a = e.MathUtils.degToRad(-42 * r)), (s = Math.PI * r));
            }
            t.group.rotation.set(
              a + t.spin.x * tt * ta - d.rotation.x,
              s + t.spin.y * tt * ta - d.rotation.y,
              0,
            );
          }
          for (let a of f.pathLayers) {
            let l = "grow" === p.animationPreset ? a.outwardSpeed : a.speed,
              n = a.isCore ? 0.022 : Math.abs(l),
              h = e.MathUtils.smootherstep(tm, 0.08, 0.5);
            if (!u.reducedMotion)
              if (
                ((a.pathShapeTravel = (0, i.positiveModulo)(
                  a.pathShapeTravel +
                    w *
                      n *
                      (p.stars.flowInward ? 1 : -1) *
                      e.MathUtils.clamp(p.stars.flowSpeed, 0, 3) *
                      h,
                  1,
                )),
                "grow" === p.animationPreset && 0 !== l)
              ) {
                let t =
                  Math.abs(l) * e.MathUtils.clamp(p.stars.flowSpeed, 0, 3) * N;
                ((a.motionOffset = (0, i.positiveModulo)(
                  a.motionOffset + w * t * Math.sign(l) * tt,
                  1,
                )),
                  (a.travel = (0, i.positiveModulo)(
                    a.phase + a.motionOffset,
                    1,
                  )));
              } else
                ((a.motionOffset = (0, i.positiveModulo)(
                  a.motionOffset +
                    w * l * e.MathUtils.clamp(p.stars.flowSpeed, 0, 3) * tt,
                  1,
                )),
                  (a.travel = (0, i.positiveModulo)(
                    a.travel + w * tV * Math.abs(l) * tt,
                    1,
                  )));
            let M = u.reducedMotion ? a.phase : a.travel,
              m = l < 0 ? 1 - M : M,
              d = u.reducedMotion
                ? 0
                : "grow" === p.animationPreset
                  ? a.motionOffset
                  : t.elapsed;
            if (
              ((a.starMaterial.uniforms.uTime.value = d),
              (a.starMaterial.uniforms.uBackgroundStarsEnabled.value = Number(
                "converge-tilt" === p.animationPreset,
              )),
              (a.starMaterial.uniforms.uPathSpeed.value =
                "grow" === p.animationPreset && 0 !== l ? 1 : l),
              (a.starMaterial.uniforms.uPathOffset.value = u.reducedMotion
                ? 0
                : a.motionOffset),
              a.starMaterial.uniforms.uPathShapeCenter.value.copy(
                t.scratch.center,
              ),
              (a.starMaterial.uniforms.uPathShapeProgress.value = tm),
              (a.starMaterial.uniforms.uPathShapePositionProgress.value = tf),
              (a.starMaterial.uniforms.uPathShapeMotion.value =
                a.pathShapeTravel),
              a.starMaterial.uniforms.uPathShapeRotation.value.copy(
                t.shapeRotation,
              ),
              (a.starMaterial.uniforms.uPathShapeScatter.value =
                e.MathUtils.clamp(p.pathShapeScatter, 0, 3)),
              a.starMaterial.uniforms.uPathShapeSize.value.copy(t.scratch.size),
              (a.starMaterial.uniforms.uPathShapeTexture.value =
                t.pathShapeTexture),
              (a.starMaterial.uniforms.uGrowthDirection.value = l < 0 ? -1 : 1),
              (a.starMaterial.uniforms.uFlowSpeed.value =
                "grow" === p.animationPreset && 0 !== l
                  ? tt
                  : e.MathUtils.clamp(p.stars.flowSpeed, 0, 3) * tt),
              (a.starMaterial.uniforms.uTwinkleSpeed.value = u.reducedMotion
                ? 0
                : e.MathUtils.clamp(p.stars.twinkleSpeed, 0, 2) * tt),
              (a.starMaterial.uniforms.uIntensity.value =
                e.MathUtils.clamp(
                  p.stars.intensity * (a.isCore ? 1.22 : 1) * tS,
                  0.1,
                  3,
                ) * _),
              (a.starMaterial.uniforms.uDispersedMotion.value = tP),
              (a.starMaterial.uniforms.uScrollScatter.value = Q),
              (a.starMaterial.uniforms.uScrollPositionProgress.value = customHero ? 1 : $),
              (a.starMaterial.uniforms.uScrollDrift.value = tU),
              (a.starMaterial.uniforms.uScrollSizeScale.value = te),
              a.starMaterial.uniforms.uTextBounds.value.set(ty, tR),
              a.starMaterial.uniforms.uScatterSize.value.set(tA, tO),
              c(
                a.starMaterial,
                "accretion-exhale" === p.animationPreset,
                V,
                A,
                "grow" === p.animationPreset && !a.isCore,
                C,
                p.grow.softness,
                tC,
                tD,
                p.accretionExhale,
                th,
                t.lensPointer,
                tN,
                tc,
                x.height,
                p.interaction,
              ),
              a.flareSource)
            ) {
              let n = a.flarePathSamples,
                h = null !== n,
                c = (0, i.positiveModulo)(
                  a.flareProgress + (u.reducedMotion ? 0 : a.motionOffset),
                  1,
                ),
                M = h ? (0, i.densityProgress)(c, p.stars.densityFalloff) : 0,
                m = M,
                f = 1,
                g = 1;
              if (h && "grow" === p.animationPreset) {
                let t = l < 0 ? -1 : 1,
                  a = 0.24 * (t > 0 ? M : 1 - M),
                  s = e.MathUtils.clamp((C - a) / Math.max(1 - a, 1e-4), 0, 1);
                ((g = e.MathUtils.smoothstep(s, 0, 1)),
                  (m = e.MathUtils.lerp(t > 0 ? 0 : 1, M, g)),
                  (f = e.MathUtils.smoothstep(C, a, a + 0.025)));
              }
              if (n) {
                let e = 1 / Math.max(Math.floor(n.length / 4) - 1, 1);
                ((0, i.samplePath)(n, m, t.scratch.position),
                  (0, i.samplePath)(n, Math.max(m - e, 0), t.scratch.previous),
                  (0, i.samplePath)(n, Math.min(m + e, 1), t.scratch.next),
                  t.scratch.tangent
                    .subVectors(t.scratch.next, t.scratch.previous)
                    .normalize(),
                  t.scratch.normal
                    .set(-t.scratch.tangent.y, t.scratch.tangent.x, 0)
                    .normalize(),
                  t.scratch.position.addScaledVector(
                    t.scratch.normal,
                    a.flareAcrossOffset * g,
                  ),
                  (t.scratch.position.z += a.flareDepthOffset * g));
              } else t.scratch.position.copy(a.flareBasePosition);
              let P = 1;
              if ("accretion-exhale" === p.animationPreset) {
                let a = Math.hypot(t.scratch.position.x, t.scratch.position.y),
                  s = e.MathUtils.clamp(
                    V - a * p.accretionExhale.propagationSoftness * 0.018,
                    0,
                    1,
                  ),
                  r = e.MathUtils.clamp(
                    p.accretionExhale.accretionRatio,
                    0.12,
                    0.72,
                  ),
                  i = Math.max(r + 0.08, 1 - tD),
                  o = e.MathUtils.smoothstep(s, 0, r),
                  l = e.MathUtils.smoothstep(s, r, i),
                  n = a > 1e-4 ? t.scratch.position.x / a : 0,
                  h = a > 1e-4 ? t.scratch.position.y / a : 0;
                (t.scratch.formed.copy(t.scratch.position),
                  (t.scratch.formed.x +=
                    n * p.accretionExhale.inwardStrength * (2 + 0.28 * a)),
                  (t.scratch.formed.y +=
                    h * p.accretionExhale.inwardStrength * (2 + 0.28 * a)),
                  (t.scratch.formed.z +=
                    0.8 * p.accretionExhale.inwardStrength),
                  t.scratch.previous.set(
                    0.045 * t.scratch.position.x,
                    0.045 * t.scratch.position.y,
                    0.12 * t.scratch.position.z,
                  ),
                  t.scratch.formed.lerp(t.scratch.previous, o),
                  t.scratch.formed.lerp(t.scratch.position, l));
                let c =
                  Math.sin(l * Math.PI) *
                  (1 - l) *
                  p.accretionExhale.exhaleStrength;
                ((t.scratch.formed.x += n * c),
                  (t.scratch.formed.y += h * c),
                  t.scratch.position.copy(t.scratch.formed),
                  (P = e.MathUtils.lerp(0.06, 0.58, o)),
                  (P = e.MathUtils.lerp(P, 1, l)));
              }
              let U = Math.fround(a.flareScatter.x),
                S = Math.fround(a.flareScatter.y),
                v = Math.fround(a.flareScatter.z),
                x = Number(Math.fround(a.flareClearanceSeed) >= 0.72),
                w = U < 0.5 ? -1 : 1,
                y = Math.sqrt((0, i.positiveModulo)(2 * U, 1)),
                R = w * e.MathUtils.lerp(w < 0 ? -ty : tR, 0.5 * tA, y);
              ((0, s.getAstraDispersedMotionOffset)(
                t.scratch.dispersedOffset,
                Math.fround(d),
                U,
                S,
                v,
                tU,
                tP,
              ),
                t.scratch.scattered.set(
                  e.MathUtils.lerp(R, (U - 0.5) * tA, x) +
                    t.scratch.dispersedOffset.x,
                  (0, i.positiveModulo)(
                    (S - 0.5) * tO + t.scratch.dispersedOffset.y + 0.5 * tO,
                    tO,
                  ) -
                    0.5 * tO -
                    Math.sin((customHero ? 1 : $) * Math.PI) * (0.15 + 0.25 * v),
                  (v - 0.5) * 0.5,
                ),
                t.scratch.position.lerp(t.scratch.scattered, customHero ? 1 : $));
              let E = h ? (0, i.tipFade)(m) : 1,
                b = h ? (0, i.sizeFalloff)(m, p.stars.sizeFalloff) : 1;
              ((E = e.MathUtils.lerp(E, 1, Q)),
                (b = e.MathUtils.lerp(b, 1, Q)));
              let I = 1,
                T = 1;
              if (tM.samples && (tm > 0 || tf > 0)) {
                (0, i.samplePathRange)(
                  tM.samples,
                  a.flareShapeSeed,
                  t.scratch.range,
                );
                let s = t.scratch.range.x,
                  r = t.scratch.range.y,
                  o = Math.max(r - s, 9775171065493646e-19),
                  l = (0, i.densityProgress)(
                    e.MathUtils.clamp((a.flareShapeSeed - s) / o, 0, 1) +
                      a.pathShapeTravel / o,
                    p.stars.densityFalloff,
                  ),
                  n = e.MathUtils.lerp(s, r, l);
                ((0, i.samplePath)(tM.samples, n, t.scratch.formed),
                  (0, i.samplePath)(
                    tM.samples,
                    Math.max(n - 9775171065493646e-19, s),
                    t.scratch.previous,
                  ),
                  (0, i.samplePath)(
                    tM.samples,
                    Math.min(n + 9775171065493646e-19, r),
                    t.scratch.next,
                  ),
                  t.scratch.tangent
                    .set(
                      (t.scratch.next.x - t.scratch.previous.x) *
                        t.scratch.size.x +
                        1e-4,
                      (t.scratch.next.y - t.scratch.previous.y) *
                        t.scratch.size.y,
                      0,
                    )
                    .normalize(),
                  t.scratch.normal
                    .set(-t.scratch.tangent.y, t.scratch.tangent.x, 0)
                    .normalize());
                let h = Math.sin(l * Math.PI),
                  c =
                    Math.sin(l * Math.PI * 1.35 + a.pathShapeDepthPhase) *
                    a.pathShapeDepth *
                    h,
                  u = e.MathUtils.clamp(p.pathShapeScatter, 0, 3);
                (t.scratch.relative
                  .set(
                    t.scratch.formed.x * t.scratch.size.x,
                    t.scratch.formed.y * t.scratch.size.y,
                    (c + 0.75 * a.flareDepthOffset + a.flareShapeDepthScatter) *
                      u,
                  )
                  .addScaledVector(
                    t.scratch.normal,
                    (1.1 * a.flareAcrossOffset + a.flareShapeAcrossScatter) * u,
                  ),
                  t.scratch.euler.set(
                    t.shapeRotation.x,
                    t.shapeRotation.y,
                    0,
                    "YXZ",
                  ),
                  t.scratch.relative.applyEuler(t.scratch.euler),
                  t.scratch.formed.set(
                    t.scratch.center.x + t.scratch.relative.x,
                    t.scratch.center.y + t.scratch.relative.y,
                    t.scratch.relative.z,
                  ),
                  t.scratch.position.lerp(t.scratch.formed, tf));
                let M = e.MathUtils.smoothstep(
                  t.scratch.relative.z,
                  -1.15,
                  1.15,
                );
                ((E = e.MathUtils.lerp(E, (0, i.tipFade)(l), tm)),
                  (b = e.MathUtils.lerp(
                    b,
                    (0, i.sizeFalloff)(l, p.stars.sizeFalloff),
                    tm,
                  )),
                  (I = e.MathUtils.lerp(
                    1,
                    e.MathUtils.lerp(0.78, 1.18, M),
                    tm,
                  )),
                  (T = e.MathUtils.lerp(1, e.MathUtils.lerp(0.72, 1, M), tm)));
              }
              (t.scratch.formed.set(
                (U - 0.5) * tA,
                ((0, i.positiveModulo)(S, 1) - 0.5) * tO,
                (v - 0.5) * 0.5,
              ),
                (0, r.applyAstraIntroMotion)(
                  t.scratch.position,
                  t.scratch.formed,
                  A,
                  v,
                  S,
                ));
              let z = (0, o.getAstraParticleRevealProgress)(A, v),
                O = Math.sqrt(z),
                D = e.MathUtils.smoothstep(
                  z,
                  0,
                  o.ASTRA_PARTICLE_OPACITY_REVEAL_END,
                ),
                N =
                  "grow" !== p.animationPreset || a.isCore ? 1 : 0.3 + 0.7 * f,
                F =
                  E *
                  b *
                  I *
                  T *
                  P *
                  f *
                  N *
                  e.MathUtils.lerp(te, 1, tm) *
                  O *
                  D *
                  tx;
              (a.flareSource.position.copy(t.scratch.position),
                a.flareSource.scale.setScalar(e.MathUtils.clamp(F, 0, 1) * _));
            }
            a.dustMaterial &&
              ((a.dustMaterial.uniforms.uDispersedMotion.value = tP),
              (a.dustMaterial.uniforms.uDriftSpeed.value = u.reducedMotion
                ? 0
                : e.MathUtils.clamp(p.orbitalDust.driftSpeed, 0, 1.5) * tt),
              (a.dustMaterial.uniforms.uScrollScatter.value = Q),
              (a.dustMaterial.uniforms.uScrollPositionProgress.value = $),
              (a.dustMaterial.uniforms.uScrollDrift.value = tU),
              (a.dustMaterial.uniforms.uStarVisibility.value = tt),
              (a.dustMaterial.uniforms.uTrailEnabled.value = tt),
              a.dustMaterial.uniforms.uScatterSize.value.set(tA, tO),
              (a.dustMaterial.uniforms.uHeadProgress.value = m),
              (a.dustMaterial.uniforms.uDirection.value = l < 0 ? -1 : 1),
              (a.dustMaterial.uniforms.uIntensity.value = e.MathUtils.clamp(
                p.orbitalDust.intensity * tv,
                0,
                3,
              )),
              (a.dustMaterial.uniforms.uLightReach.value =
                e.MathUtils.clamp(p.orbitalDust.reach, 0.02, 0.4) *
                (a.strong ? 1.15 : 1)),
              (a.dustMaterial.uniforms.uTime.value = u.reducedMotion
                ? 0
                : t.elapsed),
              c(
                a.dustMaterial,
                "accretion-exhale" === p.animationPreset,
                V,
                A,
                "grow" === p.animationPreset,
                C,
                p.grow.softness,
                tC,
                tD,
                p.accretionExhale,
                th,
                t.lensPointer,
                tN,
                tc,
                x.height,
                p.interaction,
              ));
          }
          return b || tn || tr;
        },
      ],
      324944,
    );
  };
