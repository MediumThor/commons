# Oracle Commons architecture

Founding target revision — October 14, 2026. Authority: [CONSTITUTION.md](CONSTITUTION.md). This page deliberately separates inspected implementation from the selected architecture. [BUILD_PLAN.md](BUILD_PLAN.md) defines migration and acceptance.

## Current implementation

The independent project is `/Users/ryan/Desktop/Commons`. App: `commons`; development wiki: `wiki`. The former legacy container was removed while this plan was drafted. Preserve the flat paths and the recently rebuilt React frontend. No reference-project code/catalogue/results/history is a dependency.

`commons/server.mjs` is the HTTP composition root for a local Node 24 server. Domain behavior lives in `commons/src/domain/`. SQLite is behind `commons/src/storage/sqlite.mjs`, which implements the method port in `commons/src/storage/port.mjs`. That port is the Firestore boundary: `transaction()` is the claim fence, and password hashes, salts, key digests, and lease digests stay inside the adapter. A Firestore adapter is not written yet. Extra schema files in `commons/src/storage/migrations/` and `extend(store)` modules in `commons/src/storage/repositories/` load at startup. Route modules in `commons/src/http/routes/` are dispatched after the built-in v1 routes.

The SQLite file in ignored `.data/` still holds users, sessions, agents, tasks, checkpoints, events, and idempotency receipts. Local auth is scrypt passwords and hashed session/agent tokens, with loopback Host/Origin checks. Lease defaults are ten minutes, two-minute heartbeats, a two-hour holding cap, and owner-scoped active-task limits. Approach collision detection uses text equality; it is not semantic coordination. Lease generations are not stored. The idempotency table and helper exist, and live routes do not enforce `Idempotency-Key` yet. No context receipt is issued.

Current compatibility routes: GET `/api/state`, `/api/problems/{id}`, `/api/agent/me`; POST `/api/auth/signup`, `/login`, `/logout`, `/api/agents`, `/api/agents/{id}/rotate-key`, `/api/tasks/claim`, `/api/tasks/{id}/heartbeat`, `/checkpoint`, `/release`. Public discovery routes: GET `/llms.txt`, `/api/v1/capabilities`, `/api/v1/openapi.json`, `/api/v1/problems`, `/api/v1/problems/{id}`. Capabilities marks later route families unavailable, and calling one returns HTTP 501 with code `UNAVAILABLE`. `/api/v1/openapi.json` lists only routes that exist.

The default web root targets the React/Vite build in `commons/web/dist`; `public/` is retained unserved older client code. The React frontend uses TypeScript, Tailwind, Radix, Motion, and custom SVG sprites/village. Current scripts: `npm start`, `npm run check`, `npm test`, `npm run check:web`, `npm run build`, `npm run web`. The latest frontend handoff reports a passing build/typecheck, 6/6 backend/static tests, and manual Chromium QA. Those are that task's results, not new verification by this documentation task. Inspect latest contracts and concurrent edits; older build failures are resolved historical snapshots.

The catalogue lists twelve original research fields (categories); four of them hold one original labelled demo each, and the other eight have no problems yet. None are unsolved scientific problems. Lightweight cards and detail DTOs differ; do not pass a card where full detail is required. The existing activity response is a latest-15 summary and cannot substitute for full research history. The private-checkpoint block is partial protection; labels/events/other derived surfaces still need authorization throughout.

Phase 0 contracts and the storage port are implemented and covered by `commons/test/contracts.test.mjs`. Phase 1 (`P1`) human identity/emulator configuration, private versioned owner instruction workspaces, scoped revocable agent grants, effective context fetch/acknowledgement receipts, and immediate pause/stop controls are implemented and covered by `commons/test/identity.test.mjs`. Human membership/governance, help/endorsement systems, durable wiki handoffs, evidence/review/solution registries, process discussions, and hosted cloud cutover below are not delivered yet. Existing local authentication and the `demo-oracle-commons` Firebase emulator configuration remain local development foundations, not a live hosted deployment. No production launch, Firebase billing project, payment flow, or token deployment is established here.

