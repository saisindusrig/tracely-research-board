// Tiny seeded "drawn by hand" geometry. Every shape wobbles a little, but the
// same seed always produces the same path, so nothing jitters between renders
// and server and client output match.

export type Rand = () => number;

/** Deterministic pseudo-random numbers in [0, 1) from any string. */
export function seeded(seed: string): Rand {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  if (h === 0) h = 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

/** A value in [-amount, amount]. */
const jitter = (rand: Rand, amount: number) => (rand() * 2 - 1) * amount;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Small tilt in degrees for an index card: 0.3 to 1.1, either direction. */
export function tiltFor(seed: string, max = 1.1) {
  const rand = seeded(`tilt:${seed}`);
  const deg = 0.3 + rand() * (max - 0.3);
  return r1(rand() > 0.5 ? deg : -deg);
}

/** A slightly bowed straight line. */
export function handLine(x1: number, y1: number, x2: number, y2: number, rand: Rand, wobble = 1.2) {
  const mx = (x1 + x2) / 2 + jitter(rand, wobble);
  const my = (y1 + y2) / 2 + jitter(rand, wobble);
  return `M${r1(x1 + jitter(rand, 0.4))} ${r1(y1 + jitter(rand, 0.4))} Q${r1(mx)} ${r1(my)} ${r1(x2)} ${r1(y2)}`;
}

/**
 * A connector between two points drawn like an ink stroke: a cubic curve whose
 * control points are nudged off-axis so it never looks machine-perfect.
 * Also returns the curve's midpoint (for a label) and its angle at the end
 * (for an arrowhead).
 */
export function handConnector(sx: number, sy: number, tx: number, ty: number, rand: Rand) {
  const dir = ty >= sy ? 1 : -1;
  const dy = Math.max(40, Math.abs(ty - sy) * 0.5) * dir;
  const c1x = sx + jitter(rand, 14);
  const c1y = sy + dy + jitter(rand, 8);
  const c2x = tx + jitter(rand, 14);
  const c2y = ty - dy + jitter(rand, 8);
  return {
    d: `M${r1(sx)} ${r1(sy)} C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(tx)} ${r1(ty)}`,
    mid: { x: (sx + 3 * c1x + 3 * c2x + tx) / 8, y: (sy + 3 * c1y + 3 * c2y + ty) / 8 },
    endAngle: Math.atan2(ty - c2y, tx - c2x),
  };
}

/** Two short strokes forming an arrowhead at (x, y) pointing along `angle` (radians). */
export function handArrowhead(x: number, y: number, angle: number, rand: Rand, size = 9) {
  const a1 = angle + Math.PI - 0.45 + jitter(rand, 0.08);
  const a2 = angle + Math.PI + 0.45 + jitter(rand, 0.08);
  const l1 = size + jitter(rand, 1.5);
  const l2 = size + jitter(rand, 1.5);
  return (
    `M${r1(x + Math.cos(a1) * l1)} ${r1(y + Math.sin(a1) * l1)} L${r1(x)} ${r1(y)} ` +
    `L${r1(x + Math.cos(a2) * l2)} ${r1(y + Math.sin(a2) * l2)}`
  );
}

/**
 * A loose pencil loop around a box, like circling a word. It starts a little
 * past the top and overshoots its start, the way people actually draw circles.
 */
export function handEllipse(cx: number, cy: number, rx: number, ry: number, rand: Rand) {
  const steps = 14;
  const start = -Math.PI / 2 + jitter(rand, 0.4);
  const turns = 1.12 + rand() * 0.1;
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * Math.PI * 2 * turns;
    const k = 1 + jitter(rand, 0.06);
    points.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  return smoothPath(points);
}

/** An uneven highlighter swipe filling most of a w x h box. */
export function handHighlight(w: number, h: number, rand: Rand) {
  const top = h * 0.18;
  const bottom = h * 0.92;
  return (
    `M${r1(jitter(rand, 2))} ${r1(top + jitter(rand, 2))} ` +
    `Q${r1(w * 0.5)} ${r1(top - 2 + jitter(rand, 2))} ${r1(w + jitter(rand, 3))} ${r1(top + jitter(rand, 2))} ` +
    `L${r1(w + jitter(rand, 3))} ${r1(bottom + jitter(rand, 2))} ` +
    `Q${r1(w * 0.5)} ${r1(bottom + 2 + jitter(rand, 2))} ${r1(jitter(rand, 2))} ${r1(bottom + jitter(rand, 2))} Z`
  );
}

/** A wavy pencil underline of the given width. */
export function handSquiggle(w: number, rand: Rand, amp = 1.6) {
  const segs = Math.max(3, Math.round(w / 14));
  const step = w / segs;
  let d = `M0 ${r1(3 + jitter(rand, 0.5))}`;
  for (let i = 1; i <= segs; i++) {
    const y = i % 2 ? 3 - amp : 3 + amp;
    d += ` Q${r1(step * (i - 0.5))} ${r1(y + jitter(rand, 0.5))} ${r1(step * i)} ${r1(3 + jitter(rand, 0.4))}`;
  }
  return d;
}

/** Catmull-Rom style smoothing through points into cubic bezier segments. */
function smoothPath(points: [number, number][]) {
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}
