import { useMemo } from 'react';
import type { Point, Rect, ReflectionSegment } from '../types';
import { computeReflectionPath } from '../lib/reflectionGeometry';

export function useReflectionLine(
  origin: Point | null,
  angle: number,
  stageBounds: Rect | null,
  reflectionCount: number,
  lineLength: number,
): ReflectionSegment[] {
  return useMemo(() => {
    if (!origin || !stageBounds) return [];
    return computeReflectionPath(origin, angle, stageBounds, reflectionCount, lineLength);
  }, [origin, angle, stageBounds, reflectionCount, lineLength]);
}
