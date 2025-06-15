import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import * as roomManager from './roomManager.js';
import * as gameEngine from './gameEngine.js';
import { MESSAGE_TYPES } from '../shared/messages.js';
import { PHASES, POWERS, ROLES } from '../shared/constants.js';
import { prepareChat } from './chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes express and socket.io server.
 * Handles basic connection events.
 */
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(
  express.static(path.join(__dirname, '..', 'public'), { index: false })
);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

const DISCONNECT_TIMEOUT = 30000; // ms to wait before treating disconnect as execution

function logEvent(roomCode, event, details = '') {
  console.log(`[${roomCode}] ${event}`, details);
}

/**
 * Emits a ROOM_UPDATE event for the given room code.
 * @param {string} roomCode
 * @param {object} [room] Optional pre-fetched room object
 */
function emitRoomUpdate(roomCode, room) {
  const data = room || roomManager.getRoomByCode(roomCode);
  if (data) {
    io.to(roomCode).emit(MESSAGE_TYPES.ROOM_UPDATE, data);
  }
}

function getPlayerId(room, socketId) {
  const player = room.players.find((p) => p.socketId === socketId);
  return player ? player.id : null;
}

function sendPendingPrompts(socket, room, playerId) {
  const game = room.game;
  if (!game) return;
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  const president = game.players[game.presidentIndex];
  const chancellor = game.players[game.chancellorIndex];

  if (game.phase === PHASES.POLICY && game.policyHand) {
    if (game.policyStep === 'PRESIDENT' && president.id === playerId) {
      socket.emit(MESSAGE_TYPES.POLICY_PROMPT, { policies: [...game.policyHand], canVeto: false });
    } else if (game.policyStep === 'CHANCELLOR' && chancellor && chancellor.id === playerId) {
      socket.emit(MESSAGE_TYPES.POLICY_PROMPT, {
        policies: [...game.policyHand],
        canVeto: game.enactedPolicies.fascist >= 5,
      });
    } else if (game.policyStep === 'VETO' && president.id === playerId) {
      socket.emit(MESSAGE_TYPES.VETO_PROMPT);
    }
  }

  if (
    game.phase === PHASES.POWER &&
    game.pendingPower &&
    game.powerPresidentId === playerId
  ) {
    if (game.pendingPower === POWERS.POLICY_PEEK) {
      const result = gameEngine.handlePower(room, playerId, {});
      socket.emit(MESSAGE_TYPES.POWER_RESULT, result);
    } else {
      socket.emit(MESSAGE_TYPES.POWER_PROMPT, {
        power: game.pendingPower,
        players: game.players
          .filter((p) => p.alive)
          .map((p) => ({ id: p.id, name: p.name })),
      });
    }
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on(MESSAGE_TYPES.CREATE_ROOM, ({ name, portrait, playerId }) => {
    const id = playerId || randomUUID();
    const player = { id, name, socketId: socket.id, portrait };
    const code = roomManager.createRoom(player);
    socket.join(code);
    socket.emit(MESSAGE_TYPES.ASSIGN_PLAYER_ID, { playerId: id, roomCode: code });
    emitRoomUpdate(code);
  });

  socket.on(MESSAGE_TYPES.JOIN_ROOM, ({ name, roomCode, playerId, portrait }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }

    if (playerId) {
      const existing = room.players.find((p) => p.id === playerId);
      if (existing) {
        existing.name = name || existing.name;
        if (portrait) existing.portrait = portrait;
        existing.socketId = socket.id;
        socket.join(roomCode);
        socket.emit(MESSAGE_TYPES.ASSIGN_PLAYER_ID, { playerId, roomCode });
        if (room.disconnectTimers[playerId]) {
          clearTimeout(room.disconnectTimers[playerId]);
          delete room.disconnectTimers[playerId];
        }
        emitRoomUpdate(roomCode, room);
        if (room.game) {
          const knowledge = gameEngine.getInitialKnowledge(room.game);
          socket.emit(MESSAGE_TYPES.ROLE_ASSIGNMENT, knowledge[playerId]);
          sendPendingPrompts(socket, room, playerId);
        }
        return;
      }
    }

    const id = playerId || randomUUID();
    const player = { id, name, socketId: socket.id, portrait };
    if (roomManager.joinRoom(roomCode, player)) {
      socket.join(roomCode);
      socket.emit(MESSAGE_TYPES.ASSIGN_PLAYER_ID, { playerId: id, roomCode });
      emitRoomUpdate(roomCode);
    } else {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
    }
  });

  socket.on(MESSAGE_TYPES.RECONNECT, ({ roomCode, playerId }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;
    player.socketId = socket.id;
    socket.join(roomCode);
    socket.emit(MESSAGE_TYPES.ASSIGN_PLAYER_ID, { playerId, roomCode });
    if (room.disconnectTimers[playerId]) {
      clearTimeout(room.disconnectTimers[playerId]);
      delete room.disconnectTimers[playerId];
    }
    emitRoomUpdate(roomCode, room);
    if (room.game) {
      const knowledge = gameEngine.getInitialKnowledge(room.game);
      socket.emit(MESSAGE_TYPES.ROLE_ASSIGNMENT, knowledge[playerId]);
      sendPendingPrompts(socket, room, playerId);
    }
  });

  socket.on(MESSAGE_TYPES.LEAVE_ROOM, ({ roomCode }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) return;

    socket.leave(roomCode);
    const playerId = getPlayerId(room, socket.id);

    if (room.game && room.game.phase !== PHASES.GAME_OVER && playerId) {
      const outcome = gameEngine.handleDisconnect(room, playerId);
      logEvent(roomCode, 'PLAYER_LEAVE', playerId);

      if (outcome) {
        if (outcome.autoResult) {
          io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.autoResult);
          if (outcome.autoResult.gameOver) {
            io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.autoResult.gameOver);
          }
        } else if (outcome.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.gameOver);
        }
      }

      emitRoomUpdate(roomCode, room);
    } else {
      if (playerId) roomManager.removePlayer(roomCode, playerId);
      const updated = roomManager.getRoomByCode(roomCode);
      if (updated) {
        emitRoomUpdate(roomCode, updated);
      }
    }
  });

  socket.on(MESSAGE_TYPES.START_GAME, ({ roomCode }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    gameEngine.startGame(room);
    logEvent(roomCode, 'GAME_START');
    io.to(roomCode).emit(MESSAGE_TYPES.GAME_START, room.game);
    const knowledge = gameEngine.getInitialKnowledge(room.game);
    room.players.forEach((p) => {
      if (p.socketId) io.to(p.socketId).emit(MESSAGE_TYPES.ROLE_ASSIGNMENT, knowledge[p.id]);
    });
    emitRoomUpdate(roomCode, room);
  });

  socket.on(MESSAGE_TYPES.NOMINATE_CHANCELLOR, ({ roomCode, nomineeId }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const playerId = getPlayerId(room, socket.id);
    const success = gameEngine.nominateChancellor(room, playerId, nomineeId);
    if (success) {
      logEvent(roomCode, 'NOMINATION', `${playerId} -> ${nomineeId}`);
      io.to(roomCode).emit(MESSAGE_TYPES.VOTE_REQUEST, {
        presidentId: playerId,
        nomineeId,
      });
      emitRoomUpdate(roomCode, room);
    }
  });

  socket.on(MESSAGE_TYPES.CAST_VOTE, ({ roomCode, vote }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const playerId = getPlayerId(room, socket.id);
    const result = gameEngine.handleVote(room, playerId, vote);
    if (result && result.completed) {
      logEvent(roomCode, 'VOTE_RESULT', result.passed ? 'passed' : 'failed');
      io.to(roomCode).emit(MESSAGE_TYPES.VOTE_RESULT, {
        passed: result.passed,
        votes: result.votes,
      });
      if (result.gameOver) {
        io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, result.gameOver);
      }
      if (result.autoResult) {
        logEvent(roomCode, 'POLICY_ENACTED', result.autoResult.enactedPolicies);
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, result.autoResult);
        if (result.autoResult.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, result.autoResult.gameOver);
        }
      }
      if (room.game.phase === PHASES.POLICY) {
        const policies = gameEngine.beginPolicyPhase(room);
        const president = room.game.players[room.game.presidentIndex];
        io.to(president.socketId).emit(MESSAGE_TYPES.POLICY_PROMPT, { policies });
      }
      if (room.game.phase === PHASES.POWER) {
        if (room.game.pendingPower === POWERS.POLICY_PEEK) {
          const result = gameEngine.handlePower(
            room,
            room.game.powerPresidentId,
            {}
          );
          const pres = room.game.players.find((p) => p.id === room.game.powerPresidentId);
          if (pres)
            io.to(pres.socketId).emit(MESSAGE_TYPES.POWER_RESULT, result);
        } else {
          const pres = room.game.players.find((p) => p.id === room.game.powerPresidentId);
          if (pres) io.to(pres.socketId).emit(MESSAGE_TYPES.POWER_PROMPT, {
            power: room.game.pendingPower,
            players: room.game.players
              .filter((p) => p.alive)
              .map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
    }
    emitRoomUpdate(roomCode, room);
  });

  socket.on(MESSAGE_TYPES.POLICY_CHOICE, ({ roomCode, policy, veto }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const playerId = getPlayerId(room, socket.id);
    const outcome = gameEngine.handlePolicyChoice(room, playerId, { policy, veto });
    if (outcome) {
      if (outcome.promptPlayerId) {
        const target = room.game.players.find((p) => p.id === outcome.promptPlayerId);
        if (outcome.veto) {
          if (target) io.to(target.socketId).emit(MESSAGE_TYPES.VETO_PROMPT);
        } else {
          if (target)
            io.to(target.socketId).emit(MESSAGE_TYPES.POLICY_PROMPT, {
            policies: outcome.policies,
            canVeto: outcome.canVeto,
          });
        }
      }
      if (outcome.enacted) {
        logEvent(roomCode, 'POLICY_ENACTED', outcome.result.enactedPolicies);
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.result);
        if (outcome.result.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.result.gameOver);
        }
        if (room.game.phase === PHASES.POWER) {
          const pres = room.game.players.find((p) => p.id === room.game.powerPresidentId);
          if (pres)
            io.to(pres.socketId).emit(MESSAGE_TYPES.POWER_PROMPT, {
              power: room.game.pendingPower,
              players: room.game.players
                .filter((p) => p.alive)
                .map((p) => ({ id: p.id, name: p.name })),
            });
        }
      }
        emitRoomUpdate(roomCode, room);
    }
  });

  socket.on(MESSAGE_TYPES.VETO_DECISION, ({ roomCode, accept }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const playerId = getPlayerId(room, socket.id);
    const outcome = gameEngine.handleVetoDecision(room, playerId, accept);
    if (outcome) {
      io.to(roomCode).emit(MESSAGE_TYPES.VETO_RESULT, { accepted: outcome.accepted });
      logEvent(roomCode, 'VETO_DECISION', outcome.accepted ? 'accepted' : 'rejected');
      if (outcome.promptPlayerId) {
        const target = room.game.players.find((p) => p.id === outcome.promptPlayerId);
        if (target) io.to(target.socketId).emit(MESSAGE_TYPES.POLICY_PROMPT, {
          policies: outcome.policies,
          canVeto: outcome.canVeto,
        });
      }
      if (outcome.autoResult) {
        logEvent(roomCode, 'POLICY_ENACTED', outcome.autoResult.enactedPolicies);
        io.to(roomCode).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.autoResult);
        if (outcome.autoResult.gameOver) {
          io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, outcome.autoResult.gameOver);
        }
        if (room.game.phase === PHASES.POWER) {
          const pres = room.game.players.find((p) => p.id === room.game.powerPresidentId);
          if (pres) io.to(pres.socketId).emit(MESSAGE_TYPES.POWER_PROMPT, {
            power: room.game.pendingPower,
            players: room.game.players
              .filter((p) => p.alive)
              .map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
      emitRoomUpdate(roomCode, room);
    }
  });

  socket.on(MESSAGE_TYPES.USE_POWER, ({ roomCode, action }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit(MESSAGE_TYPES.ROOM_UPDATE, { error: 'Room not found' });
      return;
    }
    const playerId = getPlayerId(room, socket.id);
    const result = gameEngine.handlePower(room, playerId, action);
    if (result) {
      logEvent(roomCode, 'POWER', result.power);
      if (result.broadcast) {
        io.to(roomCode).emit(MESSAGE_TYPES.POWER_RESULT, result);
      } else {
        const target = room.players.find((p) => p.id === playerId);
        if (target)
          io.to(target.socketId).emit(MESSAGE_TYPES.POWER_RESULT, result);
      }
      if (result.gameOver) {
        io.to(roomCode).emit(MESSAGE_TYPES.GAME_OVER, result.gameOver);
      }
        emitRoomUpdate(roomCode, room);
    }
  });

  socket.on(MESSAGE_TYPES.CHAT_SEND, ({ roomCode, message, to }) => {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room || !room.game) return;
    const playerId = getPlayerId(room, socket.id);
    if (!playerId) return;
    const result = prepareChat(room, playerId, message, to);
    if (!result) return;
    result.socketIds.forEach((sid) => {
      io.to(sid).emit(MESSAGE_TYPES.CHAT_RECEIVE, {
        from: result.entry.from,
        message: result.entry.message,
        visibility: result.visibility,
      });
    });
  });

  // NOTE: add new game event handlers as features expand
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    roomManager.listRooms().forEach((code) => {
      const room = roomManager.getRoomByCode(code);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      player.socketId = null;

      if (room.game && room.game.phase !== PHASES.GAME_OVER) {
        room.disconnectTimers[player.id] = setTimeout(() => {
          const outcome = gameEngine.handleDisconnect(room, player.id);
          logEvent(code, 'PLAYER_DISCONNECT', player.id);
          if (outcome) {
            if (outcome.autoResult) {
              io.to(code).emit(MESSAGE_TYPES.POLICY_RESULT, outcome.autoResult);
              if (outcome.autoResult.gameOver) {
                io.to(code).emit(MESSAGE_TYPES.GAME_OVER, outcome.autoResult.gameOver);
              }
            } else if (outcome.gameOver) {
              io.to(code).emit(MESSAGE_TYPES.GAME_OVER, outcome.gameOver);
            }
          }
          emitRoomUpdate(code, room);
        }, DISCONNECT_TIMEOUT);
      } else {
        roomManager.removePlayer(code, player.id);
        const updated = roomManager.getRoomByCode(code);
        if (updated) {
          emitRoomUpdate(code, updated);
        }
      }
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

