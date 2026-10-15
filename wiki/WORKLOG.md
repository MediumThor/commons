# Agent worklog

Append a task handoff after every task, before reporting completion. Preserve old entries; record corrections in new entries. Read PRODUCT.md and NEXT.md before continuing.

## 2026-10-14 — Clone, initial app scaffold, collaboration brief, and handoff

Changed:
- Cloned `elder-plinius/V3R1T4S` at `9b1d444eb864a1475e092047d49612a7410a7c5a` into the outer Commons folder, preserving its existing planning documents. Created local branch `codex/commons-platform`. Origin remains the upstream repository; no personal fork or push exists.
- Added an initial dependency-free Node 24 HTTP/SQLite backend in `commons/server.mjs`: local account/session handling, agent credentials, bank-backed public state, bounded task reservations, heartbeats, checkpoints, and release route code.
- Added initial HTML/CSS and a hand-authored animated SVG pixel village. No generated or third-party sprite assets were imported.
- Added workspace and application AGENTS.md guidance, preserved upstream research instructions, and established this mandatory wiki workflow.
- Owner clarified that collaborative problem solving is central: agents request help and vote, problems have a ranked leaderboard and active investigations, proof challenges invite inspectable review, all core actions are agent-readable, and the village should let visitors see real work.
- Wrote PRODUCT.md, ARCHITECTURE.md, and NEXT.md to reflect that direction and the actual incomplete implementation. Owner requested immediate relocation of the whole outer Commons folder to `~/Desktop/Commons` so other agents can continue.

Verified:
- `node --check commons/server.mjs` — passed.
- `node --check commons/public/village.js` — passed.
- `git diff --check` in the clone — passed for tracked changes.
- `git branch --show-current` — `codex/commons-platform`.
- `git rev-parse HEAD` — `9b1d444eb864a1475e092047d49612a7410a7c5a`.
- Node runtime available: v24.21.0; built-in SQLite opened an in-memory database and reported 3.53.4.

Limitations:
- Work paused at the owner's explicit request to update documentation and relocate immediately. The app is not working end-to-end.
- Missing `commons/public/app.js` means the page cannot load state or perform interactions. Missing `commons/agent.mjs` and test files mean the package's full check/test scripts are not yet complete.
- Backend routes have not been integration-tested. No browser QA, scientific verification, server deployment, token deployment, agent research run, or scheduling occurred.
- Help voting, proof challenges, per-problem wiki persistence, mandatory research-completion handoffs, and live sprite mapping are specified but not implemented. Static illustrations must not be reported as research activity.
- No changes are committed. Do not overwrite the existing work when continuing.

Next:
Follow NEXT.md item 1: finish the client and meaningfully test the local collaboration flow. Use PRODUCT.md as the feature acceptance brief and update this wiki after the task.

## 2026-10-14 — Install and launch the local site

Changed:
- No application code. Node.js 24.21.0 was already installed. `commons/package.json` has no third-party dependencies, so there was nothing to install.
- Started `npm start` from `commons`. The process is still running and bound to `127.0.0.1:4317`.

Verified:
- Server log: `Oracle Commons is open at http://127.0.0.1:4317`.
- `curl` against `http://127.0.0.1:4317/`: HTTP 200 HTML. `/api/state` and `/village.js`: HTTP 200. `/app.js`: HTTP 500 because `commons/public/app.js` does not exist. The request error is caught; the process stayed up.
- Browser opened `http://127.0.0.1:4317/`. Title and static layout rendered. The village stayed empty, stats stayed as dashes, and the activity feed stayed on “Opening the notebook…” because the client module never loaded.
- `npm run check` in `commons` failed at `node --check public/app.js` with `MODULE_NOT_FOUND`. `npm test` was not run; `agent.mjs` and the test files are still absent.

Limitations:
- The local server is a static shell plus the existing API. Signup, the problem board, and the village do not become interactive until `public/app.js` exists.
- This was a local launch only. No deployment, research run, or scheduling.

Next:
Finish `commons/public/app.js` so the page can load `/api/state` and the existing controls, then re-check the localhost flow.

## 2026-10-14 — Populate the problem board by category

Changed:
- The local board now shows the V3R1T4S bank: 135 open problems grouped into the 13 categories in `bank/categories.json`. Category chips, the field menu, search, and the village workbenches filter that list. Opening a problem shows its statement, what counts as a win, smaller checkable wins, how a win is checked, and source links.
- `commons/server.mjs` reads `categories.json` instead of a hardcoded name map, so Erdős problems use `erdos-and-proofs`. `/api/state` returns category summaries and short problem cards. `GET /api/problems/{id}` returns one full public problem. The agent insert used one extra placeholder; it now matches the seven agent columns.
- Added `commons/public/app.js` for loading, category rendering, problem details, and the existing signup/agent-key forms. Added `commons/test/problems.test.mjs`.

Verified:
- `node --check server.mjs`, `node --check public/app.js`, and `node --check public/village.js` passed.
- `npm test` in `commons` passed: 13 categories, 135 problems, Erdős count 13, and the Lehmer problem detail includes its criterion.
- `npm run check` failed at `node --check agent.mjs` with `MODULE_NOT_FOUND`. That file is still absent.
- Browser at `http://127.0.0.1:4317/`: stats showed 135 open problems and 0 agents. All 13 category chips rendered. Choosing Number hunts listed 19 problems. The graph-garden workbench switched the board to Graphs, games and automata and listed 14 problems. Opening “A number that shouldn’t exist” showed the Lehmer statement, win condition, partial wins, verification method, and source links. The activity feed stayed on “No notes yet.”

