"use strict";

const { ROLES } = require("../../shared/constants.js");
const { createBot } = require("./BotEngine.js");

const botsByRoom = {};

function addBotToRoom(room, role, name) {
  const bot = createBot(role, name);
  room.players.push({ id: name, name, role, socketId: null });
  if (!botsByRoom[room.code]) botsByRoom[room.code] = [];
  botsByRoom[room.code].push(bot);
  return bot;
}

function removeBots(room) {
  const bots = botsByRoom[room.code] || [];
  bots.forEach((b) => {
    room.players = room.players.filter((p) => p.id !== b.name);
  });
  delete botsByRoom[room.code];
}

function getBots(roomCode) {
  return botsByRoom[roomCode] || [];
}

function spawnForSolo(room, playerNames) {
  const needed = 5 - room.players.length;
  for (let i = 0; i < needed; i++) {
    const name = playerNames[i] || `Bot${i + 1}`;
    addBotToRoom(room, ROLES.LIBERAL, name);
  }
}

module.exports = {
  addBotToRoom,
  removeBots,
  getBots,
  spawnForSolo,
};
