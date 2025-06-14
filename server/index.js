const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomManager = require('./roomManager.js');
const gameEngine = require('./gameEngine.js');
const { MESSAGE_TYPES } = require('../shared/messages.js');

/**
 * Initializes express and socket.io server.
 * Handles basic connection events.
 */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on(MESSAGE_TYPES.CREATE_ROOM, ({ name }) => {
    const player = { id: socket.id, name };
    const code = roomManager.createRoom(player);
    socket.join(code);
    io.to(code).emit(MESSAGE_TYPES.ROOM_UPDATE, roomManager.getRoomByCode(code));
  });

  socket.on(MESSAGE_TYPES.JOIN_ROOM, ({ name, roomCode }) => {
    const player = { id: socket.id, name };
    if (roomManager.joinRoom(roomCode, player)) {
      socket.join(roomCode);
      io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, roomManager.getRoomByCode(roomCode));
    } else {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
    }
  });

  socket.on(MESSAGE_TYPES.START_GAME, ({ roomCode }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    gameEngine.startGame(room);
    io.to(roomCode).emit(MESSAGE_TYPES.GAME_START, room.game);
    room.players.forEach((p) => {
      io.to(p.id).emit(MESSAGE_TYPES.ROLE_ASSIGNMENT, { role: p.role });
    });
    io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
  });

  // TODO: add more game event handlers
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    roomManager.listRooms().forEach((code) => {
      roomManager.removePlayer(code, socket.id);
      io.to(code).emit(MESSAGE_TYPES.ROOM_UPDATE, roomManager.getRoomByCode(code));
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