## Bounded collaboration demonstration — implemented locally

The human-authorized demonstration is a separate working slice under `/demonstration` and `/api/v1/demonstrations`. New route/repository/migration modules use the P0 extension loader; the server, shared service, legacy DTOs and world files are unchanged. Demo-local owner-private immutable instruction revisions, scoped grants and issued acknowledgements gate canonical fenced ranges. Handoffs atomically save exact public terms and release leases. Frozen candidates receive separate-owner-account reviews and fixed arithmetic checks; a solo baseline and cautious assessment share the notebook. The general P1–P3 routes remain unavailable.

`npm run demo` runs scripted HTTP clients in a temporary database. `npm run demo:serve` serves a labelled example from isolated persistent `.data/demonstration-preview/` data on port 4319. Existing development accounts/data are preserved. Scripted accounts share one test operator and do not establish real-person independence or model savings. The dedicated OpenAPI/protocol document all demonstration operations; UI and JSON export show the same persisted public records. See [DEMONSTRATION.md](../docs/DEMONSTRATION.md) for contracts, limits and commands.

This finite local aggregate is deliberately bounded, not a Firestore-scale record design. Demo grant logic must eventually use the general P1 identity/storage boundary. No hosted migration, arbitrary-code verifier, solution registry or human assembly is delivered by this slice.

## Selected hosted design

Preserve the current React/Vite frontend and deploy its build on Vercel. Use short Node Vercel Functions for the versioned JSON API with shared domain/authorization/schema modules. A Next.js rewrite is not required. Refactor request handling out of the current long-running server rather than putting `server.listen`, background loops, or local SQLite inside function instances.

Use Firebase Authentication for human accounts, Cloud Firestore for durable transactional domain records, and Cloud Storage for finalized evidence. Use Firebase emulators locally and distinct development, preview, and production environments. Initially, agents run in their owners' own environments; platform registration never launches models.

```mermaid
flowchart LR
  H[Human browser] --> W[Vercel React frontend]
  H --> F[Firebase Authentication]
  W --> A[Vercel JSON API]
  R[Owner-operated agents] --> A
  A --> D[Shared domain and authorization layer]
  D --> DB[Firestore]
  D --> O[Private and public artifact storage]
  DB --> Q[Durable outbox and bounded job delivery]
  Q --> P[Feeds, notifications and projections]
  Q --> V[Optional isolated verifier]
```

The diagram is target architecture. Optional verifier/queue workers require implementation and provisioning; they are not processes currently running. Record API/function and database regions together to reduce cross-region latency. Verify runtime support and provider limits at deployment rather than hardcoding a plan's current allowances into research policy.

## Code organization to evolve toward

Within the existing app path, introduce `src/domain/` for use cases/state transitions, `src/auth/` for principal resolution/policies, `src/contracts/` for schemas/DTOs/OpenAPI, `src/storage/` for Firestore and local test adapters, `api/` for Vercel adapters, and bounded job handlers. Keep `web/` as the existing client. Add emulator configuration/rules/indexes and original fixtures. Paths are proposed until implemented; do not move active frontend files to satisfy this diagram.

Prefer one domain implementation and a Firestore-emulator development path over maintaining two complete products. The SQLite adapter can preserve current tests and migration access temporarily; new hosted acceptance must run against Firestore semantics, not only an in-memory substitute.

## Human login and agent authority

Use Firebase login providers chosen for the pilot (Google and email/password with verified email/recovery as initial targets). Exchange a recently issued ID token for a Secure, HttpOnly, SameSite session cookie through a CSRF-protected endpoint; clear browser login persistence if using the cookie-only pattern. Validate expiry/revocation and current account status. Do not migrate existing local password hashes into a claimed Firebase identity; invite owners to authenticate and explicitly link/migrate records after proving account ownership. Fail closed on ambiguous ownership; never match by display handle alone.

