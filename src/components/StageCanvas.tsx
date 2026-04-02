import { useRef, useEffect, useCallback } from 'react';
import type { Point, Rect, ReflectionSegment } from '../types';

interface Props {
  image: HTMLImageElement | null;
  stageBounds: Rect | null;
  characterPos: Point | null;
  segments: ReflectionSegment[];
  blockRects: Rect[];
  blockEditMode: boolean;
  onCanvasTap: (imagePoint: Point) => void;
  onBlockDrag: (blockIndex: number, imagePoint: Point) => void;
  onCharacterDrag: (imagePoint: Point) => void;
}

function drawStyledLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  scale: number,
  color: string,
  glowColor: string,
) {
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x1 * scale, y1 * scale);
  ctx.lineTo(x2 * scale, y2 * scale);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1 * scale, y1 * scale);
  ctx.lineTo(x2 * scale, y2 * scale);
  ctx.stroke();
}

function drawGuideLines(
  ctx: CanvasRenderingContext2D,
  segments: ReflectionSegment[],
  stageBounds: Rect,
  characterPos: Point | null,
  scale: number,
) {
  if (segments.length === 0) return;

  const seg = segments[0];
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  if (Math.abs(dx) < 0.001) return;

  const slope = dy / dx;
  const top = stageBounds.y;
  const bottom = stageBounds.y + stageBounds.height;
  const left = stageBounds.x;
  const right = stageBounds.x + stageBounds.width;

  ctx.setLineDash([10, 6]);

  // Parallel guide lines through all four corners
  const corners: Point[] = [
    { x: left, y: top },
    { x: left, y: bottom },
    { x: right, y: top },
    { x: right, y: bottom },
  ];

  for (const corner of corners) {
    const xAtTop = corner.x + (top - corner.y) / slope;
    const xAtBottom = corner.x + (bottom - corner.y) / slope;
    drawStyledLine(ctx, xAtTop, top, xAtBottom, bottom, scale,
      'rgba(255, 200, 0, 0.7)', 'rgba(255, 200, 0, 0.25)');
  }

  // Reverse guide line: from character, opposite direction to first wall hit
  if (characterPos) {
    const revDx = -dx;
    const revDy = -dy;
    const len = Math.sqrt(revDx * revDx + revDy * revDy);
    if (len > 0.001) {
      const ndx = revDx / len;
      const ndy = revDy / len;

      // Find intersection with stage boundary in reverse direction
      let minT = Infinity;
      const walls = [
        { value: left, axis: 'x' as const },
        { value: right, axis: 'x' as const },
        { value: top, axis: 'y' as const },
        { value: bottom, axis: 'y' as const },
      ];
      for (const w of walls) {
        const t = w.axis === 'x'
          ? (Math.abs(ndx) > 1e-10 ? (w.value - characterPos.x) / ndx : Infinity)
          : (Math.abs(ndy) > 1e-10 ? (w.value - characterPos.y) / ndy : Infinity);
        if (t > 0.1 && t < minT) minT = t;
      }

      if (isFinite(minT)) {
        const endX = characterPos.x + ndx * minT;
        const endY = characterPos.y + ndy * minT;
        drawStyledLine(ctx, characterPos.x, characterPos.y, endX, endY, scale,
          'rgba(255, 100, 100, 0.6)', 'rgba(255, 100, 100, 0.2)');
      }
    }
  }

  ctx.setLineDash([]);
}

function getImagePoint(
  e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement,
  scale: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  let clientX: number, clientY: number;
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return { x: 0, y: 0 };
  }
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

function findBlockAtPoint(point: Point, blockRects: Rect[]): number {
  for (let i = 0; i < blockRects.length; i++) {
    const b = blockRects[i];
    if (
      point.x >= b.x && point.x <= b.x + b.width &&
      point.y >= b.y && point.y <= b.y + b.height
    ) {
      return i;
    }
  }
  return -1;
}

