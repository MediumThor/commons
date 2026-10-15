CREATE TABLE IF NOT EXISTS demo_runs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created INTEGER NOT NULL,
  document TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_grants (
  run_id TEXT NOT NULL REFERENCES demo_runs(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL,
  document TEXT NOT NULL,
  PRIMARY KEY(run_id, agent_id)
);
CREATE TABLE IF NOT EXISTS demo_context (
  digest TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES demo_runs(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  version INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS demo_grant_revisions (
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  document TEXT NOT NULL,
  PRIMARY KEY(run_id, agent_id, version)
);
CREATE TABLE IF NOT EXISTS demo_requests (
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_key TEXT NOT NULL,
  digest TEXT NOT NULL,
  response TEXT NOT NULL,
  PRIMARY KEY(run_id, agent_id, operation, request_key)
);
