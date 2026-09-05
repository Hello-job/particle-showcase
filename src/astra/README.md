# Astra particle scene

This is a local port of the public particle renderer delivered by OpenAI's [GPT-6 Astra launch page](https://openai.com/index/gpt-6-astra/), retrieved on 2026-09-05. The renderer is procedural WebGL, not a video or a background screenshot.

The original shader source, point generation, seeded randomness, spline geometry, palette, pointer physics, optical postprocessing and animation math are retained in the extracted modules. `engine.js` is a small module adapter that replaces the original site's bundler and supplies the installed `three` and `postprocessing` packages. No requests to the original website are made at runtime.

## Public source provenance

All files below were served under `https://openai.com/_next/static/immutable/chunks/`:

| Local implementation | Original public chunk | Original modules |
| --- | --- | --- |
| `renderer.js` | `1uq8b6yni-tzr.js` | 947344 |
| `field.js`, `geometry.js`, `particle-motion.js`, `intro-motion.js`, `ambient-motion.js` | `1rfzm7jt1igp4.js` | 861045, 63295, 396522, 642671, 384051, 83007, 471772 |
| `animation.js` | `0kyg3mclnp-m6.js` | 324944 |
| `defaults.js`, `shapes.js` | `28nbglk5oli9p.js` | 170825, 59820, 651217, 333074 |
| `configuration.js`, DOM coordination reference | `0xnf_9ewj1sr3.js` | 682025, 330592, 777124, 9259 |
| `profile.js` | `23fu5ny4982ec.js` | 215453 |
| Canvas lifecycle and pointer event reference | `2jgpexr4u1zu_.js` | 328679 |
| Original Three.js core / WebGLRenderer | `0dfpqjin6t4po.js`, `1a43l2lhrwu30.js` | 695418, 361489 |
| Original postprocessing dependency | `0xhsyls0qftqy.js` | 409703 |

The original live canvas declares Three.js r180. The tier 3 profile is preserved: 40,000 maximum particles, 16 shader samples, full postprocessing, DPR range [1, 2], hardware antialiasing disabled. The renderer itself caps DPR at 1.5 and applies a 2.4-million-pixel framebuffer budget. The local dependency is Three.js 0.180.0. The compiled public postprocessing bundle does not expose its package version; the compatible local package is 6.39.4.

The launch page's actual hero configuration overrides only the headline, description and poster index. The visual engine uses its defaults. The cursor and blossom cues specify `shapeHeightVh: 80`, `maxWidth: 576`, smoothstep easing, autoplay, dispersion 1 and flow speed 0.8.

## Defaults retained from the source

- Seed 27, 12,000 base particles, density multiplier 4; palette `#6DCBF4`, `#7AB1FE`, `#F87915`, `#FA994C`, `#F5F6FB`.
- Converge and tilt introduction: 5.5 seconds. Scroll dispersion distance: 800 pixels.
- Bloom intensity 0.7, threshold 0.08, procedural optical dirt, flare intensity 0.28.
- Pointer radius 176 pixels, displacement 52 pixels, pressed multiplier 2.2, spring 7, return spring 2.8.
- Original 1024-point SVG path sampling for the cursor and OpenAI blossom.

## Integration

Import `createAstraScene` from `index.js` for the DOM lifecycle. Lower-level original APIs are exported from `engine.js`: `createAstraRenderer`, `createAstraAnimationState`, `updateAstraAnimation`, `resolveHeroLayout`, `resolveAstraRendererConfig`, and the shape SVG data.

The mathematical effect is preserved, while the page layout and DOM lifecycle are adapted to this standalone site. Device performance, display pixel ratio, antialiasing and browser rendering can produce small visual differences. Reduced motion renders a stable scene and WebGL failure can use the local poster fallback.

## DeepSeek variation

`custom-shapes.js` adds the exact whale paths from https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg. Four separate SVG subpaths preserve the body, mouth and eye details without connecting pen-up segments. `heroShape` opts into the opening path destination; original Astra behavior is preserved when omitted. The pre-customization source is tagged `astra-original-v1`.
