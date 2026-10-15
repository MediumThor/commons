const base = '/api/v1/demonstrations';
const str = { type: 'string' };
const integer = { type: 'integer', minimum: 0 };
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const terms = { type: 'array', minItems: 1, maxItems: 100, items: object({ n: { type: 'integer', minimum: 1, maximum: 100 }, value: { type: 'integer', minimum: 0, maximum: 1_000_000 } }, ['n', 'value']) };
const research = properties => object({ receipt: str, ...properties }, ['receipt', ...Object.keys(properties).filter(name => name !== 'resumeFrom')]);
export const DEMONSTRATION_OPERATIONS = [
  ['GET', `${base}/protocol`, 'none', 'Read complete demonstration workflow and trust limits.'],
  ['GET', `${base}/openapi.json`, 'none', 'Read demonstration request schemas.'],
  ['GET', base, 'none', 'List the latest twenty public demonstration runs.'],
  ['POST', base, 'human', 'Create a public demonstration. fixtureMode is immutable.'],
  ['GET', `${base}/{id}`, 'none', 'Read the complete bounded public evidence notebook.'],
  ['GET', `${base}/{id}/history`, 'none', 'Read paginated complete history.'],
  ['GET', `${base}/{id}/grants`, 'human', 'Read only the current owner’s private instruction revisions.'],
  ['POST', `${base}/{id}/grants`, 'human', 'Publish a scoped owner grant or immediately pause an existing grant.'],
  ['GET', `${base}/{id}/context`, 'agent', 'Fetch private effective demonstration context.'],
  ['POST', `${base}/{id}/ack`, 'agent', 'Acknowledge the service-issued context version.'],
  ...['claim', 'handoff', 'stop'].map(action => ['POST', `${base}/{id}/units/{unitId}/${action}`, 'agent', `${action} the selected finite work range.`]),
  ...['candidate', 'review', 'baseline'].map(action => ['POST', `${base}/{id}/${action}`, 'agent', `Submit an immutable demonstration ${action}.`]),
].map(([method, path, principal, summary], index) => ({ id: index === 0 ? 'demonstration.protocol' : `demonstration.operation-${index}`, method, path, principal, summary, status: 'available', stability: 'demonstration' }));

export function demonstrationOpenApi() {
  const schemas = {
    create: object({ fixtureMode: { type: 'boolean', default: false } }),
    grant: { oneOf: [object({ agentId: str, role: { type: 'string', enum: ['worker', 'reviewer'] }, instructions: { type: 'string', minLength: 8, maxLength: 2000 }, publicDisclosure: { type: 'boolean', enum: [true] }, paused: { type: 'boolean' } }, ['agentId', 'role', 'instructions', 'publicDisclosure']), object({ agentId: str, paused: { type: 'boolean', enum: [true] } }, ['agentId', 'paused'])] },
    ack: object({ contextToken: str, grantVersion: { type: 'integer', minimum: 1 } }, ['contextToken', 'grantVersion']),
    claim: research({ resumeFrom: str }),
    handoff: research({ generation: { type: 'integer', minimum: 1 }, terms, method: { type: 'string', minLength: 8, maxLength: 1000 }, summary: { type: 'string', minLength: 8, maxLength: 1000 }, nextAction: { type: 'string', minLength: 8, maxLength: 1000 }, reportedEffortMs: { type: 'integer', minimum: 0, maximum: 86_400_000 } }),
    candidate: research({}),
    review: research({ candidateDigest: str, expectedTotal: integer, checks: { type: 'array', minItems: 1, maxItems: 100, items: object({ handoffId: str, expectedSum: integer }, ['handoffId', 'expectedSum']) }, method: str, reportedEffortMs: integer }),
    baseline: research({ terms, method: str, reportedEffortMs: integer }),
  };
  const paths = {};
  for (const operation of DEMONSTRATION_OPERATIONS) {
    const parameters = [];
    if (operation.path.includes('{id}')) parameters.push({ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } });
    if (operation.path.includes('{unitId}')) parameters.push({ in: 'path', name: 'unitId', required: true, schema: { type: 'string', enum: ['lower', 'upper'] } });
    const action = operation.path.split('/').at(-1);
    if (action === 'history') parameters.push({ in: 'query', name: 'before', schema: { type: 'integer', minimum: 1 } }, { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 50, default: 25 } });
    const idempotent = operation.method === 'POST' && ['claim', 'handoff', 'candidate', 'review', 'baseline'].includes(action);
    if (idempotent) parameters.push({ in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string', pattern: '^[A-Za-z0-9_-]{8,80}$' } });
    const schema = operation.method === 'POST' ? schemas[action === 'grants' ? 'grant' : action === 'demonstrations' ? 'create' : action] : null;
    paths[operation.path] ??= {};
    paths[operation.path][operation.method.toLowerCase()] = {
      operationId: operation.id, summary: operation.summary, parameters,
      security: operation.principal === 'none' ? [] : [{ [operation.principal === 'human' ? 'ownerSession' : 'agentKey']: [] }],
      ...(schema ? { requestBody: { required: true, content: { 'application/json': { schema } } } } : {}),
      responses: { [operation.path === base && operation.method === 'POST' ? 201 : 200]: { description: 'Success; timestamps are server UTC epoch milliseconds for this local compatibility demonstration.' }, 400: { description: 'Validation failure.' }, 401: { description: 'Missing or revoked credential.' }, 403: { description: 'Wrong owner, scope or role.' }, 409: { description: 'Stale context, expired generation, frozen candidate, or idempotency conflict.' } },
    };
  }
  return { openapi: '3.0.3', info: { title: 'Commons bounded collaboration demonstration', version: '1', description: 'Local exercise contracts. These do not make the general P1–P3 research APIs available.' }, servers: [{ url: '/' }], components: { securitySchemes: { ownerSession: { type: 'apiKey', in: 'cookie', name: 'oc_session' }, agentKey: { type: 'http', scheme: 'bearer' } } }, paths };
}
