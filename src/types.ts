export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReflectionSegment {
  start: Point;
  end: Point;
}

export type TurnOrder = 0 | 1 | 2 | 3;

/** Block position stored as ratios relative to stage bounds (0-1) */
export interface BlockRatio {
  x: number; // center x as ratio of stage width
  y: number; // center y as ratio of stage height
}

export interface BlockPreset {
  name: string;
  blocks: BlockRatio[];
}

