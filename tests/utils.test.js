const { assignRoles, shuffleDeck } = require('../shared/utils.js');
const { ROLE_DISTRIBUTION, ROLES } = require('../shared/constants.js');

describe('assignRoles', () => {
  for (const count of Object.keys(ROLE_DISTRIBUTION)) {
    test(`assigns correct roles for ${count} players`, () => {
      const players = Array.from({ length: Number(count) }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
      const assigned = assignRoles(players);
      const dist = ROLE_DISTRIBUTION[count];
      const roleCounts = assigned.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {});
      expect(roleCounts[ROLES.LIBERAL]).toBe(dist.liberals);
      expect(roleCounts[ROLES.FASCIST]).toBe(dist.fascists);
      expect(roleCounts[ROLES.HITLER]).toBe(1);
    });
  }
});

describe('shuffleDeck', () => {
  test('shuffles array without mutating content length', () => {
    const deck = ['A', 'B', 'C', 'D'];
    const result = shuffleDeck([...deck]);
    expect(result).toHaveLength(deck.length);
    deck.forEach((card) => expect(result).toContain(card));
  });
});