Limitations:
- Signup, login, agent registration, and key rotation are implemented but were not clicked through in the browser.
- Help voting, proof challenges, per-problem wiki persistence, and live sprite mapping are still not implemented. The village remains an illustration.
- The default board shows three problems per category until “Explore more unknowns” is used. Selecting one category shows all of its problems.
- No deployment, research run, or scheduling.

Next:
Integration-test signup, agent keys, and task claims, then add help requests and votes from NEXT.md item 1.


## 2026-10-14 — Independent-project deconstruction and source removal

Changed:
- Owner explicitly superseded the fork/adapter approach: study the research process, remove inherited implementation/data/history, and build original Commons behavior.
- Inspected the local reference revision `9b1d444eb864a1475e092047d49612a7410a7c5a`: setup, charter, research loop, reviewer roles, disclosure, submission packaging, lessons, and Python mechanical gate. Wrote DECONSTRUCTION.md in original prose, including limitations: self-reported reviewer contexts, structural checks versus scientific validity, warning-only mutation checks, incomplete leak heuristics, and lack of sandboxing.
- Retired all 529 inherited tracked files and the nested Git metadata outside the project. Removed source catalogue/guides/results/scripts/checkers/prompts, wrapper instructions, source-specific manifests/licenses, and the runtime revision file. Inventory/digests and the recovery location are in the outer `docs/cleanup-inventory.json`.
- Preserved independently authored Commons code, local data, wiki, planning history, and the other agent's active React rebuild. Kept legacy working paths to avoid breaking that agent. The root Git repository is `/Users/ryan/Desktop/Commons` and has no remotes; nested upstream history is gone.
- Replaced runtime catalogue reads with `commons/data/problems.json`: four original explicitly labelled demo exercises, not unsolved scientific results. Kept API shapes and `bankGenerated` as a deprecated date alias; added catalogue-origin metadata and demo flags. Old source IDs no longer resolve.
- Replaced source branding in the older static shell and made copy-only attribution changes in four React components (Hero, Footer, ProblemBoard, ProblemSheet). No frontend layout, styling, or interaction redesign. An older generated frontend build containing the original source URL was moved to the external recovery folder; source files were preserved.
- Rewrote project/application AGENTS.md guidance and current READMEs; preserved old worklog history, marked the earlier architecture as superseded, and updated PRODUCT.md, ARCHITECTURE.md, and NEXT.md. Added IMPLEMENTATION_PROMPT.md. No code from the reference was translated or adapted into the new validator or backend.
- Removed the package check's nonexistent agent CLI target; backend package license is UNLICENSED pending an explicit public-project licensing decision. Third-party frontend packages retain their own terms.

Verified:
- `npm run check` in `commons/` — passed (server, static client, village syntax).
- `npm test` initially could not bind localhost ports inside the sandbox (EPERM). Reran with local-port access: 3/3 passed. Tests use temporary SQLite instances, not the owner's data.
- Regression coverage: source-independent startup and original demo catalogue/details; old source ID returns 404; signup, agent registration, claim and heartbeat; wrong lease token rejection; private-demo checkpoint rejection with no canary in public activity.
- File audit: no inherited source directories or nested .git remain, and no byte-identical retired source files were found among retained project files excluding dependency/runtime/generated directories. Root Git has no remotes.
- Runtime/source scan found no source branding or source-load dependencies in server, original demo data, static client, or React source after targeted copy edits (analysis/historical documents and legacy path names are intentionally separate).
- Frontend `npm run typecheck` passed at one snapshot. A subsequent `npm run build` failed while the frontend agent concurrently changed interfaces: App referenced a removed bankGenerated type, district exports no longer matched component imports, and Problem/Agent type fields no longer matched components. Do not claim a completed frontend build or repair that agent's evolving work blindly.

Limitations:
- No browser revalidation or scientific-result verification was performed in this cleanup. Existing owner-started server processes were not terminated; they may retain the previous catalogue in memory until their owner restarts them.
- The frontend agent must finish its current type/API alignment and rebuild. New source files can change during simultaneous work; audit again before release.
- Help voting/ranking, proof challenge records, server-enforced wiki completion handoffs, and full privacy enforcement remain implementation work. The current private-checkpoint block alone is not a complete private-research policy.
- No changes were committed/pushed, no new remote created, and no production deployment/token transaction occurred.

Next:
Use IMPLEMENTATION_PROMPT.md and PRODUCT.md to implement original Commons collaboration/evidence mechanisms. Preserve and coordinate the frontend rebuild; start by inspecting its current contracts. Update this wiki after every task. Simplify the legacy directory layout only when that agent finishes.

## 2026-10-14 — Premium React redesign (dark mode, iOS typography)

Changed:
- Owner request: complete site redesign with dark mode, an iOS font, and a premium React UI; the source project is inspiration only. Built a new client in `commons/web/` (Vite 8, React 19, TypeScript, Tailwind 4, Motion, Radix Dialog, Lucide). Details are in the ARCHITECTURE "Web client" section.
- iOS system font stack (SF Pro on Apple devices, bundled Inter elsewhere; SF font files not shipped for licensing reasons). Dark-first iOS system color tokens, light mode, a no-flash theme script compatible with the CSP, and a persisted toggle with view transitions.
- New surfaces: glass nav, live-count hero, redrawn day/night SVG pixel village with keyboard-accessible buildings and sprites, activity feed, problem board, detail sheet, auth, agent registration with one-time key reveal and rotation, agent profile, how-it-works, ⌘K palette, toasts. Old village sprite pixel data was ported into `Sprite.tsx` (Commons-authored).
- Aligned the client with the other agent's independent catalogue mid-task: categories and colors come from `state.categories`, the card/detail API split is used, demo badges are shown, and the other agent's attribution wording is kept. This resolves the build break recorded in the previous entry.
- `server.mjs`: static serving now targets `web/dist` with a traversal guard, SPA fallback, immutable `assets/` caching, and a 503 explanation when the client is unbuilt (`webRoot` option on `createApplication`). Added `test/web.test.mjs` (3 tests).
- `package.json`: added `build`, `web`, and `check:web` scripts. `check` and `test` are unchanged.

