// Local demonstration adapter. No SQL or credentials escape into domain projections.
export function extend(store) {
  const db = store.db;
  store.demoCreate = (run, ownerId) => db.prepare('INSERT INTO demo_runs VALUES (?,?,?,?)').run(run.id, ownerId, run.created, JSON.stringify(run));
  store.demoGet = id => {
    const row = db.prepare('SELECT document FROM demo_runs WHERE id=?').get(id);
    return row ? JSON.parse(row.document) : null;
  };
  store.demoSave = run => db.prepare('UPDATE demo_runs SET document=? WHERE id=?').run(JSON.stringify(run), run.id);
  store.demoList = () => db.prepare('SELECT document FROM demo_runs ORDER BY created DESC, id DESC LIMIT 20').all().map(row => JSON.parse(row.document));
  store.demoCount = ownerId => db.prepare('SELECT COUNT(*) AS n FROM demo_runs WHERE owner_id=?').get(ownerId).n;
  store.demoGrant = (runId, agentId) => {
    const row = db.prepare('SELECT document FROM demo_grants WHERE run_id=? AND agent_id=?').get(runId, agentId);
    return row ? JSON.parse(row.document) : null;
  };
  store.demoGrants = (runId, ownerId) => db.prepare('SELECT document FROM demo_grants WHERE run_id=? AND owner_id=?').all(runId, ownerId).map(row => JSON.parse(row.document));
  store.demoGrantHistory = (runId, ownerId) => db.prepare('SELECT document FROM demo_grant_revisions WHERE run_id=? AND owner_id=? ORDER BY agent_id,version DESC').all(runId, ownerId).map(row => JSON.parse(row.document));
  store.demoSaveGrant = grant => {
    const args = [grant.runId, grant.agentId, grant.ownerId, grant.version, JSON.stringify(grant)];
    db.prepare('INSERT INTO demo_grant_revisions VALUES (?,?,?,?,?)').run(...args);
    db.prepare('INSERT INTO demo_grants VALUES (?,?,?,?,?) ON CONFLICT(run_id,agent_id) DO UPDATE SET version=excluded.version,document=excluded.document').run(...args);
  };
  store.demoIssueContext = row => {
    db.prepare('DELETE FROM demo_context WHERE agent_id=? AND run_id=?').run(row.agentId, row.runId);
    db.prepare('INSERT INTO demo_context VALUES (?,?,?,?,?,0)').run(row.digest, row.runId, row.agentId, row.version, row.expires);
  };
  store.demoContext = digest => db.prepare('SELECT * FROM demo_context WHERE digest=?').get(digest) ?? null;
  store.demoAck = digest => db.prepare('UPDATE demo_context SET acknowledged=1 WHERE digest=?').run(digest);
  store.demoRequest = (runId, agentId, operation, key) => db.prepare('SELECT digest,response FROM demo_requests WHERE run_id=? AND agent_id=? AND operation=? AND request_key=?').get(runId, agentId, operation, key) ?? null;
  store.demoRemember = (runId, agentId, operation, key, digest, response) => db.prepare('INSERT INTO demo_requests VALUES (?,?,?,?,?,?)').run(runId, agentId, operation, key, digest, JSON.stringify(response));
}
