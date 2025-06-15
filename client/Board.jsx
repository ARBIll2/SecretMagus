import React, { useContext, useEffect, useRef, useState } from 'react';
import { GameStateContext } from './GameStateContext.js';

/**
 * Displays the current board state: enacted policies and election tracker.
 */
export default function Board() {
  const { gameState } = useContext(GameStateContext);
  const game = gameState.game || {};
  const liberal = game.enactedPolicies?.liberal || 0;
  const fascist = game.enactedPolicies?.fascist || 0;
  const tracker = game.failedElections || 0;

  const prevLiberal = useRef(liberal);
  const prevFascist = useRef(fascist);
  const [flashLiberal, setFlashLiberal] = useState(false);
  const [flashFascist, setFlashFascist] = useState(false);

  useEffect(() => {
    if (liberal > prevLiberal.current) {
      setFlashLiberal(true);
      setTimeout(() => setFlashLiberal(false), 800);
    }
    prevLiberal.current = liberal;
  }, [liberal]);

  useEffect(() => {
    if (fascist > prevFascist.current) {
      setFlashFascist(true);
      setTimeout(() => setFlashFascist(false), 800);
    }
    prevFascist.current = fascist;
  }, [fascist]);
  const president = game.players?.[game.presidentIndex];
  const chancellor =
    game.chancellorIndex != null ? game.players?.[game.chancellorIndex] : null;

  return (
    <div className="board bg-gray-100 p-4 rounded shadow max-w-md mx-auto mb-4">
      <h3 className="text-xl font-bold mb-2">Board</h3>

      <div className="mb-3">
        <p className="font-semibold">Liberal Policies</p>
        <div className="flex space-x-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 border ${i < liberal ? 'bg-blue-500' : 'bg-gray-200'} ${
                flashLiberal && i === liberal - 1 ? 'animate-pulse' : ''
              }`}
            ></div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="font-semibold">Fascist Policies</p>
        <div className="flex space-x-1 mt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 border ${i < fascist ? 'bg-red-500' : 'bg-gray-200'} ${
                flashFascist && i === fascist - 1 ? 'animate-pulse' : ''
              }`}
            ></div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="font-semibold">Election Tracker</p>
        <div className="flex space-x-1 mt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 border ${i < tracker ? 'bg-yellow-500' : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
      </div>

      {president && <p className="italic">President: {president.name}</p>}
      {chancellor && <p className="italic">Chancellor: {chancellor.name}</p>}
    </div>
  );
}
