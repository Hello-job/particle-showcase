// Extracted from the public OpenAI Astra source, 1rfzm7jt1igp4.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418);
    let a = e.SRGBColorSpace;
    class r extends e.Loader {
      constructor(t) {
        (super(t), (this.defaultDPI = 90), (this.defaultUnit = "px"));
      }
      load(t, a, r, o) {
        let i = this,
          s = new e.FileLoader(i.manager);
        (s.setPath(i.path),
          s.setRequestHeader(i.requestHeader),
          s.setWithCredentials(i.withCredentials),
          s.load(
            t,
            function (e) {
              try {
                a(i.parse(e));
              } catch (e) {
                (o ? o(e) : console.error(e), i.manager.itemError(t));
              }
            },
            r,
            o,
          ));
      }
      parse(t) {
        let r = this;
        function o(t, e, a, r, o, s, n, l) {
          if (0 == e || 0 == a) return void t.lineTo(l.x, l.y);
          ((r = (r * Math.PI) / 180), (e = Math.abs(e)), (a = Math.abs(a)));
          let u = (n.x - l.x) / 2,
            c = (n.y - l.y) / 2,
            h = Math.cos(r) * u + Math.sin(r) * c,
            p = -Math.sin(r) * u + Math.cos(r) * c,
            f = e * e,
            d = a * a,
            m = h * h,
            S = p * p,
            g = m / f + S / d;
          if (g > 1) {
            let t = Math.sqrt(g);
            ((e *= t), (a *= t), (f = e * e), (d = a * a));
          }
          let P = f * S + d * m,
            y = Math.sqrt(Math.max(0, (f * d - P) / P));
          o === s && (y = -y);
          let v = (y * e * p) / a,
            x = (-y * a * h) / e,
            b = Math.cos(r) * v - Math.sin(r) * x + (n.x + l.x) / 2,
            w = Math.sin(r) * v + Math.cos(r) * x + (n.y + l.y) / 2,
            A = i(1, 0, (h - v) / e, (p - x) / a),
            M =
              i((h - v) / e, (p - x) / a, (-h - v) / e, (-p - x) / a) %
              (2 * Math.PI);
          t.currentPath.absellipse(b, w, e, a, A, A + M, 0 === s, r);
        }
        function i(t, e, a, r) {
          let o = Math.sqrt(t * t + e * e) * Math.sqrt(a * a + r * r),
            i = Math.acos(Math.max(-1, Math.min(1, (t * a + e * r) / o)));
          return (t * r - e * a < 0 && (i = -i), i);
        }
        function s(t, e) {
          e = Object.assign({}, e);
          let a = {};
          if (t.hasAttribute("class")) {
            let e = t
              .getAttribute("class")
              .split(/\s/)
              .filter(Boolean)
              .map((t) => t.trim());
            for (let t = 0; t < e.length; t++)
              a = Object.assign(a, m["." + e[t]]);
          }
          function r(r, o, i) {
            (void 0 === i &&
              (i = function (t) {
                return (
                  t.startsWith("url") &&
                    console.warn(
                      "SVGLoader: url access in attributes is not implemented.",
                    ),
                  t
                );
              }),
              t.hasAttribute(r) && (e[o] = i(t.getAttribute(r))),
              a[r] && (e[o] = i(a[r])),
              t.style && "" !== t.style[r] && (e[o] = i(t.style[r])));
          }
          function o(t) {
            return Math.max(0, Math.min(1, c(t)));
          }
          function i(t) {
            return Math.max(0, c(t));
          }
          return (
            t.hasAttribute("id") &&
              (a = Object.assign(a, m["#" + t.getAttribute("id")])),
            r("fill", "fill"),
            r("fill-opacity", "fillOpacity", o),
            r("fill-rule", "fillRule"),
            r("opacity", "opacity", o),
            r("stroke", "stroke"),
            r("stroke-opacity", "strokeOpacity", o),
            r("stroke-width", "strokeWidth", i),
            r("stroke-linejoin", "strokeLineJoin"),
            r("stroke-linecap", "strokeLineCap"),
            r("stroke-miterlimit", "strokeMiterLimit", i),
            r("visibility", "visibility"),
            e
          );
        }
        function n(t, e, a) {
          let r;
          if ("string" != typeof t)
            throw TypeError("Invalid input: " + typeof t);
          let o = /[ \t\r\n]/,
            i = /[\d]/,
            s = /[-+]/,
            n = /\./,
            l = /,/,
            u = /e/i,
            c = /[01]/,
            h = 0,
            p = !0,
            f = "",
            d = "",
            m = [];
          function S(t, e, a) {
            let r = SyntaxError(
              'Unexpected character "' + t + '" at index ' + e + ".",
            );
            throw ((r.partial = a), r);
          }
          function g() {
            ("" !== f &&
              ("" === d
                ? m.push(Number(f))
                : m.push(Number(f) * Math.pow(10, Number(d)))),
              (f = ""),
              (d = ""));
          }
          let P = t.length;
          for (let y = 0; y < P; y++) {
            if (
              ((r = t[y]),
              Array.isArray(e) && e.includes(m.length % a) && c.test(r))
            ) {
              ((h = 1), (f = r), g());
              continue;
            }
            if (0 === h) {
              if (o.test(r)) continue;
              if (i.test(r) || s.test(r)) {
                ((h = 1), (f = r));
                continue;
              }
              if (n.test(r)) {
                ((h = 2), (f = r));
                continue;
              }
              l.test(r) && (p && S(r, y, m), (p = !0));
            }
            if (1 === h) {
              if (i.test(r)) {
                f += r;
                continue;
              }
              if (n.test(r)) {
                ((f += r), (h = 2));
                continue;
              }
              if (u.test(r)) {
                h = 3;
                continue;
              }
              s.test(r) && 1 === f.length && s.test(f[0]) && S(r, y, m);
            }
            if (2 === h) {
              if (i.test(r)) {
                f += r;
                continue;
              }
              if (u.test(r)) {
                h = 3;
                continue;
              }
              n.test(r) && "." === f[f.length - 1] && S(r, y, m);
            }
            if (3 === h) {
              if (i.test(r)) {
                d += r;
                continue;
              }
              if (s.test(r)) {
                if ("" === d) {
                  d += r;
                  continue;
                }
                1 === d.length && s.test(d) && S(r, y, m);
              }
            }
            o.test(r)
              ? (g(), (h = 0), (p = !1))
              : l.test(r)
                ? (g(), (h = 0), (p = !0))
                : s.test(r)
                  ? (g(), (h = 1), (f = r))
                  : n.test(r)
                    ? (g(), (h = 2), (f = r))
                    : S(r, y, m);
          }
          return (g(), m);
        }
        let l = ["mm", "cm", "in", "pt", "pc", "px"],
          u = {
            mm: {
              mm: 1,
              cm: 0.1,
              in: 1 / 25.4,
              pt: 72 / 25.4,
              pc: 6 / 25.4,
              px: -1,
            },
            cm: {
              mm: 10,
              cm: 1,
              in: 1 / 2.54,
              pt: 72 / 2.54,
              pc: 6 / 2.54,
              px: -1,
            },
            in: { mm: 25.4, cm: 2.54, in: 1, pt: 72, pc: 6, px: -1 },
            pt: {
              mm: 25.4 / 72,
              cm: 2.54 / 72,
              in: 1 / 72,
              pt: 1,
              pc: 6 / 72,
              px: -1,
            },
            pc: {
              mm: 25.4 / 6,
              cm: 2.54 / 6,
              in: 1 / 6,
              pt: 12,
              pc: 1,
              px: -1,
            },
            px: { px: 1 },
          };
        function c(t) {
          let e,
            a = "px";
          if ("string" == typeof t || t instanceof String)
            for (let e = 0, r = l.length; e < r; e++) {
              let r = l[e];
              if (t.endsWith(r)) {
                ((a = r), (t = t.substring(0, t.length - r.length)));
                break;
              }
            }
          return (
            "px" === a && "px" !== r.defaultUnit
              ? (e = u.in[r.defaultUnit] / r.defaultDPI)
              : (e = u[a][r.defaultUnit]) < 0 && (e = u[a].in * r.defaultDPI),
            e * parseFloat(t)
          );
        }
        function h(t) {
          let e = t.elements;
          return e[0] * e[4] - e[1] * e[3] < 0;
        }
        function p(t) {
          let e = t.elements;
          return Math.sqrt(e[0] * e[0] + e[1] * e[1]);
        }
        function f(t) {
          let e = t.elements;
          return Math.sqrt(e[3] * e[3] + e[4] * e[4]);
        }
        let d = [],
          m = {},
          S = [],
          g = new e.Matrix3(),
          P = new e.Matrix3(),
          y = new e.Matrix3(),
          v = new e.Matrix3(),
          x = new e.Vector2(),
          b = new e.Vector3(),
          w = new e.Matrix3(),
          A = new DOMParser().parseFromString(t, "image/svg+xml");
        return (
          !(function t(r, i) {
            var l, u, A, M, C, T;
            if (1 !== r.nodeType) return;
            let D = (function (t) {
                if (!(
                  t.hasAttribute("transform") ||
                  ("use" === t.nodeName &&
                    (t.hasAttribute("x") || t.hasAttribute("y")))
                ))
                  return null;
                let a = (function (t) {
                  let a = new e.Matrix3();
                  if (
                    "use" === t.nodeName &&
                    (t.hasAttribute("x") || t.hasAttribute("y"))
                  ) {
                    let e = c(t.getAttribute("x")),
                      r = c(t.getAttribute("y"));
                    a.translate(e, r);
                  }
                  if (t.hasAttribute("transform")) {
                    let e = t.getAttribute("transform").split(")");
                    for (let t = e.length - 1; t >= 0; t--) {
                      let r = e[t].trim();
                      if ("" === r) continue;
                      let o = r.indexOf("("),
                        i = r.length;
                      if (o > 0 && o < i) {
                        let t = r.slice(0, o),
                          e = n(r.slice(o + 1));
                        switch ((g.identity(), t)) {
                          case "translate":
                            if (e.length >= 1) {
                              let t = e[0],
                                a = 0;
                              (e.length >= 2 && (a = e[1]), g.translate(t, a));
                            }
                            break;
                          case "rotate":
                            if (e.length >= 1) {
                              let t = 0,
                                a = 0,
                                r = 0;
                              ((t = (e[0] * Math.PI) / 180),
                                e.length >= 3 && ((a = e[1]), (r = e[2])),
                                P.makeTranslation(-a, -r),
                                y.makeRotation(t),
                                v.multiplyMatrices(y, P),
                                P.makeTranslation(a, r),
                                g.multiplyMatrices(P, v));
                            }
                            break;
                          case "scale":
                            if (e.length >= 1) {
                              let t = e[0],
                                a = t;
                              (e.length >= 2 && (a = e[1]), g.scale(t, a));
                            }
                            break;
                          case "skewX":
                            1 === e.length &&
                              g.set(
                                1,
                                Math.tan((e[0] * Math.PI) / 180),
                                0,
                                0,
                                1,
                                0,
                                0,
                                0,
                                1,
                              );
                            break;
                          case "skewY":
                            1 === e.length &&
                              g.set(
                                1,
                                0,
                                0,
                                Math.tan((e[0] * Math.PI) / 180),
                                1,
                                0,
                                0,
                                0,
                                1,
                              );
                            break;
                          case "matrix":
                            6 === e.length &&
                              g.set(
                                e[0],
                                e[2],
                                e[4],
                                e[1],
                                e[3],
                                e[5],
                                0,
                                0,
                                1,
                              );
                        }
                      }
                      a.premultiply(g);
                    }
                  }
                  return a;
                })(t);
                return (
                  S.length > 0 && a.premultiply(S[S.length - 1]),
                  w.copy(a),
                  S.push(a),
                  a
                );
              })(r),
              F = !1,
              R = null;
            switch (r.nodeName) {
              case "svg":
              case "g":
                i = s(r, i);
                break;
              case "style":
                !(function (t) {
                  if (t.sheet && t.sheet.cssRules && t.sheet.cssRules.length)
                    for (let e = 0; e < t.sheet.cssRules.length; e++) {
                      let a = t.sheet.cssRules[e];
                      if (1 !== a.type) continue;
                      let r = a.selectorText
                        .split(/,/gm)
                        .filter(Boolean)
                        .map((t) => t.trim());
                      for (let t = 0; t < r.length; t++) {
                        let e = Object.fromEntries(
                          Object.entries(a.style).filter(([, t]) => "" !== t),
                        );
                        m[r[t]] = Object.assign(m[r[t]] || {}, e);
                      }
                    }
                })(r);
                break;
              case "path":
                ((i = s(r, i)),
                  r.hasAttribute("d") &&
                    (R = (function (t) {
                      let a = new e.ShapePath(),
                        r = new e.Vector2(),
                        i = new e.Vector2(),
                        s = new e.Vector2(),
                        l = !0,
                        u = !1,
                        c = t.getAttribute("d");
                      if ("" === c || "none" === c) return null;
                      let h = c.match(/[a-df-z][^a-df-z]*/gi);
                      for (let t = 0, e = h.length; t < e; t++) {
                        var p, f, d, m, S, g, P, y;
                        let e,
                          c = h[t],
                          v = c.charAt(0),
                          x = c.slice(1).trim();
                        switch ((!0 === l && ((u = !0), (l = !1)), v)) {
                          case "M":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2)
                              ((r.x = e[t + 0]),
                                (r.y = e[t + 1]),
                                (i.x = r.x),
                                (i.y = r.y),
                                0 === t
                                  ? a.moveTo(r.x, r.y)
                                  : a.lineTo(r.x, r.y),
                                0 === t && s.copy(r));
                            break;
                          case "H":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t++)
                              ((r.x = e[t]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "V":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t++)
                              ((r.y = e[t]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "L":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2)
                              ((r.x = e[t + 0]),
                                (r.y = e[t + 1]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "C":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 6)
                              (a.bezierCurveTo(
                                e[t + 0],
                                e[t + 1],
                                e[t + 2],
                                e[t + 3],
                                e[t + 4],
                                e[t + 5],
                              ),
                                (i.x = e[t + 2]),
                                (i.y = e[t + 3]),
                                (r.x = e[t + 4]),
                                (r.y = e[t + 5]),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "S":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 4) {
                              (a.bezierCurveTo(
                                ((p = r.x), p - (i.x - p)),
                                ((f = r.y), f - (i.y - f)),
                                e[t + 0],
                                e[t + 1],
                                e[t + 2],
                                e[t + 3],
                              ),
                                (i.x = e[t + 0]),
                                (i.y = e[t + 1]),
                                (r.x = e[t + 2]),
                                (r.y = e[t + 3]),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "Q":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 4)
                              (a.quadraticCurveTo(
                                e[t + 0],
                                e[t + 1],
                                e[t + 2],
                                e[t + 3],
                              ),
                                (i.x = e[t + 0]),
                                (i.y = e[t + 1]),
                                (r.x = e[t + 2]),
                                (r.y = e[t + 3]),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "T":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2) {
                              let o = ((d = r.x), d - (i.x - d)),
                                n = ((m = r.y), m - (i.y - m));
                              (a.quadraticCurveTo(o, n, e[t + 0], e[t + 1]),
                                (i.x = o),
                                (i.y = n),
                                (r.x = e[t + 0]),
                                (r.y = e[t + 1]),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "A":
                            e = n(x, [3, 4], 7);
                            for (let t = 0, n = e.length; t < n; t += 7) {
                              if (e[t + 5] == r.x && e[t + 6] == r.y) continue;
                              let n = r.clone();
                              ((r.x = e[t + 5]),
                                (r.y = e[t + 6]),
                                (i.x = r.x),
                                (i.y = r.y),
                                o(
                                  a,
                                  e[t],
                                  e[t + 1],
                                  e[t + 2],
                                  e[t + 3],
                                  e[t + 4],
                                  n,
                                  r,
                                ),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "m":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2)
                              ((r.x += e[t + 0]),
                                (r.y += e[t + 1]),
                                (i.x = r.x),
                                (i.y = r.y),
                                0 === t
                                  ? a.moveTo(r.x, r.y)
                                  : a.lineTo(r.x, r.y),
                                0 === t && s.copy(r));
                            break;
                          case "h":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t++)
                              ((r.x += e[t]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "v":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t++)
                              ((r.y += e[t]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "l":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2)
                              ((r.x += e[t + 0]),
                                (r.y += e[t + 1]),
                                (i.x = r.x),
                                (i.y = r.y),
                                a.lineTo(r.x, r.y),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "c":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 6)
                              (a.bezierCurveTo(
                                r.x + e[t + 0],
                                r.y + e[t + 1],
                                r.x + e[t + 2],
                                r.y + e[t + 3],
                                r.x + e[t + 4],
                                r.y + e[t + 5],
                              ),
                                (i.x = r.x + e[t + 2]),
                                (i.y = r.y + e[t + 3]),
                                (r.x += e[t + 4]),
                                (r.y += e[t + 5]),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "s":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 4) {
                              (a.bezierCurveTo(
                                ((S = r.x), S - (i.x - S)),
                                ((g = r.y), g - (i.y - g)),
                                r.x + e[t + 0],
                                r.y + e[t + 1],
                                r.x + e[t + 2],
                                r.y + e[t + 3],
                              ),
                                (i.x = r.x + e[t + 0]),
                                (i.y = r.y + e[t + 1]),
                                (r.x += e[t + 2]),
                                (r.y += e[t + 3]),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "q":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 4)
                              (a.quadraticCurveTo(
                                r.x + e[t + 0],
                                r.y + e[t + 1],
                                r.x + e[t + 2],
                                r.y + e[t + 3],
                              ),
                                (i.x = r.x + e[t + 0]),
                                (i.y = r.y + e[t + 1]),
                                (r.x += e[t + 2]),
                                (r.y += e[t + 3]),
                                0 === t && !0 === u && s.copy(r));
                            break;
                          case "t":
                            e = n(x);
                            for (let t = 0, o = e.length; t < o; t += 2) {
                              let o = ((P = r.x), P - (i.x - P)),
                                n = ((y = r.y), y - (i.y - y));
                              (a.quadraticCurveTo(
                                o,
                                n,
                                r.x + e[t + 0],
                                r.y + e[t + 1],
                              ),
                                (i.x = o),
                                (i.y = n),
                                (r.x = r.x + e[t + 0]),
                                (r.y = r.y + e[t + 1]),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "a":
                            e = n(x, [3, 4], 7);
                            for (let t = 0, n = e.length; t < n; t += 7) {
                              if (0 == e[t + 5] && 0 == e[t + 6]) continue;
                              let n = r.clone();
                              ((r.x += e[t + 5]),
                                (r.y += e[t + 6]),
                                (i.x = r.x),
                                (i.y = r.y),
                                o(
                                  a,
                                  e[t],
                                  e[t + 1],
                                  e[t + 2],
                                  e[t + 3],
                                  e[t + 4],
                                  n,
                                  r,
                                ),
                                0 === t && !0 === u && s.copy(r));
                            }
                            break;
                          case "Z":
                          case "z":
                            ((a.currentPath.autoClose = !0),
                              a.currentPath.curves.length > 0 &&
                                (r.copy(s),
                                a.currentPath.currentPoint.copy(r),
                                (l = !0)));
                            break;
                          default:
                            console.warn(c);
                        }
                        u = !1;
                      }
                      return a;
                    })(r)));
                break;
              case "rect":
                let L, k, E, B, I, O, z;
                ((i = s(r, i)),
                  (L = c((l = r).getAttribute("x") || 0)),
                  (k = c(l.getAttribute("y") || 0)),
                  (E = c(l.getAttribute("rx") || l.getAttribute("ry") || 0)),
                  (B = c(l.getAttribute("ry") || l.getAttribute("rx") || 0)),
                  (I = c(l.getAttribute("width"))),
                  (O = c(l.getAttribute("height"))),
                  (z = new e.ShapePath()).moveTo(L + E, k),
                  z.lineTo(L + I - E, k),
                  (0 !== E || 0 !== B) &&
                    z.bezierCurveTo(
                      L + I - 0.448084975506 * E,
                      k,
                      L + I,
                      k + 0.448084975506 * B,
                      L + I,
                      k + B,
                    ),
                  z.lineTo(L + I, k + O - B),
                  (0 !== E || 0 !== B) &&
                    z.bezierCurveTo(
                      L + I,
                      k + O - 0.448084975506 * B,
                      L + I - 0.448084975506 * E,
                      k + O,
                      L + I - E,
                      k + O,
                    ),
                  z.lineTo(L + E, k + O),
                  (0 !== E || 0 !== B) &&
                    z.bezierCurveTo(
                      L + 0.448084975506 * E,
                      k + O,
                      L,
                      k + O - 0.448084975506 * B,
                      L,
                      k + O - B,
                    ),
                  z.lineTo(L, k + B),
                  (0 !== E || 0 !== B) &&
                    z.bezierCurveTo(
                      L,
                      k + 0.448084975506 * B,
                      L + 0.448084975506 * E,
                      k,
                      L + E,
                      k,
                    ),
                  (R = z));
                break;
              case "polygon":
                let V, _;
                ((i = s(r, i)),
                  (u = r),
                  (V = new e.ShapePath()),
                  (_ = 0),
                  u
                    .getAttribute("points")
                    .replace(
                      /([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,
                      function (t, e, a) {
                        let r = c(e),
                          o = c(a);
                        (0 === _ ? V.moveTo(r, o) : V.lineTo(r, o), _++);
                      },
                    ),
                  (V.currentPath.autoClose = !0),
                  (R = V));
                break;
              case "polyline":
                let U, N;
                ((i = s(r, i)),
                  (A = r),
                  (U = new e.ShapePath()),
                  (N = 0),
                  A.getAttribute("points").replace(
                    /([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,
                    function (t, e, a) {
                      let r = c(e),
                        o = c(a);
                      (0 === N ? U.moveTo(r, o) : U.lineTo(r, o), N++);
                    },
                  ),
                  (U.currentPath.autoClose = !1),
                  (R = U));
                break;
              case "circle":
                let G, X, W, Y, q;
                ((i = s(r, i)),
                  (G = c((M = r).getAttribute("cx") || 0)),
                  (X = c(M.getAttribute("cy") || 0)),
                  (W = c(M.getAttribute("r") || 0)),
                  (Y = new e.Path()).absarc(G, X, W, 0, 2 * Math.PI),
                  (q = new e.ShapePath()).subPaths.push(Y),
                  (R = q));
                break;
              case "ellipse":
                let $, Z, H, j, K, J;
                ((i = s(r, i)),
                  ($ = c((C = r).getAttribute("cx") || 0)),
                  (Z = c(C.getAttribute("cy") || 0)),
                  (H = c(C.getAttribute("rx") || 0)),
                  (j = c(C.getAttribute("ry") || 0)),
                  (K = new e.Path()).absellipse($, Z, H, j, 0, 2 * Math.PI),
                  (J = new e.ShapePath()).subPaths.push(K),
                  (R = J));
                break;
              case "line":
                let Q, tt, te, ta, tr;
                ((i = s(r, i)),
                  (Q = c((T = r).getAttribute("x1") || 0)),
                  (tt = c(T.getAttribute("y1") || 0)),
                  (te = c(T.getAttribute("x2") || 0)),
                  (ta = c(T.getAttribute("y2") || 0)),
                  (tr = new e.ShapePath()).moveTo(Q, tt),
                  tr.lineTo(te, ta),
                  (tr.currentPath.autoClose = !1),
                  (R = tr));
                break;
              case "defs":
                F = !0;
                break;
              case "use":
                i = s(r, i);
                let to = (
                    r.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
                    ""
                  ).substring(1),
                  ti = r.viewportElement.getElementById(to);
                ti
                  ? t(ti, i)
                  : console.warn(
                      "SVGLoader: 'use node' references non-existent node id: " +
                        to,
                    );
            }
            R &&
              (void 0 !== i.fill &&
                "none" !== i.fill &&
                R.color.setStyle(i.fill, a),
              (function (t, a) {
                function r(t) {
                  (b.set(t.x, t.y, 1).applyMatrix3(a), t.set(b.x, b.y));
                }
                let o = t.subPaths;
                for (let t = 0, i = o.length; t < i; t++) {
                  let i = o[t].curves;
                  for (let t = 0; t < i.length; t++) {
                    let o = i[t];
                    o.isLineCurve
                      ? (r(o.v1), r(o.v2))
                      : o.isCubicBezierCurve
                        ? (r(o.v0), r(o.v1), r(o.v2), r(o.v3))
                        : o.isQuadraticBezierCurve
                          ? (r(o.v0), r(o.v1), r(o.v2))
                          : o.isEllipseCurve &&
                            (x.set(o.aX, o.aY),
                            r(x),
                            (o.aX = x.x),
                            (o.aY = x.y),
                            (function (t) {
                              let e = t.elements,
                                a = e[0] * e[3] + e[1] * e[4];
                              return (
                                0 !== a &&
                                Math.abs(a / (p(t) * f(t))) > Number.EPSILON
                              );
                            })(a)
                              ? (function (t) {
                                  let r = t.xRadius,
                                    o = t.yRadius,
                                    i = Math.cos(t.aRotation),
                                    s = Math.sin(t.aRotation),
                                    n = new e.Vector3(r * i, r * s, 0),
                                    l = new e.Vector3(-o * s, o * i, 0),
                                    u = n.applyMatrix3(a),
                                    c = l.applyMatrix3(a),
                                    p = g.set(
                                      u.x,
                                      c.x,
                                      0,
                                      u.y,
                                      c.y,
                                      0,
                                      0,
                                      0,
                                      1,
                                    ),
                                    f = P.copy(p).invert(),
                                    d = y
                                      .copy(f)
                                      .transpose()
                                      .multiply(f).elements,
                                    m = (function (t, e, a) {
                                      let r,
                                        o,
                                        i,
                                        s,
                                        n,
                                        l = t + a,
                                        u = t - a,
                                        c = Math.sqrt(u * u + 4 * e * e);
                                      return (
                                        l > 0
                                          ? (o =
                                              t *
                                                (n = 1 / (r = 0.5 * (l + c))) *
                                                a -
                                              e * n * e)
                                          : l < 0
                                            ? (o = 0.5 * (l - c))
                                            : ((r = 0.5 * c), (o = -0.5 * c)),
                                        Math.abs((i = u > 0 ? u + c : u - c)) >
                                        2 * Math.abs(e)
                                          ? ((s =
                                              1 /
                                              Math.sqrt(
                                                1 + (n = (-2 * e) / i) * n,
                                              )),
                                            (i = n * s))
                                          : 0 === Math.abs(e)
                                            ? ((i = 1), (s = 0))
                                            : ((i =
                                                1 /
                                                Math.sqrt(
                                                  1 + (n = (-0.5 * i) / e) * n,
                                                )),
                                              (s = n * i)),
                                        u > 0 && ((n = i), (i = -s), (s = n)),
                                        { rt1: r, rt2: o, cs: i, sn: s }
                                      );
                                    })(d[0], d[1], d[4]),
                                    S = Math.sqrt(m.rt1),
                                    v = Math.sqrt(m.rt2);
                                  if (
                                    ((t.xRadius = 1 / S),
                                    (t.yRadius = 1 / v),
                                    (t.aRotation = Math.atan2(m.sn, m.cs)),
                                    !(
                                      (t.aEndAngle - t.aStartAngle) %
                                        (2 * Math.PI) <
                                      Number.EPSILON
                                    ))
                                  ) {
                                    let r = P.set(S, 0, 0, 0, v, 0, 0, 0, 1),
                                      o = y.set(
                                        m.cs,
                                        m.sn,
                                        0,
                                        -m.sn,
                                        m.cs,
                                        0,
                                        0,
                                        0,
                                        1,
                                      ),
                                      i = r.multiply(o).multiply(p),
                                      s = (t) => {
                                        let { x: a, y: r } = new e.Vector3(
                                          Math.cos(t),
                                          Math.sin(t),
                                          0,
                                        ).applyMatrix3(i);
                                        return Math.atan2(r, a);
                                      };
                                    ((t.aStartAngle = s(t.aStartAngle)),
                                      (t.aEndAngle = s(t.aEndAngle)),
                                      h(a) && (t.aClockwise = !t.aClockwise));
                                  }
                                })(o)
                              : (function (t) {
                                  let e = p(a),
                                    r = f(a);
                                  ((t.xRadius *= e), (t.yRadius *= r));
                                  let o =
                                    e > Number.EPSILON
                                      ? Math.atan2(a.elements[1], a.elements[0])
                                      : Math.atan2(
                                          -a.elements[3],
                                          a.elements[4],
                                        );
                                  ((t.aRotation += o),
                                    h(a) &&
                                      ((t.aStartAngle *= -1),
                                      (t.aEndAngle *= -1),
                                      (t.aClockwise = !t.aClockwise)));
                                })(o));
                  }
                }
              })(R, w),
              d.push(R),
              (R.userData = { node: r, style: i }));
            let ts = r.childNodes;
            for (let e = 0; e < ts.length; e++) {
              let a = ts[e];
              (F && "style" !== a.nodeName && "defs" !== a.nodeName) || t(a, i);
            }
            D &&
              (S.pop(), S.length > 0 ? w.copy(S[S.length - 1]) : w.identity());
          })(A.documentElement, {
            fill: "#000",
            fillOpacity: 1,
            strokeOpacity: 1,
            strokeWidth: 1,
            strokeLineJoin: "miter",
            strokeLineCap: "butt",
            strokeMiterLimit: 4,
          }),
          { paths: d, xml: A.documentElement }
        );
      }
      static createShapes(t) {
        let a = { loc: 0, t: 0 };
        function r(t, e, r) {
          let o = r.x - e.x,
            i = r.y - e.y,
            s = t.x - e.x,
            n = t.y - e.y,
            l = o * n - s * i;
          if (t.x === e.x && t.y === e.y) {
            ((a.loc = 0), (a.t = 0));
            return;
          }
          if (t.x === r.x && t.y === r.y) {
            ((a.loc = 1), (a.t = 1));
            return;
          }
          if (l < -Number.EPSILON) {
            a.loc = 3;
            return;
          }
          if (l > Number.EPSILON) {
            a.loc = 4;
            return;
          }
          if (o * s < 0 || i * n < 0) {
            a.loc = 5;
            return;
          }
          if (Math.sqrt(o * o + i * i) < Math.sqrt(s * s + n * n)) {
            a.loc = 6;
            return;
          }
          ((a.loc = 2), (a.t = 0 !== o ? s / o : n / i));
        }
        let o = 0x3b9ac9ff,
          i = -0x3b9ac9ff,
          s = t.subPaths.map((t) => {
            let a = t.getPoints(),
              r = -0x3b9ac9ff,
              s = 0x3b9ac9ff,
              n = -0x3b9ac9ff,
              l = 0x3b9ac9ff;
            for (let t = 0; t < a.length; t++) {
              let e = a[t];
              (e.y > r && (r = e.y),
                e.y < s && (s = e.y),
                e.x > n && (n = e.x),
                e.x < l && (l = e.x));
            }
            return (
              i <= n && (i = n + 1),
              o >= l && (o = l - 1),
              {
                curves: t.curves,
                points: a,
                isCW: e.ShapeUtils.isClockWise(a),
                identifier: -1,
                boundingBox: new e.Box2(
                  new e.Vector2(l, s),
                  new e.Vector2(n, r),
                ),
              }
            );
          });
        s = s.filter((t) => t.points.length > 1);
        for (let t = 0; t < s.length; t++) s[t].identifier = t;
        let n = s.map((n) =>
            (function (t, o, i, s, n) {
              var l, u;
              let c, h;
              (null == n || "" === n) && (n = "nonzero");
              let p = new e.Vector2();
              t.boundingBox.getCenter(p);
              let f =
                ((l = [new e.Vector2(i, p.y), new e.Vector2(s, p.y)]),
                (u = t.boundingBox),
                (c = new e.Vector2()),
                u.getCenter(c),
                (h = []),
                o.forEach((t) => {
                  t.boundingBox.containsPoint(c) &&
                    (function (t, o) {
                      let i = [],
                        s = [];
                      for (let n = 1; n < t.length; n++) {
                        let l = t[n - 1],
                          u = t[n];
                        for (let t = 1; t < o.length; t++) {
                          let n = (function (t, e, o, i) {
                            let s = t.x,
                              n = e.x,
                              l = o.x,
                              u = i.x,
                              c = t.y,
                              h = e.y,
                              p = o.y,
                              f = i.y,
                              d = (u - l) * (c - p) - (f - p) * (s - l),
                              m = (f - p) * (n - s) - (u - l) * (h - c),
                              S = d / m,
                              g = ((n - s) * (c - p) - (h - c) * (s - l)) / m;
                            if (
                              (0 === m && 0 !== d) ||
                              S <= 0 ||
                              S >= 1 ||
                              g < 0 ||
                              g > 1
                            )
                              return null;
                            if (0 === d && 0 === m) {
                              for (let l = 0; l < 2; l++) {
                                if ((r(0 === l ? o : i, t, e), 0 == a.loc)) {
                                  let t = 0 === l ? o : i;
                                  return { x: t.x, y: t.y, t: a.t };
                                }
                                if (2 == a.loc)
                                  return {
                                    x: +(s + a.t * (n - s)).toPrecision(10),
                                    y: +(c + a.t * (h - c)).toPrecision(10),
                                    t: a.t,
                                  };
                              }
                              return null;
                            }
                            for (let s = 0; s < 2; s++)
                              if ((r(0 === s ? o : i, t, e), 0 == a.loc)) {
                                let t = 0 === s ? o : i;
                                return { x: t.x, y: t.y, t: a.t };
                              }
                            return {
                              x: +(s + S * (n - s)).toPrecision(10),
                              y: +(c + S * (h - c)).toPrecision(10),
                              t: S,
                            };
                          })(l, u, o[t - 1], o[t]);
                          null !== n &&
                            void 0 ===
                              i.find(
                                (t) =>
                                  t.t <= n.t + Number.EPSILON &&
                                  t.t >= n.t - Number.EPSILON,
                              ) &&
                            (i.push(n), s.push(new e.Vector2(n.x, n.y)));
                        }
                      }
                      return s;
                    })(l, t.points).forEach((e) => {
                      h.push({
                        identifier: t.identifier,
                        isCW: t.isCW,
                        point: e,
                      });
                    });
                }),
                h.sort((t, e) => t.point.x - e.point.x),
                h);
              f.sort((t, e) => t.point.x - e.point.x);
              let d = [],
                m = [];
              f.forEach((e) => {
                e.identifier === t.identifier ? d.push(e) : m.push(e);
              });
              let S = d[0].point.x,
                g = [],
                P = 0;
              for (; P < m.length && m[P].point.x < S;)
                (g.length > 0 && g[g.length - 1] === m[P].identifier
                  ? g.pop()
                  : g.push(m[P].identifier),
                  P++);
              if ((g.push(t.identifier), "evenodd" === n)) {
                let e = g.length % 2 == 0,
                  a = g[g.length - 2];
                return { identifier: t.identifier, isHole: e, for: a };
              }
              if ("nonzero" === n) {
                let e = !0,
                  a = null,
                  r = null;
                for (let t = 0; t < g.length; t++) {
                  let i = g[t];
                  e
                    ? ((r = o[i].isCW), (e = !1), (a = i))
                    : r !== o[i].isCW && ((r = o[i].isCW), (e = !0));
                }
                return { identifier: t.identifier, isHole: e, for: a };
              }
              console.warn(
                'fill-rule: "' + n + '" is currently not implemented.',
              );
            })(n, s, o, i, t.userData ? t.userData.style.fillRule : void 0),
          ),
          l = [];
        return (
          s.forEach((t) => {
            if (!n[t.identifier].isHole) {
              let a = new e.Shape();
              ((a.curves = t.curves),
                n
                  .filter((e) => e.isHole && e.for === t.identifier)
                  .forEach((t) => {
                    let r = s[t.identifier],
                      o = new e.Path();
                    ((o.curves = r.curves), a.holes.push(o));
                  }),
                l.push(a));
            }
          }),
          l
        );
      }
      static getStrokeStyle(t, e, a, r, o) {
        return {
          strokeColor: (e = void 0 !== e ? e : "#000"),
          strokeWidth: (t = void 0 !== t ? t : 1),
          strokeLineJoin: (a = void 0 !== a ? a : "miter"),
          strokeLineCap: (r = void 0 !== r ? r : "butt"),
          strokeMiterLimit: (o = void 0 !== o ? o : 4),
        };
      }
      static pointsToStroke(t, a, o, i) {
        let s = [],
          n = [],
          l = [];
        if (0 === r.pointsToStrokeWithBuffers(t, a, o, i, s, n, l)) return null;
        let u = new e.BufferGeometry();
        return (
          u.setAttribute("position", new e.Float32BufferAttribute(s, 3)),
          u.setAttribute("normal", new e.Float32BufferAttribute(n, 3)),
          u.setAttribute("uv", new e.Float32BufferAttribute(l, 2)),
          u
        );
      }
      static pointsToStrokeWithBuffers(t, a, r, o, i, s, n, l) {
        let u,
          c,
          h,
          p,
          f,
          d = new e.Vector2(),
          m = new e.Vector2(),
          S = new e.Vector2(),
          g = new e.Vector2(),
          P = new e.Vector2(),
          y = new e.Vector2(),
          v = new e.Vector2(),
          x = new e.Vector2(),
          b = new e.Vector2(),
          w = new e.Vector2(),
          A = new e.Vector2(),
          M = new e.Vector2(),
          C = new e.Vector2(),
          T = new e.Vector2(),
          D = new e.Vector2(),
          F = new e.Vector2(),
          R = new e.Vector2();
        ((r = void 0 !== r ? r : 12),
          (o = void 0 !== o ? o : 0.001),
          (l = void 0 !== l ? l : 0));
        let L = (t = (function (t) {
          let e = !1;
          for (let a = 1, r = t.length - 1; a < r; a++)
            if (t[a].distanceTo(t[a + 1]) < o) {
              e = !0;
              break;
            }
          if (!e) return t;
          let a = [];
          a.push(t[0]);
          for (let e = 1, r = t.length - 1; e < r; e++)
            t[e].distanceTo(t[e + 1]) >= o && a.push(t[e]);
          return (a.push(t[t.length - 1]), a);
        })(t)).length;
        if (L < 2) return 0;
        let k = t[0].equals(t[L - 1]),
          E = t[0],
          B = a.strokeWidth / 2,
          I = 1 / (L - 1),
          O = 0,
          z,
          V = !1,
          _ = 0,
          U = 3 * l,
          N = 2 * l;
        (G(t[0], t[1], d).multiplyScalar(B),
          x.copy(t[0]).sub(d),
          b.copy(t[0]).add(d),
          w.copy(x),
          A.copy(b));
        for (let e = 1; e < L; e++) {
          if (
            ((u = t[e]),
            (c = e === L - 1 ? (k ? t[1] : void 0) : t[e + 1]),
            G(E, u, d),
            S.copy(d).multiplyScalar(B),
            M.copy(u).sub(S),
            C.copy(u).add(S),
            (z = O + I),
            (h = !1),
            void 0 !== c)
          ) {
            (G(u, c, m),
              S.copy(m).multiplyScalar(B),
              T.copy(u).sub(S),
              D.copy(u).add(S),
              (p = !0),
              S.subVectors(c, E),
              0 > d.dot(S) && (p = !1),
              1 === e && (V = p),
              S.subVectors(c, u),
              S.normalize());
            let t = Math.abs(d.dot(S));
            if (t > Number.EPSILON) {
              let e = B / t;
              (S.multiplyScalar(-e),
                g.subVectors(u, E),
                P.copy(g).setLength(e).add(S),
                F.copy(P).negate());
              let r = P.length(),
                o = g.length();
              (g.divideScalar(o), y.subVectors(c, u));
              let i = y.length();
              switch (
                (y.divideScalar(i),
                g.dot(F) < o && y.dot(F) < i && (h = !0),
                R.copy(P).add(u),
                F.add(u),
                (f = !1),
                h ? (p ? (D.copy(F), C.copy(F)) : (T.copy(F), M.copy(F))) : Y(),
                a.strokeLineJoin)
              ) {
                case "bevel":
                  q(p, h, z);
                  break;
                case "round":
                  ($(p, h), p ? W(u, M, T, z, 0) : W(u, D, C, z, 1));
                  break;
                default:
                  let s = (B * a.strokeMiterLimit) / r;
                  s < 1
                    ? "miter-clip" !== a.strokeLineJoin
                      ? q(p, h, z)
                      : ($(p, h),
                        p
                          ? (y.subVectors(R, M).multiplyScalar(s).add(M),
                            v.subVectors(R, T).multiplyScalar(s).add(T),
                            X(M, z, 0),
                            X(y, z, 0),
                            X(u, z, 0.5),
                            X(u, z, 0.5),
                            X(y, z, 0),
                            X(v, z, 0),
                            X(u, z, 0.5),
                            X(v, z, 0),
                            X(T, z, 0))
                          : (y.subVectors(R, C).multiplyScalar(s).add(C),
                            v.subVectors(R, D).multiplyScalar(s).add(D),
                            X(C, z, 1),
                            X(y, z, 1),
                            X(u, z, 0.5),
                            X(u, z, 0.5),
                            X(y, z, 1),
                            X(v, z, 1),
                            X(u, z, 0.5),
                            X(v, z, 1),
                            X(D, z, 1)))
                    : (h
                        ? (p
                            ? (X(b, O, 1),
                              X(x, O, 0),
                              X(R, z, 0),
                              X(b, O, 1),
                              X(R, z, 0),
                              X(F, z, 1))
                            : (X(b, O, 1),
                              X(x, O, 0),
                              X(R, z, 1),
                              X(x, O, 0),
                              X(F, z, 0),
                              X(R, z, 1)),
                          p ? T.copy(R) : D.copy(R))
                        : p
                          ? (X(M, z, 0),
                            X(R, z, 0),
                            X(u, z, 0.5),
                            X(u, z, 0.5),
                            X(R, z, 0),
                            X(T, z, 0))
                          : (X(C, z, 1),
                            X(R, z, 1),
                            X(u, z, 0.5),
                            X(u, z, 0.5),
                            X(R, z, 1),
                            X(D, z, 1)),
                      (f = !0));
              }
            } else Y();
          } else Y();
          (k || e !== L - 1 || Z(t[0], w, A, p, !0, O),
            (O = z),
            (E = u),
            x.copy(T),
            b.copy(D));
        }
        if (k) {
          if (h && i) {
            let t = R,
              e = F;
            (V !== p && ((t = F), (e = R)),
              p
                ? (f || V) &&
                  (e.toArray(i, 0), e.toArray(i, 9), f && t.toArray(i, 3))
                : (f || !V) &&
                  (e.toArray(i, 3), e.toArray(i, 9), f && t.toArray(i, 0)));
          }
        } else Z(u, M, C, p, !1, z);
        return _;
        function G(t, e, a) {
          return (a.subVectors(e, t), a.set(-a.y, a.x).normalize());
        }
        function X(t, e, a) {
          (i &&
            ((i[U] = t.x),
            (i[U + 1] = t.y),
            (i[U + 2] = 0),
            s && ((s[U] = 0), (s[U + 1] = 0), (s[U + 2] = 1)),
            (U += 3),
            n && ((n[N] = e), (n[N + 1] = a), (N += 2))),
            (_ += 3));
        }
        function W(t, e, a, o, i) {
          (d.copy(e).sub(t).normalize(), m.copy(a).sub(t).normalize());
          let s = Math.PI,
            n = d.dot(m);
          (1 > Math.abs(n) && (s = Math.abs(Math.acos(n))),
            (s /= r),
            S.copy(e));
          for (let e = 0, a = r - 1; e < a; e++)
            (g.copy(S).rotateAround(t, s),
              X(S, o, i),
              X(g, o, i),
              X(t, o, 0.5),
              S.copy(g));
          (X(g, o, i), X(a, o, i), X(t, o, 0.5));
        }
        function Y() {
          (X(b, O, 1),
            X(x, O, 0),
            X(M, z, 0),
            X(b, O, 1),
            X(M, z, 0),
            X(C, z, 1));
        }
        function q(t, e, a) {
          e
            ? t
              ? (X(b, O, 1),
                X(x, O, 0),
                X(M, z, 0),
                X(b, O, 1),
                X(M, z, 0),
                X(F, z, 1),
                X(M, a, 0),
                X(T, a, 0),
                X(F, a, 0.5))
              : (X(b, O, 1),
                X(x, O, 0),
                X(C, z, 1),
                X(x, O, 0),
                X(F, z, 0),
                X(C, z, 1),
                X(C, a, 1),
                X(F, a, 0),
                X(D, a, 1))
            : (t ? (X(M, a, 0), X(T, a, 0)) : (X(C, a, 1), X(D, a, 0)),
              X(u, a, 0.5));
        }
        function $(t, e) {
          e &&
            (t
              ? (X(b, O, 1),
                X(x, O, 0),
                X(M, z, 0),
                X(b, O, 1),
                X(M, z, 0),
                X(F, z, 1),
                X(M, O, 0),
                X(u, z, 0.5),
                X(F, z, 1),
                X(u, z, 0.5),
                X(T, O, 0),
                X(F, z, 1))
              : (X(b, O, 1),
                X(x, O, 0),
                X(C, z, 1),
                X(x, O, 0),
                X(F, z, 0),
                X(C, z, 1),
                X(C, O, 1),
                X(F, z, 0),
                X(u, z, 0.5),
                X(u, z, 0.5),
                X(F, z, 0),
                X(D, O, 1)));
        }
        function Z(t, e, r, o, s, l) {
          switch (a.strokeLineCap) {
            case "round":
              s ? W(t, r, e, l, 0.5) : W(t, e, r, l, 0.5);
              break;
            case "square":
              if (s)
                (d.subVectors(e, t),
                  m.set(d.y, -d.x),
                  S.addVectors(d, m).add(t),
                  g.subVectors(m, d).add(t),
                  o
                    ? (S.toArray(i, 3), g.toArray(i, 0), g.toArray(i, 9))
                    : (S.toArray(i, 3),
                      1 === n[7] ? g.toArray(i, 9) : S.toArray(i, 9),
                      g.toArray(i, 0)));
              else {
                (d.subVectors(r, t),
                  m.set(d.y, -d.x),
                  S.addVectors(d, m).add(t),
                  g.subVectors(m, d).add(t));
                let e = i.length;
                (o
                  ? (S.toArray(i, e - 3), g.toArray(i, e - 6))
                  : (g.toArray(i, e - 6), S.toArray(i, e - 3)),
                  g.toArray(i, e - 12));
              }
          }
        }
      }
    }
    t.s(["SVGLoader", 0, r], 63295);
    let o = [
        {
          id: "astra",
          label: "Astra",
          colors: ["#6DCBF4", "#7AB1FE", "#F87915", "#FA994C", "#F5F6FB"],
        },
        {
          id: "aurora",
          label: "Aurora",
          colors: ["#47E2C2", "#6DCBF4", "#B06DFF", "#E96AC8", "#F5F6FB"],
        },
        {
          id: "ember",
          label: "Ember",
          colors: ["#F7CB59", "#FA994C", "#F67576", "#B06DFF", "#F5F6FB"],
        },
      ],
      i = "astra",
      s = new Map(
        o.map(({ id: t, colors: a }) => [t, a.map((t) => new e.Color(t))]),
      ),
      n = new e.Color(1, 1, 1),
      l = new Map();
    (t.s(
      [
        "SECONDARY_COLOR_SEEDS",
        0,
        [0.08, 0.58, 0.22, 0.68, 0.44],
        "writeStarColor",
        0,
        function (t, a, r, u, c = i, h) {
          let p = (function (t, a, r = i, u) {
            if (!t) return n;
            let c = (function (t, a) {
              let r = s.get(t) ?? s.get(i);
              if (!r) throw Error("The default Astra star palette is missing");
              if (!a) return r;
              let n = (o.find((e) => e.id === t)?.colors ?? o[0].colors).map(
                  (t, e) => a[e] || t,
                ),
                u = n.join(","),
                c = l.get(u);
              if (c) return (l.delete(u), l.set(u, c), c);
              let h = n.map((t) => new e.Color(t));
              if (l.size >= 32) {
                let t = l.keys().next().value;
                void 0 !== t && l.delete(t);
              }
              return (l.set(u, h), h);
            })(r, u);
            return a < 0.36
              ? c[0]
              : a < 0.52
                ? c[1]
                : a < 0.64
                  ? c[2]
                  : a < 0.74
                    ? c[3]
                    : c[4];
          })(r, u, c, h);
          ((t[a] = p.r), (t[a + 1] = p.g), (t[a + 2] = p.b));
        },
      ],
      396522,
    ),
      t.s(
        [
          "ASTRA_PARTICLE_OPACITY_REVEAL_END",
          0,
          0.2,
          "getAstraParticleRevealProgress",
          0,
          function (t, a) {
            let r = Number.isFinite(t) ? e.MathUtils.clamp(t, 0, 1) : 0,
              o = 0.015 * (Number.isFinite(a) ? e.MathUtils.clamp(a, 0, 1) : 0);
            return (
              e.MathUtils.smoothstep(r, o, 0.14 + o) *
              e.MathUtils.lerp(0.2, 1, e.MathUtils.smoothstep(r, 0.2, 1))
            );
          },
        ],
        642671,
      ));
  };
