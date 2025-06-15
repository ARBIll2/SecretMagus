/**
 * Simple in-memory room manager.
 * NOTE: replace with persistent storage if scaling to multiple servers.
 */
const { generateRoomCode } = require('../shared/utils.js');

const rooms = {};

/**
 * Creates a new room and returns its code.
 */
function createRoom(hostPlayer) {
  let roomCode = generateRoomCode();
  while (rooms[roomCode]) {
    roomCode = generateRoomCode();
  }
  rooms[roomCode] = {
    code: roomCode,
    players: [hostPlayer],
    game: null,
    disconnectTimers: {},
  };
  return roomCode;
}

/**
 * Adds a player to an existing room.
 * @param {string} roomCode
 * @param {object} player
 */
function joinRoom(roomCode, player) {
  const room = rooms[roomCode];
  if (!room) return false;
  room.players.push(player);
  return true;
}

function findPlayerBySocket(roomCode, socketId) {
  const room = rooms[roomCode];
  if (!room) return null;
  return room.players.find((p) => p.socketId === socketId) || null;
}

function updatePlayerSocket(roomCode, playerId, socketId) {
  const room = rooms[roomCode];
  if (!room) return false;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return false;
  player.socketId = socketId;
  return true;
}

function removePlayer(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.disconnectTimers[playerId]) {
    clearTimeout(room.disconnectTimers[playerId]);
    delete room.disconnectTimers[playerId];
  }
  if (room.players.length === 0) {
    delete rooms[roomCode];
  }
}

function closeRoom(roomCode) {
  delete rooms[roomCode];
}

/**
 * Retrieves room data by code.
 */
function getRoomByCode(code) {
  return rooms[code];
}

function listRooms() {
  return Object.keys(rooms);
}

module.exports = {
  createRoom,
  joinRoom,
  removePlayer,
  closeRoom,
  getRoomByCode,
  listRooms,
  findPlayerBySocket,
  updatePlayerSocket,
};
