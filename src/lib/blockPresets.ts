import type { BlockPreset } from '../types';

const STORAGE_KEY = 'monstrike-block-presets';

export function loadPresets(): BlockPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BlockPreset[];
  } catch {
    return [];
  }
}

export function savePresets(presets: BlockPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function addPreset(name: string, preset: BlockPreset): BlockPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name);
  presets.push(preset);
  savePresets(presets);
  return presets;
}

export function deletePreset(name: string): BlockPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name);
  savePresets(presets);
  return presets;
}
