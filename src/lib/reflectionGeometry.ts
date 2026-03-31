import type { Point, Rect, ReflectionSegment } from '../types';

/**
 * Compute reflection segments for a ray starting at `origin` with `angleDeg`
 * bouncing inside `bounds` for up to `maxReflections` wall hits,
 * with a maximum total line length of `maxLength`.
 */
export function computeReflectionPath(
  origin: Point,
  angleDeg: number,
  bounds: Rect,
  maxReflections: number,
  maxLength: number,
): ReflectionSegment[] {
  const segments: ReflectionSegment[] = [];
  const angleRad = (angleDeg * Math.PI) / 180;
  let dx = Math.cos(angleRad);
  let dy = -Math.sin(angleRad); // Canvas Y is inverted
  let current: Point = { ...origin };
  let remainingLength = maxLength;

  for (let i = 0; i <= maxReflections && remainingLength > 0.1; i++) {
    const hit = findWallIntersection(current, dx, dy, bounds);
    if (!hit) break;

    const segLen = distance(current, hit.point);
    if (segLen > remainingLength) {
      // Truncate this segment
      const ratio = remainingLength / segLen;
      const end: Point = {
        x: current.x + (hit.point.x - current.x) * ratio,
        y: current.y + (hit.point.y - current.y) * ratio,
      };
      segments.push({ start: { ...current }, end });
      break;
    }

    segments.push({ start: { ...current }, end: hit.point });
    remainingLength -= segLen;
    current = hit.point;

    // Reflect direction
    if (hit.wall === 'left' || hit.wall === 'right') {
      dx = -dx;
    } else {
      dy = -dy;
    }
  }

  return segments;
}

type Wall = 'top' | 'bottom' | 'left' | 'right';

interface WallHit {
  point: Point;
  wall: Wall;
  t: number;
}

function findWallIntersection(
  origin: Point,
  dx: number,
  dy: number,
  bounds: Rect,
): WallHit | null {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;

  let bestHit: WallHit | null = null;

  // Check each wall
  const walls: { wall: Wall; axis: 'x' | 'y'; value: number }[] = [
    { wall: 'left', axis: 'x', value: left },
    { wall: 'right', axis: 'x', value: right },
    { wall: 'top', axis: 'y', value: top },
    { wall: 'bottom', axis: 'y', value: bottom },
  ];

  for (const w of walls) {
    let t: number;
    let px: number;
    let py: number;

    if (w.axis === 'x') {
      if (Math.abs(dx) < 1e-10) continue;
      t = (w.value - origin.x) / dx;
      if (t <= 1e-6) continue;
      px = w.value;
      py = origin.y + dy * t;
      if (py < top - 0.1 || py > bottom + 0.1) continue;
    } else {
      if (Math.abs(dy) < 1e-10) continue;
      t = (w.value - origin.y) / dy;
      if (t <= 1e-6) continue;
      px = origin.x + dx * t;
      py = w.value;
      if (px < left - 0.1 || px > right + 0.1) continue;
    }

    // Clamp to bounds
    px = Math.max(left, Math.min(right, px));
    py = Math.max(top, Math.min(bottom, py));

    if (!bestHit || t < bestHit.t) {
      bestHit = { point: { x: px, y: py }, wall: w.wall, t };
    }
  }

  return bestHit;
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
