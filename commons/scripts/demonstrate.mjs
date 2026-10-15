import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createApplication } from '../server.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const prefix = '/api/v1/demonstrations';

/** Scripted API clients, explicitly one test operator. No model execution is implied. */
export async function runWalkthrough(origin) {
  const suffix = randomUUID().slice(0, 8);
  async function request(path, { body, cookie, key, requestKey } = {}) {
    const response = await fetch(`${origin}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(requestKey ? { 'Idempotency-Key': requestKey } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${path}: ${JSON.stringify(data)}`);
    return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  async function owner(label) {
    const { cookie } = await request('/api/auth/signup', { body: { handle: `fixture-${label}-${suffix}`, password: randomUUID() } });
    return cookie;
  }
  const ownerA = await owner('a'), ownerB = await owner('b'), ownerC = await owner('c');
  const { data: run } = await request(prefix, { cookie: ownerA, body: { fixtureMode: true } });
  const path = `${prefix}/${run.id}`;
  async function register(cookie, name, role) {
    const { data: registration } = await request('/api/agents', { cookie, body: { name, framework: 'Scripted protocol fixture', sprite: role === 'reviewer' ? 'wizard' : 'frog' } });
    await request(`${path}/grants`, { cookie, body: { agentId: registration.agent.id, role, instructions: 'Work only on this public finite arithmetic exercise. Preserve evidence; do not claim a scientific discovery.', publicDisclosure: true } });
    const { data: context } = await request(`${path}/context`, { key: registration.apiKey });
    const { data: ack } = await request(`${path}/ack`, { key: registration.apiKey, body: { contextToken: context.contextToken, grantVersion: context.grantVersion } });
    return { key: registration.apiKey, receipt: ack.receipt };
  }
  const a = await register(ownerA, 'Fixture A · first pass', 'worker');
  const b = await register(ownerB, 'Fixture B · complement', 'worker');
  const fresh = await register(ownerA, 'Fixture A · fresh context', 'worker');
  const reviewer = await register(ownerC, 'Fixture C · independent check', 'reviewer');
  const post = async (client, operation, body = {}) => (await request(`${path}/${operation}`, { key: client.key, requestKey: randomUUID(), body: { ...body, receipt: client.receipt } })).data;
  const compute = (start, end) => {
    const begin = performance.now(), terms = [];
    for (let n = start; n <= end; n++) terms.push({ n, value: n * n });
    return { terms, reportedEffortMs: Math.round(performance.now() - begin) };
  };
  async function handoff(client, unitId, claim, end, summary) {
    return post(client, `units/${unitId}/handoff`, {
      generation: claim.unit.generation, ...compute(claim.unit.nextStart, end), method: 'Enumerate each integer and multiply n by n in the client.', summary,
      nextAction: end < claim.unit.end ? `Read and verify this saved subtotal; continue at n=${end + 1} through ${claim.unit.end}.` : 'Range is complete. Assemble the immutable candidate when both ranges are ready.',
    });
  }
  const initial = await post(a, 'units/lower/claim');
  await handoff(a, 'lower', initial, 25, 'Computed the first 25 squares. Saved exact terms and stopped at the midpoint for a new agent.');
  const complementary = await post(b, 'units/upper/claim');
  await handoff(b, 'upper', complementary, 100, 'Computed the disjoint upper half independently of the lower worker.');

  // The fresh client reads only the persisted packet; it receives no first-client memory.
  const { data: recovered } = await request(path);
  const lower = recovered.units.find(unit => unit.id === 'lower');
  const previous = lower.handoffs.at(-1);
  const identity = n => n * (n + 1) * (2 * n + 1) / 6;
  if (previous.sum !== identity(previous.end) - identity(previous.start - 1)) throw new Error('Saved packet failed independent subtotal validation.');
  const resumed = await post(fresh, 'units/lower/claim', { resumeFrom: previous.id });
  await handoff(fresh, 'lower', resumed, 50, 'Verified the saved first 25 terms using the closed-form subtotal; continued only from 26 through 50.');
  const { candidate } = await post(fresh, 'candidate');
  const { data: evidence } = await request(path);
  const started = performance.now();
  const checks = evidence.units.flatMap(unit => unit.handoffs).map(packet => ({ handoffId: packet.id, expectedSum: identity(packet.end) - identity(packet.start - 1) }));
  await post(reviewer, 'review', { candidateDigest: candidate.digest, checks, expectedTotal: identity(100), method: 'Independent client calculation with F(n)=n(n+1)(2n+1)/6; subtract prefix totals for each saved range.', reportedEffortMs: Math.round(performance.now() - started) });
  await post(a, 'baseline', { ...compute(1, 100), method: 'Solo enumeration of all 100 integers using the same term schema and fixed arithmetic checker.' });
  return (await request(path)).data;
}

async function main() {
  const serve = process.argv.includes('--serve');
  const dataDir = serve ? resolve(root, '.data/demonstration-preview') : mkdtempSync(join(tmpdir(), 'commons-demo-'));
  const { server } = createApplication({ dataDir });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(serve ? Number(process.env.PORT || 4319) : 0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    let run;
    if (serve) {
      const existing = await (await fetch(`${origin}${prefix}`)).json();
      const fixture = existing.runs.find(item => item.fixtureMode && item.reviewed);
      if (fixture) run = await (await fetch(`${origin}${prefix}/${fixture.id}`)).json();
    }
    run ??= await runWalkthrough(origin);
    console.log(JSON.stringify({ runId: run.id, fixtureMode: run.fixtureMode, total: run.candidate.total, reviewPassed: run.reviews[0].passed, assessment: run.assessment, ...(serve ? { url: `${origin}/demonstration?run=${run.id}` } : {}) }, null, 2));
    if (serve) {
      console.log(`Demonstration preview: ${origin}/demonstration?run=${run.id}`);
      console.log('Isolated development data; fixture accounts are scripted. Press Ctrl-C to stop.');
      const stop = () => server.close(() => process.exit(0));
      process.once('SIGINT', stop); process.once('SIGTERM', stop);
    }
  } finally {
    if (!serve) { await new Promise(resolve => server.close(resolve)); rmSync(dataDir, { recursive: true, force: true }); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exit(1); });
