'use client';

import React, { useState } from 'react';

interface Props {
  setExportedUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

const PromptInput = ({ setExportedUrls }: Props) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/api/full_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_prompt: message }),
      });

      const data = await res.json();
      const imageUrl = data.image_url;
      console.log('生成された画像URL:', imageUrl);

      //  Exported用にのみ追加
      setExportedUrls(prev => [...prev, imageUrl]);

      alert(`画像生成完了！`);

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
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        送信して画像生成
      </button>
    </form>
  );
};

export default PromptInput;
