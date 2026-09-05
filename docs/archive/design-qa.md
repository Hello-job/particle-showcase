# Historical visual verification

Archived checks for the JavaScript showcase through `shorter-scroll-v1`. These entries describe the code and screenshots at each historical snapshot; they are not a TypeScript migration test report. Screenshot paths are relative to the repository root.

---

# Shorter middle scroll spacing — latest archived verification

final result: passed

The shared constellation interlude is reduced from 45svh to 20svh. Model-title bottom padding is reduced from 104px to 64px on desktop and from 56px to 40px on mobile. Particle geometry, input handlers and scroll-cue equations are unchanged.

- Desktop browser check, CSS 1440 × 900: interlude is 180px, and the page is 265px shorter. DeepSeek's final wordmark remains complete; Astra's cursor, release and OpenAI knot stages still appear in order.
- Phone browser check, CSS 360 × 780: interlude is 156px and title bottom padding is 40px, shortening the page by 211px. DeepSeek's final wordmark fits fully; document clientWidth and scrollWidth both remain 345px.
- Renderers remain ready. Browser logs contain no warnings or errors. Production build and whitespace checks passed; the existing bundle-size advisory remains.
- Independent review confirmed the measured scroll anchors remain ordered, and the release cue precedes the final-shape center. No animation-engine change is needed.

No actionable findings remain for this spacing adjustment. Saved separately as `shorter-scroll-v1`; `showcase-polish-v1` preserves the preceding layout. Prior physical-device test limits remain below.

---

# Hint removal, DeepSeek casing and shared tabs — prior verification

final result: passed

User corrections: remove the Move/Drag/Scroll hint; use `DeepSeek` with uppercase D/S; make the top-right tabs consistent. All four modes now have a model-name-only introduction. Header and bottom particle lettering both use DeepSeek; the official whale is retained.

- Fixed the inconsistent switch: Kimi/GLM had separate desktop font, padding and header-height overrides. A common desktop rule now positions every switch at the same coordinates, with four equal-width cells.
- Desktop browser check, CSS 1440 × 900: each mode's switch is 400 × 48 at x=989, y=32; each cell is 94.5 × 38. All four links were clicked and all four modes measured.
- Phone browser check, CSS 360 × 780: every switch is 220 × 34 and every cell is 52 × 28. Cell clientWidth/scrollWidth values are all 52; document clientWidth/scrollWidth are both 345. No hint text remains in any mode.
- Visual evidence: `docs/reference/deepseek-titlecase-desktop.jpg` (1425 × 891) and `docs/reference/deepseek-titlecase-mobile.jpg` (345 × 748), browser-proportional outputs. D and S read as capitals, D's counter remains open, letters fit without clipping, and the header uses the same casing.
- The new custom titlecase artwork preserves official lowercase e/e/p/e/e/k by translation and adds genuine local OpenAI Sans Medium D/S glyphs aligned to the original k. Ten independent contours preserve counters in the existing particle sampler. Original lowercase assets and earlier tags remain available.
- JS import, contour count, SVG XML and visual asset checks passed. Desktop/phone rendering remained ready; all version switches worked. Final browser logs contain no warnings or errors. Production build and whitespace checks passed; the existing bundle-size advisory remains.

No actionable visual findings remain for these three corrections. This update is saved separately as `showcase-polish-v1`; `model-titles-v1` preserves the preceding version. Prior particle interaction and physical-device test limits remain below.

---

# Model-name copy — prior verification

final result: passed

Approved text replaces the introduction headline in each mode with GPT-6 Astra, DeepSeek-V4-Pro, Kimi K3 or GLM-5.3. The former marketing sentence is replaced by the subtle hint `Move · Drag · Scroll`. Browser title and accessible page heading also use the model name. Model names were verified from official sources on 2026-09-06, as recorded in README.md; updates are manual.

