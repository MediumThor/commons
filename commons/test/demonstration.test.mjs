import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApplication } from '../server.mjs';
import { runWalkthrough } from '../scripts/demonstrate.mjs';
import { handle as demonstrationRoute } from '../src/http/routes/demonstration.mjs';

const root = '/api/v1/demonstrations';
test('an older running API process asks for restart instead of failing with an internal storage error', async () => {
  await assert.rejects(demonstrationRoute({ path: root, method: 'GET', req: { headers: {} }, store: {}, commons: {} }), error => error.status === 503 && error.code === 'UNAVAILABLE' && /Restart/.test(error.message));
});
async function harness(run) {
  const dataDir = mkdtempSync(join(tmpdir(), 'commons-demo-tests-'));
  let now = Date.now(), app, origin;
  async function start() {
    app = createApplication({ dataDir, clock: () => now });
    await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(0, '127.0.0.1', resolve); });
    origin = `http://127.0.0.1:${app.server.address().port}`;
  }
  const close = () => new Promise(resolve => app.server.close(resolve));
  await start();
  async function request(path, body, auth = {}, status = 200, requestKey = randomUUID()) {
    const response = await fetch(`${origin}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(auth.cookie ? { Cookie: auth.cookie } : {}), ...(auth.key ? { Authorization: `Bearer ${auth.key}` } : {}), 'Idempotency-Key': requestKey },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(response.status, status, `${path}: ${JSON.stringify(data)}`);
    return { ...data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  async function owner(label = 'owner') {
    return request('/api/auth/signup', { handle: `${label}-${randomUUID().slice(0, 7)}`, password: randomUUID() });
  }
  async function registered(user, name = 'Test worker') {
    const registration = await request('/api/agents', { name }, user, 201);
    return { key: registration.apiKey, agentId: registration.agent.id, cookie: user.cookie };
  }
  async function authorize(id, client, role = 'worker', instructions = 'PRIVATE_CANARY_demo_instruction_do_not_publish') {
    await request(`${root}/${id}/grants`, { agentId: client.agentId, role, instructions, publicDisclosure: true }, { cookie: client.cookie });
    const context = await request(`${root}/${id}/context`, undefined, client);
    const ack = await request(`${root}/${id}/ack`, { contextToken: context.contextToken, grantVersion: context.grantVersion }, client);
    client.receipt = ack.receipt;
    return client;
  }
  const post = (id, client, op, body = {}, status = 200, key) => request(`${root}/${id}/${op}`, { ...body, receipt: client.receipt }, client, status, key);
  const terms = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => ({ n: start + i, value: (start + i) ** 2 }));
  const packet = (generation, start, end) => ({ generation, terms: terms(start, end), summary: 'Actual arithmetic terms saved for the next contributor.', nextAction: 'Read the last saved term and continue with the next integer.', method: 'Client enumeration of each square.', reportedEffortMs: 5 });
  try { await run({ get origin() { return origin; }, request, owner, registered, authorize, post, terms, packet, advance: ms => { now += ms; }, restart: async () => { await close(); await start(); } }); }
  finally { await close(); rmSync(dataDir, { recursive: true, force: true }); }
}

test('full scripted HTTP collaboration, separate-account review, solo baseline and restart preserve immutable evidence', async () => {
  await harness(async h => {
    const result = await runWalkthrough(h.origin);
    assert.equal(result.fixtureMode, true);
    assert.equal(result.candidate.total, 338350);
    assert.equal(result.reviews[0].passed, true);
    assert.equal(result.assessment.contributingOwners, 2);
    assert.equal(result.assessment.reusedTerms, 25);
    assert.equal(result.assessment.resumedTerms, 25);
    assert.equal(result.baseline.passed, true);
    assert.match(result.assessment.outcome, /no reduction/);
    assert.match(result.assessment.limitation, /one test operator/);
    const encoded = JSON.stringify(result);
    for (const forbidden of ['privateInstructions', 'contextToken', 'receipt', 'PRIVATE_CANARY', 'password', 'lease_digest', 'apiKey']) assert.equal(encoded.includes(forbidden), false, forbidden);
    const before = structuredClone(result);
    await h.restart();
    const after = await h.request(`${root}/${result.id}`);
    delete after.cookie;
    assert.deepEqual(after, before);
    const history = await h.request(`${root}/${result.id}/history?limit=3`);
    const next = await h.request(`${root}/${result.id}/history?limit=3&before=${history.nextCursor}`);
    assert.equal(history.events.length, 3);
    assert.equal(new Set([...history.events, ...next.events].map(item => item.sequence)).size, 6);
    const caps = await h.request('/api/v1/capabilities');
    assert.equal(caps.operations.some(item => item.id === 'demonstration.protocol' && item.status === 'available'), true);
    const protocol = await h.request(`${root}/protocol`);
    const openapi = await h.request(protocol.openapi);
    assert.equal(openapi.paths[`${root}/{id}/units/{unitId}/handoff`].post.requestBody.content['application/json'].schema.required.includes('generation'), true);
  });
});

test('owner-only grants, private context, forged/stale receipts, pause and key revocation are enforced', async () => {
  await harness(async h => {
    const a = await h.owner('a'), b = await h.owner('b');
    const run = await h.request(root, {}, a, 201);
    const ca = await h.registered(a), cb = await h.registered(b);
    await h.authorize(run.id, ca);
    const otherRun = await h.request(root, {}, a, 201);
    const otherAgent = await h.authorize(otherRun.id, await h.registered(a, 'Different run agent'));
    await h.post(run.id, { ...ca, receipt: otherAgent.receipt }, 'units/lower/claim', {}, 409);
    await h.request(`${root}/${run.id}/ack`, { contextToken: 'forged-token', grantVersion: 1 }, ca, 409);
    await h.request(`${root}/${run.id}/grants`, { agentId: ca.agentId, role: 'worker', instructions: 'Attempt a foreign owner edit.', publicDisclosure: true }, b, 404);
    await h.request(`${root}/${run.id}/grants`, {}, { key: ca.key }, 403);
    const foreignGrants = await h.request(`${root}/${run.id}/grants`, undefined, b);
    assert.deepEqual(foreignGrants.grants, []);
    await h.request(`${root}/${run.id}/context`, undefined, cb, 403);
    await h.post(run.id, { ...ca, receipt: 'forged-receipt' }, 'units/lower/claim', {}, 409);
    const claim = await h.post(run.id, ca, 'units/lower/claim');
    await h.request(`${root}/${run.id}/grants`, { agentId: ca.agentId, role: 'worker', instructions: 'New private owner instruction revision.', publicDisclosure: true }, a);
    const history = await h.request(`${root}/${run.id}/grants`, undefined, a);
    assert.equal(history.revisions.length, 2);
    assert.equal(history.revisions[1].instructions, 'PRIVATE_CANARY_demo_instruction_do_not_publish');
    await h.post(run.id, ca, 'units/lower/claim', {}, 409);
    // Safe stop remains possible with a stale context and no body.
    await h.post(run.id, ca, 'units/lower/stop');
    await h.authorize(run.id, ca);
    await h.post(run.id, ca, 'units/lower/handoff', h.packet(claim.unit.generation, 1, 2), 409);
    await h.request(`${root}/${run.id}/grants`, { agentId: ca.agentId, paused: true }, a);
    await h.post(run.id, ca, 'units/lower/claim', {}, 403);
    await h.request(`/api/agents/${ca.agentId}/rotate-key`, {}, a);
    await h.request(`${root}/${run.id}/context`, undefined, ca, 401);
    const publicState = await h.request(`${root}/${run.id}`);
    assert.equal(JSON.stringify(publicState).includes('PRIVATE_CANARY'), false);
    for (let index = 0; index < 20; index++) await h.request(`${root}/${run.id}/grants`, { agentId: cb.agentId, role: 'worker', instructions: `Private revision number ${index} for the second owner.`, publicDisclosure: true }, b);
    let before, sequences = [];
    do {
      const page = await h.request(`${root}/${run.id}/history?limit=7${before ? `&before=${before}` : ''}`);
      sequences.push(...page.events.map(item => item.sequence));
      before = page.nextCursor;
    } while (before);
    assert.ok(sequences.length > 15);
    assert.equal(sequences.at(-1), 1);
    assert.equal(new Set(sequences).size, sequences.length);
  });
});

test('concurrent claims, idempotency, mandatory handoffs, expiry and stale generations cannot corrupt ranges', async () => {
  await harness(async h => {
    const a = await h.owner('a'), b = await h.owner('b');
    const run = await h.request(root, {}, a, 201);
    const first = await h.authorize(run.id, await h.registered(a));
    const fresh = await h.authorize(run.id, await h.registered(a, 'Fresh test worker'));
    const other = await h.authorize(run.id, await h.registered(b));
    const path = `${root}/${run.id}/units/lower/claim`;
    const responses = await Promise.all([first, fresh].map(client => fetch(`${h.origin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${client.key}`, 'Idempotency-Key': randomUUID() }, body: JSON.stringify({ receipt: client.receipt }) })));
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const heldBy = responses[0].status === 200 ? first : fresh;
    const winning = await responses[responses[0].status === 200 ? 0 : 1].json();
    await h.post(run.id, heldBy, 'units/upper/claim', {}, 403);
    await h.post(run.id, heldBy, 'units/lower/handoff', { generation: winning.unit.generation }, 400);
    await h.post(run.id, other, 'units/lower/handoff', h.packet(winning.unit.generation, 1, 2), 409);
    const key = randomUUID(), data = h.packet(winning.unit.generation, 1, 25);
    const handoff = await h.post(run.id, heldBy, 'units/lower/handoff', data, 200, key);
    const replay = await h.post(run.id, heldBy, 'units/lower/handoff', data, 200, key);
    assert.equal(replay.handoff.id, handoff.handoff.id);
    await h.post(run.id, heldBy, 'units/lower/handoff', { ...data, reportedEffortMs: 99 }, 409, key);
    await h.post(run.id, fresh, 'units/lower/claim', {}, 409);
    const resumed = await h.post(run.id, fresh, 'units/lower/claim', { resumeFrom: handoff.handoff.id });
    h.advance(600001);
    await h.post(run.id, fresh, 'units/lower/handoff', h.packet(resumed.unit.generation, 26, 50), 409);
    const newer = await h.post(run.id, fresh, 'units/lower/claim', { resumeFrom: handoff.handoff.id });
    assert.equal(newer.unit.generation, resumed.unit.generation + 1);
    await h.post(run.id, fresh, 'units/lower/handoff', h.packet(resumed.unit.generation, 26, 50), 409);
    await h.post(run.id, fresh, 'units/lower/handoff', h.packet(newer.unit.generation, 25, 50), 400);
    await h.post(run.id, fresh, 'units/lower/handoff', h.packet(newer.unit.generation, 26, 50));
    const state = await h.request(`${root}/${run.id}`);
    assert.equal(state.units[0].handoffs.length, 2);
    assert.equal(state.units[0].nextStart, 51);
  });
});

test('false evidence survives a failed review; contributors and related agents cannot certify it', async () => {
  await harness(async h => {
    const a = await h.owner('a'), b = await h.owner('b'), c = await h.owner('c');
    const run = await h.request(root, {}, a, 201);
    const ca = await h.authorize(run.id, await h.registered(a));
    const fresh = await h.authorize(run.id, await h.registered(a, 'Fresh worker'));
    const cb = await h.authorize(run.id, await h.registered(b));
    const cc = await h.authorize(run.id, await h.registered(c), 'reviewer');
    const first = await h.post(run.id, ca, 'units/lower/claim');
    const wrong = h.packet(first.unit.generation, 1, 25);
    // Preserve the total while corrupting individual terms: aggregate agreement is insufficient.
    wrong.terms[0].value = 2;
    wrong.terms[1].value = 3;
    const saved = await h.post(run.id, ca, 'units/lower/handoff', wrong);
    const next = await h.post(run.id, fresh, 'units/lower/claim', { resumeFrom: saved.handoff.id });
    await h.post(run.id, fresh, 'units/lower/handoff', h.packet(next.unit.generation, 26, 50));
    const upper = await h.post(run.id, cb, 'units/upper/claim');
    await h.post(run.id, cb, 'units/upper/handoff', h.packet(upper.unit.generation, 51, 100));
    const candidate = await h.post(run.id, fresh, 'candidate');
    await h.request(`${root}/${run.id}/grants`, { agentId: ca.agentId, role: 'reviewer', instructions: 'Try to review own contribution.', publicDisclosure: true }, a, 403);
    await h.post(run.id, ca, 'review', {}, 403);
    const snapshot = await h.request(`${root}/${run.id}`);
    const identity = n => n * (n + 1) * (2 * n + 1) / 6;
    const review = { candidateDigest: candidate.candidate.digest, checks: snapshot.units.flatMap(unit => unit.handoffs).map(item => ({ handoffId: item.id, expectedSum: identity(item.end) - identity(item.start - 1) })), expectedTotal: 338350, method: 'Independent closed-form check of all ranges.', reportedEffortMs: 5 };
    await h.post(run.id, cc, 'review', { ...review, candidateDigest: 'wrong-digest' }, 409);
    const rejected = await h.post(run.id, cc, 'review', review);
    assert.equal(rejected.review.passed, false);
    await h.post(run.id, fresh, 'units/lower/claim', { resumeFrom: saved.handoff.id }, 409);
    const after = await h.request(`${root}/${run.id}`);
    assert.equal(after.units[0].handoffs[0].terms[0].value, 2);
    assert.equal(after.candidate.total, 338350);
    assert.equal(after.candidate.digest, candidate.candidate.digest);
    assert.match(after.assessment.outcome, /Awaiting/);
  });
});
