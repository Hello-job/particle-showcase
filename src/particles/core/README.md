# Particle rendering core

This directory is a readable TypeScript reconstruction of the particle modules served by the [OpenAI GPT-6 Astra page](https://openai.com/index/gpt-6-astra/), retrieved on 2026-09-05, plus the local brand-shape extensions. It uses ordinary ES module imports and explicit data structures. It is not the author's original TypeScript source and does not recover names or comments lost during compilation.

The compiled implementation is preserved in Git at `typescript-showcase-v1` (`85663be`). It is not a runtime dependency of this directory. Source reconstruction and attribution do not change the original code's licensing status; see the repository's `THIRD_PARTY_NOTICES.md` and `LICENSE.md`.

## Reading order

1. **`config.ts`** normalizes scene settings and interpolates between scroll cues. Start here to see the defaults and the types passed to the engine.
2. **`geometry.ts`** provides SVG parsing, star palettes and particle reveal helpers.
3. **`field.ts`** creates the seeded particle distribution, geometry, materials and path textures. The generated field holds GPU buffers and the CPU data used for tracked highlights.
4. **`motion.ts`** contains the small movement formulas shared by animation and shaders: introduction, idle drift and pointer settling.
5. **`animation.ts`** advances time, rotation, scrolling and pointer state, then writes the material uniforms.
6. **`renderer.ts`** owns the Three.js scene and camera, postprocessing, frame rendering and resource disposal.

`runtime-defaults.ts`, `runtime-config.ts`, `scene-defaults.ts` and `keyframes.ts` support the public configuration entry. `field-materials.ts` creates typed uniforms and materials; `shaders/field.ts` contains the point shaders. `simulation/ParticleSimulation.ts` computes pointer displacement in GPU textures. The `postprocessing/` directory contains bloom, lens flares, optical noise and their shaders.

React enters through `../engine/index.ts`. The DOM coordinator in `../engine/coordinator.ts` measures invisible SVG targets, samples their paths, and passes pointer and scroll input into this core. Brand geometry is maintained separately in `../shapes/`.

## What was in the extracted modules?

The previous directory contained the particle dependency graph, not an entire copy of the website. Its responsibilities included particle generation, motion, configuration, WebGL rendering, bloom, lens flares and a general SVG parser. The numeric module registry was packaging infrastructure, not an effect. The SVG parser was duplicated library functionality. The reconstruction removes the registry and uses the SVGLoader provided by the pinned Three.js dependency.

Shader strings are **GLSL**, the program executed on the GPU. Keeping GLSL inside a TypeScript shader module is intentional: it is source code for a different processor, not leftover compiled JavaScript. Shader formulas, CPU equivalents and sampling order must remain aligned.

## Source provenance

The original modules were served under `https://openai.com/_next/static/immutable/chunks/`:

| Current responsibility                                  | Public chunk                           | Module IDs in the compiled baseline                  |
| ------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Rendering and postprocessing                            | `1uq8b6yni-tzr.js`                     | 947344                                               |
| Particle field, palette, SVG parsing and motion helpers | `1rfzm7jt1igp4.js`                     | 861045, 63295, 396522, 642671, 384051, 83007, 471772 |
| Animation state and frame updates                       | `0kyg3mclnp-m6.js`                     | 324944                                               |
| Default configuration and original shape data           | `28nbglk5oli9p.js`                     | 170825, 59820, 651217, 333074                        |
| Cue interpolation and DOM coordination reference        | `0xnf_9ewj1sr3.js`                     | 682025, 330592, 777124, 9259                         |
| Device profile reference                                | `23fu5ny4982ec.js`                     | 215453                                               |
| Canvas lifecycle and pointer reference                  | `2jgpexr4u1zu_.js`                     | 328679                                               |
| Original Three.js core / WebGLRenderer                  | `0dfpqjin6t4po.js`, `1a43l2lhrwu30.js` | 695418, 361489                                       |
| Original postprocessing dependency                      | `0xhsyls0qftqy.js`                     | 409703                                               |

The original canvas declared Three.js r180. The local dependency is `three@0.180.0`; the compatible local postprocessing package is `postprocessing@6.39.4`. The public postprocessing bundle did not disclose its package version. Dependencies retain their own licenses and are installed through the pinned pnpm version and `pnpm-lock.yaml`.

## Preserved effect settings

- Random seed 27, 12,000 base particles and density multiplier 4.
- Palette `#6DCBF4`, `#7AB1FE`, `#F87915`, `#FA994C`, `#F5F6FB`.
- Introduction duration 5.5 seconds; scroll dispersion distance 800 pixels.
- Bloom intensity 0.7, threshold 0.08 and lens flare intensity 0.28.
- Pointer radius 176 pixels, displacement 52 pixels, pressed multiplier 2.2, spring 7 and return spring 2.8.
- Original 1,024-point contour sampling for cursor and knot; custom filled sampling remains in `../shapes/filled-sampler.ts`.
- Tier 3 requests 40,000 maximum particles, 16 shader samples and full postprocessing. The renderer caps pixel ratio at 1.5 and applies a 2.4-million-pixel framebuffer budget.

The DeepSeek titlecase extension, Kimi accent and filled-logo sampling remain local additions. The custom `DeepSeek` wordmark is not the official logotype. Original Astra parameters remain the defaults for ordinary source shapes.

Changing names and types must not change the random call order, geometry, shader equations or input handling. Verify numerical behavior against the fixed baseline and inspect actual desktop and narrow-screen rendering after changes. Different GPUs and display ratios can still produce rendering differences.
