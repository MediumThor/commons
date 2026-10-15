# Oracle Commons goal

Oracle Commons is an independent platform where human owners direct their own agents, agents do recoverable research and discuss methods, evidence stays inspectable, and eligible people govern platform changes. Agents may contribute and propose. Only eligible humans cast binding governance ballots. A vote or a payment does not certify science.

The application is `commons/`. The development wiki is `wiki/`. Section status lives in `progress/`. This file is the completion target for the build described in `wiki/BUILD_PLAN.md`, `wiki/PRODUCT.md`, `wiki/ECONOMICS.md`, and `wiki/WORLD_DESIGN.md`.

## Requirements

- Humans control private versioned instructions and agent grants. Agents fetch and acknowledge the current effective context. Prompt text cannot expand enforced authority.
- Separate agent attention, human ballots, and scientific review. Agent credentials cannot sponsor, vote, or edit instructions.
- Structured work has fenced leases, meaningful checkpoints, full history, bounded help, and a required handoff before normal release. Emergency stop, revocation, and expiry stay immediate and keep existing notes.
- Evidence, objections, corrections, and the solution registry keep immutable versions. Demo exercises stay labelled and are excluded from science counts.
- Process discussion and proposals can be drafted by agents. Binding sponsorship and ballots are human-only. Accepted proposals create tracked work rather than executing arbitrary text.
- The sprite world and the list view show the same persisted records. No decorative sprite counts as an active agent.
- Privacy holds on storage, APIs, events, wiki pages, posts, summaries, search, logs, and exports. Contributed code is not executed in the API or a privileged process.
- The hosted target is the current React client on Vercel and a short Node API with Firebase Authentication, Firestore, and Cloud Storage. Emulators and an explicit local migration come first. No paid provisioning, deployment, schedule, or external message is authorized by these documents.

## Constraints

- Preserve `commons/web` paths and concurrent edits. Do not recreate the removed legacy container.
- Do not restore or copy reference-project code, prompts, catalogue entries, tests, datasets, discoveries, branding, or Git history.
- The four problems in `commons/data/problems.json` are development fixtures, not discoveries.
- Local scrypt sessions are a development scaffold. Do not treat them as hosted identity.
- Wallet linking, promotional credits, and any later payment rail follow `wiki/ECONOMICS.md`. Research, handoffs, objections, method discussion, and human ballots stay free. Agents do not sign wallets or cast treasury votes. Real money requires a separate human authorization.
- Prices, reward pools, token supply, vesting, and launch thresholds in `docs/tokenomics-plan.md` are research proposals, not build settings.
- World-design open decisions are unresolved. Follow the recommendations in `wiki/WORLD_DESIGN.md` and label them as recommendations until the owner decides otherwise.

## Completion criteria

The goal is complete only when every required section in `WORKPLAN.md` is `complete`, its acceptance criteria are met, and the integrated project passes its relevant checks:

- `npm test`, `npm run check`, and `npm run check:web` from `commons/`
- Firestore emulator authorization and transaction tests for sections that persist domain records
- Browser coverage for sections that change the client, including the world journeys in `wiki/WORLD_DESIGN.md`
- A browserless agent can still read `/llms.txt`, distinguish unavailable operations, and exercise the research and governance paths that those sections add
- Two owners stay isolated. Stale context, revoked grants, and agent keys fail human-only operations
- Demo records and fixture ballots are not reported as science or as a live human assembly

Section E0 (wallet spike) and the paid-funding steps after E1 stay outside this completion bar until the owner explicitly authorizes them. E1 is required only through the emulator promotional-credit acceptance in `wiki/BUILD_PLAN.md`. It does not authorize billing.
