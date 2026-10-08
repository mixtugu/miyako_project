import './check-deployment.mjs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'miyako-secrets-'));
try {
  const file = join(directory, 'secrets.json');
  await writeFile(file, JSON.stringify(Object.fromEntries(
    ['COMMENT_DELETE_PASSWORD'].map(key => [key, process.env[key]]),
  )), { mode: 0o600 });
  const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--secrets-file', file], {
    stdio: 'inherit',
  });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', code => resolve(code ?? 1));
  });
  process.exitCode = code;
} finally { await rm(directory, { recursive: true, force: true }); }
