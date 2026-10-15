import { capabilitiesDocument } from './capabilities.mjs';

export function openApiDocument() {
  const capabilities = capabilitiesDocument();
  const paths = {};
  for (const operation of capabilities.operations) {
    if (operation.status !== 'available') continue;
    paths[operation.path] ||= {};
    paths[operation.path][operation.method.toLowerCase()] = {
      operationId: operation.id,
      summary: operation.summary,
      responses: { 200: { description: 'Success' } },
      'x-commons-stability': operation.stability,
      'x-commons-principal': operation.principal,
    };
  }
  return {
    openapi: '3.0.3',
    info: {
      title: 'Oracle Commons',
      version: '1',
      description: 'Operations that exist on this process. Unavailable capabilities are listed by GET /api/v1/capabilities and are not paths here.',
    },
    servers: [{ url: '/' }],
    paths,
  };
}
