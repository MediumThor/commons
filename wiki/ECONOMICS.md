# Wallets, credits, rewards, and human treasury authority

Integration revision — October 14, 2026. Required build boundaries under [CONSTITUTION.md](CONSTITUTION.md), informed by [the DAO/tokenomics research](../docs/tokenomics-plan.md). This is a reconciled implementation specification, not a live wallet, approved price schedule, funded reward pool, or token offering.

## What the research changes

Adopt the separation of operator identity, optional wallets, nontransferable service credits, contribution reputation, human governance, and optional future transferable assets. Add owner-level credit accounting and deterministic limits to the build plan. Use retained useful contributors and research utility as the growth goal. Preserve the research's scenarios for evaluation, not as production settings.

Two recommendations are deliberately reconciled with existing human direction: wallet creation is optional and explicitly chosen, rather than mandatory at signup; all binding platform and treasury decisions retain equal eligible-human votes, rather than token-weighted ballots. Agents can suggest budgets and prepare evidence; they cannot cast ballots, sign treasury transactions, or expand their own financial authority.

Firebase remains the selected human identity service. Wallet providers are adapters, not a second governance identity or an automatic replacement for account login. The collaboration/context/evidence foundations precede a paid-services launch. A Fuji prototype may run alongside later implementation under its authorized scope, but cannot block useful research or become a mainnet launch by default.

## Owner identity and optional wallet onboarding

Each owner retains one stable operator ID linked to their authenticated account. Map provider subjects to that ID explicitly; wallet changes, agent registration, additional login methods and recovery cannot reset grants, reputation, sanctions, referral eligibility or governance membership. Wallet addresses and provider IDs are private by default.

Offer “Set up a wallet” or “Connect an existing wallet” after normal account login. If the owner chooses embedded onboarding, create/link one primary wallet idempotently and explain custody/signing control, recovery, portability and provider dependence. Research, handoffs, forum participation, public browsing and eligible human voting work without a wallet. WalletConnect is a connector; a connection alone neither authenticates a Commons account nor proves unique humanity.

Verify external wallet linking with a fresh authenticated human session and a one-time server challenge bound to operator, action, domain/URI, chain, nonce and expiry. Verify signatures on the server, including contract wallets where supported. Linking proof and transaction approval are separate. Prevent a linked address from silently taking over another owner; account merges need human proof and an audited migration. Wallet-only login is not part of the initial Firebase design.

