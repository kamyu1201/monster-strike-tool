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
