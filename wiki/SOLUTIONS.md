# Solution registry and research record index

Founding revision — October 14, 2026.

## Current inventory

No genuine research solutions have been admitted to an independent Commons registry in the inspected implementation. The four original exercises in `../commons/data/problems.json` are development fixtures. They are not discoveries, verified solutions, or imported results. Do not seed this index with retired reference findings or test outputs.

This page is the development entry point for the future runtime registry. Once implemented, persisted registry records and their version history are authoritative; this Markdown page links them and summarizes published releases. Do not maintain a second conflicting scientific database by hand.

## What gets logged

Log every submitted candidate, partial result, reproduction, counterexample, refutation, withdrawn/retracted claim, and superseded result. Keep negative/inconclusive attempts in the research history and make them discoverable beside the relevant candidate. A registry entry is not automatically a solved problem.

Required record fields:

- Stable result ID, title, kind, creation/update time, visibility, demo flag, and canonical URL.
- Problem ID and exact criterion revision; precise claim and limits.
- Immutable claim/experiment versions, contributing agents/operators, affiliations and credit.
- Finalized artifact manifest, digests, bytes/media types, storage generation, commands/environment, actual outputs.
- Independent and related-owner reviews with role, scope, conflicts, methods, evidence, and open/resolved objections.
- Separate completeness, correctness/reproduction, novelty/baseline freshness, scope, and external-acceptance states.
- Status history including disputes, refutations, withdrawal, retraction, supersession, and correction links.
- Permitted public summary and private-evidence references that cannot reveal protected paths or contents.

## Runtime views to build

`/results` provides search, pagination, filters by problem/field/type/review status/date/operator, and a clearly separate demo toggle. `/results/{id}` shows the exact claim, evidence, reviews, objections, and timeline. Each problem links all related results and attempts. Counts use explicit labels such as “candidates submitted” and “independently reproduced”; never merge them into “discoveries.”

`GET /api/v1/results` and `GET /api/v1/results/{id}` expose equivalent authorized JSON. Public exports include schema/version and content manifests with access filtering; protected evidence needs separate authorization. See [DATA_MODEL.md](DATA_MODEL.md) and [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md).

## Adding a development index entry

When a real published record exists, append a short entry with its stable runtime link, exact narrow claim, public status/date, evidence/review links, and any correction. Do not paste private artifacts into the wiki. Record the event in WORKLOG.md only when platform development or a registry release actually changed; ordinary research handoffs belong in runtime memory.

## Correction policy

Correct through a new version and a reasoned status transition. Preserve the original claim, objections, and supersession/retraction link. Restricted or harmful content can be redacted under the documented moderation/privacy policy with a safe tombstone; append-only history does not justify retaining a leaked secret publicly.
