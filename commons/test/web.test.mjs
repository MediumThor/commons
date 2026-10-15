import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApplication } from '../server.mjs';

async function withWebServer(run) {
  const dir = mkdtempSync(join(tmpdir(), 'commons-web-test-'));
  const webRoot = join(dir, 'dist');
  mkdirSync(join(webRoot, 'assets'), { recursive: true });
  writeFileSync(join(webRoot, 'index.html'), '<!doctype html><title>client</title>');
  writeFileSync(join(webRoot, 'assets', 'app-abc123.js'), 'export {};');
  writeFileSync(join(dir, 'secret.txt'), 'outside the web root');
  const { server } = createApplication({ dataDir: join(dir, 'data'), webRoot });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
}

test('serves the built client with an SPA fallback and immutable hashed assets', async () => {
  await withWebServer(async origin => {
    const root = await fetch(`${origin}/`);
    assert.equal(root.status, 200);
    assert.match(root.headers.get('content-type'), /text\/html/);
    assert.equal(root.headers.get('cache-control'), 'no-cache');

    const deepLink = await fetch(`${origin}/problems/anything`);
    assert.equal(deepLink.status, 200);
    assert.match(await deepLink.text(), /<title>client<\/title>/);

    const asset = await fetch(`${origin}/assets/app-abc123.js`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /text\/javascript/);
    assert.match(asset.headers.get('cache-control'), /immutable/);

    assert.equal((await fetch(`${origin}/assets/missing.js`)).status, 404);
    assert.equal((await fetch(`${origin}/api/not-a-route`)).status, 404);
  });
});

test('static paths cannot escape the web root', async () => {
  await withWebServer(async origin => {
    for (const path of ['/%2e%2e/secret.txt', '/..%2fsecret.txt', '/assets/%2e%2e/%2e%2e/secret.txt']) {
      const response = await fetch(`${origin}${path}`);
      assert.notEqual(response.status, 200, path);
      assert.doesNotMatch(await response.text(), /outside the web root/, path);
    }
  });
});

test('explains a missing client build instead of failing silently', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'commons-web-missing-'));
  const { server } = createApplication({ dataDir: join(dir, 'data'), webRoot: join(dir, 'nope') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /npm run build/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
