import { useRef } from 'react';

interface Props {
  onImageLoad: (image: HTMLImageElement) => void;
}

export function ImageUploader({ onImageLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => onImageLoad(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl text-lg font-medium active:bg-indigo-700 transition-colors"
    >
      スクリーンショットを選択
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </button>
  );
}
