import type { Point, Rect, ReflectionSegment } from '../types';

type WallType = 'horizontal' | 'vertical';

interface WallHit {
  point: Point;
  wallType: WallType;
  t: number;
}

interface WallSegment {
  axis: 'x' | 'y';
  value: number;
  min: number;
  max: number;
}

/**
 * Compute reflection segments for a ray starting at `origin` with `angleDeg`
 * bouncing inside `bounds` (and off `blocks`) for up to `maxReflections` wall hits,
 * with a maximum total line length of `maxLength`.
 */
export function computeReflectionPath(
  origin: Point,
  angleDeg: number,
  bounds: Rect,
  maxReflections: number,
  maxLength: number,
  blocks: Rect[] = [],
): ReflectionSegment[] {
  const segments: ReflectionSegment[] = [];
  const angleRad = (angleDeg * Math.PI) / 180;
  let dx = Math.cos(angleRad);
  let dy = -Math.sin(angleRad); // Canvas Y is inverted
  let current: Point = { ...origin };
  let remainingLength = maxLength;

  // Build wall list, excluding blocks that contain the origin
  const activeBlocks = blocks.filter((b) => !isPointInsideRect(origin, b));
  let walls = buildWalls(bounds, activeBlocks);
  let skipBlocks = new Set(
    blocks.map((_, i) => i).filter((i) => isPointInsideRect(origin, blocks[i]))
  );

  for (let i = 0; i <= maxReflections && remainingLength > 0.1; i++) {
    const hit = findNearestWall(current, dx, dy, walls);
    if (!hit) break;

    const segLen = distance(current, hit.point);
    if (segLen > remainingLength) {
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
    if (hit.wallType === 'vertical') {
      dx = -dx;
    } else {
      dy = -dy;
    }

    // After first reflection, re-add any initially skipped blocks
    // (character has now left them)
    if (skipBlocks.size > 0) {
      walls = buildWalls(bounds, blocks);
      skipBlocks = new Set();
    }
  }

  return segments;
}

function buildWalls(bounds: Rect, blocks: Rect[]): WallSegment[] {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;

  const walls: WallSegment[] = [
    // Stage outer walls
    { axis: 'x', value: left, min: top, max: bottom },
    { axis: 'x', value: right, min: top, max: bottom },
    { axis: 'y', value: top, min: left, max: right },
    { axis: 'y', value: bottom, min: left, max: right },
  ];

  // Block walls
  for (const block of blocks) {
    const bLeft = block.x;
    const bRight = block.x + block.width;
    const bTop = block.y;
    const bBottom = block.y + block.height;

    walls.push(
      { axis: 'x', value: bLeft, min: bTop, max: bBottom },
      { axis: 'x', value: bRight, min: bTop, max: bBottom },
      { axis: 'y', value: bTop, min: bLeft, max: bRight },
      { axis: 'y', value: bBottom, min: bLeft, max: bRight },
    );
  }

  return walls;
}

function findNearestWall(
  origin: Point,
  dx: number,
  dy: number,
  walls: WallSegment[],
): WallHit | null {
  let bestHit: WallHit | null = null;

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
      if (py < w.min - 0.1 || py > w.max + 0.1) continue;
      py = Math.max(w.min, Math.min(w.max, py));
    } else {
      if (Math.abs(dy) < 1e-10) continue;
      t = (w.value - origin.y) / dy;
      if (t <= 1e-6) continue;
      px = origin.x + dx * t;
      py = w.value;
      if (px < w.min - 0.1 || px > w.max + 0.1) continue;
      px = Math.max(w.min, Math.min(w.max, px));
    }

    if (!bestHit || t < bestHit.t) {
      bestHit = {
        point: { x: px, y: py },
        wallType: w.axis === 'x' ? 'vertical' : 'horizontal',
        t,
      };
    }
  }

  return bestHit;
}

function isPointInsideRect(point: Point, rect: Rect): boolean {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  );
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
