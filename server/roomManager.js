/**
 * Simple in-memory room manager.
 * TODO: replace with persistent storage if needed.
 */
const rooms = {};

/**
 * Creates a new room and returns its code.
 */
function createRoom(hostPlayer) {
  // TODO: generate unique room code
  const roomCode = hostPlayer.code || 'ABCD';
  rooms[roomCode] = {
    players: [hostPlayer],
    game: null,
  };
  return roomCode;
}

/**
 * Adds a player to an existing room.
 * @param {string} roomCode
 * @param {object} player
 */
function joinRoom(roomCode, player) {
  if (rooms[roomCode]) {
    rooms[roomCode].players.push(player);
  }
}

/**
 * Retrieves room data by code.
 */
function getRoomByCode(code) {
  return rooms[code];
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomByCode,
  // TODO: add more helpers (removePlayer, closeRoom, etc.)
};
