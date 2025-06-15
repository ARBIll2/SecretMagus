# TODO List

## ✅ Completed
- Room creation and join flow
- Role assignment and initial knowledge sharing
- Full game phase logic with vote counting and policy enactment
- All presidential powers (Investigate Loyalty, Special Election, Policy Peek, Execution, Veto)
- Win condition checks
- Disconnect and leave handling treating players as executed
- React components for lobby, nomination, voting, policy choices, veto and power prompts
- Action log and basic AI tips
- Jest test suite covering utilities, core game logic, and tips engine
- Room updates broadcast after every state change
- Confirmation prompt when a player attempts to leave mid-game
- Improved styling for the board and player list
- Reconnection support for players who refresh or temporarily lose connection
- Polish layout for main game UI components
- Developer debug toggle for viewing game state

## 🔨 In Progress
- Additional UX cues for executed players and game over screens

## 🕳️ Missing / Skipped Logic
- Add proper routing or state machine to manage phases
- Build step for bundling client scripts and global styles


## 🧠 Needs Design Decision
- Long-term room persistence for multi-server deployment

## ⏳ Low Priority / Post-MVP
- Enhanced tips engine tracking past actions for better suggestions
- Animation and polish for policy handling on the client

## ⚠️ Blockers / Edge Cases
- Developer tools should be gated so hidden information isn't shown during normal play
