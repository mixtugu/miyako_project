import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

// The actual Workers, D1, and Durable Objects runtimes use disposable local storage.
const directory = await mkdtemp(join(tmpdir(), 'miyako-e2e-'));
const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
config.name = 'miyako-test';
config.main = resolve('worker/index.ts');
config.assets.directory = resolve('dist');
config.vars = { COMMENT_DELETE_PASSWORD: 'fixture-only-long-password' };
config.d1_databases = [{ binding: 'DB', database_name: 'miyako-test', database_id: '11111111-1111-4111-8111-111111111111', migrations_dir: resolve('migrations') }];
const configPath = join(directory, 'wrangler.json');
const persistence = join(directory, 'state');
await writeFile(configPath, JSON.stringify(config));
const cli = resolve('node_modules/wrangler/bin/wrangler.js');
const options = { env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } };
const exec = promisify(execFile);
await exec(process.execPath, [cli, 'd1', 'migrations', 'apply', 'DB', '--local', '--config', configPath, '--persist-to', persistence], options);
await exec(process.execPath, [cli, 'd1', 'execute', 'DB', '--local', '--config', configPath, '--persist-to', persistence,
  '--command', "INSERT INTO comments VALUES ('11111111-1111-4111-8111-111111111111','l1','Existing gallery comment','2026-01-01T00:00:00Z')"], options);
const child = spawn(process.execPath, [cli, 'dev', '--config', configPath, '--persist-to', persistence, '--port', '8791', '--ip', '127.0.0.1', '--show-interactive-dev-session=false'], { ...options, stdio: 'inherit' });
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  child.kill('SIGTERM');
  await rm(directory, { recursive: true, force: true });
  process.exitCode = code;
}
process.on('SIGINT', () => void close());
process.on('SIGTERM', () => void close());
child.on('exit', code => void close(code ?? 0));
