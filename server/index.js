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

  // TODO: wire up event handlers for JOIN_ROOM, START_GAME, etc.
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
