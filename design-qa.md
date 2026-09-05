# Astra particle reproduction — visual QA

final result: passed

Source: https://openai.com/index/gpt-6-astra/
Implementation: http://localhost:4173/

Scope: reproduce the original interactive particle scene and its three shapes in a compact demonstration. The full announcement article, video, charts and site-wide navigation menus are outside this particle-focused implementation. Scroll transitions use the original equations; later shape sections are intentionally closer together.

## Evidence and normalization

All screenshots are under `/Users/admin/Documents/ChatGPT/landing-page/reference/`.

| State | Source visual truth | Implementation screenshot |
|---|---|---|
| Desktop, settled hero, scroll 0 | source-desktop.png | implementation-desktop.png |
| Desktop, initial scroll transition | source-scroll.png | implementation-scroll.png |
| Desktop, settled cursor | source-cursor-stable.png | implementation-cursor.png |
| Desktop, OpenAI blossom | source-knot.png | implementation-knot.png |
| Mobile, settled hero | source-mobile.png | implementation-mobile.png |
| Particle detail | source-particle-detail.png | implementation-particle-detail.png |

Desktop CSS viewport: 1440 × 900. Source and implementation screenshot output: 1425 × 891, normalized identically by the browser tool. Canvas CSS width: 1425 due to the vertical scrollbar. Mobile CSS viewport: 390 × 844; both screenshot outputs: 375 × 812. No independent image stretching or density correction was applied. Detail captures: 590 × 550 at the same viewport position.

Source and implementation were emitted together in each comparison input. Both full compositions and magnified particle regions were examined. Brightness and individual particle locations change continuously; captures have different elapsed animation times and do not constitute a synchronized, pixel-exact comparison. Cursor cue tops were 71.33 vs 73.68 CSS px; blossom tops were 89.76 vs 91.68 CSS px. Those tiny sampling differences are expected from manual browser scrolling.

## Comparison history and fixes

1. Desktop viewport mismatch: initial local preview used the browser's default size. Both views were aligned to 1440 × 900 before judging; the corrected desktop evidence is recorded above.
2. [P1, fixed] Initial scatter timing was early because the local title started at document Y=900 while the source title starts at Y=1172. Restored the source desktop hero offset of 152 px, 120 px section gap, and independent heading wrapper. Removed the extra title padding. Post-fix `implementation-scroll.png` reproduces the tilted spiral and title placement at scroll Y=585. Mobile uses the original 56 px header + 40 px article offset and 80 px section gap.
3. [P1, fixed] All three rotation buttons now receive pointer/keyboard handlers, rather than only the hero. Cursor drag focus and release state were verified in browser; ArrowRight and ArrowDown do not scroll the page.
4. [P2, fixed] Both hero labels and replay now receive the source fade/visibility behavior and remain fixed to the viewport. At scroll Y=585 all three report opacity 0 and visibility hidden; top and mobile captures show correct label positions.
5. [P2, fixed] Original search/sidebar/replay/arrow assets and navigation URLs replaced incomplete shell details. The visible header was checked in final desktop/mobile captures.
6. Added the original ordinary scroll cue after the cursor so its release transition can settle before the next shape.

## Required fidelity surfaces

- Typography: original local OpenAI Sans regular and medium; source clamp sizes, tracking, label entrance delays and layout. Desktop and mobile label size/placement match the source views.
- Spacing/layout: hero, fixed chrome, title anchor and source shape dimensions verified. Each shape is fitted to its SVG viewBox, up to 576 px wide and 80% viewport height. No mobile horizontal overflow: scrollWidth and clientWidth both 375 px.
- Color/tokens: original white/blue/orange particles, shader glow, bloom, seed, grain, ambient plus-lighter gradient and radial vignette. Detail comparisons show the same star cores and halo character.
- Assets/image quality: original particle geometry, GLSL, SVG paths, font files, wordmark and header icons are local. No static screenshot replaces the running scene; canvas status is ready and Three.js renders it. Original poster is available as the WebGL fallback.
- Copy/content: GPT / Astra and introduction heading match. Page body intentionally contains only the introduction sentence, two shape sections and source/back-to-top links. Mobile menu provides direct access to the three shapes.

## Interaction and runtime checks

- Intro convergence and replay: replay-start capture shows the reset field; replay-end capture shows the completed spiral.
- Scroll: spiral tilt/scatter, cursor attraction and release, blossom attraction, forward/backward scrolling all exercised.
- Cursor drag and release exercised; controls regain non-dragging state and rendering stays ready. Keyboard rotation handlers consume arrow keys without moving scroll position.
- Mouse repulsion and press amplification use the original input and shader implementation. Physical touch hardware was not available; responsive rendering and pointer behavior were checked through desktop Chrome at phone dimensions.
- Mobile menu opens/closes, Cursor anchor changes URL and scroll position, Back to top returns to the hero.
- Resizing between desktop and mobile keeps the renderer ready.
- Browser console: no warnings or errors after interaction checks.
- Production build passes. The expected bundle-size advisory remains for the Three.js/postprocessing engine; it does not block execution.

## Residual limits

No actionable P0/P1/P2 visual findings remain within the particle-demo scope. Native iOS Safari dynamic toolbar/pinch stabilization has not been device-tested; the adapter follows standard visualViewport updates. Animation snapshots are not frame-synchronized, so a literal 100% pixel-fidelity claim is not made. Full site/article parity is not claimed.