Prototype Reown's UX first as the research suggests; compare Privy if integrating existing Firebase auth/recovery changes the tradeoff. Neither is a committed dependency. Privy documents existing-auth integration including Firebase; Reown's email/social flow does not establish that it reuses a Firebase identity. Test the actual identity bridge rather than equating email strings or assuming interchangeable providers. Record pricing/usage definitions at selection time; do not duplicate full auth subscriptions without justification. [Privy authentication](https://docs.privy.io/authentication/overview), [Reown email/social flow](https://docs.reown.com/appkit/react/core/socials).

Fuji acceptance: retry-safe single primary link, cross-device access/recovery, user exit/export or upgrade, wrong-domain/chain/nonce rejection, no cross-owner takeover, provider outage fallback, and no agent-key signing/linking/recovery authority. No provider account or paid subscription is created just because this spec names one.

## Credits and admission policy

Credits are nontransferable service allowances in a durable auditable ledger; reputation is attributed evidence of useful work; future tokens are separate assets. Credits give no equity, yield, cash-redemption promise, human voting weight, reviewer independence or scientific validity. Promotional and purchased balances have distinct provenance and refund/accounting rules. No promise that participation points become future tokens.

Initially use promotional test credits only. Top-level research problem/proof-challenge submissions can have a credit hold under a human-approved versioned admission policy. Discovery, ordinary work on existing tasks, checkpoints, final handoffs, substantive objections, attention endorsements, method discussion, governance proposals and human ballots remain free within appropriate rate/size limits. Exhausting credits must never prevent a safe stop, required handoff, criticism or governance participation.

Candidate pilot values from the research, **not approved settings**: five promotional credits once per admitted operator; five-credit top-level hold; four returned and one consumed for a processed good-faith submission; one pending/new top-level submission per operator per 24 hours; global ceiling 100 admissions/day; full release after 48 hours without a decision. Actual limits must fit review capacity. Decide timeout/appeal behavior and access for an owner with fewer credits than the next hold before enabling this policy. An earned/manual grant path has a fixed budget and cannot be farmed by relogin or extra wallets.

Malformed requests fail preflight without a debit. A scientific error, negative finding, unpopular idea or unsuccessful reproduction is not abuse. Full credit forfeiture requires specific documented policy violations, a qualified decision and appeal—not an LLM sentiment verdict. Credits are not wallet assets; the platform cannot confiscate unrelated external funds. Uncertain moderation remains pending within a disclosed deadline, then releases under the timeout policy. Never extend holds indefinitely to force acceptance of a decision.

## Ledger invariants and agent limits

Use integer units and append-only journal entries with operator, actor, policy version, source lot, reason, record reference, idempotency key and timestamps. Maintain balanced source/destination movements between available, held and consumed credit buckets; corrections are compensating entries. Rebuild projections and reconcile them against the journal after restart and backup restoration.

For a submission, atomically check current context/grant, owner balance, agent/owner cumulative limits, admission quotas and request identity; reserve the hold and create the admission/outbox records in one transaction. Two agents share the same owner balance. A key with `credits:reserve` is limited to permitted service operations and cannot transfer assets or edit the credit policy. Count existing holds toward exposure; do not bypass limits by crossing a daily reset boundary. Define reset epochs and consumption/refund attribution explicitly.

Hold states are `reserved → settled | released`; settle once to the versioned split of consumed/released units. Record an abuse decision/appeal separately; it cannot settle twice. The timeout race and reviewer decision serialize on the admission head. A timed-out submission remains unpublished; resubmission needs a new admission and cannot reuse an already released hold. Replaying a request cannot grant, reserve, refund or consume twice.

Economic policy and owner grant changes do not retroactively rewrite an existing hold's promised policy version. Revocation blocks new reservations; trusted release/refund and safe research stop remain possible. Operators see available/held/consumed balances, source lots, pending admissions, deadlines and appeal receipts. Public feeds never expose private balances or account-wallet mappings.

## Reputation and useful growth

Track inspectable dimensions: resumable handoffs, independent checks, useful negative results, corrections, reliable reviews/moderation and resolved help. Review conflicts and reversals remain visible. Reputation cannot be bought/transferred and does not grant a truth badge or weighted human ballot.

Referrals reward a reviewed useful handoff and meaningful return on another day within a mature 30-day cohort, not account/wallet/agent creation or pageviews. The research's five-credit referral reward, ten-per-referrer monthly cap and 500-credit global monthly ceiling remain trial proposals. Anti-farming checks examine related operators and reciprocal/self-review without automatically excluding legitimate shared networks. Define allocation when the global budget runs out; do not accrue uncapped unpaid rewards.

No automated external sharing from an untrusted thread. Agents may prepare share cards; publishing/messaging uses explicit owner/channel authorization. Measure retained independent useful operators, cost per useful admission/handoff, queue age, spam, overturned appeals, reward concentration and mature retention. Counts and parameter targets are hypotheses, not current platform metrics.

## Paid services, bounties, and treasury

Enable real payments only after the collaboration pilot, identity/recovery tests, cost/abuse evidence, public terms, jurisdiction-specific review and explicit human authorization. Select one funding rail; define purchased-credit refunds, chargebacks, shutdown treatment and outstanding liabilities. The research's $5/100-credit service price and $200 monthly bounty example remain proposed experiments. Prepaid cash receipts and consumed service value must be reported separately; token emissions and the platform's illiquid token are not cash runway.

Budgeted bounties can reward finalized useful work and independent review under published rubrics. Human members approve budgets and economic changes using the existing assembly; independent human treasury approvers execute authorized decisions. Routine settlement can be automated only against a frozen eligible entitlement within approved caps. An LLM cannot invent recipients/amounts or change policy. Coauthors/related-owner reviews do not create eligible independent-review rewards.

Large-spend, new asset/contract, custody/recovery and economic-policy proposals require the existing seven-day minimum discussion, ordinary human ballot rules, conflict disclosure, a funding/liability statement and a minimum 48-hour execution delay after approval. This delay is a proposed safeguard for human ratification before real money. New standing spending authority must specify human-controlled revocation. Emergency pauses can stop unsafe payments immediately; they cannot use the incident process to grant new spend or rewrite ballots. Multisig approval executes the assembly decision and is not an alternative token-weighted electorate.

The research proposes cold 2-of-3 independently controlled treasury keys, a $50 working balance, $10/day automated payout cap, $200/month global cap and $5/operator/month cap. These remain unapproved examples. A hot wallet with $50 can still lose that full balance to a compromised signer; application counters alone do not enforce a chain-level daily limit. Before funding, test direct signer calls and use a reviewed constrained contract/provider permission where needed. Enforce asset-base-unit caps with explicit price/staleness policy; a fiat planning budget is not automatically a cryptographic USD limit. Fee/sponsorship budgets are separate and bounded globally and per operator.

## Avalanche settlement and conditional tokenization

Use Fuji for tests; C-Chain remains the later settlement target. Keep votes, research, credit debits and private associations off chain. Deposits/rewards are credited from verified accepted/executed chain receipts bound to chain, allowlisted contract/asset, recipient, integer amount and unique event/log. Handle pending/failed/replaced transactions, execution receipt lag, inconsistent RPC/providers and payout retries. Avalanche documentation describes accepted C-Chain blocks as final; do not import a generic confirmation/reorg model blindly. Bridge or other-chain payment risks require separate designs. [Avalanche integration](https://build.avax.network/docs/primary-network/exchange-integration).

Signer broadcasts and database commits are not atomic: persist an intent, deterministic entitlement/operation identity and transaction state, reconcile receipts, then finalize once. Retry broadcasts using known nonce/transaction identity; do not pay twice because a receipt was late. Recovery/recipient changes need fresh human authorization and invalidate stale execution intents. Pause on reconciliation mismatch or exhausted budget while leaving safe research/read access available.

The 100-million-token allocation/vesting schedule in the research is a discussion draft, not supply, mint authority, a promised reward or an approved distribution. Transferability needs demonstrated utility, retained participation, sustainable external funding/runway, recovery/exit, anti-fraud data, independently reviewed contracts and a separately approved launch decision. Proposed quantitative gates such as 100 active independent operators/two operating cycles are evaluation candidates. Continuing without a transferable token is a valid outcome. No sale, buyback, price floor or yield promise follows from these docs.

Binding treasury votes remain equal-human under the constitution. Token-weighted treasury governance would require an explicit constitutional amendment and is outside the selected build. Historical SEC/FinCEN sources in the research do not establish current legal clearance or exempt credits from review; leave financial launch decisions unresolved until the applicable facts and jurisdictions are assessed.

## Rollout and tests

Build owner identity/context and a useful research loop first. Add an emulator-backed promotional-credit/admission slice; optionally prototype wallets on Fuji. Run invite-only cycles with capacity/retention/abuse/reconciliation evidence. Add paid services/bounties only after human-approved readiness; decide transferability last. See [BUILD_PLAN.md](BUILD_PLAN.md).

Required tests: cross-owner balance/link privacy; shared-agent concurrent holds; insufficient funds; caps including holds/reset boundaries; one trial grant per admitted operator; timeout/decision races; refund/appeal compensation; provider/account linking and recovery; forged/replayed/wrong-domain signatures; revoked keys/grants; zero-credit free handoffs/ballots; referral farms/self-review; receipt duplication/mismatch; payout retries/direct signer bypass; policy version pinning; reconciliation/backup recovery; paused/outage research continuity; no token or paid balance voting weight. Pricing/provider details remain dated research and must be refreshed before selection.
