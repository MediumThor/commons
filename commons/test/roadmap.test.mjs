import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApplication } from '../server.mjs';

async function withServer(run) {
  const dataDir = mkdtempSync(join(tmpdir(), 'commons-roadmap-'));
  const { server } = createApplication({ dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataDir, { recursive: true, force: true });
  }
}

test('GET /api/v1/roadmap serves live progress sections, owned file telemetry, and next-step guidance', async () => {
  await withServer(async origin => {
    const res = await fetch(`${origin}/api/v1/roadmap`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.generatedAt, 'number');
    assert.equal(Array.isArray(body.sections), true);
    assert.equal(body.sections.length >= 17, true);

    const ids = body.sections.map(s => s.id);
    for (const expected of ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'E0', 'E1', 'INT']) {
      assert.equal(ids.includes(expected), true, `Missing section ${expected}`);
    }

    const p0 = body.sections.find(s => s.id === 'P0');
    assert.equal(p0.docStatus, 'complete');
    assert.equal(p0.effectiveState, 'complete');
    assert.equal(p0.fileActivity.existingFiles, p0.fileActivity.totalFiles);

    const p1 = body.sections.find(s => s.id === 'P1');
    assert.equal(typeof p1.agentPrompt, 'string');
    assert.match(p1.agentPrompt, /Your assigned section is P1/);
    assert.equal(p1.claimCommand, 'mkdir progress/claims/P1');

    assert.equal(Array.isArray(body.ownerDecisions), true);
    assert.equal(body.ownerDecisions.length >= 3, true);
    assert.equal(Array.isArray(body.recentWorklog), true);
  });
});
