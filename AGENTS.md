
# Secret Hitler Webapp – Codex Build Instructions

## 🎯 Project Goal
Create a webapp version of *Secret Hitler* that allows multiple players to join a room, receive secret roles, and play a fully rules-compliant game in real time.

This is not a visual-heavy game. The priority is correctness, clarity, and smooth multiplayer logic.

---

## 📦 Stack

- **Frontend**: React (or Svelte if preferred), Tailwind CSS for quick styling
- **Backend**: Node.js with `socket.io` for real-time communication
- **State**: Central server-side game engine (no trust on client)
- **Deploy**: Vercel (frontend), Render/Heroku/Fly.io (backend)

---

## 🧱 Structure

### `/client`
- `index.html` – Base page
- `App.jsx` – Root component
- `Lobby.jsx` – Join/Create room, name entry
- `Game.jsx` – Main game UI (per player)
- `GameStateContext.js` – React context for shared state

### `/server`
- `index.js` – Main express + socket.io server
- `gameEngine.js` – Game logic (deck, role assignment, turn logic)
- `roomManager.js` – Track open/active games and players

### `/shared`
- `constants.js` – Shared game constants (roles, phases)
- `messages.js` – Socket message types
- `utils.js` – Game logic helpers (shuffling, role assignment)

---

## 🧠 Game Logic Core
Keep all game logic in a central state object, e.g.:

```js
{
  players: [
    { id, name, role, alive, socketId, hasVoted, vote }
  ],
  phase: 'NOMINATE' | 'VOTE' | 'POLICY' | 'POWER',
  presidentIndex: 0,
  chancellorIndex: null,
  failedElections: 0,
  policyDeck: [...],
  enactedPolicies: { liberal: 0, fascist: 0 },
  history: [...],
  settings: { playerCount, roomCode }
}
```

---

## ✅ MVP Features

### 🔐 Join/Create Room
- Host creates room, gets code (4–6 characters)
- Others join with code, enter name
- Host starts game when ready

### 🃏 Game Start
- Assign roles based on player count
- Notify each player of their secret role
- If fascists > 1, reveal teammates

### 🧑‍⚖️ Game Loop
- Nominate Chancellor
- Vote: Everyone votes yes/no
- If passed, go to policy phase
- If failed, increment election tracker

### 📜 Policy Phase
- Pres draws 3, discards 1 → sends 2 to Chancellor
- Chancellor discards 1 → enacts final policy
- Reveal policy, update board

### 🛠️ Powers
Trigger after X fascist policies:
- Investigate Loyalty
- Call Special Election
- Peek
- Execution (player marked dead)

### 🏆 Win Conditions
- 5 Liberal or 6 Fascist policies
- Hitler elected Chancellor after 3 Fascist policies
- Hitler is killed → Liberals win

---

## 🔁 Socket Message Flow
Use a `messageType` dispatch pattern:

### Client → Server
- `JOIN_ROOM` – name + code
- `CREATE_ROOM` – name
- `START_GAME`
- `NOMINATE_CHANCELLOR`
- `CAST_VOTE`
- `POLICY_CHOICE`
- `USE_POWER`

### Server → Client
- `ROOM_UPDATE`
- `GAME_START`
- `ROLE_ASSIGNMENT`
- `VOTE_REQUEST`
- `VOTE_RESULT`
- `POLICY_PROMPT`
- `POLICY_RESULT`
- `POWER_PROMPT`
- `GAME_OVER`

---

## 📐 Best Practice Coding Guidelines
- Keep all game logic server-side; never trust the client.
- Use enums/constants for phases, roles, and messages to avoid string errors.
- Modularize logic per game phase.
- Strictly validate input and reject malformed or out-of-order actions.
- Maintain clear separation of concerns: game logic vs communication vs UI.
- Log every significant state change (for debugging and auditing).
- Keep sockets organized with event-based handlers.

---

## 🧩 Future UI Framework
Right now we go text-based, but future UI components can follow this framework:

### Planned Components:
- `PlayerList`: Shows seating order and current roles (public info only)
- `PolicyTracker`: Display current number of enacted policies
- `VotePanel`: Allows player to vote Yes/No
- `NominationPanel`: President picks a Chancellor
- `PolicyHand`: Policy selection (President/Chancellor)
- `PowerPanel`: Shows special powers when unlocked
- `GameLog`: Show action history (optional)

Use Tailwind CSS to ensure responsive layout, and structure all UI elements in a mobile-first grid/flex system.

---

## 🧪 Dev Notes
- Add simple log on server to trace game state changes.
- Use mock players for testing (e.g., 5 bots).
- Keep all UI mobile-friendly from the start.

---

## 🧱 Suggested Tasks for Codex
1. Scaffold `/client` and `/server` folders with entry files.
2. Implement `roomManager.js` to handle player joins and room tracking.
3. Build `gameEngine.js` to manage the full game state lifecycle.
4. Set up `socket.io` server and connect React client.
5. Create basic UI for joining/creating room and nickname entry.
6. Implement game phases one at a time with full broadcast logic.
7. Write tests for role assignment, voting logic, and win condition checks.


