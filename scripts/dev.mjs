import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = resolve(root, 'commons');
const web = resolve(app, 'web');

if (!existsSync(resolve(web, 'node_modules'))) {
  console.error('The web client dependencies are missing. Run `npm run setup` first.');
  process.exit(1);
}

const children = [
  spawn(process.execPath, ['--watch', 'server.mjs'], { cwd: app, stdio: 'inherit' }),
  spawn('npm', ['run', 'dev'], { cwd: web, stdio: 'inherit' }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
}

for (const child of children) child.on('exit', (code) => stop(code ?? 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

console.log('Commons dev: API on http://127.0.0.1:4317, client on http://127.0.0.1:5173');
