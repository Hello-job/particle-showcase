import {
  createAstraRenderer,
  createAstraAnimationState,
  updateAstraAnimation,
  resolveHeroLayout,
  resolveCueKeyframe,
  resolveAstraRendererConfig,
  prepareAstraRuntimeConfig,
  resolvePreparedAstraRuntimeConfig,
  getAstraScrollState,
  resolveAstraPathShape,
  ASTRA_SHAPE_SVGS,
  sceneMath,
  interpolateAstra,
} from "./engine.js";
import { createAstraProfile } from "./profile.js";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smootherstep = (value, start, end) => {
  const x = clamp((value - start) / (end - start));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const { getAstraSceneValues, getAstraNumber } = sceneMath;
const { applyAstraEasing } = interpolateAstra;

function documentBounds(element) {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

// The original effect samples the rendered SVG, including transforms on paths.
// Four floats preserve the start/end of each independent path for star travel.
export function sampleAstraPath(element, id) {
  const svg = element.querySelector("svg");
  const box = svg?.viewBox.baseVal;
  if (!svg || !box || box.width <= 0 || box.height <= 0) return null;
  const rootMatrix = svg.getScreenCTM();
  const paths = Array.from(svg.querySelectorAll("path")).flatMap((path) => {
    try {
      const length = path.getTotalLength();
      const matrix = path.getScreenCTM();
      return length > 0 && Number.isFinite(length)
        ? [
            {
              path,
              length,
              matrix:
                rootMatrix && matrix
                  ? rootMatrix.inverse().multiply(matrix)
                  : null,
            },
          ]
        : [];
    } catch {
      return [];
    }
  });
  const total = paths.reduce((sum, path) => sum + path.length, 0);
  if (!total) return null;
  const samples = new Float32Array(4096);
  let pathIndex = 0;
  let distance = 0;
  for (let index = 0; index < 1024; index += 1) {
    const position = ((index + 0.5) / 1024) * total;
    while (
      pathIndex < paths.length - 1 &&
      position > distance + paths[pathIndex].length
    ) {
      distance += paths[pathIndex++].length;
    }
    const { path, length, matrix } = paths[pathIndex];
    const point = path.getPointAtLength(position - distance);
    const transformed = matrix
      ? new DOMPoint(point.x, point.y).matrixTransform(matrix)
      : point;
    samples[index * 4] = (transformed.x - box.x) / box.width - 0.5;
    samples[index * 4 + 1] = 0.5 - (transformed.y - box.y) / box.height;
    samples[index * 4 + 2] = distance / total;
    samples[index * 4 + 3] = (distance + length) / total;
  }
  return samples.some((value) => !Number.isFinite(value))
    ? null
    : { element, id, samples, aspectRatio: box.width / box.height };
}

function getIntroElement(hero, content) {
  if (!content.contains(hero)) {
    return hero.compareDocumentPosition(content) &
      Node.DOCUMENT_POSITION_FOLLOWING
      ? (content.querySelector("[data-section-header]") ??
          content.firstElementChild ??
          content)
      : null;
  }
  let candidate = hero;
  while (candidate && candidate !== content) {
    if (!candidate.nextElementSibling) {
      candidate = candidate.parentElement;
      continue;
    }
    candidate = candidate.nextElementSibling;
    while (
      getComputedStyle(candidate).display === "contents" &&
      candidate.firstElementChild
    ) {
      candidate = candidate.firstElementChild;
    }
    const style = getComputedStyle(candidate);
    if (
      candidate.closest('[hidden], [inert], [aria-hidden="true"]') ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    )
      continue;
    if (candidate.getBoundingClientRect().height > 0) return candidate;
  }
  return null;
}

function cueRegistration(cue) {
  if (cue.element) return cue;
  let data = {};
  try {
    const value = cue.dataset.astraScrollCue;
    if (value?.startsWith("{")) data = JSON.parse(value);
  } catch {
    /* The empty data attribute is the normal registration. */
  }
  const shape = cue.dataset.astraPathShape;
  return { element: cue, data: shape ? { ...data, shape } : data };
}

/** DOM adapter for the original Astra scene, scroll anchors and pointer input. */
export function createAstraScene(canvas, options = {}) {
  const heroElement =
    options.heroElement ?? document.querySelector("[data-astra-hero]");
  const contentElement =
    options.contentElement ??
    document.querySelector("[data-astra-content]") ??
    document.body;
  if (!heroElement) throw new Error("Astra requires a hero element.");
  const backdrop =
    canvas.closest("[data-astra-backdrop]") ?? canvas.parentElement;
  const experience =
    canvas.closest("[data-astra-experience]") ??
    contentElement.parentElement ??
    document.body;
  const chrome = [...document.querySelectorAll("[data-astra-copy]")];
  const dragSurfaces = [...document.querySelectorAll("[data-astra-drag]")];
  const title = document.querySelector("[data-astra-title]");
  const titleStage =
    title?.closest("[data-section-header]") ?? title?.parentElement;
  const heroData = options.data ?? {};
  const data = resolveHeroLayout(heroData);
  const config = resolveAstraRendererConfig(data, heroData);
  const { motion } = getAstraSceneValues(data.scene);
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const input = {
    contentBounds: null,
    heroViewportHeight: null,
    reducedMotion: reducedQuery.matches,
    progress: 0,
    scatterProgress: null,
    tiltProgress: null,
    starsOpacity: 1,
    scrolling: false,
    returning: false,
    rotation: { x: 0, y: 0 },
    pointer: { active: false, pressed: false, reset: false, x: 0, y: 0 },
    shape: {
      centerNdc: { x: 0, y: 0 },
      id: null,
      samples: null,
      sizeNdc: { x: 0, y: 0 },
      strength: 0,
    },
  };
  const viewport = { width: 1, height: 1 };
  let profile = options.profile ?? createAstraProfile(3, input.reducedMotion);
  let renderer;
  let animation;
  let runtimeConfig = config;
  let disposed = false;
  let failed = false;
  let initialized = false;
  let rendererGeneration = 0;
  let needsLayout = true;
  let frameId = null;
  let lastFrame = null;
  let lastScrollX = NaN;
  let lastScrollY = NaN;
  let lastDpr = 0;
  let layout;
  let active = true;
  let dragging = null;
  let titleShift = 0;
  let resizeObserver;
  const removers = [];
  const previousTitlePadding = titleStage?.style.paddingBottom ?? "";
  const previousTitleTransform =
    title?.style.getPropertyValue("--astra-title-parallax-y") ?? "";
  const listen = (target, event, callback, listenerOptions) => {
    target?.addEventListener(event, callback, listenerOptions);
    removers.push(() =>
      target?.removeEventListener(event, callback, listenerOptions),
    );
  };

  function clearPointer(reset = false) {
    input.pointer.active = false;
    input.pointer.pressed = false;
    input.pointer.reset ||= reset;
  }

  function getViewport() {
    const visual = window.visualViewport;
    const height = visual?.height || window.innerHeight || 1;
    return {
      height,
      width: visual?.width || window.innerWidth || 1,
      scrollOffsetTop: visual?.offsetTop ?? 0,
      scrollOffsetLeft: visual?.offsetLeft ?? 0,
      activationY: (visual?.offsetTop ?? 0) + height * data.activationLine,
      top: 0,
      left: 0,
    };
  }

  function measure() {
    const visual = getViewport();
    const canvasBounds = canvas.getBoundingClientRect();
    const heroBounds = documentBounds(heroElement);
    const rangeBounds = documentBounds(contentElement);
    const registrations = Array.from(
      options.cues ??
        contentElement.querySelectorAll(
          "[data-astra-scroll-cue], [data-astra-path-shape]",
        ),
    )
      .map(cueRegistration)
      .sort((a, b) =>
        a.element === b.element
          ? 0
          : a.element.compareDocumentPosition(b.element) &
              Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1,
      );
    const seen = new Set();
    const cues = registrations
      .filter((cue) => {
        if (seen.has(cue.element)) return false;
        seen.add(cue.element);
        return true;
      })
      .map((cue) => ({ ...cue, bounds: documentBounds(cue.element) }));
    const activation =
      heroBounds.top +
      Math.min(heroBounds.height, visual.height) * data.activationLine;
    const disperseDistance = getAstraNumber(motion, "disperseDistance", 800, {
      min: 1,
      max: 10000,
    });
    const anchors = [
      { easing: data.easing, keyframe: data.keyframes[0] ?? {}, y: activation },
    ];
    let previousY = activation;
    cues.forEach((cue, index) => {
      const y = Math.max(
        resolveAstraPathShape(cue.data?.shape)
          ? cue.bounds.top + cue.bounds.height / 2
          : cue.bounds.top,
        index === 0 ? activation + disperseDistance : previousY + 1,
      );
      previousY = y;
      anchors.push({
        easing: cue.data?.easing === "linear" ? "linear" : data.easing,
        keyframe: resolveCueKeyframe({
          cueIndex: index,
          data: cue.data,
          keyframes: data.keyframes,
        }),
        y,
      });
    });
    const shapes = cues.flatMap((cue, index) => {
      const shapeName = cue.element.dataset.astraPathShape;
      if (!shapeName) return [];
      const sampled = sampleAstraPath(cue.element, `${shapeName}:${index}`);
      return sampled
        ? [
            {
              ...sampled,
              bounds: cue.bounds,
              holdAtRangeEnd: index === cues.length - 1,
            },
          ]
        : [];
    });
    let titleMetrics = null;
    if (title && titleStage) {
      const trailingSpace = getAstraNumber(
        motion,
        "headingTrailingSpaceVh",
        7,
        { min: 0, max: 100 },
      );
      titleStage.style.paddingBottom = `${Math.round((visual.height * trailingSpace) / 100)}px`;
      const bounds = documentBounds(title);
      bounds.top -= titleShift;
      const mobile = visual.width < 768;
      titleMetrics = {
        bounds,
        padding: Math.max(
          12,
          parseFloat(
            getComputedStyle(titleStage).getPropertyValue("--grid-gap"),
          ) || 0,
        ),
        distance: config.scrollEffects
          ? getAstraNumber(
              motion,
              mobile
                ? "headingParallaxDistanceMobile"
                : "headingParallaxDistance",
              mobile ? 144 : 240,
              { min: 0, max: 480 },
            )
          : 0,
      };
    }
    const intro = getIntroElement(heroElement, contentElement);
    layout = {
      viewport: visual,
      canvas: {
        width: Math.max(1, canvasBounds.width),
        height: Math.max(1, canvasBounds.height),
        top: canvasBounds.top,
        left: canvasBounds.left,
      },
      heroBounds,
      rangeBounds,
      cues,
      anchors,
      runtime: anchors.map((anchor) =>
        prepareAstraRuntimeConfig(config, anchor.keyframe),
      ),
      shapes,
      intro: intro ? documentBounds(intro) : null,
      title: titleMetrics,
    };
    const width = Math.max(1, Math.floor(canvasBounds.width));
    const height = Math.max(1, Math.floor(canvasBounds.height));
    const dpr = window.devicePixelRatio;
    if (
      viewport.width !== width ||
      viewport.height !== height ||
      lastDpr !== dpr
    ) {
      viewport.width = width;
      viewport.height = height;
      lastDpr = dpr;
      renderer?.resize(width, height, dpr);
      clearPointer(true);
    }
    needsLayout = false;
  }

  function resolveScroll() {
    if (needsLayout || !layout) measure();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    input.scrolling = scrollX !== lastScrollX || scrollY !== lastScrollY;
    lastScrollX = scrollX;
    lastScrollY = scrollY;
    const visible = layout.viewport;
    const scrollTop = scrollY + visible.scrollOffsetTop;
    const { anchors, heroBounds, rangeBounds } = layout;
    let fromIndex = 0;
    let toIndex = 0;
    let progress = 0;
    let sceneActive =
      heroBounds.top + heroBounds.height > scrollTop &&
      heroBounds.top < scrollTop + visible.height;
    const activation = scrollY + visible.activationY;
    if (anchors.length > 1 && activation > anchors[0].y) {
      const last = anchors.length - 1;
      fromIndex = last;
      toIndex = last;
      sceneActive = scrollTop < rangeBounds.top + rangeBounds.height;
      for (let index = 0; index < last; index += 1) {
        if (activation > anchors[index + 1].y) continue;
        fromIndex = index;
        toIndex = index + 1;
        const fraction =
          (activation - anchors[index].y) /
          Math.max(1, anchors[index + 1].y - anchors[index].y);
        progress = input.reducedMotion
          ? Number(fraction >= 0.5)
          : applyAstraEasing(fraction, anchors[index + 1].easing);
        sceneActive = true;
        break;
      }
    }
    input.contentBounds = layout.title
      ? {
          left: Math.max(
            0,
            (layout.title.bounds.left -
              layout.title.padding -
              scrollX -
              layout.canvas.left) /
              layout.canvas.width,
          ),
          right: Math.min(
            1,
            (layout.title.bounds.left +
              layout.title.bounds.width +
              layout.title.padding -
              scrollX -
              layout.canvas.left) /
              layout.canvas.width,
          ),
        }
      : null;

    const shape = input.shape;
    shape.strength = 0;
    if (config.scrollEffects && !input.reducedMotion) {
      const maxTop = Math.max(
        0,
        rangeBounds.top +
          rangeBounds.height -
          visible.height -
          visible.scrollOffsetTop,
      );
      const canvasScrollTop = scrollY + layout.canvas.top;
      const clippedTop = Math.min(canvasScrollTop, maxTop);
      const formationTop = clippedTop + scrollTop - canvasScrollTop;
      let selected;
      for (const candidate of layout.shapes) {
        const fraction =
          (formationTop + visible.height - candidate.bounds.top) /
          Math.max(visible.height + candidate.bounds.height, 1);
        const release = candidate.holdAtRangeEnd
          ? 1
          : 1 - smootherstep(fraction, 0.5, 0.86);
        const strength = smootherstep(fraction, 0, 0.36) * release;
        if (strength > shape.strength) {
          selected = candidate;
          shape.strength = strength;
        }
      }
      if (selected) {
        const bounds = selected.bounds;
        const width =
          bounds.width / Math.max(bounds.height, 1) > selected.aspectRatio
            ? bounds.height * selected.aspectRatio
            : bounds.width;
        const height = width / selected.aspectRatio;
        shape.centerNdc.x =
          ((bounds.left - scrollX - layout.canvas.left + bounds.width / 2) /
            layout.canvas.width) *
            2 -
          1;
        shape.centerNdc.y =
          1 -
          ((bounds.top - clippedTop + bounds.height / 2) /
            layout.canvas.height) *
            2;
        shape.sizeNdc.x = (width / layout.canvas.width) * 2;
        shape.sizeNdc.y = (height / layout.canvas.height) * 2;
        shape.id = selected.id;
        shape.samples = selected.samples;
      }
    }

    const heroScroll = Math.max(0, scrollTop - heroBounds.top);
    const scrollState = getAstraScrollState(
      heroScroll,
      config,
      input.reducedMotion,
    );
    input.progress = scrollState.progress;
    input.scatterProgress = null;
    input.tiltProgress = null;
    if (layout.intro && config.scrollEffects && !input.reducedMotion) {
      const scatterStart = layout.intro.top - 0.66 * visible.height;
      const scatterEnd =
        layout.intro.top + layout.intro.height / 2 - visible.height / 2;
      input.scatterProgress = clamp(
        (scrollTop - scatterStart) / (scatterEnd - scatterStart),
      );
      input.tiltProgress = clamp(
        heroScroll / Math.max(1, scatterEnd - heroBounds.top),
      );
    }
    if (layout.title) {
      const { bounds, distance } = layout.title;
      titleShift = input.reducedMotion
        ? 0
        : Math.round(
            clamp(
              (bounds.top +
                bounds.height / 2 -
                (scrollTop + visible.height / 2)) /
                ((visible.height + bounds.height) / 2),
              -1,
              1,
            ) * Math.round(distance / 2),
          );
      title.style.setProperty("--astra-title-parallax-y", `${titleShift}px`);
    }
    runtimeConfig = resolvePreparedAstraRuntimeConfig({
      base: config,
      from: layout.runtime[fromIndex],
      to: layout.runtime[toIndex],
      progress,
    });
    const fromOpacity = anchors[fromIndex].keyframe.opacity;
    const toOpacity = anchors[toIndex].keyframe.opacity;
    const opacity = clamp(
      Number.isFinite(fromOpacity) && Number.isFinite(toOpacity)
        ? fromOpacity + (toOpacity - fromOpacity) * progress
        : ((progress < 0.5 ? fromOpacity : toOpacity) ?? 1),
    );
    const translateY = Math.min(
      0,
      Math.round(
        rangeBounds.top +
          rangeBounds.height -
          (scrollTop + layout.canvas.height),
      ),
    );
    const withinRange = translateY > -layout.canvas.height;
    active =
      (sceneActive || shape.strength > 0.001) && withinRange && opacity > 0.01;
    input.starsOpacity = 1;
    const lastShape = layout.cues
      .filter((cue) => resolveAstraPathShape(cue.data?.shape))
      .at(-1);
    if (resolveAstraPathShape(lastShape?.data?.shape) === "openai-knot") {
      const bounds = lastShape.bounds;
      const knot = ASTRA_SHAPE_SVGS["openai-knot"];
      const height = Math.min(
        bounds.height,
        (bounds.width * knot.height) / knot.width,
      );
      const bottom = bounds.top + (bounds.height + height) / 2;
      input.starsOpacity =
        1 -
        applyAstraEasing(
          (scrollTop - bottom) / Math.max(1, 0.05 * visible.height),
          "smoothstep",
        );
    }
    if (!active) clearPointer(true);
    if (backdrop) {
      backdrop.style.opacity = String(
        Math.round((active ? opacity : 0) * 10000) / 10000,
      );
      backdrop.style.visibility = active ? "visible" : "hidden";
      backdrop.style.transform =
        translateY === 0 ? "" : `translate3d(0, ${translateY}px, 0)`;
      backdrop.style.setProperty(
        "--astra-fallback-opacity",
        String(scrollState.textOpacity),
      );
      if (active) backdrop.dataset.astraActive = "true";
      else delete backdrop.dataset.astraActive;
    }
    for (const element of chrome) {
      const opacity =
        (sceneActive || shape.strength > 0.001) && withinRange
          ? scrollState.textOpacity
          : 0;
      element.style.setProperty(
        "--astra-copy-opacity",
        String(Math.round(opacity * 10000) / 10000),
      );
      element.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      if (element.matches("button,a")) {
        element.style.opacity = String(Math.round(opacity * 10000) / 10000);
        element.style.pointerEvents = opacity > 0.01 ? "" : "none";
      }
    }
    options.onScroll?.({
      progress: input.progress,
      scatter: input.scatterProgress,
      shape: shape.id,
      shapeStrength: shape.strength,
      active,
    });
  }

  function render(delta) {
    resolveScroll();
    if (failed || !renderer || !animation || !active) return false;
    const animationDelta =
      input.reducedMotion || !runtimeConfig.animationPlaying ? 0 : delta;
    const moving = updateAstraAnimation(
      {
        state: animation,
        config: runtimeConfig,
        input,
        camera: renderer.camera,
        animationRoot: renderer.animationRoot,
        spinRoot: renderer.spinRoot,
        field: renderer.field,
        viewport,
      },
      animationDelta,
      input.reducedMotion ? 0 : delta,
    );
    const rail = animation.railPresence;
    const bounds = animation.railContentBounds;
    let mask = "";
    if (rail > 0) {
      const left = bounds.x * viewport.width;
      const right = bounds.y * viewport.width;
      const opacity = Math.round((1 - rail) * 10000) / 10000;
      mask = `linear-gradient(to right, #000 ${Math.max(0, left - 160)}px, rgba(0, 0, 0, ${opacity}) ${left}px, rgba(0, 0, 0, ${opacity}) ${right}px, #000 ${Math.min(viewport.width, right + 160)}px)`;
    }
    if (canvas.style.maskImage !== mask) canvas.style.maskImage = mask;
    renderer.render(
      animationDelta,
      animation,
      runtimeConfig,
      input.reducedMotion,
    );
    return moving;
  }

  function tick(timestamp) {
    frameId = null;
    if (disposed || document.visibilityState === "hidden") return;
    const delta =
      lastFrame === null ? 0 : clamp((timestamp - lastFrame) / 1000, 0, 0.05);
    lastFrame = timestamp;
    try {
      const moving = render(delta);
      if (
        (!failed &&
          active &&
          !input.reducedMotion &&
          runtimeConfig.animationPlaying) ||
        moving ||
        input.scrolling
      )
        invalidate();
      else lastFrame = null;
    } catch (error) {
      fail(error);
    }
  }

  function fail(error) {
    if (disposed || failed) return;
    failed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    animation?.dispose();
    renderer?.dispose();
    options.onError?.(error);
  }

  function invalidate() {
    if (
      !disposed &&
      initialized &&
      frameId === null &&
      document.visibilityState !== "hidden"
    )
      frameId = requestAnimationFrame(tick);
  }

  function refresh() {
    needsLayout = true;
    invalidate();
  }

  async function updateMotionPreference() {
    if (disposed || failed) return;
    input.reducedMotion = reducedQuery.matches;
    if (input.reducedMotion) clearPointer(true);
    // The original profile switches full postprocessing to selective when
    // reduced motion is enabled, so the renderer itself must be rebuilt.
    if (!initialized) {
      refresh();
      return;
    }
    const generation = ++rendererGeneration;
    initialized = false;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastFrame = null;
    animation?.dispose();
    animation = undefined;
    renderer?.dispose();
    profile = options.profile ?? createAstraProfile(3, input.reducedMotion);
    const replacement = createAstraRenderer(canvas, config, profile, {
      invalidate,
    });
    renderer = replacement;
    await replacement.ready;
    if (disposed || failed || generation !== rendererGeneration) {
      replacement.dispose();
      return;
    }
    needsLayout = true;
    measure();
    resolveScroll();
    animation = createAstraAnimationState(config, input.progress);
    initialized = true;
    render(0);
    invalidate();
  }

  function point(clientX, clientY, pressed) {
    if (
      input.reducedMotion ||
      !Number.isFinite(clientX) ||
      !Number.isFinite(clientY)
    )
      return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    Object.assign(input.pointer, {
      active: true,
      pressed,
      reset: false,
      x: clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
      y: clamp(1 - ((clientY - rect.top) / rect.height) * 2, -1, 1),
    });
    invalidate();
  }

  function rotate(x, y) {
    if (input.reducedMotion) return;
    input.rotation.x = clamp(input.rotation.x + y, -4 * Math.PI, 4 * Math.PI);
    input.rotation.y = clamp(input.rotation.y + x, -4 * Math.PI, 4 * Math.PI);
    input.returning = false;
    invalidate();
  }

  function release(event) {
    const previous = dragging;
    dragging = null;
    if (previous) {
      try {
        if (previous.target.hasPointerCapture(previous.id))
          previous.target.releasePointerCapture(previous.id);
      } catch {
        /* Capture can be lost during navigation. */
      }
    }
    for (const surface of dragSurfaces) surface.dataset.dragging = "false";
    if (event?.pointerType === "mouse")
      point(event.clientX, event.clientY, false);
    else clearPointer();
    if (config.faceForward) {
      input.rotation.x = 0;
      input.rotation.y = 0;
      input.returning = true;
    }
    invalidate();
  }

  function replay() {
    if (disposed || failed || !initialized) return;
    release();
    clearPointer(true);
    input.rotation.x = 0;
    input.rotation.y = 0;
    input.returning = true;
    animation?.dispose();
    animation = createAstraAnimationState(config, input.progress);
    animation.particleMotion.epoch = (performance.now() | 0) + 1;
    lastFrame = null;
    const ambient = backdrop?.querySelector("[data-astra-ambient]");
    if (ambient) {
      ambient.style.animation = "none";
      void ambient.offsetWidth;
      ambient.style.animation = "";
    }
    chrome
      .flatMap((element) => [
        ...element.querySelectorAll(
          "[data-astra-label-letter],.astra-label-letter",
        ),
      ])
      .forEach((letter) => {
        letter.style.animation = "none";
        void letter.offsetWidth;
        letter.style.animation = "";
      });
    invalidate();
  }

  listen(window, "scroll", invalidate, { passive: true });
  listen(window, "resize", refresh, { passive: true });
  listen(window.visualViewport, "resize", refresh, { passive: true });
  listen(window.visualViewport, "scroll", refresh, { passive: true });
  listen(window, "astra-replay", replay);
  listen(window, "astra:replay", replay);
  listen(
    window,
    "astra:rotate",
    (event) => event.detail && rotate(event.detail.x, event.detail.y),
  );
  listen(window, "astra:pointer", (event) => {
    const pointer = event.detail;
    if (pointer?.active)
      point(pointer.clientX, pointer.clientY, pointer.pressed === true);
    else {
      clearPointer(input.reducedMotion);
      invalidate();
    }
  });
  listen(window, "astra:return", () => release());
  listen(window, "blur", () => {
    release();
    clearPointer(true);
  });
  listen(document, "visibilitychange", () => {
    lastFrame = null;
    if (document.visibilityState === "hidden") {
      release();
      clearPointer(true);
    } else refresh();
  });
  listen(reducedQuery, "change", () => {
    updateMotionPreference().catch(fail);
  });
  listen(
    experience,
    "pointermove",
    (event) => {
      if (
        event.isPrimary &&
        (event.pointerType === "mouse" || event.pointerType === "pen") &&
        event.buttons === 0 &&
        active
      )
        point(event.clientX, event.clientY, false);
    },
    { capture: true, passive: true },
  );
  listen(
    experience,
    "pointerleave",
    (event) => {
      if (event.isPrimary && !dragging) {
        clearPointer();
        invalidate();
      }
    },
    { passive: true },
  );
  for (const dragSurface of dragSurfaces) {
    listen(dragSurface, "pointerdown", (event) => {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        dragging ||
        input.reducedMotion
      )
        return;
      try {
        dragSurface.setPointerCapture(event.pointerId);
      } catch {
        return;
      }
      dragging = {
        id: event.pointerId,
        target: dragSurface,
        x: event.clientX,
        y: event.clientY,
      };
      dragSurface.dataset.dragging = "true";
      point(event.clientX, event.clientY, true);
    });
    listen(dragSurface, "pointermove", (event) => {
      if (!event.isPrimary) return;
      if (!dragging) {
        if (event.buttons === 0) point(event.clientX, event.clientY, false);
        return;
      }
      if (event.pointerId !== dragging.id) return;
      point(event.clientX, event.clientY, true);
      rotate(
        (event.clientX - dragging.x) * 0.005,
        (event.clientY - dragging.y) * 0.005,
      );
      dragging.x = event.clientX;
      dragging.y = event.clientY;
    });
    listen(dragSurface, "pointerup", (event) => {
      if (dragging?.id === event.pointerId) release(event);
    });
    listen(dragSurface, "pointercancel", (event) => {
      if (dragging?.id === event.pointerId) release();
    });
    listen(dragSurface, "lostpointercapture", (event) => {
      if (dragging?.id === event.pointerId) release();
    });
    listen(dragSurface, "keydown", (event) => {
      const direction = {
        ArrowDown: [0, 0.08],
        ArrowLeft: [-0.08, 0],
        ArrowRight: [0.08, 0],
        ArrowUp: [0, -0.08],
      }[event.key];
      if (direction) {
        event.preventDefault();
        rotate(...direction);
      }
    });
  }
  listen(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    fail(new Error("The browser lost its WebGL context."));
  });

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(canvas);
    resizeObserver.observe(contentElement);
  }
  document.fonts?.ready.then(() => {
    if (!disposed) refresh();
  });
  const ready = (async () => {
    renderer = createAstraRenderer(canvas, config, profile, { invalidate });
    await renderer.ready;
    if (disposed) return;
    if (failed)
      throw new Error("Astra lost its renderer during initialization.");
    measure();
    resolveScroll();
    animation = createAstraAnimationState(config, input.progress);
    initialized = true;
    render(0);
    invalidate();
    return { renderer, animation };
  })().catch((error) => {
    fail(error);
    throw error;
  });

  return {
    ready,
    replay,
    refresh,
    input,
    get renderer() {
      return renderer;
    },
    get animation() {
      return animation;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      removers.forEach((remove) => remove());
      resizeObserver?.disconnect();
      animation?.dispose();
      renderer?.dispose();
      if (titleStage) titleStage.style.paddingBottom = previousTitlePadding;
      if (title)
        title.style.setProperty(
          "--astra-title-parallax-y",
          previousTitleTransform,
        );
    },
  };
}
