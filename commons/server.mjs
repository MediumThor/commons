import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBrief } from './src/contracts/brief.mjs';
import { DomainError, legacyErrorBody, structuredErrorBody } from './src/contracts/errors.mjs';
import { createCommons } from './src/domain/service.mjs';
import { handleLegacy } from './src/http/legacy.mjs';
import { dispatchRoutes } from './src/http/mounts.mjs';
import { handleV1, rejectUnimplementedV1 } from './src/http/v1.mjs';
import { openSqliteStore } from './src/storage/sqlite.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function createApplication({ dataDir = resolve(ROOT, '.data'), webRoot = resolve(ROOT, 'web/dist'), clock = Date.now, cookieSecure = false } = {}) {
  const store = openSqliteStore(dataDir);
  const commons = createCommons({ store, clock });
  const sendJson = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    let surface = 'http';
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const host = req.headers.host;
      if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
        throw new DomainError(403, 'This development server accepts localhost requests only.', { code: 'FORBIDDEN' });
      }
      const url = new URL(req.url, `http://${host}`);
      const path = url.pathname;
      if (req.headers.origin && req.headers.origin !== `http://${host}` && req.headers.origin !== `https://${host}`) {
        throw new DomainError(403, 'Cross-origin requests are not permitted.', { code: 'FORBIDDEN' });
      }
      const send = (status, value) => sendJson(res, status, value);
      const ctx = { method: req.method, path, url, req, res, commons, store, send, remoteAddress: req.socket.remoteAddress, cookieSecure, now: clock, requestId };
      if ((req.method === 'GET' || req.method === 'HEAD') && path === '/llms.txt') {
        surface = 'public';
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : renderBrief());
        return;
      }
      if (path.startsWith('/api/v1')) {
        surface = 'v1';
        commons.expire();
        if (handleV1(ctx)) return;
        if (await dispatchRoutes(ctx)) return;
        rejectUnimplementedV1(req.method, path);
      }
      if (path.startsWith('/api/')) {
        surface = 'legacy';
        commons.expire();
        if (await handleLegacy(ctx)) return;
        throw new DomainError(404, 'Endpoint not found.', { code: 'NOT_FOUND' });
      }
      surface = 'static';
      if (!['GET', 'HEAD'].includes(req.method)) throw new DomainError(405, 'Method not allowed.', { code: 'METHOD_NOT_ALLOWED' });
      let decoded;
      try { decoded = decodeURIComponent(path); }
      catch { throw new DomainError(400, 'Malformed path.', { code: 'VALIDATION' }); }
      let file = resolve(webRoot, `.${decoded}`);
      if (file !== webRoot && !file.startsWith(webRoot + sep)) throw new DomainError(404, 'Page not found.', { code: 'NOT_FOUND' });
      if (!existsSync(file) || !statSync(file).isFile()) {
        if (extname(decoded)) throw new DomainError(404, 'Page not found.', { code: 'NOT_FOUND' });
        file = resolve(webRoot, 'index.html');
        if (!existsSync(file)) throw new DomainError(503, 'The web client has not been built. Run `npm run build` in commons/.', { code: 'UNAVAILABLE' });
      }
      const type = mime[extname(file)] || 'application/octet-stream';
      const immutable = file.startsWith(resolve(webRoot, 'assets') + sep);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
    } catch (error) {
      if (!error.status) console.error(error);
      if (res.headersSent) { res.end(); return; }
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      const status = error.status || 500;
      sendJson(res, status, surface === 'v1' ? structuredErrorBody(error, requestId) : legacyErrorBody(error));
    }
  });
  server.on('close', () => store.close());
  return { server, db: store.db, store, commons };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4317);
  const { server } = createApplication();
  server.listen(port, '127.0.0.1', () => console.log(`Oracle Commons is open at http://127.0.0.1:${port}`));
}
