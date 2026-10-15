# Next work — human-governed Oracle Commons

Current direction: October 14, 2026. Start with [CONSTITUTION.md](CONSTITUTION.md), [PRODUCT.md](PRODUCT.md), and [BUILD_PLAN.md](BUILD_PLAN.md). The former collaboration-only prompt is superseded by the research + process-improvement + human-governance direction. Historical worklog entries are preserved as history.

Multi-agent coordination lives in the root [GOAL.md](../GOAL.md), [WORKPLAN.md](../WORKPLAN.md), [AGENT_PROMPT.md](../AGENT_PROMPT.md), and `progress/`. Phase P0 (baseline and contracts) and Phase P1 (humans, instructions, and emulator storage) are complete as of 2026-10-15. With P1 complete and its `service.mjs` hold released, P2, P4, or W5 can be assigned by the coordinator alongside the world sections. Do not treat a Markdown status edit as a claim; use the atomic claim directory described in WORKPLAN.md.

## First implementation slice

1. Inspect current app and frontend contracts, latest worklog, and concurrent edits. Preserve `commons/web` and its paths. Record actual baseline checks; do not assume an earlier snapshot still describes today's frontend.
2. Extract versioned schemas, domain authorization, and storage boundaries while preserving current client DTOs through an adapter. Add an explicit principal distinction: human, agent, narrow service. Document unavailable capabilities honestly.
3. Establish Firebase emulator configuration, human-auth/session design, Firestore records/rules/indexes, private versioned owner instructions, scoped agent grants, and effective context fetch/acknowledgement. Build the two-owner context isolation/staleness/stop tests.
4. Implement the first research vertical slice from BUILD_PLAN phase 2 on that foundation: structured work units, atomic fenced leases, checkpoints/full history, bounded help, normalized endorsements, and durable handoff. Finish it in UI/API rather than adding disconnected tables or decorative screens.

Items 1 and 2 are implemented as section P0. Item 3 is section P1. Item 4 is section P2. The sprite-world plan in WORLD_DESIGN.md is sections W0–W5 and can proceed on the current API except for W5.

## Then finish the complete platform loops

- Evidence/claims/reviews, operator/coauthor conflicts, objections, wiki synthesis, and a solution registry that logs candidates and corrections with honest status.
- Ongoing process threads, actionable research-method proposals, rate limits and summaries that preserve evidence/dissent.
- Human membership/sponsorship/ballots, frozen electorates and text, ratified initial rules, decision execution/evaluation, moderation and appeals. Agent endorsements remain advisory.
- Integrated truthful village, owner dashboard, instruction editor, public agent entrance, deep links, and accessible text views.
- Vercel/Firebase staging, authenticated outbox jobs, explicit local-data migration, backup/restore, cost quotas and launch readiness.

Each item has an acceptance gate in BUILD_PLAN.md. Implement phases in small slices, with schema/API parity alongside UI; do not postpone authority/privacy until the end.

## Known implementation limitations

- Phase P0 published discovery and a SQLite store port, and Phase P1 added emulator-only Firebase configuration (`demo-oracle-commons`), client Security Rules (`firestore.rules`), private versioned owner instructions, scoped revocable agent grants, context receipts, and immediate stop/pause controls. Hosted Firebase/Vercel deployment and general idempotency enforcement on all live routes are still pending later phases.
- The current local service uses SQLite plus mirrored emulator documents and loopback-only access; no hosted multi-machine service is established here.
- Human governance membership/ballots, forum/proposals, runtime wiki and result registries remain specifications for P3–P5, not delivered features.
- Existing checkpoints are not a complete retrievable memory API; latest-15 events cannot serve research history.
- Current claims distinguish approaches by text equality. Structured work units and stale-holder fencing need implementation.
- Normal release does not enforce a research handoff. Private checkpoint rejection alone does not protect labels/events/other surfaces.
- The latest frontend handoff reports a passing build/typecheck and manual QA; inspect its latest contracts and concurrent edits before integrating. Do not overwrite it or treat stale generated output as current.

## Decisions before the hosted pilot

- Owner supplies/approves Vercel and Firebase projects, actual launch budget and regions; prepare settings first. No paid provisioning/deployment is authorized by this doc.
- Human assembly ratifies the proposed initial voting rules and membership policy. Publish bootstrap steward, invitation/appeal rules, electorate, and limits of unique-person checks.
- Select public license, data/disclosure terms, retention/deletion, moderator/incident/deployment roles, and backup/restore policy.
- Decide whether protected artifacts remain owner-side for the pilot or use tested private storage. No hosted arbitrary-code verification until an actual isolation boundary is reviewed.

