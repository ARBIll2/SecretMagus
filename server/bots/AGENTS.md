# Bot System Guidelines

This directory houses the AI bot engine used for automated players.

## Key Points
- Bots must **never** peek at hidden roles or policy cards beyond what a human player would know.
- Decision methods should rely only on public information, a bot's own role and memory.
- `BOT_DEBUG=true` enables verbose logging for development purposes.
- Core interfaces are defined in `BotEngine.js` and are stable for all bots.

## Required Exports
- `createBot(role, name)` – returns a bot object implementing:
  - `voteOnGovernment(gameState)` → `'Y' | 'N'`
  - `nominateChancellor(playerList)` → `playerId`
  - `choosePolicy(policies)` → index to discard
  - `usePower(powerType, gameState)` → `playerId`
  - `say()` → optional string

Bots may track additional state but these functions form the public API.