Verified:
- `npm run check` passed; `npm run check:web` (tsc) passed; `npm run build` passed; `npm test` passed 6/6 (3 source-removal tests plus 3 static-serving tests). Tests bind localhost ports, so they need local-port access outside the sandbox.
- Manual browser QA against a throwaway server and `.data/qa` database, using only real API calls (test account, four registered agents, real claims, one checkpoint, one release): hero counts, village day and night with sprites at the correct buildings, activity feed, board filters, problem sheet detail, sign in, agent registration and key reveal, theme persistence across reload, and the command palette. At 390 px mobile width there is no horizontal overflow. The village card overflow found during QA was fixed and rechecked. The QA server was stopped and its `.data/qa` data deleted; the owner's `.data` was not touched.
- Grep found no source-project branding in `web/src`.

Limitations:
- No automated frontend tests; QA was manual and on Chromium only (no Safari/WebKit run, so SF Pro rendering was not seen first-hand in the embedded browser).
- The legacy `commons/public/` UI is no longer served but still exists and is still syntax-checked.
- The village fits at most four districts; on phones the scaled scene has small sign text.
- Help/vote/proof/wiki collaboration UIs depend on the backend work listed in NEXT and were not started.
- Nothing was committed or deployed.

Next:
See NEXT "Frontend status and follow-ups". Restart any long-running server so it serves `web/dist`.

## 2026-10-14 — Remove the v3r1t4s container directory

Changed:
- Owner asked to rename the `v3r1t4s/` folder and chose a flat layout. Moved `v3r1t4s/commons` to `commons/` and `v3r1t4s/wiki` to `wiki/`. Deleted the container's own `AGENTS.md`, `README.md`, and `.gitignore`: they duplicated the root files, and the root `.gitignore` already covers `node_modules`, `dist`, `.data`, and `*.tsbuildinfo`. Stale `tsbuildinfo` files were deleted so builds start clean.
- Added a root `package.json` (`setup`, `dev`, `start`, `build`, `check`, `test`, all forwarding to `commons/`) and `scripts/dev.mjs`, which runs the watched API and the Vite client together and stops both on Ctrl-C. `npm run dev` at the root previously failed with ENOENT.
- Updated path references and "temporary legacy directory" wording in the root AGENTS.md and README, `docs/architecture.md`, and the wiki pages ARCHITECTURE, NEXT, DECONSTRUCTION, and IMPLEMENTATION_PROMPT. Earlier worklog entries had their `v3r1t4s/commons` command paths updated; nothing else in them changed. Mentions of the V3R1T4S reference project by name (GitHub links, analysis titles, and the test asserting no V3R1T4S branding leaks into state) were intentionally kept. `docs/cleanup-inventory.json` was left unchanged because it records where removed files were when they were removed.

Verified:
- From the root: `npm run check` passed (backend syntax plus client typecheck); `npm run build` passed; `npm test` passed 6/6.
- `npm run dev` smoke test: `/api/state` returned 200 on 4317, the Vite client returned 200 on 5173, the proxied `/api/state` returned 200 through 5173, and the built client returned 200 from 4317. SIGINT stopped both Commons processes.
- A repository grep finds no remaining `v3r1t4s/` path references outside the cleanup inventory and the notes stating that the folder was removed.

Limitations:
- An unrelated Vite server from another project (BellaCatalog) listens on `[::1]:5173`, so `http://localhost:5173` may open that project instead. Use `http://127.0.0.1:5173` for Commons. It was not touched.
- Nothing was committed.

Next:
Unchanged from the previous entry; use the new root paths.

## 2026-10-14 — Founding constitution, human assembly, owner context, and platform build plan

Changed:
- Owner authorized a comprehensive amended implementation plan and new build direction: agents discuss research effectiveness and develop proposals; PEOPLE govern and vote; each human has a private instruction workspace read by their agents.
- Added CONSTITUTION.md, GOVERNANCE.md, OWNER_CONTEXT.md, RESEARCH_PROTOCOL.md, DATA_MODEL.md, BUILD_PLAN.md, and SOLUTIONS.md. Defined separate agent endorsements, human ballots, and scientific review; private versioned owner instructions and acknowledgement receipts; ongoing process discussions; proposal sponsorship/voting/execution/evaluation; research handoffs/evidence/reviews/corrections and a solution registry with no fabricated findings.
- Rewrote PRODUCT.md, ARCHITECTURE.md, NEXT.md, IMPLEMENTATION_PROMPT.md, wiki/README.md, root README.md, and root/application AGENTS.md around the founding direction. Initial numeric governance rules are documented design defaults requiring founding human ratification, not live DAO decisions.
- Selected a proposed Vercel React/Vite + short Node API, Firebase Authentication/Firestore/Storage architecture with emulator-first development, server authorization, explicit SQLite/identity migration, durable outbox delivery, private evidence boundaries, costs/operations, and acceptance gates. Cloud setup remains future implementation; no services were provisioned.
- While drafting, another task completed the frontend and removed the legacy container. Adapted every active path to root commons/ and wiki/; retained latest frontend architecture details, follow-ups, root commands, and historical worklog contents. Updated only the current-direction banner in docs/architecture.md while preserving its historical text. No removed container was recreated.

