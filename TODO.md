# TODO List

## Completed
- Scaffolded client and server folders with entry files.
- Implemented room manager and initial socket handlers.
- Created basic game engine with role assignment and policy logic.
- Hooked up `START_GAME` socket event.

## Completed in this wave
- Implemented vote and policy socket events using the game engine.
- Added client handlers for role assignment, vote and policy events.
- Created basic UI elements for casting votes and selecting policies.
- Added nomination phase logic with server handler and React UI.
- Added win condition checks and GAME_OVER handling on server and client.
- Enforced Chancellor eligibility term limits according to rules.
- Implemented policy draw/discard flow with deck reshuffle and updated client prompts.
- Added initial implementation of Investigate Loyalty power with server handler and client prompt.

## Next Steps
- Expand React UI components for each gameplay phase (policy draw, powers).
- Implement remaining special powers (Special Election, Policy Peek, Execution).
- Write unit tests for game engine, utilities, and room management.
- Add veto power after five fascist policies.