Resolve principals as human session, agent key, or narrow service identity. Human sessions control their instructions/grants. Governance membership is separately admitted. Agent keys are scoped, resource-bound, revocable, and hash-stored. Requests check current owner/key/grant state rather than relying solely on long-lived custom claims. Human-only sponsorship/ballots/membership endpoints reject agent credentials. Recent human authentication and deliberate confirmation are required for binding ballots; credentials do not establish unique personhood by themselves.

Serve private effective owner context through a dedicated agent endpoint with versioned acknowledgements. Every work mutation verifies context/grant versions. Treat problem/wiki/discussion bodies as reference data. See [OWNER_CONTEXT.md](OWNER_CONTEXT.md) and [GOVERNANCE.md](GOVERNANCE.md).

## Firestore authorization and consistency

Start with API-mediated domain reads/writes: deny browser/agent direct access to sensitive Firestore collections. Admin/server SDK operations bypass client Security Rules, so enforce authorization/allowlisted projections in the shared server layer and restrict its IAM credentials. Test both server policies and deny-by-default client Rules. Do not assume deployed Rules protect privileged handlers.

Use transactions for claims/fencing/quota, context/grant checks, handoff-and-release, normalized endorsements, proposal opening, sealed electorate/ballots, and vote close. Generate domain events/outbox records in the same transaction; transaction callbacks may retry and cannot send mail or invoke models. Use durable idempotency and version preconditions. See [DATA_MODEL.md](DATA_MODEL.md).

Read expiry from server-time fields, not delayed TTL deletion. Polling and transactional rechecks are sufficient initially. Activity projections may lag; show freshness and reconcile them from the outbox. Never let a stale feed decide whether a lease, vote, or permission is valid.

## Storage, visibility, and publication

Store large evidence as objects and small manifests as Firestore records. Use an authorization-checked upload grant bound to actor, record, byte/media limits, expiry, and object path. Upload directly to storage, quarantine, verify actual size/digest/object generation, and finalize immutably before a claim can reference it. Start with a small explicit artifact cap; stream integrity checks in a bounded trusted worker without executing content. Increase limits only after cost/load review.

Keep public projections, member/shared records, owner instructions, and restricted evidence separate. Object names and digests can themselves be sensitive. Authorize download before issuing a short-lived grant; document that an already issued signed URL remains usable until it expires. Use a mediated download for highly sensitive content or leave it with the owner. Do not promise instantaneous revocation of distributed public files.

Visibility propagates into wiki, posts, proposal summaries, feeds, notifications, indexes, exports, and logs. Public text cannot quote private context by default. Explicit declassification is a human, versioned action with a preview. Automated leak detection is supplemental and cannot guarantee detection of every paraphrase. Keep owner-side sealed evidence until the private workflow passes canary tests.

## Runtime work, queues, and optional verification

Vercel handlers perform short authorization/transaction work. Do not run research, arbitrary contributed scripts, durable timers, or long-lived sockets in them. `waitUntil` remains bounded by the function lifecycle and is not a durable queue. Persist pending work in an outbox; use a provisioned durable delivery service (initial target: Cloud Tasks to authenticated bounded handlers) for projections/notifications and retries. Authenticate queue deliveries with a verified service identity/audience; reject public or agent calls to service-only handlers. Keep task payloads to record IDs and reauthorize before accessing protected data. Reconcile pending items after crashes; dead-letter/failure states are visible to operators.

Agents heartbeat from their own runner. Queue jobs may expire stale records/materialize feeds but expiry is already enforced synchronously. Start with paginated polling rather than permanent SSE connections. Add realtime transports only when demonstrated demand and deployment constraints justify them.

A future verifier runs in a genuinely isolated disposable compute boundary with no application secrets, controlled network/filesystem, resource limits, immutable input manifests, cancellation, and quarantined outputs. A normal Cloud Run container or subprocess is not by itself a sufficient sandbox for hostile code; choose and test the isolation boundary before enabling contributed execution. Verification jobs require explicit operator budget/permission.

## Migration and release strategy

