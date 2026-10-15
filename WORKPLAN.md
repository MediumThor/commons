# Work plan

The coordinator assigns sections and resolves overlapping ownership. Section status in Markdown is a record. The claim is the directory `progress/claims/<section-id>/`, created with `mkdir`. If that directory exists, the section is taken.

Statuses: `available`, `assigned`, `in_progress`, `blocked`, `ready_for_review`, `complete`.

## Integration

| ID | Status | Owner | Role |
| --- | --- | --- | --- |
| INT | assigned | coordinator | Assign sections, sequence exclusive files, merge shared-file conflicts, and decide when the goal's integrated checks are due. |

INT is not available for feature work. Feature agents do not edit `GOAL.md`, `WORKPLAN.md`, `AGENT_PROMPT.md`, `commons/server.mjs`, or `progress/INT.md`.

## Shared files

These files are shared. A section may edit one only when its progress file allows that edit. Reread it immediately before writing.

| File | Rule |
| --- | --- |
| `commons/server.mjs` | Coordinator only. New HTTP behavior goes in `commons/src/http/routes/<section>.mjs`. |
| `commons/src/domain/service.mjs` | Exclusive. Only the assigned section that lists it may edit it. |
| `commons/src/storage/sqlite.mjs` | Coordinator only. Schema goes in a new migration file. Methods go in a new repository module. |
| `commons/src/storage/port.mjs` | Additive method names only, by the section that adds the repository. |
| `commons/src/contracts/capabilities.mjs` | Additive. Flip a route from `unavailable` to `available` only after its handler and tests exist. Reread first. |
| `commons/package.json` | Additive scripts only. Reread first. |
| `wiki/WORKLOG.md` | Append only. Reread the end first. |
| `wiki/NEXT.md`, `wiki/ARCHITECTURE.md` | Update facts your section changed. Reread first. |
| `commons/web/src/App.tsx` | Exclusive among W1–W4. W0 must not edit it. |

P0 files under `commons/src/contracts/`, `commons/src/domain/catalog.mjs`, `commons/src/http/legacy.mjs`, and `commons/src/http/v1.mjs` stay as they are unless a later section's progress file names a specific additive change.

## Sections

### P0 — Baseline and contracts

- Status: complete
- Depends on: none
- Owner: coordinator
- Exclusive files: the P0 modules listed in `progress/P0.md`
- Acceptance: met. See that progress file for evidence.

### P1 — Humans, instructions, and emulator storage

- Status: available
- Depends on: P0
- Can run with: W0
- Must not run with: W5, or any other section editing `service.mjs`
- Owns: `commons/src/auth/`, `commons/src/domain/instructions.mjs`, `commons/src/http/routes/p1.mjs`, `commons/src/storage/migrations/010-p1-identity.sql`, `commons/src/storage/repositories/p1.mjs`, `commons/firebase.json`, `commons/firestore.rules`, `commons/firestore.indexes.json`, `commons/.firebaserc`, `commons/test/identity.test.mjs`
- Exclusive shared edit: `commons/src/domain/service.mjs`, limited to context and grant checks that do not change legacy response shapes
- Additive: `capabilities.mjs`, `port.mjs`
- Acceptance: in `progress/P1.md`

### P2 — One research collaboration

- Status: blocked
- Depends on: P1
- Blocker: P1 is not complete. After P1, this can run beside P4 and beside W0–W4.
- Must not run with: another holder of `service.mjs`
- Owns: `commons/src/domain/research.mjs`, `commons/src/http/routes/p2.mjs`, `commons/src/storage/migrations/020-research.sql`, `commons/src/storage/repositories/p2.mjs`, `commons/test/research.test.mjs`, and the collaboration UI files named in `progress/P2.md` only after W1 has landed or the coordinator says the current sheets still receive that UI
- Exclusive shared edit after assignment: `service.mjs` for fencing, handoff, and idempotency enforcement
- Acceptance: in `progress/P2.md`

### P3 — Evidence, wiki, and registry

- Status: blocked
- Depends on: P2
- Can run later beside P4 if both avoid `service.mjs` and `App.tsx`
- Owns: `commons/src/domain/evidence.mjs`, `commons/src/http/routes/p3.mjs`, `commons/src/storage/migrations/030-evidence.sql`, `commons/src/storage/repositories/p3.mjs`, `commons/test/evidence.test.mjs`
- Acceptance: in `progress/P3.md`

### P4 — Process discussion and proposals

