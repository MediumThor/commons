import {
  assertNotAgentRequest,
  resolveAgentPrincipal,
  resolveHumanPrincipal,
} from '../../auth/index.mjs';
import { createIdentityDomain } from '../../domain/instructions.mjs';
import { isP0ContractsBaselineMode } from '../../storage/repositories/p1.mjs';
import { readJson } from '../read-json.mjs';

async function readOptionalJson(req) {
  if (!req.headers['content-type'] && (!req.headers['content-length'] || req.headers['content-length'] === '0')) {
    return {};
  }
  return readJson(req);
}

export async function handle(ctx) {
  if (isP0ContractsBaselineMode()) {
    return false;
  }

  const { method, path, url, req, res, commons, store, send, remoteAddress, cookieSecure, now } = ctx;
  const identity = createIdentityDomain({ store, commons, clock: now });

  if (method === 'POST' && path === '/api/v1/auth/session') {
    assertNotAgentRequest(req, 'Agent credentials cannot open or exchange a human session.');
    const data = await readJson(req);
    const { sessionToken, body } = identity.exchangeSession(data, { remoteAddress });
    res.setHeader(
      'Set-Cookie',
      `oc_session=${sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${cookieSecure ? '; Secure' : ''}`
    );
    send(200, body);
    return true;
  }

  if (path === '/api/v1/me') {
    if (method === 'GET') {
      const human = resolveHumanPrincipal(ctx);
      send(200, identity.getMe(human));
      return true;
    }
    if (method === 'PUT') {
      const human = resolveHumanPrincipal(ctx);
      const data = await readJson(req);
      send(200, identity.updateMe(human, data));
      return true;
    }
    return false;
  }

  if (path === '/api/v1/me/instructions') {
    if (method === 'GET') {
      const human = resolveHumanPrincipal(ctx);
      send(200, identity.getInstructions(human));
      return true;
    }
    if (method === 'PUT') {
      const human = resolveHumanPrincipal(ctx);
      const data = await readJson(req);
      send(200, identity.createInstructionRevision(human, data, { defaultPublish: true }));
      return true;
    }
    return false;
  }

  if (method === 'POST' && path === '/api/v1/me/instructions/revisions') {
    const human = resolveHumanPrincipal(ctx);
    const data = await readJson(req);
    send(201, identity.createInstructionRevision(human, data, { defaultPublish: false }));
    return true;
  }

  const publishMatch = path.match(/^\/api\/v1\/me\/instructions\/revisions\/([^/]+)\/publish$/);
  if (method === 'POST' && publishMatch) {
    const human = resolveHumanPrincipal(ctx);
    send(200, identity.publishInstructionRevision(human, decodeURIComponent(publishMatch[1])));
    return true;
  }

  if (method === 'POST' && path === '/api/v1/me/stop') {
    const human = resolveHumanPrincipal(ctx);
    const data = await readOptionalJson(req);
    send(200, identity.stopOwnerWorkspace(human, data));
    return true;
  }

  if (path === '/api/v1/agents') {
    if (method === 'GET') {
      const human = resolveHumanPrincipal(ctx);
      send(200, identity.listV1Agents(human));
      return true;
    }
    if (method === 'POST') {
      const human = resolveHumanPrincipal(ctx);
      const data = await readJson(req);
      send(201, identity.registerV1Agent(human, data));
      return true;
    }
    return false;
  }

  const grantMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/grants$/);
  if ((method === 'PUT' || method === 'POST') && grantMatch) {
    const human = resolveHumanPrincipal(ctx);
    const data = await readJson(req);
    send(200, identity.updateAgentGrant(human, decodeURIComponent(grantMatch[1]), data));
    return true;
  }

  const revokeMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/revoke$/);
  if (method === 'POST' && revokeMatch) {
    const human = resolveHumanPrincipal(ctx);
    const data = await readOptionalJson(req);
    send(200, identity.revokeAgent(human, decodeURIComponent(revokeMatch[1]), data));
    return true;
  }

  const stopAgentMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/stop$/);
  if (method === 'POST' && stopAgentMatch) {
    const human = resolveHumanPrincipal(ctx);
    const data = await readOptionalJson(req);
    send(200, identity.stopAgentByOwner(human, decodeURIComponent(stopAgentMatch[1]), data));
    return true;
  }

  const previewMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/context-preview$/);
  if (method === 'GET' && previewMatch) {
    const human = resolveHumanPrincipal(ctx);
    send(200, identity.previewAgentContext(human, decodeURIComponent(previewMatch[1]), url));
    return true;
  }

  if (method === 'GET' && path === '/api/v1/agent/context') {
    const agent = resolveAgentPrincipal(ctx, { requiredScope: 'context:read' });
    send(200, identity.fetchAgentContext(agent, url));
    return true;
  }

  if (method === 'POST' && path === '/api/v1/agent/context-ack') {
    const agent = resolveAgentPrincipal(ctx, { requiredScope: 'context:read' });
    const data = await readJson(req);
    send(200, identity.acknowledgeAgentContext(agent, data));
    return true;
  }

  if (method === 'POST' && path === '/api/v1/agent/context-suggestions') {
    const agent = resolveAgentPrincipal(ctx);
    const data = await readJson(req);
    send(201, identity.submitContextSuggestion(agent, data));
    return true;
  }

  if (method === 'POST' && path === '/api/v1/agent/stop') {
    const agent = resolveAgentPrincipal(ctx, { allowPaused: true, allowRevokedGrant: true });
    const data = await readOptionalJson(req);
    send(200, identity.stopByAgent(agent, data));
    return true;
  }

  if (method === 'POST' && path === '/api/v1/runs') {
    const agent = resolveAgentPrincipal(ctx, { requiredScope: 'work:claim' });
    const data = await readJson(req);
    send(201, identity.createRunWithReceipt(agent, data, req.headers['x-context-receipt']));
    return true;
  }

  return false;
}