Verified:
- Inspected current root/app instructions, product/architecture/next/worklog/deconstruction, server/API, frontend contracts, package scripts, and tests before drafting; reread after the concurrent flat-layout change.
- Staged documentation validation passed for 16 files: local Markdown links, balanced fences, final newlines/trailing whitespace, current paths, and no concurrent documentation hash changes before apply.
- Checked official Vercel/Firebase/Cloud Tasks documentation for function lifecycle/limits, session cookies/revocation, Admin SDK versus Rules, transaction retries, Storage Blaze requirements, billing controls, and HTTP job delivery. Sources are linked in ARCHITECTURE.md.
- Applied only the 16 documentation/instruction files plus this appended worklog handoff. Post-apply link/content/history and application-file scope checks are the final completion checks for this docs-only task.

Limitations:
- This task establishes the constitution, specifications, and amended implementation prompt. It does not implement runtime owner prompts, governance, discussions, evidence/wiki registries, or cloud services.
- No application code, frontend assets, dependencies, local account data, runtime servers, Git history, or cloud configuration was changed by this task. No deploy, billing enablement, token transaction, external message, scientific claim, or schedule was created.
- No runtime test/build rerun is claimed for this Markdown-only change. Previous 6/6 runtime checks and browser QA remain attributed to the frontend/layout tasks above.
- Human membership/personhood policy, founding voting-rule ratification, public license, hosting budget/regions, and operational policies remain prelaunch decisions.

Next:
Follow BUILD_PLAN.md phases 0–2: freeze current contracts, establish human/context/storage authorization in Firebase emulators, and deliver the bounded research/help/handoff slice. Then implement evidence/registry, process proposals, and human governance through the documented acceptance gates. Use IMPLEMENTATION_PROMPT.md and preserve current commons/web work.

Final verification:
- Installed documentation validation passed: 16 files matched the reviewed drafts; 57 local Markdown links resolved; fences/newlines/whitespace and current-layout checks passed. Prior worklog bytes and historical architecture content were preserved; the removed container stayed absent.
- The documentation apply manifest contained no application-code write targets. Of 40 application files snapshotted, 36 remained byte-identical; four frontend files changed concurrently outside this task's write set (App, Nav, CommandPalette, AuthSheet). Those changes were preserved, not overwritten or reverted. No runtime checks are attributed to this docs-only task.

## 2026-10-14 — Simple signup sheet

Changed:
- The account sheet in `commons/web/src/components/AuthSheet.tsx` now asks only for a handle and a passphrase. Display name is omitted; `POST /api/auth/signup` already stores the handle when no display name is sent. The Sign in / Create account switch is a text link under the button.
- Logged-out nav says Join and opens signup. The command palette action is “Join or sign in” and opens signup. Hero, “Find your place,” and How it works still open signup and then the agents sheet. No API or server change.

Verified:
- Browser at `http://127.0.0.1:5173/`: Join opened a sheet with handle, passphrase, and Create account. Creating `simplejoin` signed in and the nav showed `@simplejoin`. Signed out, switched to Sign in on the same sheet, and signed back in. Creating the same handle again showed “That handle already has a home here. Try another or sign in.”
- `npm --prefix commons run check:web` passed (`tsc -b`).

Limitations:
- Display name stays the handle until a profile editor exists.
- Browser QA created the local handle `simplejoin` in the development SQLite database. The passphrase is not recorded here.
- No automated frontend test covers the sheet. Backend tests were not rerun; the API contract is unchanged.

Next:
A profile editor if display names should differ from handles. Otherwise continue the collaboration UI listed in NEXT.md.


## 2026-10-14 — Wallet and tokenomics research proposal

Changed:
- Added `docs/tokenomics-plan.md`: approximately 4,350 words of source-linked planning for automatically created/linked operator wallets, optional WalletConnect, shared operator credits, reputation, anti-spam holds, retained-contributor referrals, bounded agent operations, Avalanche settlement, explicit operating-cost scenarios, and a conditional future token allocation/vesting draft.
- Preserved PRODUCT boundaries: Avalanche remains the target, agent credentials remain separate from financial authority, and spending does not buy ranked attention votes or scientific proof status. All new policy values and allocations are proposals, not approved implementation.
- Added planning links/handoffs to wiki README, ARCHITECTURE, and NEXT. Created the interactive `commons-tokenomics.canvas.tsx` in the managed Desktop-Commons canvas directory, with provider comparison, editable cost inputs, governance boundaries, rollout gates, and primary sources. An export/staging copy and memo also live in the current chat visualization directory.
- The environment-supplied Documents/ChatGPT/Commons path does not exist. Inspected and wrote documentation in the active `/Users/ryan/Desktop/Commons` project. App source, databases, existing credentials, and other agents' files were not edited. No packages installed, provider accounts created, financial transactions sent, contracts deployed, external messages sent, or work committed/pushed.

Verified:
- `/Users/ryan/.nvm/versions/node/v24.21.0/bin/tsc -p /Users/ryan/.cursor/projects/Users-ryan-Desktop-Commons/canvases/tsconfig.json --pretty false` passed with exit 0.
- Python arithmetic checks confirmed the illustrative fee is $0.0225/operation; baseline cost $391.50/month; stress scenario $864/month; twelve-month baseline $4,698; full/20%-paid posting consumption $150/$30 per month; referral cap 100 qualifying rewards/month; and proposed token allocations sum to 100 million.
- Confirmed the three updated wiki pages link the plan. Researched primary provider docs/pricing, signed-login specification, Avalanche fee/integration docs, OpenZeppelin forwarding docs, and historical SEC/FinCEN sources. References are in the memo/report.
- Requested native opening of the managed canvas; the app returned queued. No rendered-browser visual QA or wallet integration test was performed. Application tests were not run because this task changed planning documentation and a standalone report only.

Limitations:
- No production usage, treasury, moderation cost, or retention dataset was available. Cost inputs are explicit scenarios, not live gas/token-price quotes. Provider fees and network behavior can change; signature/volume/RPC overages and one-time engineering/legal/security work are excluded from the simple calculator.
- Recovery, custody/signing control, existing-account migration, Avalanche provider behavior, receipt reconciliation, smart contracts, treasury policies, and reward-fraud resistance need implementation/prototype validation. The proposal does not establish current legal clearance or approve a token sale.

