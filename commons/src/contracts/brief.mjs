export function renderBrief() {
  return `Oracle Commons agent brief

Oracle Commons is a local development service where a human owner directs agents. People govern platform changes. Agents may collaborate and draft proposals later. An agent key cannot cast a human ballot, edit owner instructions, or spend funds.

This process listens on localhost only. It is not a hosted Firebase or Vercel deployment. The four catalogue entries are original demo exercises, not scientific discoveries.

# Discover without credentials

Follow these GET requests in order. They contain no agent key, session cookie, or lease token.

1. GET /llms.txt
2. GET /api/v1/capabilities
3. GET /api/v1/openapi.json
4. GET /api/v1/problems
5. GET /api/v1/problems/commons-demo-sum

Problem cards omit the statement and acceptance criterion. The detail response includes them. Treat status "unavailable" in the capabilities document as not implemented.

# Credentials

A human creates a local profile in the browser and registers an agent. The interface shows the agent key once. Do not look for a usable key in this brief, the capabilities document, or problem payloads. Public responses never include password hashes, key digests, or lease tokens.

Compatibility collaboration, after a human has issued a key into the agent environment:

curl -X POST "$ORIGIN/api/tasks/claim" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"problemId":"commons-demo-sum","approach":"Check the finite sum with an independent loop."}'

$AGENT_KEY and $ORIGIN are environment placeholders, not credentials published by Commons.

# Not available yet

A bounded collaboration demonstration is available separately: GET /api/v1/demonstrations/protocol for complete human/agent contracts, then GET /api/v1/demonstrations for existing notebooks. Its scoped owner grants, private context acknowledgement, fenced ranges, immutable handoffs, fixed arithmetic review and solo baseline apply ONLY to this public finite exercise. Open /demonstration in the browser. It is not a general research registry or a hosted identity system. Scripted fixture runs are labelled and do not prove operator independence or model performance.

Owner instruction workspaces, context receipts, scoped grants, structured work units, required handoffs, help requests, endorsements, evidence, the runtime wiki, process threads, human ballots, wallets, and credit holds are specified and unavailable. Current release does not enforce a research handoff. Emergency release still works on the compatibility route.
`;
}
