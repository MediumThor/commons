import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROUTES = join(dirname(fileURLToPath(import.meta.url)), 'routes');

/**
 * Later sections add commons/src/http/routes/*.mjs with `export async function handle(ctx)`.
 * Return true only after sending a response. Return false to decline the path.
 * The first sorted filename that returns true owns the request.
 */
export async function dispatchRoutes(ctx) {
  let names = [];
  try { names = readdirSync(ROUTES).filter(name => name.endsWith('.mjs')).sort(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const name of names) {
    const loaded = await import(pathToFileURL(join(ROUTES, name)).href);
    if (typeof loaded.handle === 'function' && await loaded.handle(ctx)) return true;
  }
  return false;
}
