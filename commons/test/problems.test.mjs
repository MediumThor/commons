import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApplication } from '../server.mjs';

async function withServer(run) {
  const dataDir = mkdtempSync(join(tmpdir(), 'commons-independent-test-'));
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

test('startup and problem details use only original explicitly marked demo exercises', async () => {
  await withServer(async origin => {
    const response = await fetch(`${origin}/api/state`);
    assert.equal(response.status, 200);
    const state = await response.json();
    assert.equal(state.catalogOrigin, 'commons-original-demo');
    assert.equal(state.stats.problems, 4);
    assert.equal(state.categories.reduce((sum, category) => sum + category.count, 0), 4);
    assert.equal(state.problems.every(p => p.isDemo && p.title.startsWith('[Demo]')), true);
    assert.equal('statement' in state.problems[0], false, 'board cards stay lightweight');
    assert.doesNotMatch(JSON.stringify(state), /elder-plinius|V3R1T4S|lehmer-totient/i);
    const detail = await (await fetch(`${origin}/api/problems/commons-demo-sum`)).json();
    assert.match(detail.problem.criterion, /independent methods/i);
    assert.equal(detail.problem.sources.length, 0);
    assert.equal(detail.problem.guideUrl, '');
    assert.equal(detail.problem.isDemo, true);
  });
});

test('removed source problem IDs do not resolve', async () => {
  await withServer(async origin => {
    const response = await fetch(`${origin}/api/problems/lehmer-totient`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, 'Problem not found.');
  });
});

test('new catalogue supports account, agent, bounded reservation, and heartbeat without source data', async () => {
  await withServer(async origin => {
    const post = (path, body, headers = {}) => fetch(`${origin}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
    });
    const signup = await post('/api/auth/signup', { handle: 'localtester', password: 'test-only-passphrase' });
    assert.equal(signup.status, 200);
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const created = await post('/api/agents', { name: 'Original Test Agent', framework: 'Test' }, { Cookie: cookie });
    assert.equal(created.status, 201);
    const { apiKey } = await created.json();
    const auth = { Authorization: `Bearer ${apiKey}` };
    const claim = await post('/api/tasks/claim', { problemId: 'commons-demo-sum', approach: 'Check the finite sum with an independent loop.' }, auth);
    assert.equal(claim.status, 201);
    const { task, leaseToken } = await claim.json();
    const beat = await post(`/api/tasks/${task.id}/heartbeat`, { leaseToken }, auth);
    assert.equal(beat.status, 200);
    const stale = await post(`/api/tasks/${task.id}/heartbeat`, { leaseToken: 'not-the-lease-token' }, auth);
    assert.equal(stale.status, 403);
    const state = await (await fetch(`${origin}/api/state`)).json();
    assert.equal(state.stats.tasks, 1);
    assert.equal(state.agents[0].tasks[0].problem_id, 'commons-demo-sum');
    const privateClaim = await post('/api/tasks/claim', { problemId: 'commons-demo-envelope', approach: 'Test only synthetic public disclosure boundaries.' }, auth);
    assert.equal(privateClaim.status, 201);
    const privateTask = await privateClaim.json();
    const blocked = await post(`/api/tasks/${privateTask.task.id}/checkpoint`, { leaseToken: privateTask.leaseToken, summary: 'synthetic-private-canary-do-not-publish' }, auth);
    assert.equal(blocked.status, 403);
    const publicState = await (await fetch(`${origin}/api/state`)).json();
    assert.doesNotMatch(JSON.stringify(publicState), /synthetic-private-canary-do-not-publish/);
  });
});
