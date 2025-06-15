export function sanitizeMessage(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

function determineRecipients(room, to) {
  const game = room.game;
  const recipients = [];
  if (!game) return recipients;
  if (to === 'global' || !to) {
    room.players.forEach(p => {
      if (p.socketId) recipients.push(p.socketId);
    });
  } else if (to === 'presidentOnly') {
    const pres = game.players[game.presidentIndex];
    if (pres && pres.socketId) recipients.push(pres.socketId);
  } else if (to === 'chancellorOnly') {
    const chan = game.players[game.chancellorIndex];
    if (chan && chan.socketId) recipients.push(chan.socketId);
  } else if (Array.isArray(to)) {
    to.forEach(id => {
      const target = room.players.find(p => p.id === id);
      if (target && target.socketId) recipients.push(target.socketId);
    });
  }
  return recipients;
}

export function prepareChat(room, fromId, text, to = 'global') {
  if (!room || !room.game) return null;
  const fromPlayer = room.players.find(p => p.id === fromId);
  if (!fromPlayer) return null;
  const msg = sanitizeMessage(text);
  const entry = { from: fromPlayer.name, message: msg, to, timestamp: Date.now() };
  room.game.chatLog = room.game.chatLog || [];
  room.game.chatLog.push(entry);
  const socketIds = determineRecipients(room, to);
  const visibility = to === 'global' ? 'global' : Array.isArray(to) ? 'private' : 'limited';
  return { entry, socketIds, visibility };
}