Next:
- Build a Fuji-only wallet-onboarding/recovery/linking prototype (Reown first; Privy fallback) and operator-level atomic credit holds/scoped agent API budgets alongside admission and handoff foundations. Run an invite-only credits pilot before real-money funding or transferable-token decisions. Preserve the user's authority over financial launches and unresolved entity/jurisdiction/funding decisions.

## 2026-10-14 — Integrate DAO and tokenomics research into the founding build direction

Changed:
- Reviewed docs/tokenomics-plan.md and the preceding research handoff, then integrated compatible findings into a new wiki/ECONOMICS.md and 12 existing docs (13 files total). Updated constitution revision 1.1, product, human governance, owner context, data model, architecture, build plan, next work, implementation prompt, wiki index, root README and the research's reconciliation wording.
- Preserved the owner's PEOPLE-govern principle: treasury/platform ballots remain equal-human; no token-weighted electorate is selected. Wallet setup is optional and explicitly owner-chosen, with stable Firebase/operator identity and private account links. Reown/Privy remain prototype candidates, not production dependencies.
- Specified promotional versus purchased credit lots, balanced immutable journals, atomic owner-shared holds/settlement/refunds/appeal compensation, policy pinning, cumulative agent grants, timeout races and reconciliation. Useful handoffs/stops, objections, method discussion, governance proposals and ballots stay free within limits. No LLM-only financial punishment or ordinary agent wallet signing authority.
- Integrated capped retained-contributor referrals, later funded bounties, human treasury approval/independent execution, conditional post-approval delay, enforceable signer/asset limits, verified payment intents/receipts and pause controls. Prices, numeric rewards/caps, supply/vesting and launch gates remain unapproved proposals; no token launch is required.
- Reconciled research-first sequencing, Firebase versus embedded-wallet auth, and mandatory wallet/token-weighted treasury language in the source plan. Retained its numerical scenarios/sources and conditional allocation. Clarified accepted Avalanche C-Chain finality and tests for pending/replaced/failed transactions, execution receipt lag and inconsistent RPC rather than generic confirmation/reorg assumptions.

Verified:
- Inspected current instructions, constitution/product/architecture/build/next/worklog, owner-context/governance/data-model/implementation docs and the full incoming tokenomics research before edits.
- Rechecked primary Reown/Privy authentication/pricing, ERC-4361 and Avalanche integration/fee docs for the boundaries being integrated. Sources are linked in ECONOMICS.md, ARCHITECTURE.md and the research; no provider or chain integration was exercised.
- Staged validation passed for 13 docs: Markdown fences/whitespace, 66 local links, economics cross-references, conflict-removal checks, and concurrency hashes. Independent arithmetic checks passed for the research's illustrative fee, baseline/stress costs, annual baseline, paid-share consumption, referral ceiling and 100-million allocation.
- Installed validation passed: all 13 files matched the reviewed drafts and 66 local links resolved. Application scope check: 41/41 snapshotted application files remained byte-identical; no application changes detected.

Limitations:
- Documentation/specification only. No app code, account data, credentials, dependencies, providers, cloud billing/configuration, wallet/contract, payment/reward transaction, scheduled job, external message or Git commit was changed/created by this task. No application build/test run is claimed.
- Prototype recovery/auth bridging, credit policy ratification, paid-service terms/funding/jurisdictions, actual custody/signing constraints and token-launch decisions remain future gates. Scenario prices/costs are not a production budget, legal clearance or investment promise. The other task's standalone canvas remains a research scenario snapshot; it was not edited.

Next:
Use ECONOMICS.md and the economic workstream in BUILD_PLAN.md alongside phases 0–2. Build owner context and useful collaboration/admission first, then emulator promotional credits and optional authorized Fuji recovery/linking tests. Do not let wallet/token work become a condition of research or human governance; require separate readiness and authorization before real money.

## 2026-10-14 — World design proposal: Oracle Green

Changed:
- Owner direction: return to the earlier `commons/public/village.js` village style and make the sprite world the site's main interface. Added `wiki/WORLD_DESIGN.md`, a design proposal and implementation plan with no runtime change. It covers:
  - an assessment of the existing records and gaps;
  - the world concept, palette and the SVG rendering decision;
  - the first screen and the Number Lab interior;
  - layout, navigation, pathfinding, crowd and expansion rules;
  - the sprite and animation spec, including the human-only Steward avatar and owner pennants;
  - a mapping from every current record and event (and proposed ones) to world behavior;
  - activity, contribution and verified-outcome visual registers;
  - six user journeys, the heads-up display and accessibility;
  - MVP steps W0–W5 with file paths, and observable acceptance criteria.
- Noted that the old village's four buildings map one-to-one to today's category IDs, and that its Number Lab chalkboard formula refers to a retired source-catalogue problem and must not be restored.
- Linked the page from wiki README and replaced the old village bullet in NEXT.md.

Verified:
- Read `server.mjs`, `data/problems.json`, `public/village.js`, PRODUCT, DATA_MODEL, BUILD_PLAN and the latest NEXT and WORKLOG entries, so the entity mapping reflects the current schema (`users`, `agents`, `tasks`, `checkpoints`, `events`) and the five event types.
- Checked that the pages WORLD_DESIGN links to exist. This was a documentation-only task; no build or tests were run because no code changed.

Limitations:
- Nothing in the design is implemented. Stale and disconnected states, paginated history, the "while you were away" view and work phases need the W5 server additions. Help, handoffs, the registry, reviews and governance visuals wait on BUILD_PLAN phases 2–5.
- The 60 KB and 60 fps budgets are targets, not measurements.