- Desktop evidence: `docs/reference/model-title-kimi-desktop.jpg`, CSS viewport 1440 × 900, output 1425 × 891. The name is large, centered, and separated from the small gray hint by 24 px.
- Phone evidence: `docs/reference/model-title-deepseek-mobile.jpg`, CSS viewport 360 × 780, output 345 × 748. DeepSeek-V4-Pro is the longest name; it fits one line at 28 px. Document clientWidth/scrollWidth both equal 345, and heading clientWidth/scrollWidth both equal 297. Hint gap is 20 px.
- Fixed a layout issue during this edit: the existing independent heading parallax could cross the newly adjacent hint. The heading and hint now share one moving wrapper, preserving their spacing throughout scrolling. Bottom section padding preserves breathing room after the compact copy block.
- All four version links and their displayed model/hint strings were checked in the browser. Renderers remained ready. Final browser checks found no new runtime errors.
- Production build and whitespace checks passed. Existing bundle-size advisory remains. No particle-engine, brand geometry, or input-handler files changed.

No actionable visual findings remain in this copy/layout update. Existing particle QA and device-test limits are retained below. The earlier four-brand version remains at `kimi-glm-v1`; this update is saved separately as `model-titles-v1`.

---

# Kimi / GLM particle showcases — prior verification

final result: passed

Scope: implement the approved hero and bottom concepts as real interactive particles. Kimi forms the official K with detached blue droplet, then the complete KIMI wordmark; GLM forms uppercase lettering, then the official three-piece Z.ai emblem without its square. Four working version links remain at top right, brand logo at top left, and new modes have only Back to top in their footer.

## Visual evidence and normalization

- Selected hero: `docs/reference/kimi-glm-hero-selected.png`; selected bottom: `docs/reference/kimi-glm-bottom-selected.png`. Both are 2103 × 748 paired images, interpreted as two side-by-side 1440 × 1024 desktop compositions.
- Desktop captures use CSS viewport 1440 × 1024. Browser output is 1425 × 1013 after scrollbar exclusion and proportional output scaling. Compare each half of the selected source proportionally; no image stretching or density correction was applied.
- Phone captures use CSS viewport 390 × 844 and output 375 × 812. They are responsive adaptations of the approved desktop concept.

| State | Kimi evidence | GLM evidence |
| --- | --- | --- |
| Settled desktop hero | `docs/reference/kimi-hero-desktop.jpg` | `docs/reference/glm-hero-desktop.jpg` |
| Final desktop constellation | `docs/reference/kimi-bottom-desktop.jpg` | `docs/reference/glm-bottom-desktop.jpg` |
| Phone hero | `docs/reference/kimi-hero-mobile.jpg` | `docs/reference/glm-hero-mobile.jpg` |
| Phone final constellation | `docs/reference/kimi-bottom-mobile.jpg` | `docs/reference/glm-bottom-mobile.jpg` |

Each selected source and corresponding final desktop browser capture were opened together in the same comparison input. Full views show centered uncropped silhouettes, sparse surrounding stars and the four-choice header. The large, legible captures also resolve the detached droplet, G aperture, M interior and the two gaps between Z pieces; separate close crops were not necessary. Desktop bottom scroll Y=2194.5, phone bottom Y=1762.5. Back to top restores the hero at its document anchor, Y=152 desktop / Y=96 phone.

## Findings and completed fixes

1. [P2, fixed] First interior sampling showed horizontal particle bands and tangent reversal could make offsets jump. Stable per-particle half-row jitter and a fixed filled-route normal remove the banding and keep retraced motion continuous. Final hero and bottom captures show natural distributions.
2. [P2, fixed] Bright white centers washed out the Kimi accent. Corrected the accent's texture-index boundary and reduced white-core mixing for that range. Final Kimi hero has a clearly separate blue droplet.
3. [P2, fixed] Bright sprites dominated while fine stars left the lettering sparse. Filled modes now preserve stroke endpoints, reduce oversized bright sprites, increase fine-point visibility, and scale points and tracked flares with phone width. Existing contour modes keep neutral defaults.
4. [P2, fixed] Initial header/replay sizing and ambient glow differed from the approved composition. New desktop modes use larger brand marks and controls with more top spacing, a 52 px replay control, and a darker surround. Final captures retain the established minimal header anatomy.

