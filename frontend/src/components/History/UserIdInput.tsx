'use client';

import { useState } from 'react';

type Props = {
  setUserId: (id: string) => void;
};

const UserIdInput = ({ setUserId }: Props) => {
  const [input, setInput] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setUserId(input);
      }}
      className="p-4"
    >
      <label className="block mb-2">ユーザーID:</label>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border px-3 py-2 rounded"
      />
      <button type="submit" className="ml-2 bg-blue-600 text-white px-4 py-2 rounded">
        設定
      </button>
    </form>
  );
};

export default UserIdInput;
