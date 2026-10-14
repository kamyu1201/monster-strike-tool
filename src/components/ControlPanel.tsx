import { useRef, useCallback, useEffect, useState } from 'react';
import { ANGLE_STEP, ANGLE_STEP_FAST } from '../constants';
import type { StageRatios } from '../lib/stageBounds';
import type { BlockRatio } from '../types';
import { BoundsAdjuster } from './BoundsAdjuster';
import { BlockPanel } from './BlockPanel';

interface Props {
  reflectionCount: number;
  stageRatios: StageRatios;
  blocks: BlockRatio[];
  blockEditMode: boolean;
  reverseShotMode: boolean;
  onFlipVertical: () => void;
  onFlipHorizontal: () => void;
  onAngleDelta: (delta: number) => void;
  onPosDelta: (dx: number, dy: number) => void;
  onReflectionCountChange: (count: number) => void;
  onStageRatiosChange: (ratios: StageRatios) => void;
  onBlocksChange: (blocks: BlockRatio[]) => void;
  onBlockEditModeChange: (mode: boolean) => void;
  onReverseShotModeChange: (mode: boolean) => void;
  onImageSelect: () => void;
}

export function ControlPanel({
  reflectionCount,
  stageRatios,
  blocks,
  blockEditMode,
  reverseShotMode,
  onFlipVertical,
  onFlipHorizontal,
  onAngleDelta,
  onPosDelta,
  onReflectionCountChange,
  onStageRatiosChange,
  onBlocksChange,
  onBlockEditModeChange,
  onReverseShotModeChange,
  onImageSelect,
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

  const startRepeat = (action: () => void) => {
    stopRepeat();
    action();
    intervalRef.current = window.setInterval(action, 80);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3 space-y-3">
      {/* Angle controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onMouseDown={() => startRepeat(() => onAngleDelta(ANGLE_STEP_FAST))}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onAngleDelta(ANGLE_STEP_FAST)); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &laquo;
        </button>
        <button
          onMouseDown={() => startRepeat(() => onAngleDelta(ANGLE_STEP))}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onAngleDelta(ANGLE_STEP)); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &lsaquo;
        </button>

        <button
          onClick={onFlipVertical}
          className="flex-1 h-12 bg-blue-600 rounded-lg text-white text-xs font-medium active:bg-blue-700 select-none"
        >
          縦軸反転
        </button>
        <button
          onClick={onFlipHorizontal}
          className="flex-1 h-12 bg-blue-600 rounded-lg text-white text-xs font-medium active:bg-blue-700 select-none"
        >
          横軸反転
        </button>

        <button
          onMouseDown={() => startRepeat(() => onAngleDelta(-ANGLE_STEP))}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onAngleDelta(-ANGLE_STEP)); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &rsaquo;
        </button>
        <button
          onMouseDown={() => startRepeat(() => onAngleDelta(-ANGLE_STEP_FAST))}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onAngleDelta(-ANGLE_STEP_FAST)); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
          className="w-12 h-12 bg-gray-700 rounded-lg text-white text-xl font-bold active:bg-gray-600 select-none"
        >
          &raquo;
        </button>
      </div>

      {/* Reflection count & options */}
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

        {/* Position adjustment */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs whitespace-nowrap">位置</span>
          <button
            onMouseDown={() => startRepeat(() => onPosDelta(-1, 0))}
            onMouseUp={stopRepeat}
            onMouseLeave={stopRepeat}
            onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onPosDelta(-1, 0)); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
            className="w-8 h-8 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onMouseDown={() => startRepeat(() => onPosDelta(0, -1))}
              onMouseUp={stopRepeat}
              onMouseLeave={stopRepeat}
              onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onPosDelta(0, -1)); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
              className="w-8 h-6 bg-gray-700 rounded text-white text-xs font-bold active:bg-gray-600 select-none"
            >
              ↑
            </button>
            <button
              onMouseDown={() => startRepeat(() => onPosDelta(0, 1))}
              onMouseUp={stopRepeat}
              onMouseLeave={stopRepeat}
              onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onPosDelta(0, 1)); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
              className="w-8 h-6 bg-gray-700 rounded text-white text-xs font-bold active:bg-gray-600 select-none"
            >
              ↓
            </button>
          </div>
          <button
            onMouseDown={() => startRepeat(() => onPosDelta(1, 0))}
            onMouseUp={stopRepeat}
            onMouseLeave={stopRepeat}
            onTouchStart={(e) => { e.preventDefault(); startRepeat(() => onPosDelta(1, 0)); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRepeat(); }}
            className="w-8 h-8 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
          >
            →
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={onImageSelect}
          className="px-2 h-8 bg-indigo-600 rounded text-white text-xs font-medium active:bg-indigo-700 select-none"
        >
          画像選択
        </button>

        <button
          onClick={() => setShowBounds((v) => !v)}
          className={`px-2 h-8 rounded text-xs font-medium transition-colors select-none ${
            showBounds ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          枠調整
        </button>

        <button
          onClick={() => onReverseShotModeChange(!reverseShotMode)}
          className={`px-2 h-8 rounded text-xs font-medium transition-colors select-none ${
            reverseShotMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300'
          }`}
        >
          逆弾
        </button>
      </div>

      {/* Block panel */}
      <BlockPanel
        blocks={blocks}
        editMode={blockEditMode}
        onEditModeChange={onBlockEditModeChange}
        onBlocksChange={onBlocksChange}
      />

      {/* Bounds adjuster (collapsible) */}
      {showBounds && (
        <BoundsAdjuster ratios={stageRatios} onChange={onStageRatiosChange} />
      )}
    </div>
  );
}
