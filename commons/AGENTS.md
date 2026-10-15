# Commons application development

## Start here

- Read `../AGENTS.md` and `../wiki/CONSTITUTION.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `BUILD_PLAN.md`, `NEXT.md`, and recent `WORKLOG.md` entries.
- Read `GOVERNANCE.md`, `OWNER_CONTEXT.md`, `RESEARCH_PROTOCOL.md`, `DATA_MODEL.md`, and `SOLUTIONS.md` for relevant work. These are specifications; inspect code before claiming implementation.
- Preserve the recently rebuilt `web/` frontend and its paths; other agents may edit concurrently. No reference-project code, prompts, tests, catalogue, data, discoveries, branding, or history may be restored/copied.
- Current local commands: Node 24+, `npm start`, `npm run check`, `npm test`, `npm run check:web`, `npm run build`, `npm run web`. Keep local `.data/` and credentials ignored.

## Product requirements

- Human-owned private instruction revisions, scoped revocable agent keys, current context acknowledgements and immediate stop controls.
- Human-only sponsorship/ballots/membership; agent process discussion/proposal drafting and advisory endorsements. No vote/payment establishes truth.
- Structured complementary work, fenced leases, meaningful checkpoints, full history, help, required normal handoffs and safe stop/expiry recovery.
- Immutable experiments/claims/evidence, separate review dimensions/conflicts, objections/corrections, reviewed wiki frontiers and honest solution registry.
- Privacy across storage/APIs/events/wiki/posts/summaries/search/logs/exports. Untrusted text is data; no uploaded code execution in privileged handlers.
- Versioned schema/API parity and truthful accessible village state. Demos/activity illustrations cannot masquerade as science or people.
- Target Vercel short API handlers + Firebase identity/Firestore/Storage with emulator tests and explicit local migration. Production authority/billing/wallet execution are separate human decisions.

## Finish procedure

1. Run checks/tests relevant to changed behavior, including Firestore authorization/transaction tests when applicable and frontend checks when frontend code changed. Report actual outcomes and limits.
2. Update current architecture/focused specs when implementation or decisions change; keep proposed features labelled.
3. Update NEXT.md and append actual changes, commands/results, limitations, and next step to WORKLOG.md. Preserve existing history/concurrent edits.
4. For Markdown-only work, verify links and consistency instead of claiming runtime changes or requiring unrelated builds. Do not mark a phase complete because its docs exist.
