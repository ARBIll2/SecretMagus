import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MESSAGE_TYPES } from '../shared/messages.js';
import { PHASES } from '../shared/constants.js';

/**
 * Context providing game state and socket connection to components.
 */
export const GameStateContext = createContext({});

export default function GameStateProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({});
  const [role, setRole] = useState(null);
  const [policyPrompt, setPolicyPrompt] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const sock = io();
    setSocket(sock);

    sock.on('connect', () => {
      setPlayerId(sock.id);
    });

    // Listen for room and game state updates
    sock.on(MESSAGE_TYPES.ROOM_UPDATE, (state) => {
      setGameState(state);
    });

    // Handle role assignment for this client
    sock.on(MESSAGE_TYPES.ROLE_ASSIGNMENT, ({ role }) => {
      setRole(role);
    });

    // Update game state when a new game starts
    sock.on(MESSAGE_TYPES.GAME_START, (game) => {
      setGameState((prev) => ({ ...prev, game }));
    });

    sock.on(MESSAGE_TYPES.VOTE_REQUEST, () => {
      setGameState((prev) => ({
        ...prev,
        game: { ...prev.game, phase: PHASES.VOTE },
      }));
    });

    sock.on(MESSAGE_TYPES.VOTE_RESULT, (result) => {
      setGameState((prev) => ({ ...prev, lastVote: result }));
    });

    sock.on(MESSAGE_TYPES.POLICY_PROMPT, () => {
      setPolicyPrompt(true);
    });

    sock.on(MESSAGE_TYPES.POLICY_RESULT, (res) => {
      setPolicyPrompt(false);
      setGameState((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          enactedPolicies: res.enactedPolicies,
        },
      }));
    });

    return () => {
      sock.disconnect();
    };
  }, []);

  return (
    <GameStateContext.Provider value={{ socket, gameState, role, policyPrompt, playerId }}>
      {children}
    </GameStateContext.Provider>
  );
}
