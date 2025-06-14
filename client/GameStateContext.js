import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * Context providing game state and socket connection to components.
 */
export const GameStateContext = createContext({});

export default function GameStateProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({});

  useEffect(() => {
    const sock = io();
    setSocket(sock);

    // Example: listen for game state updates
    sock.on(MESSAGE_TYPES.ROOM_UPDATE, (state) => {
      setGameState(state);
    });

    // TODO: add more listeners for game events
    return () => {
      sock.disconnect();
    };
  }, []);

  return (
    <GameStateContext.Provider value={{ socket, gameState }}>
      {children}
    </GameStateContext.Provider>
  );
}
