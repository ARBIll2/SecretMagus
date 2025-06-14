import React, { useState, useContext } from 'react';
import { GameStateContext } from './GameStateContext.js';
import { MESSAGE_TYPES } from '../shared/messages.js';

/**
 * Lobby view for entering a name and room code.
 * Provides buttons to create or join a room.
 */
export default function Lobby({ onStart }) {
  const { socket } = useContext(GameStateContext);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const createRoom = () => {
    // TODO: Implement create room logic
    if (socket) socket.emit(MESSAGE_TYPES.CREATE_ROOM, { name });
    onStart();
  };

  const joinRoom = () => {
    // TODO: Implement join room logic
    if (socket) socket.emit(MESSAGE_TYPES.JOIN_ROOM, { name, roomCode });
    onStart();
  };

  return (
    <div>
      <h1>Secret Hitler</h1>
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
      <button onClick={createRoom}>Create Room</button>
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}
