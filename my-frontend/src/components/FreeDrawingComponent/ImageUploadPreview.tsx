'use client';
import Image from 'next/image';

interface Props {
  previewUrl: string | null;
  setPreviewUrl: (index: string | null) => void;
}

export default function ImageUploadPreview({previewUrl, setPreviewUrl}: Props) {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string); // base64文字列
    };
    reader.readAsDataURL(file); // base64として読み込む
  };

  return (
    <div className="p-4 space-y-4">
      <div className='text-center'>
        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
          ファイルを選択
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ></input>
        </label>
      </div>

      {previewUrl && (
        <Image
          src={previewUrl}
          alt="プレビュー画像"
          className="border rounded shadow"
          width={100}
          height={100}
        />
      )}
    </div>
  );
}
