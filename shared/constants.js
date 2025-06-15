/**
 * Shared game constants for roles, phases, and setup information.
 */

// Player roles
export const ROLES = Object.freeze({
  LIBERAL: 'LIBERAL',
  FASCIST: 'FASCIST',
  HITLER: 'HITLER',
});

// Game phases
export const PHASES = Object.freeze({
  NOMINATE: 'NOMINATE',
  VOTE: 'VOTE',
  POLICY: 'POLICY',
  POWER: 'POWER',
  GAME_OVER: 'GAME_OVER',
});

// Presidential powers
export const POWERS = Object.freeze({
  NONE: 'NONE',
  INVESTIGATE: 'INVESTIGATE',
  SPECIAL_ELECTION: 'SPECIAL_ELECTION',
  POLICY_PEEK: 'POLICY_PEEK',
  EXECUTION: 'EXECUTION',
});

// Available portrait IDs
export const AVAILABLE_PORTRAITS = [
  'owl',
  'fox',
  'robot',
  'pirate',
  'alien',
  'witch',
  'cat',
  'deer',
];

// Mapping of fascist policy count to powers based on player count
// Index 0 corresponds to the first enacted fascist policy, etc.
export const FASCIST_POWERS = {
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
export const ROLE_DISTRIBUTION = {
  5: { liberals: 3, fascists: 1, hitler: 1 },
  6: { liberals: 4, fascists: 1, hitler: 1 },
  7: { liberals: 4, fascists: 2, hitler: 1 },
  8: { liberals: 5, fascists: 2, hitler: 1 },
  9: { liberals: 5, fascists: 3, hitler: 1 },
  10: { liberals: 6, fascists: 3, hitler: 1 },
};


