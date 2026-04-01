import {
  CARD_REGION_TOP_RATIO,
  CARD_REGION_BOTTOM_RATIO,
  CARD_COUNT,
  CARD_PADDING_RATIO,
} from '../constants';

/**
 * Detect which of the 4 bottom cards is raised (= current turn).
 *
 * The active card is shifted up by ~2-3% of screen height.
 * We sample a thin strip above the normal card top for each slot.
 * The slot with the most non-background content is the raised card.
 */
export function detectTurnCard(
  image: HTMLImageElement,
): number | null {
  const canvas = document.createElement('canvas');
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const cardTop = Math.round(h * CARD_REGION_TOP_RATIO);
  const cardBottom = Math.round(h * CARD_REGION_BOTTOM_RATIO);
  const cardHeight = cardBottom - cardTop;
  const stripWidth = Math.round(w * (1 - 2 * CARD_PADDING_RATIO) / CARD_COUNT);
  const padLeft = Math.round(w * CARD_PADDING_RATIO);

  // Sample a strip just above the normal card top position.
  // The raised card will have card content in this strip; others won't.
  const probeHeight = Math.round(cardHeight * 0.25);
  const probeTop = cardTop - probeHeight;

  const scores: number[] = [];

  for (let i = 0; i < CARD_COUNT; i++) {
    const x = padLeft + i * stripWidth;
    // Sample the center portion of each card slot
    const innerPad = Math.round(stripWidth * 0.15);
    const sampleX = x + innerPad;
    const sampleW = stripWidth - 2 * innerPad;

    const data = ctx.getImageData(sampleX, probeTop, sampleW, probeHeight).data;

    // Calculate average brightness and color variance
    let totalBrightness = 0;
    let totalVariance = 0;
    const pixelCount = sampleW * probeHeight;

    for (let p = 0; p < data.length; p += 4) {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      // Color variance = how different r,g,b are from each other
      const mean = brightness;
      totalVariance += Math.abs(r - mean) + Math.abs(g - mean) + Math.abs(b - mean);
    }

    // Score: combine brightness and color variance
    // The raised card has colorful character art, while non-raised area is dark
    const avgBrightness = totalBrightness / pixelCount;
    const avgVariance = totalVariance / pixelCount;
    scores.push(avgBrightness + avgVariance * 0.5);
  }

  // The raised card should have a significantly higher score
  const maxScore = Math.max(...scores);
  const secondMax = [...scores].sort((a, b) => b - a)[1];

  // Require the top score to be at least 30% above the second
  if (maxScore < 30 || maxScore < secondMax * 1.3) {
    return null; // Can't confidently determine
  }

  return scores.indexOf(maxScore);
}