No actionable P0/P1/P2 findings remain.

## Fidelity surfaces

- Typography: local OpenAI Sans controls, exact official KIMI path lettering, and local OpenAI Sans Medium outlined GLM with explicit tracking. No missing glyphs, fallback flashes, wrapping or truncation observed. The GLM type treatment is a concept wordmark, not a claim of official GLM artwork.
- Layout: K hero height constrained for desktop, broad GLM/KIMI lettering, centered final Z, proportional viewBox fitting and independent pieces. Four links and logo fit on phone; document clientWidth and scrollWidth both equal 375.
- Color: near-black surround, white/ice-blue/occasional amber particles, blue droplet, translucent active switch. The live bloom and seeded points naturally vary across animation frames.
- Assets: official Moonshot K/KIMI and official Z.ai paths are local and unaltered in silhouette; only the Z square was removed. Hidden SVG geometry is sampled into the moving WebGL stars. No solid brand loading poster exists in the custom modes.
- Content: correct brand title, active version, drag/replay labels, retained scroll instructions and Back to top. No full navigation or extra page flows were added.

## Interaction and runtime verification

- Exercised all four version links; active state and page title match. Kimi and GLM renderers report ready.
- Desktop forward scrolling forms each final wordmark/emblem; returning to top restores each hero. Drag/release exercised on GLM hero and KIMI bottom; drag flags reset to false and renderer remains ready.
- Kimi replay clears the field and reforms K plus blue droplet. Desktop/phone resizing preserves rendering and control visibility.
- Original-mode regression captures: `docs/reference/astra-four-version-regression.jpg` and `docs/reference/deepseek-four-version-regression.jpg`. Astra still shows its spiral with cursor/knot cues; DeepSeek still shows the whale, wordmark-only final cue, and zero solid posters. Independent engine review checked neutral original defaults and matching CPU/GPU filled offsets.
- Sampler checks cover deterministic 1024-point allocation, finite values, closed independent routes, holes/detached gaps, accent indexing, cache reuse and invalidation. Syntax checks and production build passed; the existing large-bundle advisory remains.
- Console checked after final reloads and navigation. No new runtime or shader errors occurred. The log retains one earlier development hot-reload warning from changing the length of an effect dependency array; it did not recur after full reload and the current dependency array is stable.

## Follow-up polish and limits

Individual particle brightness, point placement and the precise local GLM font weight differ from the generated still. These remain an interactive adaptation; no pixel-identical still-image claim is made. Physical iOS touch, reduced-motion devices and forced WebGL loss were not newly device-tested. Existing keyboard handlers are unchanged; this pass focused on mouse/drag/scroll/replay and responsive rendering.

The pre-change two-brand version is preserved at `two-brand-showcase-v1` (9974c46); the four-brand version is saved separately as `kimi-glm-v1`. Existing original and DeepSeek tags are unchanged.

---

# Minimal shared header — prior verification

final result: passed

User correction: retain both brand logos. Both variants now show the original logo at top left and the same version switch at top right. Removed Astra navigation links, search, login/ChatGPT buttons, mobile menu and the old bottom-left version link. The header stays transparent while scrolling. Particle geometry, animation, hero spacing and scroll cues were not edited.

- Desktop Astra evidence: `docs/reference/astra-simple-header.png`, CSS 1440 × 900, screenshot 1425 × 891. Logo left, switch right; no remaining navigation buttons.
- Mobile DeepSeek evidence: `docs/reference/deepseek-simple-header-mobile.png`, CSS 390 × 844, screenshot 375 × 812. Logo and switch fit without overflow.
- Both version links exercised, active version correctly marked, renderer ready, browser console free of warnings/errors.
- Production build and whitespace checks passed. Existing bundle-size advisory remains.
- Previous particle and wordmark validation is retained below. No particle code changed in this iteration.

---

# DeepSeek bottom wordmark — prior QA

final result: passed