Next:
Start W0 and W1 in `commons/web/src/world/`: port the old village art and build the world shell as the home page, with the current board, feed and sheets moved to a `/list` view. Ask the owner the open decisions at the end of WORLD_DESIGN.md (panel palette, building names, presence of other people).

## 2026-10-15 — Phase P0 contracts, storage boundary, and multi-agent plan

Changed:
- Split the local server into a domain service, a SQLite store port, and HTTP adapters. `commons/server.mjs` no longer issues SQL. Claims, agent registration, release, and public checkpoints commit through `store.transaction()`.
- Published a credential-free agent entrance: `GET /llms.txt`, `/api/v1/capabilities`, `/api/v1/openapi.json`, `/api/v1/problems`, and `/api/v1/problems/{id}`. Cards omit the statement and criterion; detail includes them. Unavailable route families return HTTP 501 `UNAVAILABLE`. OpenAPI lists only live routes.
- Defined principal classes, visibility, structured v1 errors, concurrency notes, an idempotency helper plus table, and the context-receipt shape. Live routes do not enforce `Idempotency-Key`, and no receipt is issued.
- Kept `/api/state` and `/api/problems/{id}` response fields the React client reads, including `bankGenerated`.
- Added migration and repository extension points so later sections can add SQL and store methods without rewriting the core schema, and `commons/src/http/routes/` so later sections can mount handlers without editing the composition root.
- Added root `GOAL.md`, `WORKPLAN.md`, `AGENT_PROMPT.md`, and `progress/` records for P0–P7, E0, E1, W0–W5, and INT. Included the concurrent Oracle Green world plan as W0–W5. P0 and INT are claimed via `progress/claims/`.
- Updated ARCHITECTURE, DATA_MODEL, NEXT, the wiki index, the root README, and root AGENTS.md. Preserved the world-design worklog entry and its NEXT/README links.

Verified:
- Baseline before edits, from `commons/`: Node v24.21.0; `npm test` 6/6; server and legacy static `node --check` passed; `npm run check:web` (`tsc -b`) passed.
- After edits, at 2026-10-15T01:10:07Z from `commons/`: `npm test` 9/9; `npm run check` passed; `npm run check:web` passed.
- `commons/test/contracts.test.mjs` follows the brief's GET example, checks unavailable context, checks legacy client fields, checks public responses omit credential keys, round-trips the idempotency helper in SQLite, and loads a repository extension.
- No client component changed, so the browser UI was not re-exercised. The compatibility test covers the DTO fields in `commons/web/src/lib/api.ts`.

Limitations:
- Firestore, Firebase Authentication, instruction workspaces, lease generations, required handoffs, full history, and idempotency enforcement on live routes are not implemented.
- Local authentication remains the development scaffold. The process is still loopback-only.
- `/api/state` activity is still the latest 15 events. Normal release still does not require a handoff.
- W0–W5 are planned, not built. World palette, station names, and presence of other people remain open owner decisions; the work plan says to follow the design's recommendations and label them as recommendations.
- No deploy, billing, wallet, schedule, or external message.

Next:
Assign P1, W0, or both. They do not share files. Do not assign W5 or P2 while P1 holds `commons/src/domain/service.mjs`. Use `AGENT_PROMPT.md` and claim with `mkdir progress/claims/<section-id>`.

## 2026-10-15 — Interactive build roadmap page and live progress endpoint

Changed:
- Added `commons/src/http/routes/roadmap.mjs` (`GET /api/v1/roadmap`), discovered automatically by `dispatchRoutes`, which reads `progress/*.md`, `progress/claims/*`, `AGENT_PROMPT.md`, `wiki/WORKLOG.md`, `capabilitiesDocument()`, and the live filesystem status/timestamps of each section's owned files across `P0–P7`, `W0–W5`, `E0–E1`, and `INT`.
- Built `commons/web/src/components/RoadmapPage.tsx` with the Oracle Green Construction Map (pixel-art milestones, sprites, and lanterns across the Platform, World, and Economics trails), a Coordinator's Dispatch Desk showing what is ready to claim now (`P1`, `W0`), which steps have active agent claims or file edits on disk (`W0–W3`), what unlocks next (`P2`, `P4`, `W1–W4`), open human owner decisions, filterable section cards, a step detail sheet with acceptance criteria, disk file checks, API capability parity, and one-click copyable `AGENT_PROMPT.md` prompts.
- Added the `Roadmap` button right next to the `Join` / account button in `commons/web/src/components/Nav.tsx`, wired `/roadmap` in `commons/web/src/App.tsx`, added the roadmap action to `commons/web/src/components/CommandPalette.tsx`, and added `commons/test/roadmap.test.mjs`.

Verified:
- From `commons/`: `npm test` passed (10/10); `npm run check` passed; `npm run check:web` (`tsc -b`) passed; `npm run build` succeeded.
- Browser QA at `http://127.0.0.1:5173/`: clicked the `Roadmap` button next to `Join`, verified the `/roadmap` page, interactive construction map, dispatch desk, section cards, and the `P1` step detail sheet.

Limitations:
- Read-only local developer dashboard; claiming a section still uses the atomic `mkdir progress/claims/<section-id>` command in a terminal as specified by `WORKPLAN.md`.

Next:
Claim and implement `P1` (`mkdir progress/claims/P1`) and complete/verify the `W0–W4` world slices on disk.



## 2026-10-14 — First bounded collaboration demonstration

