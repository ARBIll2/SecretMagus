/**
 * Utility helpers for Secret Hitler game logic.
 */

/**
 * Shuffles an array in place and returns it.
 * @param {Array} deck
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Assigns roles to players based on player count.
 * @param {Array} playerList
 */
import { ROLE_DISTRIBUTION, ROLES } from './constants.js';

export function assignRoles(playerList) {
  const distribution = ROLE_DISTRIBUTION[playerList.length];
  if (!distribution) return playerList;

  const roles = [];
  roles.push(...Array(distribution.liberals).fill(ROLES.LIBERAL));
  roles.push(...Array(distribution.fascists).fill(ROLES.FASCIST));
  roles.push(ROLES.HITLER);

  shuffleDeck(roles);

  return playerList.map((p, idx) => ({ ...p, role: roles[idx] }));
}

/**
 * Generates a unique room code.
 */
export function generateRoomCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


