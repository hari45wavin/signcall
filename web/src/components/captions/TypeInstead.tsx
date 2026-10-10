"use client";

import { useState } from "react";

export function TypeInstead({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
      }}
    >
      <input
        className="w-72 rounded-full bg-white px-4 py-2 text-sm text-ink shadow"
        placeholder="Type instead of signing"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Type a caption"
      />
    </form>
  );
}