Scope: selected generated option 1 becomes the final particle section at the bottom; remove the intermediate cursor in DeepSeek mode and remove the initial solid whale loading image. Keep the animated whale hero and separately recoverable Astra version.

## Visual evidence and normalization

- Selected source: `docs/reference/deepseek-wordmark-selected.png`, 1586 × 992 generated visual intended as a 1440 × 900 desktop viewport.
- Official letter geometry: `public/assets/deepseek-wordmark.svg`, viewBox `60.422485 10.022217 134.577469 25.511124`; all eight source paths plus the exact rectangular k stem are sampled separately.
- Desktop: `docs/reference/deepseek-wordmark-desktop.png`, 1425 × 891 screenshot at CSS viewport 1440 × 900, final scroll Y=2005.5.
- Phone: `docs/reference/deepseek-wordmark-mobile.png`, 375 × 812 screenshot at CSS viewport 390 × 844, final scroll Y=1762.5.
- Hero: `docs/reference/deepseek-no-poster.png`, returning to the hero (Y=152); background image count is zero and WebGL scene reports ready.
- Original-mode regression: `docs/reference/astra-wordmark-regression.png`, desktop, settled opening.

Selected source and final desktop screenshot were emitted together in the same comparison input. Frames share the same 1.6 aspect ratio; compositions were compared proportionally, accounting for browser scrollbar and output scaling. The wordmark spans about 82% of the viewport and sits at its vertical center at maximum scroll. Full-view and focused letter checks show readable d/p stems, open e apertures, a distinct s and complete k. Mobile is a responsive adaptation of the desktop target, not a separately supplied phone mock. No horizontal overflow: clientWidth = scrollWidth = 375.

## Iteration history

1. [P2, fixed] The footer initially pushed the final shape above center. DeepSeek footer now sits inside the final screen, and the wordmark cue center is Y=450.18 at the bottom of a 900 px viewport.
2. [P2, fixed] Fine stars inherited the original scroll reduction to 45%, leaving the lettering sparse. Wordmark-only fine-star size now blends to 80%, with narrower contour scatter and reduced lens flare intensity. Original Astra and whale keep their existing values.
3. [P1, fixed] Desktop-sized points overwhelmed the letters on a 390 px phone. Wordmark sprite size, contour scatter and tracked flare size now scale together with viewport width. The final phone capture shows clear, separate lowercase letters and no overflow.
4. [P1, fixed] A solid whale SVG appeared during loading. The custom poster was removed from the render tree; the original Astra poster remains available in Astra mode.

## Interaction and verification

- Forward scrolling forms the final wordmark; returning to the top dissolves it and restores the whale.
- Wordmark drag/release and keyboard ArrowRight work; keyboard rotation leaves scroll Y unchanged and drag state resets to false.
- Both version links were exercised. Astra still exposes the original six, cursor and OpenAI knot sequence.
- Desktop and phone resizing keeps the renderer ready. Browser console shows no warnings or errors.
- Production build and whitespace checks passed. Existing bundle-size advisory remains.
- Independent review checked 360 combinations of viewport width, shape progress, shape identity and custom/original modes: all added size/scatter factors are numerically neutral for Astra and whale shapes.

## Findings and remaining limits

No actionable P0/P1/P2 findings remain. The generated concept uses a softly filled particle stroke; the live scene traces the exact official letter contours with the existing moving stars, so individual point placement and brightness differ. This is an interactive adaptation, not a pixel-identical rendering of a still image. Physical iOS touch behavior and forced WebGL failure were not device-tested.

Earlier versions remain at `astra-original-v1` and `deepseek-v1`. Current work is saved separately as `deepseek-wordmark-v2` on `feature/deepseek-particles`.

---

# DeepSeek custom shape — latest QA

Previous version result: passed

Scope: replace the opening spiral with the familiar DeepSeek whale, preserve interactive particles, keep the original Astra version independently recoverable. The final scroll shape is also the whale; the middle cursor transition remains available.

## Source and visual evidence

