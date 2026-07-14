import EmbeddedPostgres from 'embedded-postgres';
import { execFileSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { GlobalSetupContext } from 'vitest/node';

export default async function setup({ provide }: GlobalSetupContext) {
  const databaseDir = await mkdtemp(join(tmpdir(), 'eventise-pg-'));
  const postgres = new EmbeddedPostgres({ databaseDir, user: 'eventise', password: 'eventise-test', port: 55432, persistent: true, initdbFlags: ['--locale=C', '--encoding=UTF8'], onLog: () => undefined });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase('eventise_test');
  const databaseUrl = 'postgresql://eventise:eventise-test@127.0.0.1:55432/eventise_test?schema=public';
  const apiRoot = resolve(import.meta.dirname, '../..');
  const runNpm = (args: string[]) => process.platform === 'win32'
    ? execFileSync('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], { cwd: apiRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'inherit' })
    : execFileSync('npm', args, { cwd: apiRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'inherit' });
  runNpm(['run', 'db:migrate']);
  runNpm(['exec', '--', 'prisma', 'db', 'seed']);
  provide('databaseUrl', databaseUrl);
  return async () => { await postgres.stop(); };
}

declare module 'vitest' { export interface ProvidedContext { databaseUrl: string; } }