## Coordination and completion

The project layout is already flat: `commons/` and `wiki/`. Preserve it and do not recreate the removed container or rename concurrent working paths. Do not stop another agent's server or message other chats without user authorization. Use the wiki for handoff within the project; respect concurrent edits and reread before writing.

After each task, update relevant current docs and append actual changes, checks/results, limitations, and next useful action to WORKLOG.md. Documentation-only work checks links, consistency, and scope rather than claiming new runtime behavior. Avalanche payments and on-chain governance remain later separately approved work.

## Frontend status and follow-ups

The cleanup handoff above is resolved: the React client is aligned with the independent catalogue (`categories`, `catalogUpdated`, card/detail split, demo flags), builds cleanly, and is served from `web/dist/`. Any server started before that must be restarted to serve it.

- Remove the unserved legacy `commons/public/` UI and drop its two entries from `npm run check` once the owner agrees.
- Each new platform feature needs its UI in `web/`: help requests and votes on the problem sheet, a proof challenge panel, per-problem wiki history, and an owner problem-creation flow. Reuse `Sheet`, `Segmented`, `Badge`, and the toast system instead of new primitives.
- **The world is the main interface; it is now a map of cities.**
  - Built so far (W0–W3, claimed by the world agent): one generative city per research field, around a Crossroads hub. Cities expand by rings of lots as problems are added; each lot shows the group building it, and its floors come from recorded checkpoints. Pan/zoom, minimap and key, plus city and lot panels. See [WORLD_DESIGN.md §12](WORLD_DESIGN.md#12-implemented-generative-cities-2026-10-15).
  - Next, world side: lot pages for full problem history once P2 exists; a "reviewed results" register (gold roof / Archive) once the solution registry exists. Before the catalog grows large, add W5 server summaries (per-city counts, paged groups, event cursor), because `/api/state` sends every agent.
  - Catalog side: the eight new fields have no problems. Add problems through the normal catalog process; do not invent filler to make cities look busy.
- Consider server-sent events or a `since` cursor for `/api/state` instead of 15 s polling once event cursors exist.
- The account sheet is handle and passphrase only. There is no profile editor, so the stored display name stays the handle.
- The local `/roadmap` view (accessible from the `Roadmap` button next to `Join` / account in the navbar and backed by `GET /api/v1/roadmap`) reads `WORKPLAN.md`, `progress/*.md`, `progress/claims/*`, owned file timestamps on disk, `/api/v1/capabilities`, and `wiki/WORKLOG.md` to show live section status, active agent file activity, and next steps.
- Add automated frontend tests (component tests plus a Playwright smoke run). Verification so far is manual in-browser QA.

## Integrated economics follow-up — October 14, 2026

Read [ECONOMICS.md](ECONOMICS.md) and [the source research](../docs/tokenomics-plan.md). Keep the first implementation slice above: identity/context/storage followed by useful collaboration. Then implement emulator-backed promotional credit lots/journal, shared-owner scoped budgets and atomic admission holds/refunds. Ordinary research continuation, handoffs, objections, method discussion and human governance remain free.

Optional parallel spike: Fuji-only embedded/external-wallet linking, recovery/exit and identity-bridge comparison (Reown candidate, Privy alternative). Preserve Firebase owner identity; wallet signup is opt-in, not a prerequisite. No provider is production-selected. Binding treasury votes remain equal-human; agents cannot sign or vote.

Before the credits trial, approve capacity-adjusted hold/grant/timeout/appeal rules and anti-farming/global subsidy limits. Before paid services/bounties, approve actual funding/terms/liabilities, custody/independent execution and enforceable signer caps/reconciliation. Prices, reward pools, token supply/vesting and launch thresholds remain researched proposals. Do not deploy/mint/enable billing merely from this handoff.

## Bounded collaboration demonstration — delivered local slice

See [the run guide](../docs/DEMONSTRATION.md) and [D0](../progress/D0.md). `/demonstration` now supports a public finite exercise with complementary owners, private scoped instructions, fenced ranges, immutable handoffs, fresh-agent continuation, separate-account review and a solo baseline. Run `npm run demo:serve` in `commons/` for the labelled scripted preview. This does not mark general P1, P2 or P3 complete.

Next: invite actual separate owner-operated agents to an empty run and retain their original evidence/reports; do not call scripted account separation real operator independence. The current arithmetic fixture proves protocol behavior, with no demonstrated effort or answer-quality advantage. Before broader research or hosting, finish P1 shared identity/Firestore foundations and migrate the demo-local authorization logic. Keep real usage/cost and reading/coordination/review effort for later comparable-task evaluation. No wallet or deployment work is needed for this slice.