- User visual truth: `docs/reference/deepseek-user-reference.png` (814 × 316).
- Exact vector source: https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg . Four whale subpaths, 56.25 × 41.3594 viewBox, stored locally in `src/astra/custom-shapes.js`.
- Desktop implementation: `docs/reference/deepseek-desktop.png`, CSS viewport 1440 × 900, browser screenshot 1425 × 891.
- Phone implementation: `docs/reference/deepseek-mobile.png`, CSS viewport 390 × 844, browser screenshot 375 × 812.
- Scroll release: `docs/reference/deepseek-transition.png`, scroll Y=634.
- Original mode regression: `docs/reference/astra-regression.png` compared together with `docs/reference/source-desktop.png`.

The user reference and desktop/mobile implementation captures were included together in each visual comparison. The reference is a solid blue brand logo on a white background; the requested result is its whale geometry expressed using the existing moving star aesthetic. Thus comparison checks the body, tail, mouth and eyes, not equal background/color pixels. Particle width was fitted without distorting the vector aspect ratio. Full captures resolve these features and the header controls clearly; the official vector path equality check supplies detail-level geometry evidence.

## Iteration history

- [P2, fixed] Labels on either side crossed the whale at narrow widths. DeepSeek mode now leaves the whale unobstructed and uses the official logo in its header; original Astra labels remain intact.
- [P1, fixed] The source engine's autonomous core rotation produced a second rotating layer of whale particles. Custom mode disables this autonomous rotation while preserving the common drag parent. Post-fix `deepseek-desktop.png` shows one coherent contour; initial `deepseek-first-preview.png` records the earlier state.
- [P1, fixed] Releasing a custom opening path could reveal the original six underneath. Custom mode now releases directly to dispersed stars, with CPU flare and shader positions synchronized. `deepseek-transition.png` shows the whale dissolving without a six.
- [P2, fixed] Along-path scatter was broad for the whale's small eye/mouth details. DeepSeek alone uses pathShapeScatter=0.5; all source Astra defaults are preserved.

## Fidelity and interaction review

- Typography: local OpenAI Sans retained for controls/body; the DeepSeek header uses the exact official vector wordmark. No fallback-font or truncation issue observed.
- Layout: centered whale with original aspect ratio, responsive width 80% on phones; no horizontal overflow (375 px clientWidth = scrollWidth). Version controls remain accessible.
- Colors: the original dark starfield and white/blue/orange glows are intentionally retained. This is a particle adaptation of the logo, not a solid blue image replacement.
- Assets: the four separate paths exactly concatenate to the official whale compound path. No paths were redrawn; separate mouth and eye subpaths prevent accidental connections.
- Copy: new mode uses concise instructions for moving, dragging and scrolling; original mode preserves its prior text. New header links switch between DeepSeek and Astra.
- Tested in browser: initial formation, hero drag/release, scroll dissolution into cursor, movement through later sections, version switch in both directions, phone layout and replay. Renderer stayed ready; console had no errors or warnings.
- Numerical regression: latest Astra code matched the original animation for 480 frames, including core rotation. Custom checks passed for 5.5-second convergence, complementary release weights, single parent drag rotation, centered camera and stationary core rotation.
- Production build and whitespace checks passed. Existing Three.js bundle-size advisory remains unchanged in nature.

## Preservation

Original code is commit `3dd20cf`, branch `main`, annotated tag `astra-original-v1`. New work is committed separately on `feature/deepseek-particles`. The original tag was not moved. No remote repository was created or pushed.

No actionable P0/P1/P2 findings remain. Physical iOS touch/toolbar behavior has not been device-tested; phone dimensions were checked in the local browser.

---

# Astra particle reproduction — visual QA

Original Astra result: passed

Source: https://openai.com/index/gpt-6-astra/
Implementation: http://localhost:4173/

Scope: reproduce the original interactive particle scene and its three shapes in a compact demonstration. The full announcement article, video, charts and site-wide navigation menus are outside this particle-focused implementation. Scroll transitions use the original equations; later shape sections are intentionally closer together.

## Evidence and normalization

All screenshots are under `docs/reference/`.

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
