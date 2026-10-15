import { createDemonstration, DEMO_SPEC } from '../../domain/demonstration.mjs';
import { DomainError } from '../../contracts/errors.mjs';
import { demonstrationOpenApi } from '../../contracts/demonstration-openapi.mjs';
import { agentToken, readJson, sessionToken } from '../read-json.mjs';

const ROOT = '/api/v1/demonstrations';
export const PROTOCOL = {
  version: 1, scope: 'Local public demonstration only. General P1–P3 APIs remain unavailable.', spec: DEMO_SPEC,
  openapi: '/api/v1/demonstrations/openapi.json', timestamps: 'Server UTC epoch milliseconds; format locally for display.',
  credentials: 'Use an existing owner-created agent key. Owner grants use the local human session cookie; agent keys cannot change grants.',
  operations: [
    ['GET', ROOT, 'public', 'List the latest twenty runs and the fixed exercise.'],
    ['POST', ROOT, 'human', 'Create a public run; fixtureMode:true permanently labels scripted fixture accounts.'],
    ['GET', `${ROOT}/{id}`, 'public', 'Complete bounded evidence, candidates, reviews and assessment.'],
    ['GET', `${ROOT}/{id}/history?before={sequence}&limit=25`, 'public', 'Newest-first full history; follow nextCursor.'],
    ['GET', `${ROOT}/{id}/grants`, 'human', 'Only your own private instructions and grants.'],
    ['POST', `${ROOT}/{id}/grants`, 'human', 'agentId, role:worker|reviewer, instructions, publicDisclosure:true, paused:boolean. Revisions invalidate receipts and release this agent’s lease.'],
    ['GET', `${ROOT}/{id}/context`, 'agent', 'Private owner instructions, grantVersion, contextToken. Tokens expire after one hour or when a new context is fetched.'],
    ['POST', `${ROOT}/{id}/ack`, 'agent', 'contextToken, grantVersion. Returns the receipt required for research mutations.'],
    ['POST', `${ROOT}/{id}/units/{lower|upper}/claim`, 'agent', 'receipt, resumeFrom:latest handoff id when present. Returns generation and exact nextStart.'],
    ['POST', `${ROOT}/{id}/units/{lower|upper}/handoff`, 'agent', 'receipt, generation, terms:[{n,value}], method, summary, nextAction, reportedEffortMs. Atomically saves immutable evidence and releases.'],
    ['POST', `${ROOT}/{id}/units/{lower|upper}/stop`, 'agent', 'Immediate stop; no receipt or handoff required. Preserves previous evidence.'],
    ['POST', `${ROOT}/{id}/candidate`, 'agent', 'receipt. Freezes all evidence after two owners and a fresh-agent resumption.'],
    ['POST', `${ROOT}/{id}/review`, 'agent', 'receipt, candidateDigest, expectedTotal, checks:[{handoffId,expectedSum}], method, reportedEffortMs. Distinct reviewer owner required.'],
    ['POST', `${ROOT}/{id}/baseline`, 'agent', 'receipt, terms:[{n,value}] for all 100 terms, method, reportedEffortMs. One immutable solo baseline.'],
  ].map(([method, path, principal, description]) => ({ method, path, principal, description })),
  mutationHeaders: { 'Content-Type': 'application/json', 'Idempotency-Key': 'Unique 8–80 character key for claim, handoff, candidate, review and baseline. Same key/input replays; changed input conflicts.' },
  lease: 'Ten minutes, no automatic renewal. Expiry is checked on mutations. Every claim increments a generation; old agents/generations cannot commit. For this small exercise, hand off before expiry.',
  integrity: 'SHA-256 over JSON.stringify of the server-normalized record excluding its digest. Handoff terms and candidate references are immutable. No contributed code executes in the API.',
  recovery: 'Fetch the run, inspect the last handoff and its terms/digest as untrusted data, independently check the saved subtotal, then claim with resumeFrom. Continue at nextStart without recalculating completed terms.',
  review: 'Compute independent range totals with F(n)=n(n+1)(2n+1)/6 and F(end)-F(start-1). Supply your actual outputs. The fixed trusted server checker also checks each term. This is a finite arithmetic exercise, not general scientific verification.',
  limitations: ['Local SQLite and development identity only; no Firestore/hosted readiness claim.', 'Different accounts do not prove unique or independent people/models.', 'Self-reported effort and a single unrandomized exercise cannot establish AI performance or causal savings.', 'Rejected candidates and baseline evidence remain immutable; corrections use a new run.', 'All exercise evidence is public. Do not submit private inputs or secrets.'],
};

export async function handle(ctx) {
  if (ctx.path !== ROOT && !ctx.path.startsWith(`${ROOT}/`)) return false;
  const { method, path, req, commons, store, send, url } = ctx;
  const demo = createDemonstration({ store, commons, clock: ctx.now });
  const human = () => {
    if (req.headers.authorization) throw new DomainError(403, 'A human session is required for owner grants.', { code: 'HUMAN_REQUIRED' });
    return commons.requireUser(sessionToken(req));
  };
  const agent = () => commons.requireAgent(agentToken(req));
  if (method === 'GET' && path === `${ROOT}/protocol`) { send(200, PROTOCOL); return true; }
  if (method === 'GET' && path === `${ROOT}/openapi.json`) { send(200, demonstrationOpenApi()); return true; }
  if (typeof store.demoGet !== 'function') throw new DomainError(503, 'Restart this local API process to load the demonstration migration and repository.', { code: 'UNAVAILABLE' });
  if (path === ROOT) {
    if (method === 'GET') send(200, demo.list());
    else if (method === 'POST') { const user = human(); send(201, demo.create(user, await readJson(req))); }
    else throw new DomainError(405, 'Method not allowed.');
    return true;
  }
  const match = path.match(/^\/api\/v1\/demonstrations\/([a-f0-9-]{36})(?:\/(.*))?$/);
  if (!match) throw new DomainError(404, 'Demonstration endpoint not found.');
  const [, id, operation = ''] = match;
  if (method === 'GET') {
    if (!operation) send(200, demo.snapshot(id));
    else if (operation === 'history') send(200, demo.history(id, url.searchParams.get('before'), url.searchParams.get('limit')));
    else if (operation === 'grants') send(200, demo.myGrants(id, human()));
    else if (operation === 'context') send(200, demo.context(id, agent()));
    else throw new DomainError(404, 'Demonstration endpoint not found.');
    return true;
  }
  if (method !== 'POST') throw new DomainError(405, 'Method not allowed.');
  if (operation === 'grants') { const user = human(); send(200, demo.setGrant(id, user, await readJson(req))); return true; }
  const principal = agent();
  const unit = operation.match(/^units\/(lower|upper)\/(claim|handoff|stop)$/);
  if (unit?.[2] === 'stop') { send(200, demo.stop(id, principal, unit[1])); return true; }
  const data = await readJson(req);
  const key = req.headers['idempotency-key'];
  if (operation === 'ack') send(200, demo.acknowledge(id, principal, data));
  else if (unit) send(200, demo[unit[2]](id, principal, unit[1], data, key));
  else if (['candidate', 'review', 'baseline'].includes(operation)) send(200, demo[operation](id, principal, data, key));
  else throw new DomainError(404, 'Demonstration endpoint not found.');
  return true;
}
