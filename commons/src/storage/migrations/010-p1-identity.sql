CREATE TABLE IF NOT EXISTS user_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  firebase_uid TEXT UNIQUE,
  email TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  auth_provider TEXT NOT NULL DEFAULT 'local-scrypt',
  account_status TEXT NOT NULL DEFAULT 'active',
  paused INTEGER NOT NULL DEFAULT 0,
  private_settings_json TEXT NOT NULL DEFAULT '{}',
  public_profile_json TEXT NOT NULL DEFAULT '{}',
  profile_revision INTEGER NOT NULL DEFAULT 1,
  published_revision_id TEXT,
  instruction_version INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS owner_instruction_revisions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  preprompt TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  body_digest TEXT NOT NULL,
  previous_revision_id TEXT,
  rollback_of_revision_id TEXT,
  author_principal_json TEXT NOT NULL,
  created INTEGER NOT NULL,
  published INTEGER,
  UNIQUE(owner_id, version)
);
CREATE INDEX IF NOT EXISTS idx_owner_instructions_owner ON owner_instruction_revisions(owner_id, version DESC);

CREATE TABLE IF NOT EXISTS agent_grants (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  grant_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  scopes_json TEXT NOT NULL,
  allowed_problems_json TEXT NOT NULL DEFAULT '[]',
  limits_json TEXT NOT NULL DEFAULT '{}',
  overrides_json TEXT NOT NULL DEFAULT '{}',
  public_disclosure INTEGER NOT NULL DEFAULT 1,
  paused INTEGER NOT NULL DEFAULT 0,
  expires INTEGER,
  revoked_at INTEGER,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_grants_owner ON agent_grants(owner_id);

CREATE TABLE IF NOT EXISTS agent_grant_revisions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  grant_version INTEGER NOT NULL,
  document_json TEXT NOT NULL,
  created INTEGER NOT NULL,
  UNIQUE(agent_id, grant_version)
);

CREATE TABLE IF NOT EXISTS agent_keys (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  digest TEXT UNIQUE NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  scopes_json TEXT NOT NULL,
  expires INTEGER,
  revoked_at INTEGER,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_keys_agent ON agent_keys(agent_id, revoked_at);

CREATE TABLE IF NOT EXISTS context_receipts (
  id TEXT PRIMARY KEY,
  token_digest TEXT UNIQUE NOT NULL,
  receipt_digest TEXT UNIQUE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  key_id TEXT,
  problem_id TEXT,
  context_version TEXT NOT NULL,
  instruction_revision_id TEXT NOT NULL,
  instruction_version INTEGER NOT NULL,
  grant_version INTEGER NOT NULL,
  manifest_json TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  acknowledged_at INTEGER,
  run_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_context_receipts_agent ON context_receipts(agent_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  receipt_id TEXT NOT NULL REFERENCES context_receipts(id),
  problem_id TEXT,
  context_version TEXT NOT NULL,
  instruction_revision_id TEXT NOT NULL,
  grant_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  snapshot_json TEXT NOT NULL,
  created INTEGER NOT NULL,
  stopped_at INTEGER,
  stop_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_owner ON agent_runs(owner_id, status, created DESC);

CREATE TABLE IF NOT EXISTS context_suggestions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  problem_id TEXT,
  title TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_context_suggestions_owner ON context_suggestions(owner_id, created DESC);

CREATE TABLE IF NOT EXISTS identity_audit_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  actor_kind TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_identity_audit_owner ON identity_audit_events(owner_id, created DESC);

CREATE TABLE IF NOT EXISTS firestore_emulator_docs (
  path TEXT PRIMARY KEY,
  collection_path TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  owner_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'owner',
  data_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_firestore_emulator_collection ON firestore_emulator_docs(collection_path, owner_id);
