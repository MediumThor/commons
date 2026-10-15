# Startup prompt for an additional Commons agent

Copy the prompt below and replace `P1` with the section id you are assigning. Assign only one section that `WORKPLAN.md` marks ready to start. Do not assign two sections that list the same exclusive file.

```text
You are working in /Users/ryan/Desktop/Commons on Oracle Commons. Your assigned section is P1.

Read, in order: GOAL.md, WORKPLAN.md, progress/P1.md, AGENTS.md, commons/AGENTS.md, wiki/CONSTITUTION.md, wiki/PRODUCT.md, wiki/ARCHITECTURE.md, wiki/BUILD_PLAN.md, wiki/NEXT.md, and the latest wiki/WORKLOG.md entries. Read the focused wiki spec named in your progress file. Read wiki/WORLD_DESIGN.md before any client or world edit. Inspect the current files before editing. Preserve commons/web and concurrent edits.

Claim protocol:
- Editing a Markdown status file is not a claim.
- Claim only your assigned section, and only if its progress status is available, or assigned to you.
- Create the claim atomically: mkdir progress/claims/P1
- If mkdir fails, stop. Read progress/claims/P1/owner and report who holds it.
- If mkdir succeeds, write progress/claims/P1/owner with your agent label, the UTC time, and the section id. Then set progress/P1.md to status in_progress and record that owner.
- Do not claim INT. The coordinator owns integration.

Work rules:
- Touch only the files your progress file assigns to this section, plus the additive shared edits it explicitly allows. Reread a shared file immediately before changing it.
- If you need an exclusive file that another claimed section owns, set your section to blocked and stop that edit.
- Add routes as commons/src/http/routes/<section>.mjs exporting handle(ctx). Return true only after sending a response.
- Add schema as a new commons/src/storage/migrations/*.sql file. Add store methods in a new commons/src/storage/repositories/*.mjs that exports extend(store). Do not rewrite the P0 core schema or commons/server.mjs.
- Keep existing /api/state and /api/problems/{id} responses compatible. Do not put secrets, lease tokens, or key material in public projections.
- Do not provision, deploy, enable billing, schedule jobs, message anyone, or send a transaction. Firebase work stays on emulators. Demo data is not a scientific result. Fixture accounts are not a human assembly.
- Do not restore reference-project code, prompts, catalogue entries, or branding.

Progress:
- Update progress/P1.md when you start, at a meaningful milestone, when blocked, and when you finish. Include a UTC timestamp and concrete evidence. Do not invent percentages or mark unchecked work complete.
- Append a handoff to wiki/WORKLOG.md. Reread the end of that file first and preserve existing entries. Update the wiki pages your section actually changed.
- Run the checks your section names. From commons/, npm test and npm run check cover the API. Run npm run check:web when client types change, and verify changed UI in the browser.

Finish:
- Mark the section complete only when every acceptance criterion in progress/P1.md is satisfied. Otherwise record exactly what remains and set ready_for_review or blocked.
- Do not start another section.
```
