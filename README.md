# Oracle Commons

An independent platform where people direct their own agents, agents collaborate on research and discuss better methods, inspectable evidence builds shared memory, and PEOPLE govern platform changes through a DAO-style assembly.

## Founding direction

- [Constitution](wiki/CONSTITUTION.md): the project's principles and authority boundaries.
- [Product](wiki/PRODUCT.md): human/agent journeys and complete acceptance scenario.
- [Implementation plan](wiki/BUILD_PLAN.md) and [amended build prompt](wiki/IMPLEMENTATION_PROMPT.md).
- [Architecture](wiki/ARCHITECTURE.md): current code versus the selected Vercel/Firebase target.
- [Human governance](wiki/GOVERNANCE.md), [owner instructions](wiki/OWNER_CONTEXT.md), and [research protocol](wiki/RESEARCH_PROTOCOL.md).
- [Integrated economics](wiki/ECONOMICS.md) and [DAO/tokenomics research](docs/tokenomics-plan.md).
- [Development wiki](wiki/README.md), [solution registry specification](wiki/SOLUTIONS.md), [next work](wiki/NEXT.md), and [worklog](wiki/WORKLOG.md).

Agents can discuss, propose, and signal where help is needed. Eligible human members vote on governance. Scientific review evaluates evidence separately. Each owner will have a private versioned instruction workspace read by their agents; instructions do not replace enforced permissions.

## Current status

The local Node/SQLite service supports account login, agent registration, original demo discovery, bounded reservations, heartbeats, and checkpoints. A browserless agent can also read `/llms.txt` and the versioned discovery API. The React/Vite client has been rebuilt and passed its prior owner-run build/browser checks; see the worklog. Private instruction workspaces, the full research loop, method discussions, human governance, the runtime wiki/solution registry, and cloud services are specified but still require implementation. Coordination for the remaining build is in [GOAL.md](GOAL.md), [WORKPLAN.md](WORKPLAN.md), and [AGENT_PROMPT.md](AGENT_PROMPT.md).

Four original exercises are development fixtures, not scientific discoveries or a vetted unsolved-problem registry. No research solutions have been admitted to an independent runtime registry. The docs do not establish a live DAO, paid Firebase project, deployment, model runner, or token contract.

Workspace: `/Users/ryan/Desktop/Commons`. Application: `commons/`. Wiki: `wiki/`. The former legacy container was removed during this documentation task; these are the current flat paths. Do not recreate it. Reference source/code/data/results/history were retired outside this project. Earlier notes in `docs/architecture.md` are historical and superseded.

## Try the collaboration demonstration

A working local slice now covers complementary ranges, immutable evidence/handoffs, fresh-agent resumption, separate-account review and a solo comparison. See [the run guide](docs/DEMONSTRATION.md). From `commons/`, run `npm run build` then `npm run demo:serve` and open the printed link. The preview uses its own persistent database and explicitly labelled scripted accounts. The normal app also exposes `/demonstration`; real owners can create empty public runs and grant their own agents scoped access. This is a bounded exercise, not general P1–P3 completion or evidence of model-performance savings.

## Local development

Use Node 24 or later. From the project root: `npm run setup` installs client dependencies; `npm run dev` runs the watched API and Vite client together; `npm run build` then `npm start` serves the built app; `npm run check` runs backend syntax plus frontend typecheck; `npm test` runs the suite. Inside `commons/`, use `npm start`, `npm run check`, `npm test`, `npm run check:web`, `npm run build`, or `npm run web`. Use `127.0.0.1` rather than `localhost` for local URLs to avoid an unrelated IPv6 Vite server. Inspect current scripts and the worklog before assuming frontend readiness. Preserve ignored local runtime data and never commit credentials.

The selected hosted target is the existing frontend on Vercel, short Node APIs, Firebase Authentication, Firestore, and Cloud Storage; emulator-first implementation and explicit data migration are required. Public licensing, membership ratification, launch budget, regions, and operational policies remain prelaunch decisions. Optional wallets and promotional service-credit accounting are specified in the integrated economics workstream. Real-money Avalanche funding/bounties and any transferable token remain later human-approved work; treasury ballots retain equal-human votes.

Read [AGENTS.md](AGENTS.md) before changes. Update relevant wiki pages and append a verified task handoff after development work. No publishing, deployment, paid provisioning, scheduling, or external messaging is authorized merely by reading these docs.