export function StageCanvas({
  image,
  stageBounds,
  characterPos,
  segments,
  blockRects,
  blockEditMode,
  onCanvasTap,
  onBlockDrag,
  onCharacterDrag,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(1);
  const hasScrolled = useRef(false);
  const draggingRef = useRef<{ type: 'block'; blockIndex: number } | { type: 'character' } | null>(null);
  const hasDragged = useRef(false);

  // Auto-scroll to show stage area after image loads
  useEffect(() => {
    if (!image || !stageBounds || hasScrolled.current) return;
    hasScrolled.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    requestAnimationFrame(() => {
      const scale = canvas.clientWidth / image.naturalWidth;
      const stageTopOnScreen = stageBounds.y * scale;
      const canvasRect = canvas.getBoundingClientRect();
      const scrollTarget = window.scrollY + canvasRect.top + stageTopOnScreen - 30;
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    });
  }, [image, stageBounds]);

  useEffect(() => {
    hasScrolled.current = false;
  }, [image]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const scale = displayWidth / image.naturalWidth;
    const displayHeight = image.naturalHeight * scale;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    scaleRef.current = scale;

    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    if (stageBounds) {
      ctx.strokeStyle = 'rgba(0, 255, 128, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        stageBounds.x * scale, stageBounds.y * scale,
        stageBounds.width * scale, stageBounds.height * scale,
      );
      ctx.setLineDash([]);
    }

    // Draw blocks
    for (const block of blockRects) {
      ctx.fillStyle = 'rgba(120, 120, 120, 0.6)';
      ctx.fillRect(block.x * scale, block.y * scale, block.width * scale, block.height * scale);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x * scale, block.y * scale, block.width * scale, block.height * scale);
    }

    if (characterPos) {
      ctx.beginPath();
      ctx.arc(characterPos.x * scale, characterPos.y * scale, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (stageBounds && segments.length > 0) {
      drawGuideLines(ctx, segments, stageBounds, characterPos, scale);
    }

    if (segments.length > 0) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(segments[0].start.x * scale, segments[0].start.y * scale);
      for (const seg of segments) {
        ctx.lineTo(seg.end.x * scale, seg.end.y * scale);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(segments[0].start.x * scale, segments[0].start.y * scale);
      for (const seg of segments) {
        ctx.lineTo(seg.end.x * scale, seg.end.y * scale);
      }
      ctx.stroke();

      for (let i = 0; i < segments.length - 1; i++) {
        const pt = segments[i].end;
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.fill();
      }
    }
  }, [image, stageBounds, characterPos, segments, blockRects]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Touch/mouse drag handling for blocks and character
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const CHAR_HIT_RADIUS = 30; // pixels in image coords

    const isNearCharacter = (point: Point): boolean => {
      if (!characterPos) return false;
      const dx = point.x - characterPos.x;
      const dy = point.y - characterPos.y;
      return Math.sqrt(dx * dx + dy * dy) < CHAR_HIT_RADIUS;
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      if (!image) return;
      const scale = scaleRef.current;
      const point = getImagePoint(e, canvas, scale);

      if (blockEditMode) {
        const hitIndex = findBlockAtPoint(point, blockRects);
        if (hitIndex >= 0) {
          e.preventDefault();
          draggingRef.current = { type: 'block', blockIndex: hitIndex };
          hasDragged.current = false;
        }
      } else if (isNearCharacter(point)) {
        e.preventDefault();
        draggingRef.current = { type: 'character' };
        hasDragged.current = false;
      }
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!draggingRef.current || !image) return;
      e.preventDefault();
      const scale = scaleRef.current;
      const point = getImagePoint(e, canvas, scale);
      hasDragged.current = true;

      if (draggingRef.current.type === 'block') {
        onBlockDrag(draggingRef.current.blockIndex, point);
      } else {
        onCharacterDrag(point);
      }
    };

    const handleEnd = () => {
      draggingRef.current = null;
    };

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
    };
  }, [blockEditMode, blockRects, characterPos, image, onBlockDrag, onCharacterDrag]);

  const handleTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Skip if we just finished a drag
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    e.preventDefault();
    const scale = scaleRef.current;
    const point = getImagePoint(e, canvas, scale);
    onCanvasTap(point);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      onClick={handleTap}
      onTouchEnd={handleTap}
    />
  );
}
