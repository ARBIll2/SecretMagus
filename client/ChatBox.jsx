import React, { useState, useContext, useRef, useEffect } from 'react';
import { GameStateContext } from './GameStateContext.js';

export default function ChatBox() {
  const { chatLog, sendChat, gameState } = useContext(GameStateContext);
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const roomCode = gameState.code || gameState.roomCode;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const submit = () => {
    const msg = text.trim();
    if (!msg) return;
    sendChat(roomCode, msg, 'global');
    setText('');
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 text-sm">
      <div className="h-32 overflow-y-auto mb-2 border p-1">
        {chatLog.map((m, idx) => (
          <div key={idx}>
            <strong>{m.from}:</strong> {m.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex">
        <input
          className="flex-1 border px-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button
          onClick={submit}
          className="bg-blue-600 text-white px-2 ml-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
