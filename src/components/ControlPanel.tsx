import { useState } from 'react';
import type { StageRatios } from '../lib/stageBounds';
import type { BlockRatio } from '../types';
import { BoundsAdjuster } from './BoundsAdjuster';
import { BlockPanel } from './BlockPanel';

const TURN_LABELS = ['1st', '2nd', '3rd', '4th'] as const;

interface Props {
  reflectionCount: number;
  stageRatios: StageRatios;
  blocks: BlockRatio[];
  blockEditMode: boolean;
  detecting: boolean;
  detectedTurn: number | null;
  onFlip: () => void;
  onReflectionCountChange: (count: number) => void;
  onStageRatiosChange: (ratios: StageRatios) => void;
  onBlocksChange: (blocks: BlockRatio[]) => void;
  onBlockEditModeChange: (mode: boolean) => void;
  onAutoDetect: () => void;
  onManualTurnSelect: (turnIndex: number) => void;
  onImageSelect: () => void;
}

export function ControlPanel({
  reflectionCount,
  stageRatios,
  blocks,
  blockEditMode,
  detecting,
  detectedTurn,
  onFlip,
  onReflectionCountChange,
  onStageRatiosChange,
  onBlocksChange,
  onBlockEditModeChange,
  onAutoDetect,
  onManualTurnSelect,
  onImageSelect,
}: Props) {
  const [showBounds, setShowBounds] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3 space-y-3">

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

        <button
          onClick={onFlip}
          className="px-3 h-8 bg-blue-600 rounded text-white text-xs font-medium active:bg-blue-700 select-none"
        >
          180°反転
        </button>

        <div className="flex-1" />

        <button
          onClick={onAutoDetect}
          disabled={detecting}
          className={`px-2 h-8 rounded text-xs font-medium transition-colors select-none ${
            detecting
              ? 'bg-gray-600 text-gray-400 cursor-wait'
              : 'bg-orange-600 text-white active:bg-orange-700'
          }`}
        >
          {detecting ? '検出中...' : detectedTurn !== null ? `検出(${TURN_LABELS[detectedTurn]})` : '自動検出'}
        </button>

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
      </div>

      {/* Manual turn select */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs whitespace-nowrap">手番指定</span>
        {TURN_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => onManualTurnSelect(i)}
            disabled={detecting}
            className={`flex-1 h-7 rounded text-xs font-medium transition-colors select-none ${
              detectedTurn === i
                ? 'bg-orange-600 text-white'
                : detecting
                  ? 'bg-gray-700 text-gray-500 cursor-wait'
                  : 'bg-gray-700 text-gray-300 active:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
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
