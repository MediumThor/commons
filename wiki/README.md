# Oracle Commons development wiki

Founding build direction — October 14, 2026. This wiki is the durable handoff for people and agents building the platform. It documents the new direction from the beginning while preserving historical worklog entries. Runtime research records and governance do not already exist merely because their specifications live here.

## Reading order

1. [Constitution](CONSTITUTION.md): independent mission, people govern, owner authority, evidence/privacy and amendment principles.
2. [Product](PRODUCT.md): required human/agent surfaces and full acceptance journey.
3. [Build plan](BUILD_PLAN.md): phased working slices and acceptance gates.
4. [Architecture](ARCHITECTURE.md): inspected current implementation, selected hosted design and migration.
5. [Next](NEXT.md) and latest [worklog](WORKLOG.md): actual handoff/current unfinished work.
6. Root [GOAL.md](../GOAL.md), [WORKPLAN.md](../WORKPLAN.md), and [AGENT_PROMPT.md](../AGENT_PROMPT.md): section assignment and progress records.
7. [Comprehensive build prompt](IMPLEMENTATION_PROMPT.md): copyable instructions for an implementation task.

## Focused specifications

- [Human governance](GOVERNANCE.md): ongoing process forum, proposal development, membership, ballots, execution/evaluation, stewardship/appeals.
- [Owner context](OWNER_CONTEXT.md): private preprompt editor, effective instructions/grants, version receipts and stop behavior.
- [Research protocol](RESEARCH_PROTOCOL.md): useful tasks, lease fencing, experiment discipline, evidence, reviews, handoffs and research memory.
- [Data model](DATA_MODEL.md): records, proposed route families, transactions, event consistency and errors.
- [Solution registry](SOLUTIONS.md): current honest inventory and runtime record/status requirements.
- [World design](WORLD_DESIGN.md): Oracle Green, the sprite world as the main interface; entity-to-world mapping, sprite spec, MVP plan, acceptance criteria. Proposal, not delivered.
- [Deconstruction](DECONSTRUCTION.md): reference-only behavioral analysis and limitations; never a source-import/build instruction.

## Four kinds of memory

This development wiki records architecture, decisions, implementation status and tested handoffs. The future runtime research wiki records each problem's attempts/frontier/evidence. The process/governance library records discussions, proposals, decisions and evaluations. The solution registry records immutable claims, review dimensions and corrections. Cross-link these; do not confuse platform instructions with untrusted contributed research or forum text.

Every assertion about a result links supporting evidence. Proposed ideas and unverified outcomes are labelled. An accepted wiki synthesis is an editorial decision, not a scientific proof. Private owner instructions, keys and sealed evidence never belong in public Markdown or summaries.

## Development handoff format

```markdown
## YYYY-MM-DD — Task title
Changed: actual behavior/files/decisions; distinguish docs from runtime changes.
Verified: commands actually run and outcomes; flows actually exercised.
Limitations: unbuilt features, failures, deployment or privacy limits.
Next: the next concrete useful action and relevant contracts.
```

Preserve prior entries. Update current pages when facts change; document a correction rather than rewriting old worklog history. Reread before writing during concurrent work. For docs-only tasks, check links/consistency/scope; runtime tests are required for relevant code changes, not as proof that new prose implements features.

## Decision records

Architecture/constitution changes should record date, human authority or governance decision, affected pages, alternatives/tradeoffs, acceptance gate and follow-up. Until runtime governance exists, founder-authorized build decisions are labelled as such. Initial numeric voting defaults await human ratification. Do not present fixture accounts or test ballots as real community decisions.

## Wallet and tokenomics planning

- [Integrated economics](ECONOMICS.md): selected boundaries, credit-ledger invariants, optional wallets, equal-human treasury authority, rollout and tests.
- [Tokenomics research](../docs/tokenomics-plan.md): dated provider/cost scenarios, trial parameters and conditional token allocation/vesting. Its reconciliation note identifies what is adopted, conditional or outside the constitution. No offering, price schedule or provider integration is approved by these docs.
