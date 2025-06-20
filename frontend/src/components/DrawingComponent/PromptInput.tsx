'use client';

import React, { Dispatch, SetStateAction, useState } from 'react';

interface Props {
  setExportedUrls: Dispatch<SetStateAction<string[]>>;
  steps: number;
  width: number;
  height: number;
  style: string;
  generatedPrompt: string;
  setGeneratedPrompt: Dispatch<SetStateAction<string>>;
  userId: string;
}

const PromptInput = ({ setExportedUrls, steps, width, height, style,  generatedPrompt, setGeneratedPrompt, userId}: Props) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/api/full_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          steps: steps,
          width: width,
          height: height,
          style: style,
          user_id: userId,
        }),
      });

      const data = await res.json();
      const imageUrl = data.image_url;
      console.log('生成された画像URL:', imageUrl);

      setExportedUrls(prev => [...prev, imageUrl]);
      setGeneratedPrompt(data.adjusted_prompt); 
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
        送信して画像生成
      </button>
    </form>
  );
};

export default PromptInput;
