import { useState } from 'react';
import type { BlockRatio, BlockPreset } from '../types';
import { loadPresets, addPreset, deletePreset } from '../lib/blockPresets';

interface Props {
  blocks: BlockRatio[];
  editMode: boolean;
  onEditModeChange: (mode: boolean) => void;
  onBlocksChange: (blocks: BlockRatio[]) => void;
}

export function BlockPanel({
  blocks,
  editMode,
  onEditModeChange,
  onBlocksChange,
}: Props) {
  const [presets, setPresets] = useState<BlockPreset[]>(loadPresets);
  const [showPresets, setShowPresets] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const handleSave = () => {
    if (!saveName.trim()) return;
    const preset: BlockPreset = { name: saveName.trim(), blocks: [...blocks] };
    const updated = addPreset(saveName.trim(), preset);
    setPresets(updated);
    setSaveName('');
    setShowSave(false);
  };

  const handleLoad = (preset: BlockPreset) => {
    onBlocksChange([...preset.blocks]);
    setShowPresets(false);
  };

  const handleDelete = (name: string) => {
    const updated = deletePreset(name);
    setPresets(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onEditModeChange(!editMode)}
          className={`px-3 h-8 rounded text-xs font-medium transition-colors select-none ${
            editMode ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          {editMode ? 'ブロック配置中' : 'ブロック配置'}
        </button>

        {blocks.length > 0 && (
          <button
            onClick={() => onBlocksChange([])}
            className="px-2 h-8 bg-gray-700 rounded text-gray-300 text-xs active:bg-gray-600 select-none"
          >
            全削除
          </button>
        )}

        <button
          onClick={() => { setShowPresets((v) => !v); setShowSave(false); }}
          className="px-2 h-8 bg-gray-700 rounded text-gray-300 text-xs active:bg-gray-600 select-none"
        >
          読込
        </button>

        {blocks.length > 0 && (
          <button
            onClick={() => { setShowSave((v) => !v); setShowPresets(false); }}
            className="px-2 h-8 bg-gray-700 rounded text-gray-300 text-xs active:bg-gray-600 select-none"
          >
            保存
          </button>
        )}

        {blocks.length > 0 && (
          <span className="text-gray-500 text-xs">{blocks.length}個</span>
        )}
      </div>

      {editMode && (
        <p className="text-orange-400 text-xs">
          タップでブロック追加、ブロック上タップで削除
        </p>
      )}

      {showSave && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="プリセット名（例: ペグイル4）"
            className="flex-1 h-8 px-2 bg-gray-800 border border-gray-600 rounded text-white text-xs"
          />
          <button
            onClick={handleSave}
            className="px-3 h-8 bg-blue-600 rounded text-white text-xs font-medium active:bg-blue-700 select-none"
          >
            保存
          </button>
        </div>
      )}

      {showPresets && (
        <div className="space-y-1">
          {presets.length === 0 ? (
            <p className="text-gray-500 text-xs">保存済みプリセットがありません</p>
          ) : (
            presets.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <button
                  onClick={() => handleLoad(p)}
                  className="flex-1 text-left h-8 px-2 bg-gray-800 rounded text-white text-xs hover:bg-gray-700 active:bg-gray-700"
                >
                  {p.name} ({p.blocks.length}個)
                </button>
                <button
                  onClick={() => handleDelete(p.name)}
                  className="px-2 h-8 bg-red-900 rounded text-red-300 text-xs active:bg-red-800 select-none"
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
