import type { SampledShape } from "./types";

interface ScanRoute {
  start: number;
  end: number;
  y: number;
  accent: boolean;
}

const SAMPLE_COUNT = 1024;
const MIN_ROUTE_SAMPLES = 3;
const MAX_ROUTES = Math.floor(SAMPLE_COUNT / MIN_ROUTE_SAMPLES);
const sampleCache = new WeakMap<SVGSVGElement, { signature: string; result: SampledShape }>();

// Each interior scanline travels out and back within one filled interval.
// Keeping the intervals independent preserves letter counters and detached marks.
export function sampleFilledAstraShape(svg: SVGSVGElement, id: string): SampledShape | null {
  if (!svg || typeof svg.querySelectorAll !== "function") return null;
  try {
    const box = svg.viewBox?.baseVal;
    const signature = JSON.stringify([
      id,
      box?.x,
      box?.y,
      box?.width,
      box?.height,
      svg.getAttribute?.("fill-rule"),
      ...Array.from(svg.querySelectorAll("path"), (path) => [
        path.getAttribute("d"),
        path.getAttribute("data-accent"),
        path.getAttribute("fill-rule"),
      ]),
    ]);
    const cached = sampleCache.get(svg);
    if (cached?.signature === signature) return cached.result;
    const result = buildFilledShape(svg, id);
    if (result) sampleCache.set(svg, { signature, result });
    return result;
  } catch {
    // A malformed or temporarily unavailable SVG can use the caller's fallback.
    return null;
  }
}

function buildFilledShape(svg: SVGSVGElement, id: string): SampledShape | null {
  const box = svg?.viewBox?.baseVal;
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  const paths = Array.from(svg.querySelectorAll("path")).flatMap((path) => {
    if (typeof path.isPointInFill !== "function") return [];
    try {
      const bounds = path.getBBox();
      return bounds.width > 0 && bounds.height > 0
        ? [
            {
              path,
              bounds,
              accent:
                path.hasAttribute("data-accent") && path.getAttribute("data-accent") !== "false",
            },
          ]
        : [];
    } catch {
      return [];
    }
  });
  if (!paths.length) return null;
  const point = svg.createSVGPoint();
  const columnStep = box.width / 768;

  function scan(rowCount: number) {
    const routes: ScanRoute[] = [];
    // Accent routes occupy a contiguous range at the end of the texture.
    for (const accent of [false, true]) {
      const group = paths.filter((entry) => entry.accent === accent);
      for (let row = 0; row < rowCount; row += 1) {
        const y = box.y + ((row + 0.5) / rowCount) * box.height;
        const active = group.filter(({ bounds }) => y >= bounds.y && y <= bounds.y + bounds.height);
        if (!active.length) continue;
        const minX = Math.min(...active.map(({ bounds }) => bounds.x));
        const maxX = Math.max(...active.map(({ bounds }) => bounds.x + bounds.width));
        const contains = (x: number) => {
          point.x = x;
          point.y = y;
          return active.some(
            ({ path, bounds }) =>
              x >= bounds.x && x <= bounds.x + bounds.width && path.isPointInFill(point),
          );
        };
        const boundary = (left: number, right: number, leftInside: boolean) => {
          for (let iteration = 0; iteration < 10; iteration += 1) {
            const middle = (left + right) / 2;
            if (contains(middle) === leftInside) left = middle;
            else right = middle;
          }
          return leftInside ? left : right;
        };
        const columns = Math.ceil((maxX - minX) / columnStep) + 2;
        let previousX = minX - columnStep;
        let previousInside = false;
        let start: number | null = null;
        for (let column = 0; column <= columns; column += 1) {
          const x = minX + column * columnStep;
          const inside = contains(x);
          if (inside !== previousInside) {
            const edge = boundary(previousX, x, previousInside);
            if (inside) start = edge;
            else if (start !== null && edge > start) {
              routes.push({ start, end: edge, y, accent });
              start = null;
            }
          }
          previousX = x;
          previousInside = inside;
        }
      }
    }
    return routes;
  }

  // Complex words can have several separate intervals on every row. Reduce
  // rows only when necessary so every interval keeps a complete closed route.
  let rowCount = 64;
  let routes = scan(rowCount);
  while (routes.length > MAX_ROUTES && rowCount > 1) {
    rowCount = Math.max(1, rowCount - 8);
    routes = scan(rowCount);
  }
  if (!routes.length || routes.length > MAX_ROUTES) return null;

  const totalWidth = routes.reduce((sum, route) => sum + route.end - route.start, 0);
  const extra = SAMPLE_COUNT - routes.length * MIN_ROUTE_SAMPLES;
  let assigned = 0;
  const allocations = routes.map((route, index) => {
    const ideal = (extra * (route.end - route.start)) / totalWidth;
    const whole = Math.floor(ideal);
    assigned += MIN_ROUTE_SAMPLES + whole;
    return { index, count: MIN_ROUTE_SAMPLES + whole, remainder: ideal - whole };
  });
  const byRemainder = [...allocations].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (let index = 0; index < SAMPLE_COUNT - assigned; index += 1) {
    byRemainder[index].count += 1;
  }

  const samples = new Float32Array(SAMPLE_COUNT * 4);
  let offset = 0;
  let accentStart: number | null = null;
  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index];
    const count = allocations[index].count;
    const rangeStart = offset / (SAMPLE_COUNT - 1);
    const rangeEnd = (offset + count - 1) / (SAMPLE_COUNT - 1);
    // Accent membership uses the seed-to-texel lookup (floor(seed * 1024)),
    // whereas geometry interpolation uses the separate /1023 route bounds.
    if (route.accent && accentStart === null) accentStart = offset / SAMPLE_COUNT;
    for (let sample = 0; sample < count; sample += 1) {
      const turn = Math.floor((count - 1) / 2);
      const travel = sample <= turn ? sample / turn : (count - 1 - sample) / (count - 1 - turn);
      const x = route.start + (route.end - route.start) * travel;
      const position = (offset + sample) * 4;
      samples[position] = (x - box.x) / box.width - 0.5;
      samples[position + 1] = 0.5 - (route.y - box.y) / box.height;
      samples[position + 2] = rangeStart;
      samples[position + 3] = rangeEnd;
    }
    offset += count;
  }
  if (offset !== SAMPLE_COUNT || samples.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return {
    id,
    samples,
    aspectRatio: box.width / box.height,
    filled: true,
    accentRange: accentStart === null ? [0, 0] : [accentStart, 1],
    flowScale: 0.04,
    rowSpacing: 1 / rowCount,
  };
}
