import { useState, useMemo, useCallback } from 'react';
import type { Point } from './types';
import { calcStageBounds, type StageRatios } from './lib/stageBounds';
import { useReflectionLine } from './hooks/useReflectionLine';
import { ImageUploader } from './components/ImageUploader';
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

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [characterPos, setCharacterPos] = useState<Point | null>(null);
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [reflectionCount, setReflectionCount] = useState(DEFAULT_REFLECTION_COUNT);
  const [lineLengthRatio, setLineLengthRatio] = useState(DEFAULT_LINE_LENGTH_RATIO);
  const [stageRatios, setStageRatios] = useState<StageRatios>(DEFAULT_RATIOS);

  const stageBounds = useMemo(() => {
    if (!image) return null;
    return calcStageBounds(image.naturalWidth, image.naturalHeight, stageRatios);
  }, [image, stageRatios]);

  const stageDiagonal = useMemo(() => {
    if (!stageBounds) return 1000;
    return Math.sqrt(stageBounds.width ** 2 + stageBounds.height ** 2);
  }, [stageBounds]);

  const lineLength = stageDiagonal * lineLengthRatio;

  const segments = useReflectionLine(
    characterPos,
    angle,
    stageBounds,
    reflectionCount,
    lineLength,
  );

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setImage(img);
    setCharacterPos(null);
    setAngle(DEFAULT_ANGLE);
    setReflectionCount(DEFAULT_REFLECTION_COUNT);
    setLineLengthRatio(DEFAULT_LINE_LENGTH_RATIO);
  }, []);

  const handleCanvasTap = useCallback((point: Point) => {
    setCharacterPos(point);
  }, []);

  const handleAngleDelta = useCallback((delta: number) => {
    setAngle((prev) => prev + delta);
  }, []);

  const handleReset = useCallback(() => {
    setCharacterPos(null);
    setAngle(DEFAULT_ANGLE);
    setReflectionCount(DEFAULT_REFLECTION_COUNT);
    setLineLengthRatio(DEFAULT_LINE_LENGTH_RATIO);
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-gray-950">
      {!image ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <h1 className="text-white text-xl font-bold">モンスト反射シミュレーター</h1>
          <p className="text-gray-400 text-sm text-center">
            ゲームのスクリーンショットをアップロードして、
            反射ルートをシミュレーションします
          </p>
          <ImageUploader onImageLoad={handleImageLoad} />
        </div>
      ) : (
        <div className="flex flex-col pb-44">
          <StageCanvas
            image={image}
            stageBounds={stageBounds}
            characterPos={characterPos}
            segments={segments}
            onCanvasTap={handleCanvasTap}
          />
          {!characterPos && (
            <div className="text-center text-yellow-400 text-sm py-2 bg-gray-900/80">
              画面をタップしてキャラクター位置を指定してください
            </div>
          )}
          <div className="px-4 py-2">
            <ImageUploader onImageLoad={handleImageLoad} />
          </div>
          <ControlPanel
            angle={angle}
            reflectionCount={reflectionCount}
            stageRatios={stageRatios}
            onAngleChange={setAngle}
            onAngleDelta={handleAngleDelta}
            onReflectionCountChange={setReflectionCount}
            onStageRatiosChange={setStageRatios}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}

export default App;