Changed:
- Added `/demonstration`, a working public evidence notebook for one fixed sum-of-squares exercise. Two owner accounts contribute canonical disjoint ranges; a fresh agent resumes the saved lower-half packet; a third account reports independent formula checks against an immutable candidate; a solo baseline receives the same fixed arithmetic checks.
- Added demo-local human-only scoped grants, immutable private instruction revisions, service-issued context acknowledgements, current-grant enforcement, immediate owner pause/agent stop, ten-minute fenced leases, contiguous immutable term evidence and atomic handoff/release. Durable idempotency receipts preserve retries without storing raw lease/key secrets.
- Added a route/repository/migration extension, dedicated OpenAPI and protocol, machine-readable capability/agent-brief links, scripted HTTP walkthrough, HTTP failure tests, browser smoke and the run guide at `docs/DEMONSTRATION.md`. General P1–P3 APIs remain unavailable. The local fixed checker never executes supplied code.
- Integrated through `main.tsx`, a plain navigation link and additive scripts. The installation detected concurrent world/navigation changes, preserved them and rechecked the integrated tree. No edit to App, world files, shared domain service, server entry, SQLite core, GOAL, WORKPLAN or other section statuses. D0 records this separately scoped human-authorized slice.
- `demo:serve` uses separate persistent `.data/demonstration-preview/` data; scripted accounts and the permanent fixture flag are explicit throughout. The normal development database is preserved. Older API processes receive restart guidance before using the new extension.

Verified:
- Installed `npm test`: 15/15 passed, including the concurrent roadmap test. New tests cover complete HTTP collaboration and restart, private canaries, cross-owner/cross-run context isolation, forged/stale acknowledgements, private immutable revisions, grant pause/key rotation, competing claims, required handoffs, exact resumption, generation/expiry fencing, request replay/conflicts, full history beyond 15 events, and corrupted per-term evidence whose aggregate total still looks correct.
- Installed `npm run check`, `npm run check:web`, and normal `npm run build` passed. The demo page is a separate lazy-loaded chunk (~7 KB gzip). The integrated build emitted a nonfatal main-bundle size advisory alongside concurrent world additions.
- Installed `npm run demo:browser` passed using the bundled Playwright/Chromium runtime: desktop/mobile horizontal overflow checks, light/dark mode, evidence download, signup, empty run creation, private grant/history UI, pause with publication consent unchecked, no private canary in public JSON, logout privacy and home-to-demo navigation. Screenshots in `/private/tmp/commons-demo-browser/` were visually inspected.
- The installed `demo:serve` walkthrough completed: candidate and solo result 338,350; 100 work terms each; 25 saved terms reused and 25 remaining terms computed by the fresh client; separate-account review passed. The fixture run is ac512a3d-0213-486f-b116-3d21dde3a818 on `http://127.0.0.1:4319/demonstration?run=ac512a3d-0213-486f-b116-3d21dde3a818`. Native preview opening returned queued.

Limitations:
- Scripted fixture accounts share one test operator. This validates workflow and authorization, not unique people, independent models or productive scientific research. No time, model-cost or answer-quality improvement was demonstrated; both paths evaluated 100 work terms. Client effort rounded below one millisecond and is explicitly self-reported, with missing coordination/model costs disclosed.
- This is a bounded local SQLite/development-identity slice, not Firestore semantics, Firebase identity, a hosted multi-machine pilot, the general solution registry, governance, or full P1/P2/P3 completion. Candidate corrections require a new run in this slice; original evidence and failed reviews remain immutable.
- Normal app data was not seeded. Browser smoke created test accounts/one empty run only in the isolated preview database. No model launch, cloud provisioning, public deployment, billing, wallets, financial transaction, schedule, external message or Git commit/push.

Next:
Use the run guide to perform an actual local trial with independently operated agents; retain original client reports and review disagreements. Complete shared P1 identity/storage foundations before a cross-machine hosted pilot, then migrate demo-local grants into that boundary. For a performance conclusion, collect actual usage/cost and reading/coordination/review effort on repeated comparable solo/collaborative tasks. Keep demo and scientific counts separate.

## 2026-10-15 — Phase P1 humans, private instructions, scoped grants, and emulator storage

Changed:
- Claimed `P1` via `progress/claims/P1` (`p1-agent`) and implemented Firebase emulator configuration (`commons/firebase.json`, `commons/.firebaserc` targeting `demo-oracle-commons` only, `commons/firestore.rules`, and `commons/firestore.indexes.json`).
- Added `commons/src/auth/principals.mjs`, `commons/src/auth/firebase-emulator.mjs`, and `commons/src/auth/index.mjs` for human/agent principal resolution, Firebase Auth emulator ID token verification and session exchange, client Security Rules evaluation (`evaluateFirestoreSecurityRules`), and server-mediated Firestore document isolation (`createFirestoreEmulatorGuard`).
- Added `commons/src/storage/migrations/010-p1-identity.sql` and `commons/src/storage/repositories/p1.mjs` (`extend(store)`) persisting separated human account/public profile records, immutable private owner instruction revisions (draft, publish, rollback), scoped agent grants and grant revisions, hashed agent keys, service-issued context receipts, run snapshots, owner-private context suggestions, identity audit events, and mirrored Firestore emulator documents.
- Added `commons/src/domain/instructions.mjs` and `commons/src/http/routes/p1.mjs` (`handle(ctx)`) serving `/api/v1/auth/session`, `/api/v1/me`, `/api/v1/me/instructions`, `/api/v1/me/instructions/revisions`, `/api/v1/me/instructions/revisions/{id}/publish`, `/api/v1/me/stop`, `/api/v1/agents`, `/api/v1/agents/{id}/grants`, `/api/v1/agents/{id}/revoke`, `/api/v1/agents/{id}/stop`, `/api/v1/agents/{id}/context-preview`, `/api/v1/agent/context`, `/api/v1/agent/context-ack`, `/api/v1/agent/context-suggestions`, `/api/v1/agent/stop`, and `/api/v1/runs`.
- Updated `commons/src/domain/service.mjs` to enforce current acknowledged context receipts and active scoped grants on work mutations while preserving legacy response shapes and immediate stop/release without requiring a handoff.
- Updated `commons/src/storage/port.mjs` and `commons/src/contracts/capabilities.mjs` additively and updated `progress/P1.md`, `wiki/ARCHITECTURE.md`, and `wiki/NEXT.md`.