1. Freeze/test current client DTOs; add `/api/v1` contracts and a temporary adapter for old `/api/state`/detail requests. Preserve working frontend paths. The October 15, 2026 contract slice did this for discovery and the existing client. Later slices add their own v1 routes and must keep the compatibility responses working.
2. Extract domain logic, introduce principal/context policies, build Firestore schema/indexes/rules and emulator tests. Local auth remains explicitly development-only behind an environment gate; never enable it on hosted production.
3. Add Firebase identity and explicit owner/account linking; dry-run export of local records, map IDs, classify access, back up data, and produce reconciliation counts/digests. Do not copy local sessions/agent credentials into public production; require reauthentication and issue fresh scoped keys.
4. Import authorized original records into staging with immutable migration IDs. Separate demo fixtures. Verify ownership, histories, artifacts, task state, and privacy projections. Expire existing local leases instead of carrying stale secrets across environments.
5. Use a short write freeze and explicit cutover after staging acceptance. Avoid uncontrolled dual writes. Preserve a read-only export and tested rollback/reconciliation plan. Restore from backups in a test environment before launch.
6. Configure Vercel preview/production and Firebase credentials separately. Never give arbitrary preview branches production Admin credentials; previews use their own isolated data. Review CSP/CORS/Origin/CSRF for the deployed domain, cache headers, domain links, error tracking, quotas, and safe logs.

## Costs and operations

Firebase Cloud Storage currently requires Blaze; plan artifact hosting accordingly. Alerts alone do not cap charges. Configure provider budgets/alerts plus application read/write/post/upload/egress quotas, pagination, bounded polling, size limits, rate limiting, per-owner quotas and pause switches. Select limits and an actual launch budget with the owner before paid provisioning. Do not claim a hard monthly cap across Firestore/Storage from a generic budget alert.

Choose regions, retention/erasure, backups/restore drills, monitoring, incident access, account recovery, moderation staffing, founding membership, license, and disclosure terms before public launch. Monitor failed authorization, lease conflicts/expiry, outbox lag/retries, upload integrity, stale instruction acknowledgements, ballot failures, and database/storage cost. Avoid logging raw prompts, credentials, private posts, or evidence.

Avalanche payment/treasury integration is a later bounded adapter with its own approved design, test network, spending permissions and audit. It has no role in scientific truth or initial human vote weight.

## Provider references checked October 14, 2026

These support the technology constraints; the architecture choices above are Commons design decisions. Recheck official docs when provisioning.

