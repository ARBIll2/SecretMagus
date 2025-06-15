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

// Presidential powers
const POWERS = Object.freeze({
  NONE: 'NONE',
  INVESTIGATE: 'INVESTIGATE',
  SPECIAL_ELECTION: 'SPECIAL_ELECTION',
  POLICY_PEEK: 'POLICY_PEEK',
  EXECUTION: 'EXECUTION',
});

// Mapping of fascist policy count to powers based on player count
// Index 0 corresponds to the first enacted fascist policy, etc.
const FASCIST_POWERS = {
  5: [
    POWERS.NONE,
    POWERS.NONE,
    POWERS.POLICY_PEEK,
    POWERS.EXECUTION,
    POWERS.EXECUTION,
  ],
  6: [
    POWERS.NONE,
    POWERS.NONE,
    POWERS.POLICY_PEEK,
    POWERS.EXECUTION,
    POWERS.EXECUTION,
  ],
  7: [
    POWERS.INVESTIGATE,
    POWERS.INVESTIGATE,
    POWERS.SPECIAL_ELECTION,
    POWERS.EXECUTION,
    POWERS.EXECUTION,
  ],
  8: [
    POWERS.INVESTIGATE,
    POWERS.INVESTIGATE,
    POWERS.SPECIAL_ELECTION,
    POWERS.EXECUTION,
    POWERS.EXECUTION,
  ],
  9: [
    POWERS.INVESTIGATE,
    POWERS.INVESTIGATE,
    POWERS.EXECUTION,
    POWERS.SPECIAL_ELECTION,
    POWERS.EXECUTION,
  ],
  10: [
    POWERS.INVESTIGATE,
    POWERS.INVESTIGATE,
    POWERS.EXECUTION,
    POWERS.SPECIAL_ELECTION,
    POWERS.EXECUTION,
  ],
};

// Mapping of player count to roles
const ROLE_DISTRIBUTION = {
  5: { liberals: 3, fascists: 1, hitler: 1 },
  6: { liberals: 4, fascists: 1, hitler: 1 },
  7: { liberals: 4, fascists: 2, hitler: 1 },
  8: { liberals: 5, fascists: 2, hitler: 1 },
  9: { liberals: 5, fascists: 3, hitler: 1 },
  10: { liberals: 6, fascists: 3, hitler: 1 },
};

// Available portrait identifiers
const PORTRAITS = ['squirrel', 'robot', 'wizard', 'frog'];

module.exports = {
  ROLES,
  PHASES,
  POWERS,
  FASCIST_POWERS,
  ROLE_DISTRIBUTION,
  PORTRAITS,
};
