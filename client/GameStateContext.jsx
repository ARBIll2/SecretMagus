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
  const [roleInfo, setRoleInfo] = useState(null);
  const [policyPrompt, setPolicyPrompt] = useState(null);
  const [vetoPrompt, setVetoPrompt] = useState(false);
  const [powerPrompt, setPowerPrompt] = useState(null);
  const [powerResult, setPowerResult] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [nomination, setNomination] = useState(null);
  const [chatLog, setChatLog] = useState([]);

  const resetState = () => {
    setGameState({});
    setRole(null);
    setRoleInfo(null);
    setPolicyPrompt(null);
    setVetoPrompt(false);
    setPowerPrompt(null);
    setPowerResult(null);
    setNomination(null);
    setChatLog([]);
  };

  useEffect(() => {
    const sock = io(import.meta.env.VITE_SOCKET_URL || undefined);
    setSocket(sock);

    sock.on('connect', () => {
      const savedId = localStorage.getItem('playerId');
      const savedRoom = localStorage.getItem('roomCode');
      if (savedId && savedRoom) {
        sock.emit(MESSAGE_TYPES.RECONNECT, { roomCode: savedRoom, playerId: savedId });
      }
    });

    sock.on(MESSAGE_TYPES.ASSIGN_PLAYER_ID, ({ playerId, roomCode }) => {
      setPlayerId(playerId);
      localStorage.setItem('playerId', playerId);
      if (roomCode) localStorage.setItem('roomCode', roomCode);
    });

    // Listen for room and game state updates
    sock.on(MESSAGE_TYPES.ROOM_UPDATE, (state) => {
      setGameState(state);
    });

    // Handle role assignment for this client
    sock.on(MESSAGE_TYPES.ROLE_ASSIGNMENT, (info) => {
      setRole(info.role);
      setRoleInfo(info);
    });

    // Update game state when a new game starts
    sock.on(MESSAGE_TYPES.GAME_START, (game) => {
      setGameState((prev) => ({ ...prev, game }));
    });

    sock.on(MESSAGE_TYPES.VOTE_REQUEST, ({ presidentId, nomineeId }) => {
      setGameState((prev) => ({
        ...prev,
        game: { ...prev.game, phase: PHASES.VOTE },
      }));
      setNomination({ presidentId, nomineeId });
    });

    sock.on(MESSAGE_TYPES.VOTE_RESULT, (result) => {
      setNomination(null);
      setGameState((prev) => ({ ...prev, lastVote: result }));
    });

    sock.on(MESSAGE_TYPES.POLICY_PROMPT, (data) => {
      setPolicyPrompt({ policies: data.policies, canVeto: data.canVeto });
    });

    sock.on(MESSAGE_TYPES.POLICY_RESULT, (res) => {
      setPolicyPrompt(null);
      setGameState((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          enactedPolicies: res.enactedPolicies,
        },
      }));
    });

    sock.on(MESSAGE_TYPES.POWER_PROMPT, (data) => {
      setPowerPrompt(data);
    });

    sock.on(MESSAGE_TYPES.POWER_RESULT, (res) => {
      setPowerPrompt(null);
      setPowerResult(res);
    });

    sock.on(MESSAGE_TYPES.VETO_PROMPT, () => {
      setVetoPrompt(true);
    });

    sock.on(MESSAGE_TYPES.VETO_RESULT, () => {
      setVetoPrompt(false);
      setPolicyPrompt(null);
    });

    sock.on(MESSAGE_TYPES.CHAT_RECEIVE, (msg) => {
      setChatLog((prev) => [...prev, msg]);
    });

    sock.on(MESSAGE_TYPES.GAME_OVER, (result) => {
      setGameState((prev) => ({
        ...prev,
        gameOver: result,
        game: { ...prev.game, phase: PHASES.GAME_OVER },
      }));
    });

    return () => {
      sock.disconnect();
    };
  }, []);

  const leaveRoom = (roomCode) => {
    if (
      gameState?.game &&
      gameState.game.phase !== PHASES.GAME_OVER &&
      !window.confirm(
        'Leaving now counts as a resignation and may end the game. Are you sure?'
      )
    ) {
      return;
    }
    if (socket) {
      socket.emit(MESSAGE_TYPES.LEAVE_ROOM, { roomCode });
    }
    localStorage.removeItem('roomCode');
    resetState();
  };

  const sendChat = (roomCode, message, to = 'global') => {
    if (socket) {
      socket.emit(MESSAGE_TYPES.CHAT_SEND, { roomCode, message, to });
    }
  };

  return (
    <GameStateContext.Provider
      value={{
        socket,
        gameState,
        role,
        roleInfo,
        policyPrompt,
        powerPrompt,
        powerResult,
        playerId,
        nomination,
        vetoPrompt,
        chatLog,
        sendChat,
        leaveRoom,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}
