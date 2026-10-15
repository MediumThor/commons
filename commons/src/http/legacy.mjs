import { agentToken, readJson, sessionToken } from './read-json.mjs';

export async function handleLegacy(ctx) {
  const { method, path, req, res, commons, send, remoteAddress, cookieSecure } = ctx;
  if (method === 'GET' && path === '/api/state') {
    send(200, commons.state(commons.userFromSession(sessionToken(req))));
    return true;
  }
  if (method === 'POST' && (path === '/api/auth/signup' || path === '/api/auth/login')) {
    commons.recordAuthAttempt(remoteAddress);
    const data = await readJson(req);
    const user = path.endsWith('signup')
      ? commons.signUp({ handle: data.handle, password: data.password, displayName: data.displayName })
      : commons.logIn({ handle: data.handle, password: data.password });
    const raw = commons.createSession(user);
    res.setHeader('Set-Cookie', `oc_session=${raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${cookieSecure ? '; Secure' : ''}`);
    send(200, { user: commons.publicUser(user) });
    return true;
  }
  if (method === 'POST' && path === '/api/auth/logout') {
    commons.logOut(sessionToken(req));
    res.setHeader('Set-Cookie', 'oc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    send(200, { ok: true });
    return true;
  }
  if (method === 'POST' && path === '/api/agents') {
    const user = commons.requireUser(sessionToken(req));
    send(201, commons.registerAgent(user, await readJson(req)));
    return true;
  }
  const rotation = path.match(/^\/api\/agents\/([^/]+)\/rotate-key$/);
  if (method === 'POST' && rotation) {
    const user = commons.requireUser(sessionToken(req));
    send(200, commons.rotateAgentKey(user, rotation[1]));
    return true;
  }
  if (method === 'GET' && path === '/api/agent/me') {
    send(200, { agent: commons.publicAgent(commons.requireAgent(agentToken(req)), ctx.now()) });
    return true;
  }
  const problemPath = path.match(/^\/api\/problems\/([^/]+)$/);
  if (method === 'GET' && problemPath) {
    send(200, commons.legacyProblem(decodeURIComponent(problemPath[1])));
    return true;
  }
  if (method === 'POST' && path === '/api/tasks/claim') {
    send(201, commons.claim(commons.requireAgent(agentToken(req)), await readJson(req)));
    return true;
  }
  const taskPath = path.match(/^\/api\/tasks\/([^/]+)\/(heartbeat|checkpoint|release)$/);
  if (method === 'POST' && taskPath) {
    const agent = commons.requireAgent(agentToken(req));
    const data = await readJson(req);
    send(200, commons[taskPath[2]](agent, taskPath[1], data));
    return true;
  }
  return false;
}
