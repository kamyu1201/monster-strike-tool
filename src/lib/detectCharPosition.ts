import type { Point, Rect } from '../types';
import {
  LABEL_TO_CHAR_OFFSET_X_RATIO,
  LABEL_TO_CHAR_OFFSET_Y_RATIO,
} from '../constants';

const LABEL_NAMES = ['1st', '2nd', '3rd', '4th'] as const;

/**
 * Load a template image from the public/templates directory.
 */
async function loadTemplate(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `${import.meta.env.BASE_URL}templates/${name}.png`;
  });
}

/**
 * Get pixel data from an image drawn onto a temporary canvas.
 */
function getImageData(
  image: HTMLImageElement,
  region?: Rect,
): ImageData {
  const canvas = document.createElement('canvas');
  const x = region?.x ?? 0;
  const y = region?.y ?? 0;
  const w = region?.width ?? image.naturalWidth;
  const h = region?.height ?? image.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Normalized cross-correlation template matching.
 * Returns the (x, y) position of the best match and its score.
 *
 * To keep it fast, we:
 * - Search only within the stage bounds
 * - Skip every `step` pixels
 * - Only use grayscale
 */
function templateMatch(
  sourceData: ImageData,
  templateData: ImageData,
  step: number = 2,
): { x: number; y: number; score: number } {
  const sw = sourceData.width;
  const sh = sourceData.height;
  const tw = templateData.width;
  const th = templateData.height;
  const src = sourceData.data;
  const tpl = templateData.data;

  // Pre-compute template grayscale and stats
  const tGray = new Float32Array(tw * th);
  let tMean = 0;
  for (let i = 0; i < tw * th; i++) {
    const g = (tpl[i * 4] + tpl[i * 4 + 1] + tpl[i * 4 + 2]) / 3;
    tGray[i] = g;
    tMean += g;
  }
  tMean /= tGray.length;

  let tStdDev = 0;
  for (let i = 0; i < tGray.length; i++) {
    tStdDev += (tGray[i] - tMean) ** 2;
  }
  tStdDev = Math.sqrt(tStdDev / tGray.length);

  if (tStdDev < 1) {
    return { x: 0, y: 0, score: 0 }; // Template is essentially flat
  }

  let bestScore = -1;
  let bestX = 0;
  let bestY = 0;

  for (let sy = 0; sy <= sh - th; sy += step) {
    for (let sx = 0; sx <= sw - tw; sx += step) {
      // Compute NCC at this position
      let sMean = 0;
      for (let ty = 0; ty < th; ty += step) {
        for (let tx = 0; tx < tw; tx += step) {
          const si = ((sy + ty) * sw + (sx + tx)) * 4;
          sMean += (src[si] + src[si + 1] + src[si + 2]) / 3;
        }
      }
      const sampledCount = Math.ceil(th / step) * Math.ceil(tw / step);
      sMean /= sampledCount;

      let numer = 0;
      let sVar = 0;
      for (let ty = 0; ty < th; ty += step) {
        for (let tx = 0; tx < tw; tx += step) {
          const si = ((sy + ty) * sw + (sx + tx)) * 4;
          const sg = (src[si] + src[si + 1] + src[si + 2]) / 3 - sMean;
          const tg = tGray[ty * tw + tx] - tMean;
          numer += sg * tg;
          sVar += sg * sg;
        }
      }

      const sStdDev = Math.sqrt(sVar / sampledCount);
      if (sStdDev < 1) continue;

      const score = numer / (sampledCount * sStdDev * tStdDev);
      if (score > bestScore) {
        bestScore = score;
        bestX = sx;
        bestY = sy;
      }
    }
  }

  // Refine around best position with step=1 if we used a larger step
  if (step > 1) {
    const refineRange = step * 2;
    const startX = Math.max(0, bestX - refineRange);
    const startY = Math.max(0, bestY - refineRange);
    const endX = Math.min(sw - tw, bestX + refineRange);
    const endY = Math.min(sh - th, bestY + refineRange);

    for (let sy = startY; sy <= endY; sy++) {
      for (let sx = startX; sx <= endX; sx++) {
        let sMean = 0;
        for (let ty = 0; ty < th; ty++) {
          for (let tx = 0; tx < tw; tx++) {
            const si = ((sy + ty) * sw + (sx + tx)) * 4;
            sMean += (src[si] + src[si + 1] + src[si + 2]) / 3;
          }
        }
        sMean /= tGray.length;

        let numer = 0;
        let sVar = 0;
        for (let ty = 0; ty < th; ty++) {
          for (let tx = 0; tx < tw; tx++) {
            const si = ((sy + ty) * sw + (sx + tx)) * 4;
            const sg = (src[si] + src[si + 1] + src[si + 2]) / 3 - sMean;
            const tg = tGray[ty * tw + tx] - tMean;
            numer += sg * tg;
            sVar += sg * sg;
          }
        }

        const sStdDev = Math.sqrt(sVar / tGray.length);
        if (sStdDev < 1) continue;

        const score = numer / (tGray.length * sStdDev * tStdDev);
        if (score > bestScore) {
          bestScore = score;
          bestX = sx;
          bestY = sy;
        }
      }
    }
  }

  return { x: bestX, y: bestY, score: bestScore };
}

/**
 * Detect the position of the turn character's label on the stage.
 *
 * @param image - The game screenshot
 * @param turnIndex - Which turn (0=1st, 1=2nd, 2=3rd, 3=4th)
 * @param stageBounds - The stage area rectangle
 * @returns The character position (center of the character, offset from label) or null
 */
export async function detectCharPosition(
  image: HTMLImageElement,
  turnIndex: number,
  stageBounds: Rect,
): Promise<Point | null> {
  const labelName = LABEL_NAMES[turnIndex];
  if (!labelName) return null;

  let template: HTMLImageElement;
  try {
    template = await loadTemplate(labelName);
  } catch {
    return null;
  }

  // Get image data for the stage area only (for performance)
  const sourceData = getImageData(image, stageBounds);
  const templateData = getImageData(template);

  // Run template matching
  const match = templateMatch(sourceData, templateData, 3);

  // Require a minimum correlation score
  if (match.score < 0.4) {
    return null;
  }

  // Convert match position back to full image coordinates
  // The match position is the top-left of the template in the stage area
  const labelCenterX = stageBounds.x + match.x + template.naturalWidth / 2;
  const labelCenterY = stageBounds.y + match.y + template.naturalHeight / 2;

  // Apply offset from label center to character center
  const charX = labelCenterX + image.naturalWidth * LABEL_TO_CHAR_OFFSET_X_RATIO;
  const charY = labelCenterY + image.naturalHeight * LABEL_TO_CHAR_OFFSET_Y_RATIO;

  return { x: charX, y: charY };
}

/**
 * Try to detect the turn character position automatically.
 * First detects which card is active, then finds the label on the stage.
 */
export async function autoDetectCharacter(
  image: HTMLImageElement,
  stageBounds: Rect,
): Promise<{ turnIndex: number; position: Point } | null> {
  // Try detecting the turn card
  const { detectTurnCard } = await import('./detectTurnCard');
  const turnIndex = detectTurnCard(image);

  if (turnIndex !== null) {
    // Try to find that character's label on the stage
    const position = await detectCharPosition(image, turnIndex, stageBounds);
    if (position) {
      return { turnIndex, position };
    }
  }

  // Fallback: try all labels and return the best match
  let bestResult: { turnIndex: number; position: Point; score: number } | null = null;

  for (let i = 0; i < LABEL_NAMES.length; i++) {
    let template: HTMLImageElement;
    try {
      template = await loadTemplate(LABEL_NAMES[i]);
    } catch {
      continue;
    }

    const sourceData = getImageData(image, stageBounds);
    const templateData = getImageData(template);
    const match = templateMatch(sourceData, templateData, 3);

    if (match.score > 0.4 && (!bestResult || match.score > bestResult.score)) {
      const labelCenterX = stageBounds.x + match.x + template.naturalWidth / 2;
      const labelCenterY = stageBounds.y + match.y + template.naturalHeight / 2;
      const charX = labelCenterX + image.naturalWidth * LABEL_TO_CHAR_OFFSET_X_RATIO;
      const charY = labelCenterY + image.naturalHeight * LABEL_TO_CHAR_OFFSET_Y_RATIO;

      bestResult = {
        turnIndex: i,
        position: { x: charX, y: charY },
        score: match.score,
      };
    }
  }

  return bestResult ? { turnIndex: bestResult.turnIndex, position: bestResult.position } : null;
}
