# TODO List

## Completed
- Scaffolded client and server folders with entry files.
- Implemented room manager and initial socket handlers.
- Created basic game engine with role assignment and policy logic.
- Hooked up `START_GAME` socket event.

## Previously Completed
- Implemented vote and policy socket events using the game engine.
- Added client handlers for role assignment, vote and policy events.
- Created basic UI elements for casting votes and selecting policies.
- Added nomination phase logic with server handler and React UI.
- Added win condition checks and GAME_OVER handling on server and client.
- Enforced Chancellor eligibility term limits according to rules.
- Implemented policy draw/discard flow with deck reshuffle and updated client prompts.
- Added initial implementation of Investigate Loyalty power with server handler and client prompt.
- Added Special Election presidential power with server logic and client UI.
- Implemented Policy Peek power with automatic handling.
- Implemented Execution power with victory checks.
- Added veto power after five fascist policies with request/decision flow.

## Completed in this wave
- Implemented initial fascist/Hitler knowledge sharing on game start.
- Added simple server logging for key state changes.

## Next Steps
- Expand React UI components for each gameplay phase (policy draw, powers).
- Write unit tests for game engine, utilities, and room management.
- Improve lobby UI to display joined players and error messages.
