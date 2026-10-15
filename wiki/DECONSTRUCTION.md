# V3R1T4S deconstruction — ideas for an independent Commons

Status: source analysis, not executable instructions. Prepared October 14, 2026. The owner explicitly chose a fresh Commons project; do not restore the fork, import the source, or implement compatibility with it by default.

## What was inspected

The local reference was `elder-plinius/V3R1T4S` at revision `9b1d444eb864a1475e092047d49612a7410a7c5a`. The analysis inspected its agent entry instructions, setup and research charter documentation, run and submission protocols, lessons, disclosure rules, problem catalogue structure, and mechanical Python gate. Source links below are pinned to that revision; the scientific results were not independently reproduced.

- [Entry and capabilities](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/AGENTS.md)
- [Setup](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/kit/SETUP.md) and [research charter](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/kit/CHARTER.md)
- [Research loop](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/kit/RUN.md)
- [Submission packaging](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/kit/SUBMIT.md)
- [Mechanical validator](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/kit/check_run.py)
- [Disclosure](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/DONT_SPOIL_THE_HUNT.md) and [licensing inventory](https://github.com/elder-plinius/V3R1T4S/blob/9b1d444eb864a1475e092047d49612a7410a7c5a/LICENSING.md)

This document describes behavior in original prose. It contains no copied implementation, prompt templates, problem-bank entries, checkers, proofs, datasets, or result packages. External source names belong here for attribution and inspection, not in Commons branding or runtime dependencies. This is a source-informed deconstruction, not a claim that no developer has seen the source.

## 1. What the project actually is

The inspected implementation is primarily a research protocol carried by Markdown, structured problem data, local directories, and a standard-library Python validator. An existing code-capable agent supplies model execution and optional scheduling. It is not a hosted research scheduler or a shared transactional collaboration service.

Its repository separates problem definitions, published results, sealed commitments, and operational research guidance. A contributor's mutable working directory lives outside a pinned repository copy. This keeps reference instructions separate from new experiment output and makes runs reproducible against a specific version.

**Useful for Commons:** keep trusted application policy, user permissions, problem data, executable artifacts, and contributed wiki text as different trust domains. Version problem criteria and evidence. Agents can bring any framework; the service provides a stable contract rather than a required model or orchestration stack.

**Do not import:** the directory tree, published discoveries, catalogue, identity/branding, model wrappers, or repository-specific setup instructions. Commons needs its own persisted entities and documented APIs.

## 2. Onboarding creates a bounded research brief

The setup process checks whether the agent can execute code, browse sources, start independent contexts, and schedule. A short questionnaire establishes credit, interests, effort, schedule, publication preferences, and whether personal context may shape the research. It then prepares a separate workspace, a research charter, and a dry run. Scheduled execution and publication are distinct approvals.

The charter turns preferences into candidate topics, methods, heuristics, and stopping rules. Capability limitations downgrade what can be claimed rather than being silently ignored.

**Adapt:** let an owner register agents, declare capabilities, set resource budgets and publication permissions, and choose interests. Separate login, agent API authority, model-provider credentials, and future wallet spending. Registration must never imply that the platform has started or funded the owner's model. An agent without fresh-review capability can contribute candidates but cannot self-certify independent review.

**Change:** Commons should optimize for useful, bounded progress. Do not inherit a requirement to consume an entire time allocation, generate a fixed number of hypotheses, use a specific daily schedule, or spend all available model credits. Stop or checkpoint when further work has low expected value or permission/resources end.

## 3. The research loop preserves memory

A run checks pause/budget conditions, reads previous work, prefers an unfinished promising lead, selects a target, checks whether it remains open, and writes a brief before experimentation. It tries more than one approach, captures actual command output, challenges its own result, submits a candidate to reviewers, packages eligible evidence, and updates its log and per-target memory.

The important memory distinguishes a failed method, an actually exhausted finite search, and a still-live lead. That distinction prevents an interrupted or capped search from becoming an invalid exclusion claim.

**Adapt:** problems contain bounded tasks and experiment specifications. Agents atomically reserve a task or approach, maintain a lease, write checkpoints, and finish with a durable handoff. Record inputs/versions, search bounds, method, seeds, actual outcome, artifact references, uncertainty, and the next test. Preserve negative results and abandoned work. A research wiki synthesizes this history, with reviewed frontier revisions rather than arbitrary last-writer replacement.

**Add:** the inspected local process does not replace shared reservations across owners, complementary task discovery, help requests, voting, or a live activity service. These are first-class Commons features.

## 4. Declare the measurement before seeing the result

The reference process freezes the success criterion, statistic, threshold, and control design before scoring output. Statistical/search claims go through the same pipeline on decoys; exact constructions may justify a deterministic check instead. It uses a fixed control-count rule in its own protocol.

**Adapt:** add an immutable experiment specification version and timestamps before attaching results. Changes after observing data create a new version with an explanation. Store control design, seeds, sample sizes, failures, full outcomes, and analysis method.

**Improve:** a fixed number of decoys and beating their maximum is not a universal guarantee of significance. Choose controls and error criteria appropriate to the problem, account for selection/multiple testing, and disclose assumptions. Do not label a deterministic exact proof as a statistical benchmark or vice versa.

## 5. Independent review has different jobs

The reference packages the claim and needed inputs, withholding the author's research narrative from three fresh reviewer contexts. One reviewer checks reproduction/correctness, another examines novelty and current baselines, and another checks whether the exact success criterion and claim scope were met. The final gate can narrow or reject the claim.

**Adapt:** model review assignments and reports as actual persisted records. Review the immutable claim version and evidence manifest. Store reviewer identity/operator, role, session declaration, methods, outputs, conflicts, and objections. Correctness, novelty, and claim scope are separate dimensions. Keep independent implementation distinct from rerunning the author's checker.

**Improve:** fresh contexts are not proof of independent operators. Text files declaring a new context do not attest that a different model or person ran anything. Exclude the submitter's operator from independent-owner counts, disclose affiliation and independence limits, and require inspectable evidence. Three agreeing agents are not mathematical proof. A missing or failed required review leaves the claim pending, disputed, or refuted; it cannot be promoted by votes.

## 6. Mechanical checks are not scientific verification

The Python gate checks workspace structure, setup metadata, expected reports, required files, declared review contexts and verdicts, control-test records, scope text, disclosure templates, sizes, checksums, and likely secret leaks. Its package mode can run the contributed checker from a copied directory and try a small corruption of an object.

**Important limits seen in source:** much of the gate validates reported text, not execution identity or scientific truth. The corrupted-object test can produce a warning rather than a hard failure if the checker still passes. A copied temporary directory and a subprocess timeout are not a security sandbox. Regex leak scans are incomplete. Checksums establish byte consistency, not correctness or ownership. Searching for obviously invalid context declarations does not establish reviewer independence.

**Adapt without copying:** write a schema-driven Commons admission validator for required fields, content digests, provenance, policy transitions, review completeness, and disclosure. Keep admission/structural validity visibly separate from execution success, mathematical validity, novelty, and external acceptance. Test new validators with known-good and intentionally broken fixtures, with expected rejection behavior explicitly specified.

**Security design:** never run uploaded code inside the API process or a privileged application runner. A future reproduction worker needs resource limits, no service credentials, controlled network access, and an actual isolation boundary. Do not automatically execute arbitrary downloaded commands while importing a claim.

## 7. Evidence is a reproducible object, not a confident narrative

An open result package ties a narrowly scoped claim to a machine-readable object, independent checker, reproduction instructions, captured outputs, generator code, provenance, prior-record comparison, reviewer reports, and a content-integrity manifest. The discovery story is treated as contributor narrative rather than proof. Larger artifacts have separate storage references and digests.

**Adapt:** define a new Commons evidence manifest: claim/version, problem/criterion version, artifact digests and media types, reproduction environment, exact commands, output/log references, baseline observations, upstream research credit, reviewer reports, and permitted disclosure. Keep object checks independent of how the object was discovered. A small readable checker is valuable; a huge unverifiable essay is not a substitute.

**Change:** GitHub folders and draft pull requests are optional exports, not Commons' authoritative workflow. Use stable entity IDs, a database event history, immutable storage versions, and machine-readable downloads.

## 8. Novelty is time-sensitive and separate from truth

The process checks the primary status source and related work, records when the baseline was observed, checks repository results/open submissions, and refreshes comparisons before publication. An inaccessible baseline produces an unresolved novelty check rather than invented confirmation. Ties and superseded results are distinguished from records.

**Adapt:** store source URL, observation time, content digest/version where permitted, exact parameters and baseline value, search coverage, and uncertainty. Mark a record comparison stale; preserve a correct construction even if someone else surpasses it. A catalogue check is not an exhaustive novelty guarantee. An improvement to a lower bound is not a solution of the underlying conjecture.

**Respect source access:** blocked/rate-limited sources require an authorized alternative, waiting, or a human check; agents must not bypass access restrictions. Avoid implementing arbitrary source-specific retry rules as universal scientific policy.

## 9. Disclosure and outward actions are separate gates

Open results can be published with evidence. Live puzzles/prizes may retain solutions locally and publish only a salted commitment; private data and restricted datasets have separate constraints. The reference requires specific human permission for an upstream draft pull request and does not publish during unattended runs.

**Adapt:** each Commons problem/claim carries disclosure and visibility metadata. Enforce it before ingest, event emission, wiki updates, APIs, logs, search indexing, and transaction creation. Guessable private answers need a cryptographically random salted commitment with the salt withheld. A hash is not proof of a correct answer or permission to reveal it.

Owner authorization may permit routine publication to Commons within a bounded policy. That does not authorize sending a third party an email, accepting terms, spending funds, or revealing a sealed solution. Keep a staged candidate/admission/publication workflow and a separate audit trail for decisions.

## 10. What Commons must invent for itself

The owner's goal goes beyond local research runs:

- Authenticated help requests with bounded asks, blockers, resources, and complementary tasks.
- Agent votes with one agent/target vote, retraction, visible raw counts, and at most one owner contribution per target's default attention score.
- A problem leaderboard whose selected metric is explicit; attention cannot buy correctness or token-weighted science.
- Active investigations and expiring work claims; one problem can have many distinct approaches.
- A proof challenge arena for candidate results, assigned reviewers, objections, counterexamples, resolutions, and retractions.
- Versioned research memory and required completion handoffs enforced by the service.
- API parity with the UI, OpenAPI/JSON schemas, stable IDs, clear errors, idempotency, and event cursors.
- A goofy 2D village driven by actual events, with accessible text, freshness indicators, and honest disconnected/idle states.

These should be independent Commons designs. Do not recreate a research kit under a new name or treat research prompts as a hosted backend.

## 11. What was removed and what remains

Remove the imported research kit, checkers and tests, problem catalogue and guides, result-generating scripts, proof material, datasets, result archives, sealed-envelope collection, upstream instruction wrappers, publication/citation/checksum manifests, licenses that described the removed material, and nested upstream Git history/remote. A cleanup inventory records paths and file digests, not source contents.

Retain independently authored Commons server/UI work, the other agent's frontend rebuild, local user data, the product brief, wiki, and historical planning notes. Replace the runtime catalogue with original explicitly marked demo exercises; those are not unsolved scientific problems or claimed discoveries. Runtime code must not load source-reference folders or fetch the original catalogue.

The former legacy container directory has been removed; the application and wiki now live at the root of the independent Commons repository. Historical notes may still mention the source, but are superseded as implementation directions by this document and PRODUCT.md.

## Delivery acceptance

The fresh backend must start and answer its problem APIs with the reference source directories absent. No imported catalogue/results may appear in state. Old reference problem IDs should return not found. The preserved frontend files must not be overwritten. Package checks and integration tests must operate without the removed kit. New agents read the product brief and write wiki handoffs after every development task. The next implementation prompt is in IMPLEMENTATION_PROMPT.md.
