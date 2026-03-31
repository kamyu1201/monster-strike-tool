import type { Rect } from '../types';

export interface StageRatios {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function calcStageBounds(
  imageWidth: number,
  imageHeight: number,
  ratios: StageRatios,
): Rect {
  const x = Math.round(imageWidth * ratios.left);
  const y = Math.round(imageHeight * ratios.top);
  const right = Math.round(imageWidth * ratios.right);
  const bottom = Math.round(imageHeight * ratios.bottom);
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}
