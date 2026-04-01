import type { StageRatios } from '../lib/stageBounds';

interface Props {
  ratios: StageRatios;
  onChange: (ratios: StageRatios) => void;
}

const STEP = 0.001; // 0.1%

function RatioRow({
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
      <span className="text-gray-400 text-xs w-6 text-right">{label}</span>
      <button
        onClick={() => onChange(Math.max(0, value - STEP))}
        className="w-8 h-7 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
      >
        -
      </button>
      <span className="text-gray-300 text-xs font-mono w-12 text-center">
        {(value * 100).toFixed(1)}%
      </span>
      <button
        onClick={() => onChange(Math.min(1, value + STEP))}
        className="w-8 h-7 bg-gray-700 rounded text-white text-sm font-bold active:bg-gray-600 select-none"
      >
        +
      </button>
    </div>
  );
}

export function BoundsAdjuster({ ratios, onChange }: Props) {
  const update = (key: keyof StageRatios, value: number) => {
    onChange({ ...ratios, [key]: value });
  };

  return (
    <div className="space-y-1.5">
      <div className="text-gray-500 text-xs font-bold">枠位置調整 (0.1%刻み)</div>
      <RatioRow label="上" value={ratios.top} onChange={(v) => update('top', v)} />
      <RatioRow label="下" value={ratios.bottom} onChange={(v) => update('bottom', v)} />
      <RatioRow label="左" value={ratios.left} onChange={(v) => update('left', v)} />
      <RatioRow label="右" value={ratios.right} onChange={(v) => update('right', v)} />
    </div>
  );
}
