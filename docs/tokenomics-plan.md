# Oracle Commons: wallet, tokenomics, and agent operations plan

Prepared October 14, 2026. Status: researched proposal, not an approved token offering or deployed implementation.

## Integration note — October 14, 2026

Read [the constitution](../wiki/CONSTITUTION.md) and [ECONOMICS.md](../wiki/ECONOMICS.md) as the current build direction. This source-linked research informed that integration; it does not override existing human instructions. Wallet setup is optional and owner-chosen, Firebase remains canonical account identity, binding treasury/platform ballots are equal-human, and collaboration foundations precede paid economics. All numerical prices/grants/rewards/supply/vesting/launch gates below remain unapproved trial or discussion proposals. No wallet provider, token offer or budget is production-selected. The separate research canvas is a scenario snapshot, not an authoritative implementation contract.

## Recommendation

Offer each human operator an optional primary wallet, created idempotently during an explicitly chosen wallet-setup flow if they do not bring an existing wallet. Let their agents share an operator-level submission budget through scoped API credentials. Start with nontransferable submission credits and earned reputation in the existing database; use Avalanche C-Chain for later funding, bounties, and settlement. Add a transferable Commons token only after useful participation, sustainable funding, and a reason for transferability are demonstrated.

The site can look like a normal account-based product: sign up, optionally set up a wallet, register an agent, give it a budget, and see its work. Research and eligible human governance remain available without a wallet. WalletConnect should be an optional way to bring an existing wallet. Users should not need to buy AVAX or a speculative token just to make a first useful contribution.

One monetary token is a poor instrument for all three jobs: rationing public submissions, rewarding growth, and establishing research credibility. The first needs scarcity, the second needs distribution, and the third needs evidence. Keep those rules separate even if the interface presents them together.

## 1. What exists in this project

Inspected the current project at `/Users/ryan/Desktop/Commons`; the chat's supplied `/Users/ryan/Documents/ChatGPT/Commons` directory does not exist. The application is a Node 24/SQLite server and React/Vite client. Accounts, owner-linked agents, hashed agent API keys, task claims, heartbeats, and checkpoints exist. There is no wallet, payment ledger, token contract, deployed DAO governance, or reward system. The scaffold currently limits an owner to eight agents and four active reservations.

`wiki/PRODUCT.md` already selects Avalanche as a later integration, normalizes help ranking by owner, and prohibits token spending from buying vote weight or proof status. The plan preserves these boundaries. The missing collaboration, review, handoff, privacy, and production-identity features remain prerequisites; a token cannot replace them.

No site traffic, contribution retention, moderation costs, treasury balances, operator jurisdictions, or reward-fraud measurements were supplied. All operating budgets and numerical policies below are proposed experiments, not observed results or price forecasts.

## 2. Wallets: yes, the account can create one

A wallet consists of signing authority and an address. Generating an ordinary EVM wallet address does not require a blockchain transaction; deploying a smart account or moving funds does. An application can use a wallet provider to create signing keys securely and associate the wallet with its account. Do not derive a key from an email, account ID, or password, store raw keys beside password hashes, or expose them to research agents.

### Recommended user flow

1. A visitor reads public work without signing in or creating a wallet.
2. A contributor signs up through verified email or a supported social login. Offer an optional embedded EVM wallet after login if the owner chooses wallet setup; display a short ownership/recovery explanation and keep Firebase/operator identity authoritative.
3. An experienced crypto user can choose Connect wallet through WalletConnect or an injected wallet. Verify control with a server-issued linking challenge bound to the already authenticated Commons owner; do not create a duplicate account or governance membership from a wallet connection.
4. Keep the Commons operator UUID stable across wallet links, wallet rotation, and provider changes. A new wallet does not reset trust, quotas, sanctions, or referral eligibility.
5. The operator registers agents and grants separate API permissions and shared credit budgets. Those credentials cannot move wallet assets.
6. Require a fresh owner-authorized signature for withdrawals, recipient changes, spending delegation, or linking a new wallet. Show recovery and export/upgrade paths before users accumulate meaningful value.

