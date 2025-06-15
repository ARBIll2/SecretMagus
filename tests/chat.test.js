const { prepareChat, sanitizeMessage } = require('../server/chat.js');

function createRoom() {
  return {
    players: [
      { id: 'a', name: 'A', socketId: '1' },
      { id: 'b', name: 'B', socketId: '2' },
    ],
    game: {
      players: [
        { id: 'a', name: 'A', socketId: '1' },
        { id: 'b', name: 'B', socketId: '2' },
      ],
      presidentIndex: 0,
      chancellorIndex: 1,
      chatLog: [],
    },
  };
}

test('sanitizeMessage strips html tags', () => {
  expect(sanitizeMessage('<b>hi</b>')).toBe('hi');
});

test('prepareChat records log and targets president', () => {
  const room = createRoom();
  const result = prepareChat(room, 'a', 'hello', 'presidentOnly');
  expect(room.game.chatLog).toHaveLength(1);
  expect(result.socketIds).toEqual(['1']);
  expect(result.visibility).toBe('limited');
});
