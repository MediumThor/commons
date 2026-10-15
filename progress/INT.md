# INT — Coordinator integration

- Status: assigned
- Owner: coordinator
- Claim: `progress/claims/INT`
- Updated: 2026-10-15T01:10:07Z

## Scope

Assign sections, keep exclusive files single-owner, and run the integrated checks in `GOAL.md` when every required section is complete. This is not a feature section.

## Dependencies

All other sections.

## File ownership

- `GOAL.md`
- `WORKPLAN.md`
- `AGENT_PROMPT.md`
- `progress/INT.md`
- `commons/server.mjs`
- `commons/src/storage/sqlite.mjs`

## Acceptance criteria

- Every required section in `WORKPLAN.md` is `complete` with evidence in its progress file.
- `npm test`, `npm run check`, and `npm run check:web` pass on the integrated tree.
- Sections that changed the client have browser evidence recorded.
- E0 remains out of the completion bar unless the owner authorized it and its criteria passed.

## Log

- 2026-10-15T01:10:07Z — Opened after P0. P1 and W0 are the sections that can start.

## Completed work

P0 is complete. Shared claim rules and file ownership are recorded.

## Validation

P0 checks are in `progress/P0.md`. Integrated checks are not due.

## Blockers

Required sections P1–P7, E1, and W0–W5 are not complete.

## Next action

Assign P1, W0, or both to different agents. Do not assign W5 or P2 while P1 holds `service.mjs`.
