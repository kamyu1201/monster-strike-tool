import { useRef, useEffect, useCallback } from 'react';
import type { Point, Rect, ReflectionSegment } from '../types';

interface Props {
  image: HTMLImageElement | null;
  stageBounds: Rect | null;
  characterPos: Point | null;
  segments: ReflectionSegment[];
  onCanvasTap: (imagePoint: Point) => void;
}

export function StageCanvas({
  image,
  stageBounds,
  characterPos,
  segments,
  onCanvasTap,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(1);

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

    // Draw background image
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    // Draw stage bounds
    if (stageBounds) {
      ctx.strokeStyle = 'rgba(0, 255, 128, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        stageBounds.x * scale,
        stageBounds.y * scale,
        stageBounds.width * scale,
        stageBounds.height * scale,
      );
      ctx.setLineDash([]);
    }

    // Draw character position marker
    if (characterPos) {
      ctx.beginPath();
      ctx.arc(characterPos.x * scale, characterPos.y * scale, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw reflection segments
    if (segments.length > 0) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Glow effect
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(segments[0].start.x * scale, segments[0].start.y * scale);
      for (const seg of segments) {
        ctx.lineTo(seg.end.x * scale, seg.end.y * scale);
      }
      ctx.stroke();

      // Main line
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(segments[0].start.x * scale, segments[0].start.y * scale);
      for (const seg of segments) {
        ctx.lineTo(seg.end.x * scale, seg.end.y * scale);
      }
      ctx.stroke();

      // Reflection points
      for (let i = 0; i < segments.length - 1; i++) {
        const pt = segments[i].end;
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.fill();
      }
    }
  }, [image, stageBounds, characterPos, segments]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    const scale = scaleRef.current;

    onCanvasTap({
      x: canvasX / scale,
      y: canvasY / scale,
    });
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