- Status: blocked
- Depends on: P1
- Can run with: P2, after P1, if it does not edit `service.mjs` or `App.tsx`
- Owns: `commons/src/domain/process.mjs`, `commons/src/http/routes/p4.mjs`, `commons/src/storage/migrations/040-process.sql`, `commons/src/storage/repositories/p4.mjs`, `commons/test/process.test.mjs`
- Acceptance: in `progress/P4.md`

### P5 — Human assembly

- Status: blocked
- Depends on: P1 and P4
- Owns: `commons/src/domain/governance.mjs`, `commons/src/http/routes/p5.mjs`, `commons/src/storage/migrations/050-governance.sql`, `commons/src/storage/repositories/p5.mjs`, `commons/test/governance.test.mjs`
- Acceptance: in `progress/P5.md`

### P6 — Truthful integrated journeys

- Status: blocked
- Depends on: P2, P4, P5, and W4
- Owns: journey tests and the deep-link wiring named in `progress/P6.md`. Coordinate with INT before editing world files owned by an open W section.
- Acceptance: in `progress/P6.md`

### P7 — Hosted pilot preparation

- Status: blocked
- Depends on: P1 through P6
- Owns: `vercel.json` and the operations checklist named in `progress/P7.md`. No paid provisioning.
- Acceptance: in `progress/P7.md`. The hosted two-machine gate cannot pass until the owner authorizes real staging projects.

### E1 — Promotional credit ledger

- Status: blocked
- Depends on: P1 and P2
- Owns: `commons/src/domain/credits.mjs`, `commons/src/http/routes/e1.mjs`, `commons/src/storage/migrations/060-credits.sql`, `commons/src/storage/repositories/e1.mjs`, `commons/test/credits.test.mjs`
- Acceptance: in `progress/E1.md`

### E0 — Fuji wallet spike

- Status: blocked
- Depends on: P1 and an explicit owner authorization that is not in the repository today
- Owns: nothing until that authorization names a prototype boundary
- Acceptance: in `progress/E0.md`

### W0 — Port village art

- Status: available
- Depends on: P0
- Can run with: P1
- Owns: `commons/web/src/world/art/`, and a re-export if sprite data moves out of `commons/web/src/components/Sprite.tsx`
- Does not own: `App.tsx`, `server.mjs`, or deletion of `commons/public/` until the check script and current UI no longer need them
- Acceptance: in `progress/W0.md`

### W1 — World shell

- Status: blocked
- Depends on: W0
- Exclusive: `commons/web/src/App.tsx`, `commons/web/src/index.css` for the world palette
- Owns: `commons/web/src/world/World.tsx`, `map/green.ts`, `engine/tick.ts`
- Acceptance: in `progress/W1.md`

### W2 — World state model

- Status: blocked
- Depends on: W1
- Owns: `commons/web/src/world/model.ts` and the Vitest coverage named in `progress/W2.md`
- Acceptance: in `progress/W2.md`

### W3 — Interiors and panels

- Status: blocked
- Depends on: W2
- Owns: `commons/web/src/world/Interior.tsx`, `ProblemPanel`, `AgentCard`
- Exclusive while assigned: the sheet components it extracts, so do not assign it beside another web section
- Acceptance: in `progress/W3.md`

### W4 — World heads-up display

- Status: blocked
- Depends on: W3
- Owns: `commons/web/src/world/hud/`
- Acceptance: in `progress/W4.md`

### W5 — World server fields

- Status: blocked
- Depends on: P0, and an exclusive hold on `service.mjs`
- Blocker: do not assign while P1, P2, or another backend section holds `service.mjs`
- Owns: `commons/src/http/routes/w5.mjs` only if the fields cannot be added there; otherwise a repository `w5.mjs`, migration `015-world.sql`, and `commons/test/world-api.test.mjs`
- Exclusive shared edit: `service.mjs` and the legacy state projector, additive fields only
- Acceptance: in `progress/W5.md`

## What can run at the same time

Now: P1 and W0.

After P1, if W0 is done: P2 and P4 together, while W1 proceeds. Do not also assign W5 or a second editor of `service.mjs`.

After W1: one world section at a time (W2, then W3, then W4) because they share the client shell.

E0 stays blocked until the owner authorizes a wallet prototype. E1 waits for P1 and P2.

## Coordinator checklist before assigning

1. Confirm the section status is `available` and `progress/claims/<id>` does not exist.
2. Confirm no assigned section holds an exclusive file this section needs.
3. Tell the agent the exact prompt in `AGENT_PROMPT.md` with the section id filled in.
