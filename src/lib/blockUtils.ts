import type { Rect, BlockRatio } from '../types';
import { BLOCK_WIDTH_RATIO, BLOCK_HEIGHT_RATIO } from '../constants';

/** Convert block ratios (relative to stage) to pixel Rects */
export function blockRatiosToRects(
  blockRatios: BlockRatio[],
  stageBounds: Rect,
): Rect[] {
  const blockW = stageBounds.width * BLOCK_WIDTH_RATIO;
  const blockH = stageBounds.height * BLOCK_HEIGHT_RATIO;

  return blockRatios.map((b) => ({
    x: stageBounds.x + b.x * stageBounds.width - blockW / 2,
    y: stageBounds.y + b.y * stageBounds.height - blockH / 2,
    width: blockW,
    height: blockH,
  }));
}

/** Convert a tap point (image coords) to a block ratio relative to stage */
export function pointToBlockRatio(
  point: { x: number; y: number },
  stageBounds: Rect,
): BlockRatio {
  return {
    x: (point.x - stageBounds.x) / stageBounds.width,
    y: (point.y - stageBounds.y) / stageBounds.height,
  };
}

/** Check if a point is near a block (for deletion) */
export function findBlockAtPoint(
  point: { x: number; y: number },
  blockRects: Rect[],
): number {
  for (let i = 0; i < blockRects.length; i++) {
    const b = blockRects[i];
    if (
      point.x >= b.x &&
      point.x <= b.x + b.width &&
      point.y >= b.y &&
      point.y <= b.y + b.height
    ) {
      return i;
    }
  }
  return -1;
}
