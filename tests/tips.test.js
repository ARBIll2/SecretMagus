const { getTipsForPlayer } = require('../shared/tips.js');
const { PHASES, POWERS } = require('../shared/constants.js');

describe('getTipsForPlayer', () => {
  const baseGame = {
    players: [
      { id: 'a' },
      { id: 'b' },
    ],
    enactedPolicies: { liberal: 0, fascist: 0 },
    failedElections: 0,
  };

  test('provides nomination tip for president', () => {
    const game = { ...baseGame, phase: PHASES.NOMINATE, presidentIndex: 0 };
    const tips = getTipsForPlayer(game, 'a', 'LIBERAL');
    expect(tips[0]).toMatch(/nominate/i);
  });

  test('includes tracker warning on two failed elections', () => {
    const game = {
      ...baseGame,
      phase: PHASES.VOTE,
      failedElections: 2,
      presidentIndex: 0,
    };
    const tips = getTipsForPlayer(game, 'b', 'LIBERAL');
    const warning = tips.find((t) => t.includes('failed election'));
    expect(warning).toBeTruthy();
  });
});
