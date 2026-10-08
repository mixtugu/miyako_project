import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export async function queryD1(sql, remote = true) {
  const { stdout } = await execute(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB',
    remote ? '--remote' : '--local', '--command', sql, '--json',
  ], { maxBuffer: 20 * 1024 * 1024, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  const results = JSON.parse(stdout);
  if (!results.every(result => result.success)) throw new Error('D1 query did not succeed.');
  return results.map(result => result.results);
}
