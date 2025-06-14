/**
 * Socket message type constants for client/server communication.
 */

export const MESSAGE_TYPES = Object.freeze({
  CREATE_ROOM: 'CREATE_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  START_GAME: 'START_GAME',
  ROOM_UPDATE: 'ROOM_UPDATE',
  GAME_START: 'GAME_START',
  ROLE_ASSIGNMENT: 'ROLE_ASSIGNMENT',
  VOTE_REQUEST: 'VOTE_REQUEST',
  VOTE_RESULT: 'VOTE_RESULT',
  NOMINATE_CHANCELLOR: 'NOMINATE_CHANCELLOR',
  CAST_VOTE: 'CAST_VOTE',
  POLICY_PROMPT: 'POLICY_PROMPT',
  POLICY_RESULT: 'POLICY_RESULT',
  POLICY_CHOICE: 'POLICY_CHOICE',
  VETO_REQUEST: 'VETO_REQUEST',
  VETO_PROMPT: 'VETO_PROMPT',
  VETO_DECISION: 'VETO_DECISION',
  VETO_RESULT: 'VETO_RESULT',
  POWER_PROMPT: 'POWER_PROMPT',
  POWER_RESULT: 'POWER_RESULT',
  USE_POWER: 'USE_POWER',
  RECONNECT: 'RECONNECT',
  ASSIGN_PLAYER_ID: 'ASSIGN_PLAYER_ID',
  GAME_OVER: 'GAME_OVER',
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
});

