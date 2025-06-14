const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomManager = require('./roomManager.js');
const gameEngine = require('./gameEngine.js');
const { MESSAGE_TYPES } = require('../shared/messages.js');
const { PHASES } = require('../shared/constants.js');

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

  socket.on(MESSAGE_TYPES.NOMINATE_CHANCELLOR, ({ roomCode, nomineeId }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const success = gameEngine.nominateChancellor(room, socket.id, nomineeId);
    if (success) {
      io.to(roomCode).emit(MESSAGE_TYPES.VOTE_REQUEST, {
        presidentId: socket.id,
        nomineeId,
      });
      io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
    }
  });

  socket.on(MESSAGE_TYPES.CAST_VOTE, ({ roomCode, vote }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const result = gameEngine.handleVote(room, socket.id, vote);
    if (result && result.completed) {
      io.to(roomCode).emit(MESSAGE_TYPES.VOTE_RESULT, {
        passed: result.passed,
        votes: result.votes,
      });
      if (room.game.phase === PHASES.POLICY) {
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_PROMPT);
      }
    }
    io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
  });

  socket.on(MESSAGE_TYPES.POLICY_CHOICE, ({ roomCode, policy }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const result = gameEngine.processPolicy(room, policy);
    io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, result);
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