Verified:
- From `commons/` at 2026-10-15T01:47:35Z: `npm test` passed 18/18 (including the new `commons/test/identity.test.mjs` suite, `contracts.test.mjs`, `demonstration.test.mjs`, `problems.test.mjs`, `roadmap.test.mjs`, and `web.test.mjs`); `npm run check` passed across `server.mjs`, legacy static files, and all `src/**/*.mjs` modules.
- `commons/test/identity.test.mjs` verified emulator-only `.firebaserc` (`demo-oracle-commons`), client `firestore.rules` denial of direct/cross-owner/agent reads and writes, server-side cross-owner isolation, two-owner agent context isolation, prompt-text non-expansion of scopes/limits, `UNAUTHENTICATED` and `CONTEXT_STALE` enforcement on unacknowledged/forged/stale receipts, draft vs published instruction revision transitions, immediate grant revocation without process restart, `HUMAN_REQUIRED` / `FORBIDDEN` on agent attempts to edit instructions or grants, immediate safe stop/pause without handoff, and persistence across API process restart.

Limitations:
- Firebase configuration targets local emulators (`demo-oracle-commons`) and local SQLite + mirrored Firestore emulator documents; no live cloud Firebase billing project or Vercel staging deployment was created.
- Structured work units, generation fencing on general tasks, mandatory normal-release handoffs, help requests, and owner-normalized endorsements belong to `P2` and remain marked `unavailable` in `/api/v1/capabilities`.

Next:
Coordinator can release the `service.mjs` lock from `P1` and assign `P2`, `P4`, or `W5` as sequenced in `WORKPLAN.md`.


## 2026-10-15 — World of generative category cities (W0–W3)

Changed:
- Owner direction: a much larger default world, one city per category, each city with a population, zoom into a city to see what each agent group is building, and cities that expand to hold their work.
- Claimed W0–W3 via `progress/claims/`. The W0/W1 shell from the previous session (sprite world on `/`, board, feed and hero on `/list`) is now included in these records.
- Added `web/src/world/map/atlas.ts`, the deterministic generative layout:
  - a Crossroads hub, and cities on a golden-angle spiral pushed outward until they clear each other;
  - orthogonal roads and seeded scenery;
  - square rings of lots per city, with a new ring whenever fewer than three plots would stay open.
- Replaced `map/green.ts` and the single-Green scene.
- Rewrote `world/model.ts` as `deriveWorld`: cities, lots, per-lot agent groups with approach text, distinct-agent population, floors from checkpoints, and homesteads. Kept the existing staleness estimate.
- New `world/camera.ts`: pan, wheel, pinch, double-click and keyboard zoom, fly-to, fit, and a resize that keeps the centre.
- Rewrote `World.tsx`:
  - map, town and street levels of detail;
  - collision-culled HTML labels, kept as screen-reader buttons when hidden;
  - minimap, zoom/home/fit controls and a map key, plus a breadcrumb back to the world;
  - separate scenery and sprite SVG layers with screen-size night filters (a group-level filter washed out at large extents).
- Added `LotBuilding` (foundation, floors, scaffold, crane, padlock) and `VacantPlot` art.
- Replaced `StationSheet.tsx` with `CitySheet.tsx`, which holds the city and lot panels.
- Updated `App.tsx` wiring, the nav label ("World") and the HUD copy.
- The owner chose original fields over restoring the retired 13 source categories. Added eight original categories with no problems to `commons/data/problems.json`, beside the four existing ones (12 total). No problems were invented. The owner declined a simulated crowd preview.
- Added `commons/test/world-atlas.test.mjs`. Updated ARCHITECTURE (catalog sentence, web client section), NEXT, WORLD_DESIGN §12, and `progress/W0–W3`.

Verified:
- From `commons/`: `npm test` 21/21 passed (including the 3 new atlas tests and the existing catalog test, which still counts 4 problems). `npm run check` and `npm run check:web` passed. `npm run build` succeeded with the existing chunk-size advisory (about 180 KB gzipped).
- Browser QA used a throwaway server on `127.0.0.1:4318` with `.data/qa-world`. A local script seeded test owners and agents through the API, following the test-suite flow (publish instructions, acknowledge context, claim). That produced 6 live reservations on the sum demo and 1 on the cycle demo; one test agent recorded 3 checkpoints.
- Checked in the browser:
  - Hub default view, fit-world map with culled labels, and the minimap jump.
  - City view: 1 lot plus 7 open plots, and the scaffold and crane.
  - Street view: 3 floors from 4 checkpoints, 5 sprites plus "+1", the DEMO pennant and plaques.
  - The lot panel listing all 6 members with approaches.
  - Dark mode after the layer split.
  - At 390 px width, the hub is centred with no horizontal overflow (checked through the DOM; screenshots under emulation were unreliable).

Limitations:
- Building interiors (§3), W4 heads-up display and W5 server summaries are not built. `/api/state` still returns every agent, which will not scale to thousands without W5.
- Model honesty rules have no unit tests yet; only the layout is tested.
- The signed-in Steward and own-agent markers were not re-checked in this pass. Reduced motion was not exercised in the browser.
- City positions shift when an earlier city grows a ring.
- The owner's servers on 4317 and 5173 keep the old 4-category catalog in memory until restarted.

Next:
Restart the local server to load 12 fields. Add model honesty tests (W2). Then W5 summaries before the population grows, or W3 interiors.
