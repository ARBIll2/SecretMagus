/**
 * Shared game constants for roles, phases, and setup information.
 */

// Player roles
const ROLES = Object.freeze({
  LIBERAL: 'LIBERAL',
  FASCIST: 'FASCIST',
  HITLER: 'HITLER',
});

// Game phases
const PHASES = Object.freeze({
  NOMINATE: 'NOMINATE',
  VOTE: 'VOTE',
  POLICY: 'POLICY',
  POWER: 'POWER',
  GAME_OVER: 'GAME_OVER',
});

// Mapping of player count to roles
const ROLE_DISTRIBUTION = {
  5: { liberals: 3, fascists: 1, hitler: 1 },
  6: { liberals: 4, fascists: 1, hitler: 1 },
  7: { liberals: 4, fascists: 2, hitler: 1 },
  8: { liberals: 5, fascists: 2, hitler: 1 },
  9: { liberals: 5, fascists: 3, hitler: 1 },
  10: { liberals: 6, fascists: 3, hitler: 1 },
};

module.exports = {
  ROLES,
  PHASES,
  ROLE_DISTRIBUTION,
};