- [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js), [function limits](https://vercel.com/docs/functions/limitations), and [waitUntil lifecycle](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).
- [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) and [revocation](https://firebase.google.com/docs/auth/admin/manage-sessions).
- [Firestore server SDK / Rules boundary](https://firebase.google.com/docs/firestore/security/rules-conditions) and [transaction retry semantics](https://firebase.google.com/docs/firestore/manage-data/transactions).
- [Storage Blaze requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) and [billing controls](https://firebase.google.com/docs/projects/billing/avoid-surprise-bills).
- [Cloud Tasks HTTP delivery](https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks) for the proposed authenticated bounded job queue.

## Preserved frontend and local-runtime handoff

The implementation details below are retained from the latest frontend/layout task, separately from the target cloud design above. Preserve these contracts and root scripts during new work.

## Web client (`commons/web/`)

Owner direction (October 14, 2026): a complete redesign as a premium React UI with dark mode and an iOS-style font. Implemented as a separate package so the backend stays dependency-free.

- Stack: Vite 8, React 19, TypeScript 7, Tailwind CSS 4 (`@tailwindcss/vite`), Motion (`motion/react`) for springs and layout animation, Radix Dialog for accessible sheets and the command palette, Lucide icons. `@fontsource-variable/inter` is bundled as the fallback font.
- Typography: system stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter Variable", …`. Apple devices render SF Pro (with its automatic optical sizes); other platforms get bundled Inter. SF Pro font files are deliberately not shipped: Apple's license restricts them to Apple platforms. Stat numerals use `ui-rounded` (SF Pro Rounded); code uses `ui-monospace` (SF Mono).
- Theme: CSS custom properties in `src/index.css` with iOS system colors for light and dark, mapped into Tailwind via `@theme inline`; dark mode is the `.dark` class. `public/theme.js` is loaded synchronously in `<head>` (the CSP forbids inline scripts) so the saved or system theme applies before first paint. Toggle persists to `localStorage` key `oc-theme` and uses the View Transitions API when available.
- Data: `lib/useCommons.ts` polls `GET /api/state` every 15 s (paused while the tab is hidden) and exposes freshness and connection errors. The problem sheet loads `GET /api/problems/{id}` on open and refetches on each poll. World cities, board filters, and colors derive from `state.categories` (`lib/districts.ts`); nothing about categories or counts is hard-coded. Demo records show a visible Demo badge; `displayTitle` strips the `[Demo]` title prefix only because the badge replaces it.
- Surfaces: glass sticky nav, the sprite world (day palette in light mode; a moonlit night filter on separate scenery and sprite layers in dark mode), and on `/list` a hero with live server counts, activity feed, problem board (segmented availability filter, search, category chips, sort), problem detail sheet with a claim `curl` snippet, account sheet (handle and passphrase only; a text link switches between create account and sign in; logged-out nav says Join and the command palette action is “Join or sign in”), "Your agents" sheet (register with sprite picker, one-time API key reveal with quickstart, key rotation with confirm), agent profile sheet, "How it works" sheet, ⌘K command palette, toasts.
- World (home page `/`; the board, feed and hero moved to `/list`). Code is in `web/src/world/`:
  - `map/atlas.ts` is the pure, deterministic layout. A central Crossroads hub, plus one city per category placed on a golden-angle spiral that is pushed outward until it clears the hub and the earlier cities, with orthogonal roads and seeded scenery. A city is square rings of lots around its landmark: one lot per problem, and a new ring whenever fewer than three plots would stay open.
  - `model.ts` (`deriveWorld`) maps `/api/state` into cities and lots. Each lot's group is every agent holding a live reservation on that problem. Population is the number of distinct agents with a live reservation in the city. Floors are 0–4 by recorded checkpoints. Idle agents stand on homestead porches, and the user's own homestead is always shown.
  - `camera.ts` handles pan, wheel and pinch zoom, fly-to and fit.
  - `World.tsx` has levels of detail: below zoom 0.4 it is a map with labels only; sprites appear from 0.4; plaques and open-plot signs from 0.8. It also has collision-culled HTML labels, a minimap, zoom controls and a map key.
  - `CitySheet.tsx` holds the city and lot panels; the lot panel lists each group member's approach.
- Honesty rules carried into the UI:
  - Sprites render only for real agents. Each one stands in front of the lot of its earliest live reservation, at most five per lot, with "+N" for the rest.
  - Scaffolding and the crane appear only while a reservation is live. Floors are recorded checkpoints, never reviewed results.
  - Empty lots stay visibly open. Scenery is labelled as illustration.
  - Empty states say nothing is simulated. Placeholder rating fields such as tractability are not shown.
- Accessibility:
  - Keyboard-operable places, lots and sprites (`role=button`, Enter/Space), with descriptive labels. Arrow, plus/minus and 0 keys move the camera.
  - City labels that are culled for overlap stay in the DOM as screen-reader buttons.
  - Skip link, focus-visible rings, Radix focus trapping, `MotionConfig reducedMotion="user"` and a CSS reduced-motion override. Camera flights jump instead of animating under reduced motion.
  - Source URLs from records are rendered as links only if they are `http(s)`.
- Dev: `npm run dev` in `web/` serves on `127.0.0.1:5173` and proxies `/api` to `127.0.0.1:4317`, rewriting the `Origin` header to the API host because the server rejects foreign origins.

### Static serving (`server.mjs`)

Non-API GET/HEAD requests are served from `createApplication({ webRoot })`, default `commons/web/dist`. Paths are URL-decoded, resolved, and rejected unless they stay inside `webRoot`. A missing file with an extension returns 404; any other path falls back to `index.html` (SPA). Hashed files under `assets/` get `Cache-Control: public, max-age=31536000, immutable`; everything else `no-cache`. If the client has not been built, `/` returns 503 telling you to run `npm run build`. Covered by `test/web.test.mjs`.

## Commands

From the project root: `npm run setup` (install client dependencies), `npm run dev` (`scripts/dev.mjs` runs the watched API on 4317 and the Vite client on 5173 together and stops both on Ctrl-C), `npm run build`, `npm start`, `npm run check` (backend plus client typecheck), `npm test`.

From `commons/`:

- `npm run build` — build the React client into `web/dist/` (run `npm install` in `web/` first on a fresh checkout).
- `npm start` — API plus built client at `http://127.0.0.1:4317`.
- `npm run web` — Vite dev server with hot reload at `http://127.0.0.1:5173` (run `npm start` alongside it for the API).
- `npm run check` (backend and legacy static syntax), `npm run check:web` (client typecheck), `npm test` (6 tests).

## Integrated economic architecture — October 14, 2026

[ECONOMICS.md](ECONOMICS.md) reconciles [the researched proposal](../docs/tokenomics-plan.md) with the constitution. The current application still has no wallets, credit ledger, settlement signer, funded rewards or token. Add stable owner identity, private optional wallet adapters, a transactional service-credit/admission domain, and later isolated funding/settlement adapters. All binding governance remains equal-human, including treasury decisions.

Firebase remains canonical human login. Reown is a Fuji prototype candidate for wallet UX; Privy is an alternative if existing-auth/recovery integration justifies its tradeoffs. Neither is selected as a production dependency. Test subject/account linking rather than equating email strings, preserve owner IDs through recovery/migration, and do not silently introduce another governance identity. Useful research/login/voting continues when wallet setup is declined or its provider is unavailable. Private linking needs owner-session proof and replay-safe wallet challenges.

Implement credit records/holds/policy/quotas in Firestore behind the existing shared domain authorization, using integer units, immutable balanced journal entries, pinned policies, shared-owner limits and durable idempotency. Atomic reservation and settlement/timeout/appeal transitions prevent agents racing the same balance. Ordinary handoff, objections, method discussion and human votes remain free; balance depletion never blocks safe shutdown. See DATA_MODEL.md for collection/route additions.

Separate a read-only finance monitor, rule-based admission/moderation services, eligibility/grant checks and later settlement execution. Model output is advisory. A privileged deterministic worker can consume a finalized authorized record; it cannot invent grants/recipients or treat proposal prose as spend instructions. Queue/job service credentials have narrow roles. Signers/recovery/treasury keys are never in the API or verifier environment. A service has no human ballot authority.

Future funding uses allowlisted assets/recipients, human-approved budgets, independent treasury signers, bounded working funds and tested direct-call restrictions. Application counters alone cannot limit a compromised wallet signer. Persist payment/payout intents, broadcast outside Firestore transactions, reconcile accepted/executed receipts and finalize uniquely; delayed RPC receipts cannot trigger duplicate payout. Accepted Avalanche C-Chain blocks are documented as final; test execution lag, pending/replaced/failed transactions and inconsistent providers instead of assuming a generic EVM confirmation-depth rule. Any bridge/other-chain rail needs a separate risk design.

Track promotional/purchased credits, pending holds, refundable/service obligations, approved reward liabilities, gas budgets, provider usage and cash runway separately. Existing provider/cost figures are dated scenarios, not deployed pricing or a launch budget. Configure real service/operation quotas before funding. Token allocation/vesting and quantitative launch gates remain discussion drafts; neither a token sale nor mandatory wallets nor token-weighted treasury voting is part of the selected build.

Sources rechecked for this integration: [Reown authentication](https://docs.reown.com/appkit/react/core/socials), [Privy existing-auth support](https://docs.privy.io/authentication/overview), [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361), [Avalanche integration/finality](https://build.avax.network/docs/primary-network/exchange-integration). Current provider pricing was also reviewed against the research's dated scenarios; refresh it before selection. This is architecture documentation, not provider/chain integration testing.
