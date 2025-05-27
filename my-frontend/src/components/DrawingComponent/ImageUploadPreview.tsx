'use client';
import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  previewUrls: string[];
  setPreviewUrls: Dispatch<SetStateAction<string[]>>;
}

export default function ImageUploadPreview({ previewUrls, setPreviewUrls }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    fileArray.forEach((file) => {
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

      {/* プレビュー表示 */}
      <div className="grid grid-cols-3 gap-2">
        {previewUrls.map((url, i) => (
          <Image key={i} src={url} alt={`preview-${i}`} width={100} height={100} />
        ))}
      </div>
    </div>
  );
}
