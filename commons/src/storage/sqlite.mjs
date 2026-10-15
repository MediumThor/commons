import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertStore } from './port.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const CORE_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  salt TEXT NOT NULL,
  password TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  digest TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  sprite TEXT NOT NULL,
  digest TEXT UNIQUE NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  approach TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  lease_digest TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS task_problem ON tasks(problem_id, status, expires);
CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  summary TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  agent_id TEXT,
  problem_id TEXT,
  summary TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency (
  scope TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL,
  request_digest TEXT NOT NULL,
  status TEXT NOT NULL,
  response_json TEXT,
  created INTEGER NOT NULL
);
`;

export function applySqlMigrations(db, dir = join(HERE, 'migrations')) {
  let names = [];
  try { names = readdirSync(dir).filter(name => name.endsWith('.sql')).sort(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const name of names) db.exec(readFileSync(join(dir, name), 'utf8'));
}

export function applyExtensions(store, dir = join(HERE, 'repositories')) {
  let names = [];
  try { names = readdirSync(dir).filter(name => name.endsWith('.mjs')).sort(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const name of names) {
    const loaded = require(join(dir, name));
    if (typeof loaded.extend === 'function') loaded.extend(store);
  }
  return store;
}

export function openSqliteStore(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(resolve(dataDir, 'commons.sqlite'));
  db.exec(CORE_SQL);
  applySqlMigrations(db);
  const store = new SqliteStore(db);
  applyExtensions(store);
  return assertStore(store);
}

class SqliteStore {
  constructor(db) { this.db = db; }

  transaction(run) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = run();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  insertUser({ id, handle, displayName, salt, passwordHash, created }) {
    this.db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(id, handle, displayName, salt, passwordHash, created);
  }

  findUserByHandle(handle) {
    return this.db.prepare('SELECT * FROM users WHERE handle=?').get(handle) ?? null;
  }

  findUserBySession(digest, now) {
    return this.db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.digest=? AND s.expires>?').get(digest, now) ?? null;
  }

  insertSession({ digest, userId, expires }) {
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest, userId, expires);
  }

  deleteSession(digest) {
    this.db.prepare('DELETE FROM sessions WHERE digest=?').run(digest);
  }

  countAgents(ownerId) {
    return this.db.prepare('SELECT COUNT(*) AS n FROM agents WHERE owner_id=?').get(ownerId).n;
  }

  insertAgent(agent) {
    this.db.prepare('INSERT INTO agents VALUES (?,?,?,?,?,?,?)').run(agent.id, agent.owner_id, agent.name, agent.framework, agent.sprite, agent.digest, agent.created);
  }

  findAgentByDigest(digest) {
    return this.db.prepare('SELECT * FROM agents WHERE digest=?').get(digest) ?? null;
  }

  findAgentForOwner(id, ownerId) {
    return this.db.prepare('SELECT * FROM agents WHERE id=? AND owner_id=?').get(id, ownerId) ?? null;
  }

  updateAgentDigest(id, digest) {
    this.db.prepare('UPDATE agents SET digest=? WHERE id=?').run(digest, id);
  }

  listAgents() {
    return this.db.prepare('SELECT id, owner_id, name, framework, sprite, created FROM agents ORDER BY created').all();
  }

  ownerHandle(ownerId) {
    return this.db.prepare('SELECT handle FROM users WHERE id=?').get(ownerId)?.handle ?? null;
  }

  activeTasksForAgent(agentId, now) {
    return this.db.prepare("SELECT id, problem_id, approach, expires, created FROM tasks WHERE agent_id=? AND status='active' AND expires>?").all(agentId, now);
  }

  countCheckpointsForAgent(agentId) {
    return this.db.prepare('SELECT COUNT(*) AS n FROM checkpoints WHERE agent_id=?').get(agentId).n;
  }

  insertEvent({ type, agentId, problemId, summary, created }) {
    this.db.prepare('INSERT INTO events(type, agent_id, problem_id, summary, created) VALUES (?,?,?,?,?)').run(type, agentId, problemId, summary, created);
  }

  expireDueTasks(now) {
    const due = this.db.prepare("SELECT id, agent_id, problem_id FROM tasks WHERE status='active' AND expires<=?").all(now);
    for (const task of due) {
      this.db.prepare("UPDATE tasks SET status='expired' WHERE id=? AND status='active'").run(task.id);
      this.insertEvent({ type: 'expired', agentId: task.agent_id, problemId: task.problem_id, summary: 'Reservation expired. This approach is available again.', created: now });
    }
    return due.length;
  }

  listActiveTasks(now) {
    return this.db.prepare("SELECT id, problem_id, owner_id, agent_id, approach, status, created, expires FROM tasks WHERE status='active' AND expires>?").all(now);
  }

  recentActivity(limit) {
    return this.db.prepare('SELECT e.id, e.type, e.agent_id, e.problem_id, e.summary, e.created, a.name, a.sprite, u.handle FROM events e LEFT JOIN agents a ON a.id=e.agent_id LEFT JOIN users u ON u.id=a.owner_id ORDER BY e.id DESC LIMIT ?').all(limit);
  }

  countCheckpoints() {
    return this.db.prepare('SELECT COUNT(*) AS n FROM checkpoints').get().n;
  }

  countCheckpointsForProblem(problemId) {
    return this.db.prepare('SELECT COUNT(*) AS n FROM checkpoints c JOIN tasks t ON c.task_id=t.id WHERE t.problem_id=?').get(problemId).n;
  }

  activeTasksForProblem(problemId, now) {
    return this.db.prepare("SELECT a.name, a.sprite, u.handle, t.approach, t.expires FROM tasks t JOIN agents a ON a.id=t.agent_id JOIN users u ON u.id=a.owner_id WHERE t.problem_id=? AND t.status='active' AND t.expires>?").all(problemId, now);
  }

  findOwnActiveApproach(agentId, problemId, approach, now) {
    return this.db.prepare("SELECT id, expires FROM tasks WHERE agent_id=? AND problem_id=? AND approach=? AND status='active' AND expires>?").get(agentId, problemId, approach, now) ?? null;
  }

  findOccupiedApproach(problemId, approach, now) {
    return this.db.prepare("SELECT a.name, t.id, t.expires FROM tasks t JOIN agents a ON t.agent_id=a.id WHERE t.problem_id=? AND lower(t.approach)=lower(?) AND t.status='active' AND t.expires>?").get(problemId, approach, now) ?? null;
  }

  countOwnerActiveTasks(ownerId, now) {
    return this.db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE owner_id=? AND status='active' AND expires>?").get(ownerId, now).n;
  }

  insertTask(task) {
    this.db.prepare('INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)').run(task.id, task.problemId, task.ownerId, task.agentId, task.approach, 'active', task.created, task.expires, task.leaseDigest);
  }

  findTaskForAgent(taskId, agentId) {
    return this.db.prepare('SELECT * FROM tasks WHERE id=? AND agent_id=?').get(taskId, agentId) ?? null;
  }

  releaseTask(taskId) {
    this.db.prepare("UPDATE tasks SET status='released' WHERE id=?").run(taskId);
  }

  insertCheckpoint({ id, taskId, agentId, summary, created }) {
    this.db.prepare('INSERT INTO checkpoints VALUES (?,?,?,?,?)').run(id, taskId, agentId, summary, created);
  }

  updateTaskExpiry(taskId, expires) {
    this.db.prepare('UPDATE tasks SET expires=? WHERE id=?').run(expires, taskId);
  }

  findIdempotency(scope) {
    return this.db.prepare('SELECT scope, principal_id, request_digest, status, response_json, created FROM idempotency WHERE scope=?').get(scope) ?? null;
  }

  insertIdempotency({ scope, principalId, requestDigest, created }) {
    this.db.prepare('INSERT INTO idempotency(scope, principal_id, request_digest, status, response_json, created) VALUES (?, ?, ?, ?, NULL, ?)').run(scope, principalId, requestDigest, 'reserved', created);
  }

  completeIdempotency(scope, response) {
    this.db.prepare("UPDATE idempotency SET status='completed', response_json=? WHERE scope=?").run(JSON.stringify(response), scope);
  }

  close() { this.db.close(); }
}
