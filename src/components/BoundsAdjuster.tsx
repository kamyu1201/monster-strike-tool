import type { StageRatios } from '../lib/stageBounds';

interface Props {
  ratios: StageRatios;
  onChange: (ratios: StageRatios) => void;
}

const STEP = 0.005;

function RatioSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-8 text-right">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-green-400"
      />
      <span className="text-gray-300 text-xs font-mono w-12">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export function BoundsAdjuster({ ratios, onChange }: Props) {
  const update = (key: keyof StageRatios, value: number) => {
    onChange({ ...ratios, [key]: value });
  };

  return (
    <div className="space-y-1.5">
      <div className="text-gray-500 text-xs font-bold">枠位置調整</div>
      <RatioSlider label="上" value={ratios.top} onChange={(v) => update('top', v)} />
      <RatioSlider label="下" value={ratios.bottom} onChange={(v) => update('bottom', v)} />
      <RatioSlider label="左" value={ratios.left} onChange={(v) => update('left', v)} />
      <RatioSlider label="右" value={ratios.right} onChange={(v) => update('right', v)} />
    </div>
  );
}
