import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApplication } from '../server.mjs';
import { decideIdempotency, idempotencyConflict, idempotencyScope } from '../src/contracts/idempotency.mjs';
import { findSecretKeys } from '../src/contracts/visibility.mjs';
import { applyExtensions, openSqliteStore } from '../src/storage/sqlite.mjs';
import { FIRESTORE_BOUNDARY, assertStore } from '../src/storage/port.mjs';

const credentialPattern = /oc_[A-Za-z0-9_-]{20,}/;

async function withServer(run) {
  const dataDir = mkdtempSync(join(tmpdir(), 'commons-contracts-'));
  const { server } = createApplication({ dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataDir, { recursive: true, force: true });
  }
}

test('a browserless agent can follow the public example and tell unavailable work from live routes', async () => {
  await withServer(async origin => {
    const briefResponse = await fetch(`${origin}/llms.txt`);
    assert.equal(briefResponse.status, 200);
    assert.match(briefResponse.headers.get('content-type'), /text\/plain/);
    const brief = await briefResponse.text();
    const capabilitiesResponse = await fetch(`${origin}/api/v1/capabilities`);
    assert.equal(capabilitiesResponse.status, 200);
    const capabilities = await capabilitiesResponse.json();
    assert.equal(capabilities.schemaVersion, 1);
    assert.equal(capabilities.contextReceipts.issued, false);
    assert.equal(capabilities.idempotency.enforced, false);
    assert.equal(capabilities.operations.some(operation => operation.status === 'unavailable' && operation.id === 'agent.context'), true);
    assert.equal(capabilities.operations.some(operation => operation.status === 'available' && operation.path === '/api/tasks/claim'), true);
    assert.equal(capabilities.principalNotes.find(item => item.kind === 'service').implemented, false);
    for (const step of capabilities.example.steps) {
      assert.equal(step.method, 'GET');
      assert.match(brief, new RegExp(step.path.replaceAll('/', '\\/')));
      const response = await fetch(`${origin}${step.path}`);
      assert.equal(response.status, 200, step.path);
      const body = step.path.endsWith('.txt') ? await response.text() : await response.json();
      const encoded = typeof body === 'string' ? body : JSON.stringify(body);
      assert.equal(credentialPattern.test(encoded), false, step.path);
      assert.equal(encoded.includes('leaseToken'), false, step.path);
      assert.equal(encoded.includes('"apiKey"'), false, step.path);
    }
    const cards = await (await fetch(`${origin}/api/v1/problems`)).json();
    assert.equal(cards.items.length, 4);
    assert.equal(cards.page.nextCursor, null);
    assert.equal('statement' in cards.items[0], false);
    assert.equal('criterion' in cards.items[0], false);
    const spec = await (await fetch(`${origin}/api/v1/openapi.json`)).json();
    assert.equal(spec.openapi, '3.0.3');
    assert.equal(typeof spec.paths['/api/v1/problems'].get, 'object');
    assert.equal(spec.paths['/api/v1/agent/context'], undefined);
    const page = await (await fetch(`${origin}/api/v1/problems?limit=1`)).json();
    assert.equal(page.items.length, 1);
    assert.equal('statement' in page.items[0], false);
    const pageTwo = await (await fetch(`${origin}/api/v1/problems?limit=1&cursor=${page.page.nextCursor}`)).json();
    assert.notEqual(pageTwo.items[0].id, page.items[0].id);
    const detail = await (await fetch(`${origin}/api/v1/problems/commons-demo-sum`)).json();
    assert.match(detail.problem.statement, /integers from 1 through 100/);
    assert.match(detail.problem.criterion, /independent methods/i);
    assert.equal(detail.problem.isDemo, true);
    assert.deepEqual(findSecretKeys(detail), []);
    const missing = await fetch(`${origin}/api/v1/problems/not-a-problem`);
    assert.equal(missing.status, 404);
    const missingBody = await missing.json();
    assert.equal(missingBody.error.code, 'NOT_FOUND');
    assert.equal(typeof missingBody.error.requestId, 'string');
    const context = await fetch(`${origin}/api/v1/agent/context`);
    assert.equal(context.status, 501);
    const contextBody = await context.json();
    assert.equal(contextBody.error.code, 'UNAVAILABLE');
    assert.equal(contextBody.error.details.phase, 'P1');
    assert.equal(contextBody.acknowledgement, undefined);
    const legacyMiss = await fetch(`${origin}/api/problems/not-a-problem`);
    assert.equal(legacyMiss.status, 404);
    assert.equal((await legacyMiss.json()).error, 'Problem not found.');
  });
});

