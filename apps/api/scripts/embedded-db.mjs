import EmbeddedPostgres from 'embedded-postgres';
const postgres = new EmbeddedPostgres({ databaseDir: process.argv[2], user: 'eventise', password: 'eventise-test', port: 55433, persistent: true, initdbFlags: ['--locale=C', '--encoding=UTF8'] });
await postgres.initialise(); await postgres.start();
try { await postgres.createDatabase('eventise_migrate'); } catch {}
process.on('SIGTERM', async () => { await postgres.stop(); process.exit(0); });
setInterval(() => {}, 60_000);
