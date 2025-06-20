import React, { useState, useContext } from 'react';
import { GameStateContext } from './GameStateContext.jsx';
import { MESSAGE_TYPES } from '../shared/messages.js';
import Portrait from './components/Portrait.jsx';

const availablePortraits = [
  'owl',
  'fox',
  'robot',
  'pirate',
  'alien',
  'witch',
  'cat',
  'deer',
];

/**
 * Lobby view for entering a name and room code.
 * Provides buttons to create or join a room.
 */
export default function Lobby() {
  const { socket, gameState, playerId, leaveRoom } = useContext(GameStateContext);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [portrait, setPortrait] = useState(availablePortraits[0]);

  const createRoom = () => {
    if (socket) socket.emit(MESSAGE_TYPES.CREATE_ROOM, { name, playerId, portrait });
  };

  const joinRoom = () => {
    if (socket)
      socket.emit(MESSAGE_TYPES.JOIN_ROOM, { name, roomCode, playerId, portrait });
  };

  const startGame = () => {
    if (socket && gameState?.code) {
      socket.emit(MESSAGE_TYPES.START_GAME, { roomCode: gameState.code });
    }
  };

  const exitRoom = () => {
    if (gameState?.code) {
      leaveRoom(gameState.code);
    }
  };

  const isHost = gameState?.players?.[0]?.id === playerId;
  const joined = gameState?.players && gameState.players.some((p) => p.id === playerId);

  return (
    <div>
      <h1>Secret Hitler</h1>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {availablePortraits.map((pId) => (
          <div
            key={pId}
            onClick={() => setPortrait(pId)}
            className={
              'cursor-pointer border ' + (portrait === pId ? 'border-blue-500' : 'border-transparent')
            }
          >
            <Portrait portraitId={pId} variant="neutral" />
          </div>
        ))}
      </div>
      {joined && <p>Room Code: {gameState.code}</p>}
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      {!joined && (
        <>
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
        </>
      )}
      {joined && (
        <>
          <h3>Players</h3>
          <ul>
            {gameState.players.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
          {isHost && gameState.players.length >= 5 && (
            <button onClick={startGame}>Start Game</button>
          )}
          <button onClick={exitRoom}>Leave Room</button>
          {gameState.error && <p>{gameState.error}</p>}
        </>
      )}
    </div>
  );
}
