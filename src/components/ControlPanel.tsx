import { useRef, useCallback, useEffect, useState } from 'react';
import { ANGLE_STEP, ANGLE_STEP_FAST } from '../constants';
import type { StageRatios } from '../lib/stageBounds';
import { BoundsAdjuster } from './BoundsAdjuster';

interface Props {
  angle: number;
  reflectionCount: number;
  lineLength: number;
  maxLineLength: number;
  stageRatios: StageRatios;
  onAngleChange: (angle: number) => void;
  onAngleDelta: (delta: number) => void;
  onReflectionCountChange: (count: number) => void;
  onLineLengthChange: (length: number) => void;
  onStageRatiosChange: (ratios: StageRatios) => void;
  onReset: () => void;
}

export function ControlPanel({
  angle,
  reflectionCount,
  lineLength,
  maxLineLength,
  stageRatios,
  onAngleChange,
  onAngleDelta,
  onReflectionCountChange,
  onLineLengthChange,
  onStageRatiosChange,
  onReset,
}: Props) {
  const intervalRef = useRef<number | null>(null);
  const [showBounds, setShowBounds] = useState(false);

  const stopRepeat = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopRepeat;
  }, [stopRepeat]);

  const startRepeat = (delta: number) => {
    stopRepeat();
    onAngleDelta(delta);
    intervalRef.current = window.setInterval(() => {
      onAngleDelta(delta);
    }, 80);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3 space-y-3">
      {/* Angle controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onMouseDown={() => startRepeat(ANGLE_STEP_FAST)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(ANGLE_STEP_FAST); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &laquo;
        </button>
        <button
          onClick={() => onAngleChange(angle + ANGLE_STEP)}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &lsaquo;
        </button>

        <div className="flex-1 text-center text-white text-sm font-mono">
          {angle.toFixed(1)}&deg;
        </div>

        <button
          onClick={() => onAngleChange(angle - ANGLE_STEP)}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &rsaquo;
        </button>
        <button
          onMouseDown={() => startRepeat(-ANGLE_STEP_FAST)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(-ANGLE_STEP_FAST); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &raquo;
        </button>
      </div>

      {/* Reflection count & line length */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs whitespace-nowrap">反射</span>
          <button
            onClick={() => onReflectionCountChange(Math.max(1, reflectionCount - 1))}
            className="w-8 h-8 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
          >
            -
          </button>
          <span className="text-white text-sm font-mono w-4 text-center">
            {reflectionCount}
          </span>
          <button
            onClick={() => onReflectionCountChange(Math.min(20, reflectionCount + 1))}
            className="w-8 h-8 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
          >
            +
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowBounds((v) => !v)}
          className={`px-2 h-8 rounded text-xs font-medium transition-colors select-none ${
            showBounds ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          枠調整
        </button>

        <button
          onClick={onReset}
          className="px-2 h-8 bg-gray-700 rounded text-gray-300 text-xs active:bg-gray-600 select-none"
        >
          リセット
        </button>
      </div>

      {/* Bounds adjuster (collapsible) */}
      {showBounds && (
        <BoundsAdjuster ratios={stageRatios} onChange={onStageRatiosChange} />
      )}
    </div>
  );
}