test('legacy client snapshot stays compatible and does not publish credentials', async () => {
  await withServer(async origin => {
    const stateResponse = await fetch(`${origin}/api/state`);
    const state = await stateResponse.json();
    for (const key of ['user', 'agents', 'categories', 'problems', 'activity', 'now', 'catalogUpdated', 'catalogOrigin', 'bankGenerated', 'stats']) {
      assert.equal(key in state, true, key);
    }
    const card = state.problems[0];
    for (const key of ['id', 'title', 'originalTitle', 'description', 'category', 'categoryId', 'categoryOrder', 'icon', 'disclosure', 'compute', 'tractability', 'kind', 'featured', 'order', 'isDemo', 'provenance', 'activeAgents', 'activeTasks', 'checkpoints']) {
      assert.equal(key in card, true, key);
    }
    assert.equal('statement' in card, false);
    assert.equal(state.catalogOrigin, 'commons-original-demo');
    const detail = await (await fetch(`${origin}/api/problems/commons-demo-sum`)).json();
    for (const key of ['statement', 'criterion', 'verification', 'partialWins', 'statusChecked', 'sources', 'guideUrl']) {
      assert.equal(key in detail.problem, true, key);
    }
    const post = (path, body, headers = {}) => fetch(`${origin}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
    });
    const signup = await post('/api/auth/signup', { handle: 'contracttester', password: 'test-only-passphrase' });
    assert.equal(signup.status, 200);
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const created = await post('/api/agents', { name: 'Contract Agent', framework: 'Test' }, { Cookie: cookie });
    const { apiKey } = await created.json();
    const claim = await post('/api/tasks/claim', {
      problemId: 'commons-demo-sum', approach: 'Check the finite sum with an independent loop.',
    }, { Authorization: `Bearer ${apiKey}` });
    assert.equal(claim.status, 201);
    const after = await (await fetch(`${origin}/api/state`)).json();
    assert.deepEqual(findSecretKeys(after), []);
    assert.equal(JSON.stringify(after).includes(apiKey), false);
  });
});

test('storage boundary, idempotency helper, and repository extension are ready for Firestore', () => {
  const serverSource = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  const domainSource = readFileSync(new URL('../src/domain/service.mjs', import.meta.url), 'utf8');
  assert.equal(serverSource.includes('node:sqlite'), false);
  assert.equal(serverSource.includes('.prepare('), false);
  assert.equal(domainSource.includes('node:sqlite'), false);
  assert.equal(domainSource.includes('.prepare('), false);
  assert.equal(FIRESTORE_BOUNDARY.transactionMethod, 'transaction');
  assert.equal(typeof FIRESTORE_BOUNDARY.collections.tasks, 'string');

  const dataDir = mkdtempSync(join(tmpdir(), 'commons-store-'));
  const store = openSqliteStore(dataDir);
  try {
    assertStore(store);
    const scope = idempotencyScope({ principalId: 'agent-1', method: 'POST', route: '/api/v1/tasks/claim', bodyDigest: 'abc' });
    store.insertIdempotency({ scope, principalId: 'agent-1', requestDigest: 'abc', created: 1 });
    assert.equal(decideIdempotency(store.findIdempotency(scope), 'abc').action, 'in_progress');
    store.completeIdempotency(scope, { ok: true, taskId: 'task-1' });
    const replay = decideIdempotency(store.findIdempotency(scope), 'abc');
    assert.equal(replay.action, 'replay');
    assert.equal(replay.response.taskId, 'task-1');
    assert.equal(decideIdempotency(store.findIdempotency(scope), 'different').action, 'conflict');
    assert.equal(idempotencyConflict().code, 'IDEMPOTENCY_CONFLICT');
    const extensionDir = mkdtempSync(join(tmpdir(), 'commons-extension-'));
    writeFileSync(join(extensionDir, 'probe.mjs'), 'export function extend(store) { store.extensionProbe = () => "ready"; }\n');
    applyExtensions(store, extensionDir);
    assert.equal(store.extensionProbe(), 'ready');
    rmSync(extensionDir, { recursive: true, force: true });
  } finally {
    store.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
