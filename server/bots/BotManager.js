import { ROLES, AVAILABLE_PORTRAITS } from "../../shared/constants.js";
import { createBot } from "./BotEngine.js";

const botsByRoom = {};

function addBotToRoom(room, role, name) {
  const portrait = AVAILABLE_PORTRAITS[Math.floor(Math.random() * AVAILABLE_PORTRAITS.length)];
  const bot = createBot(role, name);
  bot.portrait = portrait;
  room.players.push({ id: name, name, role, socketId: null, portrait });
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

export {
  addBotToRoom,
  removeBots,
  getBots,
  spawnForSolo,
};
