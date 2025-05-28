'use client';
import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  previewUrls: string[];
  setPreviewUrls: Dispatch<SetStateAction<string[]>>;
  onImport: (url: string) => void;
}

export default function ImageUploadPreview({ previewUrls, setPreviewUrls, onImport }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newUrl = reader.result as string;
        setPreviewUrls((prev) => [...prev, newUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
          ファイルを選択
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </label>
      </div>

      {/*グリッドレイアウト*/}
      <div className="grid grid-cols-3 gap-2">
        {previewUrls.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt={`preview-${i}`}
            width={100}
            height={100}
            className="border rounded shadow cursor-pointer hover:opacity-80 transition"
            onClick={() => onImport(url)}
          />
        ))}
      </div>
    </div>
  );
}
