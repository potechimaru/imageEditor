'use client';

import React, { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  setExportedUrls: React.Dispatch<React.SetStateAction<string[]>>;
  originalUrl: string | null;
  maskUrl: string | null;
  steps: number;
  width: number;
  height: number;
  style: string;
  generatedPrompt: string;
  setGeneratedPrompt: Dispatch<SetStateAction<string>>;
  userId : string;
}

const WithMaskPromptInput = ({ setExportedUrls, originalUrl, maskUrl, steps, width, height, style, generatedPrompt, setGeneratedPrompt, userId }: Props) => {
  const [message, setMessage] = useState('');

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // "data:image/png;base64,..." のカンマ以降
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!originalUrl || !maskUrl) {
      alert("元画像とマスク画像の両方を選択してください。");
      return;
    }

    try {
      const original_base64 = await fetchImageAsBase64(originalUrl);
      const mask_base64 = await fetchImageAsBase64(maskUrl);

      const res = await fetch('http://localhost:8000/api/masked_full_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          original_base64,
          mask_base64,
          steps: steps,
          width: width,
          height: height,
          style: style,
          user_id: userId,
        }),
      });

      const data = await res.json();

      if (!data.image_url) {
        console.error("画像URLが含まれていません:", data);
        alert("生成に失敗しました。");
        return;
      }

      const imageUrl = data.image_url;
      setExportedUrls(prev => [...prev, imageUrl]);
      setGeneratedPrompt(data.adjusted_prompt);
      alert('画像生成完了！');
    } catch (error) {
      console.error('生成エラー:', error);
      alert('エラーが発生しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium">プロンプト</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      {generatedPrompt && (
        <div className="p-4 bg-gray-100 border rounded mt-4">
          <p className="text-sm font-bold">補正後プロンプト:</p>
          <p className="text-sm whitespace-pre-wrap">{generatedPrompt}</p>
        </div>
        )}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
      画像を生成
      </button>
    </form>
  );
};

export default WithMaskPromptInput;
