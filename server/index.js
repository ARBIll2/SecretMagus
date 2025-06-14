const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomManager = require('./roomManager.js');
const gameEngine = require('./gameEngine.js');
const { MESSAGE_TYPES } = require('../shared/messages.js');
const { PHASES, POWERS } = require('../shared/constants.js');

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
      if (result.gameOver) {
        io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, result.gameOver);
      }
      if (room.game.phase === PHASES.POLICY) {
        const policies = gameEngine.beginPolicyPhase(room);
        const presidentId = room.game.players[room.game.presidentIndex].id;
        io.to(presidentId).emit(MESSAGE_TYPES.POLICY_PROMPT, { policies });
      }
      if (room.game.phase === PHASES.POWER) {
        if (room.game.pendingPower === POWERS.POLICY_PEEK) {
          const result = gameEngine.handlePower(
            room,
            room.game.powerPresidentId,
            {}
          );
          io
            .to(room.game.powerPresidentId)
            .emit(MESSAGE_TYPES.POWER_RESULT, result);
        } else {
          io.to(room.game.powerPresidentId).emit(MESSAGE_TYPES.POWER_PROMPT, {
            power: room.game.pendingPower,
            players: room.game.players
              .filter((p) => p.alive)
              .map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
    }
    io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
  });

  socket.on(MESSAGE_TYPES.POLICY_CHOICE, ({ roomCode, policy, veto }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const outcome = gameEngine.handlePolicyChoice(room, socket.id, { policy, veto });
    if (outcome) {
      if (outcome.promptPlayerId) {
        if (outcome.veto) {
          io.to(outcome.promptPlayerId).emit(MESSAGE_TYPES.VETO_PROMPT);
        } else {
          io.to(outcome.promptPlayerId).emit(MESSAGE_TYPES.POLICY_PROMPT, {
            policies: outcome.policies,
            canVeto: outcome.canVeto,
          });
        }
      }
      if (outcome.enacted) {
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.result);
        if (outcome.result.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.result.gameOver);
        }
        if (room.game.phase === PHASES.POWER) {
          io.to(room.game.powerPresidentId).emit(MESSAGE_TYPES.POWER_PROMPT, {
            power: room.game.pendingPower,
            players: room.game.players
              .filter((p) => p.alive)
              .map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
      io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
    }
  });

  socket.on(MESSAGE_TYPES.VETO_DECISION, ({ roomCode, accept }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const outcome = gameEngine.handleVetoDecision(room, socket.id, accept);
    if (outcome) {
      io.to(roomCode).emit(MESSAGE_TYPES.VETO_RESULT, { accepted: outcome.accepted });
      if (outcome.promptPlayerId) {
        io.to(outcome.promptPlayerId).emit(MESSAGE_TYPES.POLICY_PROMPT, {
          policies: outcome.policies,
          canVeto: outcome.canVeto,
        });
      }
      if (outcome.autoResult) {
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.autoResult);
        if (outcome.autoResult.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.autoResult.gameOver);
        }
        if (room.game.phase === PHASES.POWER) {
          io.to(room.game.powerPresidentId).emit(MESSAGE_TYPES.POWER_PROMPT, {
            power: room.game.pendingPower,
            players: room.game.players
              .filter((p) => p.alive)
              .map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
      io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
    }
  });

  socket.on(MESSAGE_TYPES.USE_POWER, ({ roomCode, action }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const result = gameEngine.handlePower(room, socket.id, action);
    if (result) {
      if (result.broadcast) {
        io.to(roomCode).emit(MESSAGE_TYPES.POWER_RESULT, result);
      } else {
        io.to(socket.id).emit(MESSAGE_TYPES.POWER_RESULT, result);
      }
      if (result.gameOver) {
        io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, result.gameOver);
      }
      io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, room);
    }
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
