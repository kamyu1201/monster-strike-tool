import { useState, useMemo, useCallback, useRef } from 'react';
import type { Point, BlockRatio } from './types';
import { calcStageBounds, type StageRatios } from './lib/stageBounds';
import { blockRatiosToRects, pointToBlockRatio, findBlockAtPoint } from './lib/blockUtils';
import { autoDetectCharacter, detectCharPosition } from './lib/detectCharPosition';
import { useReflectionLine } from './hooks/useReflectionLine';
import { StageCanvas } from './components/StageCanvas';
import { ControlPanel } from './components/ControlPanel';
import {
  STAGE_LEFT_RATIO,
  STAGE_RIGHT_RATIO,
  STAGE_TOP_RATIO,
  STAGE_BOTTOM_RATIO,
  DEFAULT_ANGLE,
  DEFAULT_REFLECTION_COUNT,
  DEFAULT_LINE_LENGTH_RATIO,
} from './constants';

const DEFAULT_RATIOS: StageRatios = {
  left: STAGE_LEFT_RATIO,
  right: STAGE_RIGHT_RATIO,
  top: STAGE_TOP_RATIO,
  bottom: STAGE_BOTTOM_RATIO,
};

const STAGE_RATIOS_KEY = 'monstrike-stage-ratios';

function loadSavedRatios(): StageRatios {
  try {
    const saved = localStorage.getItem(STAGE_RATIOS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.left === 'number' &&
        typeof parsed.right === 'number' &&
        typeof parsed.top === 'number' &&
        typeof parsed.bottom === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_RATIOS;
}

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [characterPos, setCharacterPos] = useState<Point | null>(null);
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [reflectionCount, setReflectionCount] = useState(DEFAULT_REFLECTION_COUNT);
  const [lineLengthRatio, setLineLengthRatio] = useState(DEFAULT_LINE_LENGTH_RATIO);
  const [stageRatios, setStageRatios] = useState<StageRatios>(loadSavedRatios);
  const [blockRatios, setBlockRatios] = useState<BlockRatio[]>([]);
  const [blockEditMode, setBlockEditMode] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedTurn, setDetectedTurn] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageBounds = useMemo(() => {
    if (!image) return null;
    return calcStageBounds(image.naturalWidth, image.naturalHeight, stageRatios);
  }, [image, stageRatios]);

  const stageDiagonal = useMemo(() => {
    if (!stageBounds) return 1000;
    return Math.sqrt(stageBounds.width ** 2 + stageBounds.height ** 2);
  }, [stageBounds]);

  const lineLength = stageDiagonal * lineLengthRatio;

  const blockRects = useMemo(() => {
    if (!stageBounds) return [];
    return blockRatiosToRects(blockRatios, stageBounds);
  }, [blockRatios, stageBounds]);

  const segments = useReflectionLine(
    characterPos,
    angle,
    stageBounds,
    reflectionCount,
    lineLength,
    blockRects,
  );

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setImage(img);
    setCharacterPos(null);
    setDetectedTurn(null);
    setAngle(DEFAULT_ANGLE);
    setReflectionCount(DEFAULT_REFLECTION_COUNT);
    setLineLengthRatio(DEFAULT_LINE_LENGTH_RATIO);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => handleImageLoad(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const handleCanvasTap = useCallback((point: Point) => {
    if (!stageBounds) return;
    const { x, y, width, height } = stageBounds;
    if (point.x < x || point.x > x + width || point.y < y || point.y > y + height) return;

    if (blockEditMode) {
      const currentBlockRects = blockRatiosToRects(blockRatios, stageBounds);
      const hitIndex = findBlockAtPoint(point, currentBlockRects);
      if (hitIndex >= 0) {
        setBlockRatios((prev) => prev.filter((_, i) => i !== hitIndex));
      } else {
        const ratio = pointToBlockRatio(point, stageBounds);
        setBlockRatios((prev) => [...prev, ratio]);
      }
      return;
    }

    setCharacterPos(point);
  }, [stageBounds, blockEditMode, blockRatios]);

  const handleCharacterDrag = useCallback((point: Point) => {
    setCharacterPos(point);
  }, []);

  const handleBlockDrag = useCallback((blockIndex: number, point: Point) => {
    if (!stageBounds) return;
    const ratio = pointToBlockRatio(point, stageBounds);
    setBlockRatios((prev) => {
      const next = [...prev];
      next[blockIndex] = ratio;
      return next;
    });
  }, [stageBounds]);

  const handleStageRatiosChange = useCallback((ratios: StageRatios) => {
    setStageRatios(ratios);
    try {
      localStorage.setItem(STAGE_RATIOS_KEY, JSON.stringify(ratios));
    } catch {
      // ignore
    }
  }, []);

  const handleAutoDetect = useCallback(async () => {
    if (!image || !stageBounds || detecting) return;
    setDetecting(true);
    try {
      const result = await autoDetectCharacter(image, stageBounds);
      if (result) {
        setCharacterPos(result.position);
        setDetectedTurn(result.turnIndex);
      } else {
        setDetectedTurn(null);
      }
    } finally {
      setDetecting(false);
    }
  }, [image, stageBounds, detecting]);

  const handleManualTurnSelect = useCallback(async (turnIndex: number) => {
    if (!image || !stageBounds || detecting) return;
    setDetecting(true);
    try {
      const position = await detectCharPosition(image, turnIndex, stageBounds);
      if (position) {
        setCharacterPos(position);
        setDetectedTurn(turnIndex);
      }
    } finally {
      setDetecting(false);
    }
  }, [image, stageBounds, detecting]);

  const handleAngleDelta = useCallback((delta: number) => {
    setAngle((prev) => prev + delta);
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-gray-950">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />
      {!image ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <h1 className="text-white text-xl font-bold">モンスト反射シミュレーター</h1>
          <p className="text-gray-400 text-sm text-center">
            ゲームのスクリーンショットをアップロードして、
            反射ルートをシミュレーションします
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl text-lg font-medium active:bg-indigo-700 transition-colors"
          >
            スクリーンショットを選択
          </button>
        </div>
      ) : (
        <div className="flex flex-col pb-48">
          <StageCanvas
            image={image}
            stageBounds={stageBounds}
            characterPos={characterPos}
            segments={segments}
            blockRects={blockRects}
            blockEditMode={blockEditMode}
            onCanvasTap={handleCanvasTap}
            onBlockDrag={handleBlockDrag}
            onCharacterDrag={handleCharacterDrag}
          />
          {!characterPos && !blockEditMode && (
            <div className="text-center text-yellow-400 text-sm py-2 bg-gray-900/80">
              画面をタップしてキャラクター位置を指定してください
            </div>
          )}
          <ControlPanel
            angle={angle}
            reflectionCount={reflectionCount}
            stageRatios={stageRatios}
            blocks={blockRatios}
            blockEditMode={blockEditMode}
            detecting={detecting}
            detectedTurn={detectedTurn}
            onAngleDelta={handleAngleDelta}
            onReflectionCountChange={setReflectionCount}
            onStageRatiosChange={handleStageRatiosChange}
            onBlocksChange={setBlockRatios}
            onBlockEditModeChange={setBlockEditMode}
            onAutoDetect={handleAutoDetect}
            onManualTurnSelect={handleManualTurnSelect}
            onImageSelect={() => fileInputRef.current?.click()}
          />
        </div>
      )}
    </div>
  );
}

export default App;