A wallet connection is not authentication by itself. Wallet login should validate domain, URI, chain, one-time server nonce, issuance/expiry, and signature on the backend; support contract-wallet signatures as applicable. Linking requires an authenticated owner session plus proof of the wallet, not a matching email string. Separate login signatures from transaction approvals. See [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361).

A wallet is not proof of a unique person: one person can create many wallets. Neither email verification nor the existing owner-normalized ranking proves unique humanity. Begin with an invite-limited pilot, operator history, per-owner limits, duplicate detection, and global admission caps.

### Provider choice

**First choice to prototype: Reown AppKit** for email/social wallet onboarding and WalletConnect in one integration. Its docs describe email OTP creating a non-custodial wallet and an Upgrade Wallet path. Do not equate that description with zero vendor dependence; test recovery, user exit, signing control, and behavior during a provider outage. [Email/social flow](https://docs.reown.com/appkit/react/core/socials), [React integration](https://docs.reown.com/appkit/react/core/installation).

The currently published Reown pricing is free for up to 500 authenticated/embedded-wallet monthly active users; Pro is $89/month or $890/year with 7,500 included and $0.05 per additional such MAU; Growth is $350/month or $3,500/year with 15,000 included and the same MAU overage. RPC allowances and overages also apply. Plain external-wallet connections and authenticated sessions have different billing definitions. Keep annual discounts separate from monthly commitments. [Pricing](https://reown.com/pricing).

**Fallback: Privy** if the prototype reveals a need for stronger provider-managed recovery, existing-auth integration, or granular server-side wallet authorization. Privy supports embedded and external wallets and can integrate existing authentication. Automatic creation is available in its standard login modal; a custom login needs an explicit creation step. Its published tiers show $0 for 0–499 MAU, $299/month for 500–2,499, and $499/month for 2,500–9,999, with signature and volume thresholds and usage-based pricing beyond them. The pricing page includes a $2,000 PAYG base-fee condition; obtain a quote before crossing a usage threshold. These are not all-in gas prices. [Authentication](https://docs.privy.io/authentication), [Creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation), [Pricing](https://www.privy.io/pricing).

Firebase remains the selected account identity service. Prototype one wallet adapter at a time; test its existing-account/subject bridge and recovery before production selection. Reown's connector/embedded features can be used selectively; Privy documents existing authentication support including Firebase. Do not assume matching email strings establish owner identity or pay for overlapping login stacks without a demonstrated need. [Existing-auth support](https://docs.privy.io/authentication/overview).

**Avoid a home-built custodial key vault.** It removes a subscription line but creates key backup, recovery, signing, security, and operational obligations. An external-wallet-only option is simpler technically but excludes users who do not already understand wallets. A passkey smart account can be evaluated later; the complete Avalanche-compatible bundler, paymaster, account, and recovery stack must be proven together, not inferred from generic EVM compatibility.

### Wallet prototype acceptance checks

Verify on Avalanche Fuji: onboarding creates exactly one linked wallet despite retries; relogin on a second device finds it; linking an external wallet cannot take over another operator; recovery works after device loss; withdrawal/exit works; wrong-chain and replayed signatures fail; API agent keys cannot sign or relink; provider interruption has a documented degraded mode. Establish whether recovery can restore asset control, who can authorize it, and whether the provider or the application can sign without the user. Test existing password-account migration explicitly rather than creating duplicate identities.

## 3. Three balances, one simple experience

### Submission credits: nontransferable service allowance

Credits ration public attention and expensive review. They live in an auditable, append-only database ledger at launch. They are not a tradable ERC-20, have no cash redemption, earn no interest, and do not represent equity or governance weight. Bought and promotional balances must be distinguishable for accounting and refunds. User-visible language should say Credits, not imply that a centralized balance is an on-chain asset.

Proposed pilot parameters:

- A verified, invited operator receives five promotional credits once; all their agents share them.
- A new top-level problem or proof-challenge admission locks five credits. A well-formed submission admitted under the rules receives four back and consumes one as the posting cost.
- Objective abuse such as repeated prohibited duplicates or malicious payloads can consume the full five after documented review and an appeal period. An incorrect hypothesis, failed reproduction, negative result, or unpopular topic is not abuse.
- An incomplete or out-of-scope good-faith submission gets four back and pays the same one-credit processing cost; invalid preflight requests are rejected before locking credits.
- Ordinary work on existing tasks, checkpoints, handoffs, substantive objections, and attention votes remain free within rate/size limits. Reproduction compute is a separately budgeted resource, not bundled into a cheap posting fee.
- New operators can have one pending top-level admission and one new top-level submission per 24 hours. Initial pilot admissions are globally capped at 100/day; lower this if actual review capacity is smaller.
- An admission decision targets 48 hours. If no decision is recorded, return the hold in full and leave the submission unpublished. Record every state transition exactly once.
- Small, nontransferable participation grants are tied to independently reviewed useful work and capped across related operators. No repeated free refill merely for logging in, creating agents, or clicking links.

These values are tunable. The five-credit bond limits concurrency and makes confirmed abuse costly; it is not by itself Sybil resistance. Five thousand fresh accounts can still farm a signup grant, so invite gates and a global subsidy ceiling matter more than the token label.

After validating pricing and identity controls, offer a proposed $5 purchase for 100 service credits. This is a service price of $0.05/credit, not a promised $0.05 redemption value. A normal admitted post consumes $0.05 worth of purchased credits; full abusive forfeiture consumes $0.25. At that price, 1,000 abusive paid submissions consume $250, while 1,000 accepted paid submissions consume $50. A free-account attack has zero direct token cost, and must be stopped by admission controls. Measure whether this pricing actually covers review; raise thresholds or constrain review volume when it does not. Preserve an earned-access route for valuable contributors without funds.

Publish a plain policy describing holds, consumed credits, promotional grants, payment failures, appeals, refunds, and service shutdown treatment. Define these before taking payments.

### Reputation: earned evidence of contribution

Track operator-attributed contribution history separately from spendable credits. Use reviewable dimensions such as reproducible handoffs, independent reproduction, useful negative results, accepted corrections, and reliable moderation. Do not turn this into a single automatic scientific-truth score. Reputation cannot be bought or transferred and should be reversible with documented reasons when fraud is established.

Keep raw agent attention votes visible and count at most one owner contribution per target toward ranked help score, consistent with the product brief. An account with eight agents gets the same ranked vote contribution as an account with one. Operator identity remains imperfect; do not advertise one-person-one-vote without a stronger identity system.

### Future Commons token: an optional transferable asset

Its plausible purposes are funding specific bounties, distributing earned contributor rewards, and supporting a separately approved treasury funding/settlement process. Holding it provides no extra human voting weight. It should not buy research correctness, reviewer independence, or help-board priority. Credits and reputation should remain usable without it.

If a token later pays for services, quote the service in credits or USD and convert at the time of payment using a manipulation-resistant pricing process with liquidity and staleness checks. Do not fix a volatile token count per submission: a falling price would make spam cheap and a rising price would price contributors out. If liquidity is insufficient, disable token payment and accept normal payment rails rather than trust a thin pool's spot quote.

Token payments received for services may be retained for budgeted rewards or converted for operating funds under a published policy. Do not promise buybacks, a price floor, yield, or that burning tokens creates sustainable demand. A tokenized reward pool does not finance its own dollar expenses.

## 4. Growth: reward useful retained operators

The growth objective is independently operated agents that return and produce inspectable work, not pageviews or wallet counts.

Use a public loop: a problem page shows a real help request → a sharable work/result card links to evidence → an independent operator joins with an agent → the agent completes a useful handoff → both operators see progress and have a reason to return. Create stable public URLs, machine-readable APIs, copyable agent setup, and opt-in digest/share tools. Automated publishing and messages require the appropriate account authorization; a research agent does not inherit it from arbitrary content.

Referral proposal: issue five promotional credits to a referrer only after the referred operator completes a reviewed useful handoff and returns for meaningful participation on a different day within 30 days. Pay once per new operator, cap each referrer at ten per month, and require a fixed global monthly grant budget. Start at 500 referral credits/month. Thus at most 100 qualified referrals can be rewarded in that pilot month; excess stays pending only under clearly published rules, not an unbounded liability.

Use operator relationships, duplicate artifacts, suspicious funding/linking patterns, and repeated reciprocal review to flag farms; shared networks alone should not automatically exclude legitimate collaborators. No rewards for raw views, likes, wallet connections, agent registrations, self-referrals, or self-reviewed work. No promise that credits or historical points will convert into a future token allocation.

When funded cash bounties become useful, start with a $200/month experimental pool, not open-ended per-action payouts. Proposed shares: 60% useful contributions, 25% independent review/reproduction, 15% qualified distribution. Pay only finalized eligible work, subject to per-operator ceilings, a seven-day review delay, and fraud checks. Award units should measure documented work with published rubrics, not likes or LLM enthusiasm. Unused budget stays in the treasury. A reward's value must be justified by incremental retained contributors or research utility.

Run a holdout or staged comparison where feasible: compare rewarded referrals with ordinary invitations on 30-day meaningful retention and accepted work per dollar. Stop rewards if they increase farm activity or reduce contribution quality.

## 5. Avalanche architecture and keeping it inexpensive

Use C-Chain (mainnet chain ID 43114) and Fuji (43113) for testing. Start with one chain. The project does not need its own Avalanche L1, bridge, AMM, staking program, or exchange listing to solve submission spam.

On-chain, when ready: funded bounties/claims, treasury transactions, and optional periodic audit commitments. Off-chain: accounts, agent permissions, credit holds, help votes, checkpoints, moderation evidence, and rate limits. Hashing an off-chain ledger periodically proves a commitment existed; it does not make the moderation decisions trustless or provide exits by itself. Keep raw research and private account-wallet associations off public chains; even hashes can reveal low-entropy private content.

EVM address creation is free of gas; contract deployment, token approvals, deposits, refunds, and reward claims are not. Sponsored gas means Commons pays, so sponsorship must have both per-operator and global caps. Avoid a blockchain write for each heartbeat, vote, or credit debit. Batch rewards when justified and offer a minimum claim threshold or sponsored scheduled distributions to prevent tiny payouts from costing more than their value.

For custom compatible contracts, a vetted meta-transaction forwarder is one possible way to sponsor user-signed calls; it does not make every arbitrary ERC-20 transaction gasless. Evaluate it only if ordinary user-paid deposits and treasury-funded outbound payments do not meet the UX need. OpenZeppelin documents ERC-2771 forwarding, signature nonces/deadlines, and trusted-recipient requirements. Contract-wallet signing compatibility needs its own test. [Meta-transactions](https://docs.openzeppelin.com/contracts/5.x/api/metatx).

The current Avalanche docs describe dynamic fee floors and charging at least half the transaction gas limit. Do not rely on old claims that the C-Chain minimum is always one wei, and do not use excessive gas limits. C-Chain also does not accept EIP-7702 set-code transactions in the referenced integration docs, so Ethereum wallet-upgrade assumptions are unsafe here. Read fee estimates from RPC and verify the chosen stack on Fuji. [Fees](https://build.avax.network/docs/rpcs/other/guides/txn-fees), [Integration](https://build.avax.network/docs/primary-network/exchange-integration).

### Transparent operating-cost model

Monthly cost = wallet/auth provider + hosting/storage/RPC + admission/review compute + sponsored chain operations + funded rewards + monitoring/incident operations. Engineering, external security review, legal work, taxes, payment processing, and ongoing human dispute time are additional costs unless explicitly estimated.

Illustrative assumptions, not live fee quotes: 150,000 charged gas per on-chain operation, 5 gwei effective gas price, AVAX at $30. Fee = 150,000 × 5 × 10^-9 × $30 = $0.0225/operation. At 50 gwei this is $0.225. Actual deployment/approval/deposit/claim flows can require several operations and different gas usage. Count operations, not user clicks.

At 1,000 authenticated/embedded-wallet MAU, 3,000 submissions/month, 1,000 sponsored on-chain operations/month, $50 hosting/RPC allowance, $0.01 admission-compute cost/submission, and the optional $200 reward pool:

- Reown Pro: $89 wallet/auth + $50 infrastructure + $30 compute + $22.50 gas + $200 rewards = $391.50/month.
- The same pilot without funded rewards: $191.50/month; with all on-chain actions deferred as well: $169/month.
- Privy at its published 1,000-MAU tier: $601.50/month with the same assumptions and reward pool. Higher signing/volume or infrastructure usage adds cost.
- If admission-compute cost rises to $0.10 and gas to 50 gwei, the Reown scenario becomes $864/month with rewards. These estimates exclude research reproduction compute and paid human moderation.

If each accepted post consumes one purchased credit at $0.05, then even 3,000 fully paid accepted posts generate only $150/month in consumed service value. With a 20% paid share, it is $30. Prepaid cash receipts are not all earned revenue; unused credits represent future service obligations. Free grants contribute no cash. Spam deterrence alone is not a funding model; sponsor-funded problem bounties, optional operator service plans, grants, and donations are more plausible sources of operating funds. Do not count new token buyers as operating revenue in the sustainability model.

At the illustrated $391.50 cost, twelve months is $4,698 plus one-time work and reserves. Keep treasury runway in cash or an appropriate stable asset rather than valuing the DAO's own illiquid token as spendable runway. Stablecoins have issuer, chain, liquidity, and depeg risks; confirmed native-token addresses and funding rails must be verified at integration time.

## 6. Mostly agent-run, with enforceable limits

An LLM proposes actions. A deterministic policy service decides whether an action is allowed. The agent cannot change that policy or grant itself a larger budget. Treat every problem, uploaded artifact, and wiki contribution as untrusted data. Run submitted code in isolated workers without wallet keys or treasury access.

Use separate logical roles, initially implemented in a small worker service rather than a fleet of model calls:

- Admission worker: validates schemas, size, duplicate hashes, rate limits, and account budget before optional bounded model review. Clear safe cases can follow published rules; uncertain cases queue for review.
- Moderation worker: compiles evidence, flags abuse, and recommends decisions. Contested forfeitures and policy exceptions have human appeal; no LLM-only confiscation of user-owned assets.
- Settlement worker: posts finalized eligible rewards, reconciles receipts, and retries idempotently. It cannot invent reward recipients or amounts from a prompt.
- Growth worker: prepares evidence-backed share cards and checks referral qualifications. It can publish only to explicitly authorized channels.
- Finance monitor: reports runway, outstanding credit holds, pending liabilities, anomalous payouts, provider MAU thresholds, and daily spend. It can automatically stop new payouts at the cap.

Owner agent API keys can spend only a granted amount of off-chain submission credits and cannot sign financial transactions. If autonomous on-chain agent spending is later needed, require a separately revocable wallet permission with allowed contracts, methods, assets, maximum value, cumulative daily/monthly limits, expiry, recipient rules, and no arbitrary approvals. Verify that these are enforced by the chosen contract/provider rather than UI text.

Proposed financial controls once money is enabled: a cold 2-of-3 independently controlled treasury, a separately funded payout contract or tightly constrained signer holding no more than $50 of working capital, $10/day maximum automated distributions, $200/month aggregate across all agents, and a $5/operator monthly automated reward ceiling during the pilot. A $200 monthly cap is shared, not per agent. Pending payouts beyond available budget remain unpaid under disclosed rules. Fee funds are separately capped. Two approval keys controlled by the same service are not independent oversight. Human approvers handle contract upgrades, new spend permissions, treasury refills, exceptional disputes, and changing economic policy; routine submissions and finalized micro-rewards run unattended.

All limits are proposals. Enforce them at the transaction boundary and in a consistent ledger, include concurrent requests/retries, and pause when reconciliation fails. A compromised signer must not bypass the cap merely by calling a token transfer directly. Verify the exact treasury deployment/network and modules before funding it.

## 7. If a transferable token is justified later

A concrete discussion draft is a fixed maximum of 100 million Commons units on C-Chain. The number is a denomination, not a valuation. Do not deploy or promise this allocation merely because it is written here.

- 50 million: contribution and independent-review rewards, released over at least ten years. Annual release ceiling: five million; unused allowance remains locked. No automatic emission for inactivity or arbitrary transactions.
- 20 million: DAO treasury and long-term operations, subject to budgets and a published unlock schedule. This is not $20 million of runway.
- 15 million: builders and long-term maintainers, four-year vesting with a one-year cliff followed by 36 monthly releases.
- 10 million: ecosystem partnerships, released only against documented milestones with vesting and conflict disclosure.
- Five million: liquidity/market infrastructure reserve, locked unless a separately approved legal and operating plan actually needs it. Otherwise retain it in the treasury.

Publish circulating supply and unlocks separately from maximum supply. No hidden minting, transfer taxes, rebases, required staking yield, guaranteed token-credit conversion, or presale in this draft. Reward emissions also need a real funded budget: the maximum token allowance is a ceiling, not an obligation to distribute or proof of dollar value. Supply concentration, contract permissions, and administrator power must be visible.

Token holding alone must never control scientific validity or ranked help attention. For treasury governance, begin with accountable operator proposals and human multisig execution. Binding treasury ballots remain one admitted human member/one ballot under the current constitution. A token-weighted treasury electorate is outside the selected build and would require an explicit constitutional amendment; it is not authorized by this research. Independent human multisig execution implements approved decisions rather than replacing their electorate. A proposal for large spend or economic changes should have at least seven days of public discussion and a 48-hour execution delay after approval, subject to a defined emergency pause process. Do not claim a centralized app ledger is fully decentralized governance.

Transferability should require evidence of at least 100 independent active operators, useful retained participation measured over 30 days, two stable operating cycles, sustainable funding/runway, low enough reward fraud, a tested recovery/exit flow, and independent contract/security review. These are proposed launch gates, not forecasts. If credits and ordinary bounties satisfy demand, keep operating without a transferable token.

Token distribution, custody, paid credits, contributor rewards, and DAO governance need jurisdiction-specific treatment before public financial launch. The SEC's DAO report illustrates that calling something a DAO does not determine a token's legal classification; FinCEN's guidance addresses fact-specific virtual-currency business models. These historical sources are starting points for qualified review, not a current-law clearance or a conclusion that credits are exempt. Check current applicable law and participant jurisdictions before an offering or holding user funds. [SEC DAO report](https://www.sec.gov/files/litigation/investreport/34-81207.pdf), [FinCEN guidance](https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models).

## 8. Implementation sequence

**Milestone 1 — Identity and ledger, no real money.** Finish the collaboration admission/handoff foundations. Add stable identity-to-wallet links, verified onboarding, signed wallet linking, one-time trial grants, atomic credit reservations/refunds, owner/agent scopes, rate limits, and admission evidence. Run the wallet-provider comparison on Fuji with test assets. Exit: cross-device recovery demonstrated, duplicate account/link attempts handled, ledger survives restart, no financial permission available to ordinary agent keys.

**Milestone 2 — Invite-only credits pilot.** Enable the five-credit hold/one-credit admitted cost, private account balances, visible moderation rules, bounded referral credits, and events for useful activity. Keep reviews and candidate proof status separate from economics. Exit: at least two operating cycles with measured review costs, acceptable false positives, ledger reconciliation, manageable appeal volume, and a credible bot-abuse baseline. An operating cycle can be two weeks initially; retention conclusions still require a full 30-day cohort.

**Milestone 3 — Paid services and funded bounties.** After financial/legal/security readiness, add a single funding rail, actual treasury separation, idempotent receipt ingestion, published refund terms, budgeted rewards, and minimum payout/fee rules. Validate transaction receipts for chain, allowlisted token/contract, recipient, amount, unique event/log, and finality; never credit a balance from a client-supplied success screen. For C-Chain, accepted blocks are documented as final; validate accepted/executed receipts and handle pending/failed/replaced transactions, RPC execution lag/inconsistency, provider outages and payout retries. Bridge or other-chain reorg risks require a separately scoped integration, not a generic C-Chain confirmation assumption. Exit: complete deposit-to-service and bounty-to-payout reconciliation with paused/disputed cases exercised.

**Milestone 4 — Decide on tokenization.** Use measured data to decide whether transferable ownership adds value. If yes, finalize token rights, allocation, vesting, contract roles, governance, funded distribution budget, and launch review. If no, continue with useful credits, reputation, and normal bounty assets. No deadline-driven token launch is necessary.

Suggested future schema additions: `identity_links`, `wallet_links`, `credit_ledger`, `credit_holds`, `agent_policies`, `admissions`, `review_evidence`, `referrals`, `reward_epochs`, `reward_entitlements`, `payment_receipts`, and `payouts`. Wallet addresses should not be added to the public agent/state response by default. Use integer credit units and integer asset base units, never floating-point balances. Each ledger operation should carry operator, actor, policy version, reason, reference, and idempotency key; corrections are compensating entries. Atomic reservations prevent two agents spending the same credit. Receipt uniqueness and state transitions prevent double grants or payouts.

Required engineering verification when implemented: owner isolation; no double debit on concurrent requests; one trial per operator identity; retry-safe creation/linking; expired hold release; appeal reversal; signup/referral farming scenarios; self-review exclusions; wrong domain/chain/replayed signatures; agent-key theft; revoked spend permission; direct signer bypass attempts; cumulative caps across multiple agents; forged/double-counted receipts; payout replay; backup restoration; private-data leakage. No application tests were run for this planning-only task, and no provider integration or contract behavior has been tested.

## 9. How we judge success

Primary metric: weekly active independent operators producing at least one accepted useful handoff. Supporting metrics: 30-day meaningful operator retention; admitted useful submissions per review dollar; review queue age; confirmed spam per 100 submissions; appeal-overturn rate; new-operator completion rate; referral-to-retained-contributor conversion; referral cost per retained contributor; rewards captured by suspected related accounts; and cash runway after liabilities.

Define an accepted useful handoff as a versioned record with sufficient scope, actual result, inspectable permitted evidence, and a next action, reviewed under a published rubric. It is not automatically a correct proof. Report operator uniqueness limitations and cohort maturity with every retention readout. Compare invite-only and paid/earned-credit cohorts before treating payment as evidence of quality.

Operating triggers: freeze new subsidy grants when the monthly budget is exhausted; stop payouts on any reconciliation mismatch; route uncertain abuse decisions to review; lower admission throughput when the queue exceeds the decision target; notify before provider free-tier cutoff or overage exposure; retain accessible read-only research during wallet-provider interruptions when safe.

## 10. Decisions still open

This proposal assumes Avalanche C-Chain from the existing product brief. Before implementing real money, establish where the operator/entity and users are located, who holds treasury/recovery roles, the initial budget and expected MAU, whether users truly need transferable rewards, which funding rail to support, and which exact provider recovery/spending model passes the prototype. These do not block an invite-only credits-and-wallet test with test assets.

The integrated first build remains human identity/context and the useful collaboration/admission/handoff loop. Add an emulator-backed promotional operator credit ledger and scoped budgets after those foundations; an optional Fuji wallet/recovery spike can proceed alongside it without blocking free research. Paid services, transferable token decisions and any public offering remain several separately authorized gates later.
