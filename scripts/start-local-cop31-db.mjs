import EmbeddedPostgres from 'embedded-postgres';

const pg = new EmbeddedPostgres({ databaseDir: './tmp/cop31-directory-postgres-utf8', user: 'eventise', password: 'eventise', port: 5434, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog: () => {}, onError: console.error });
await pg.initialise();
await pg.start();
await pg.createDatabase('eventise').catch(() => {});
process.on('SIGINT', async () => { await pg.stop(); process.exit(0); });
process.on('SIGTERM', async () => { await pg.stop(); process.exit(0); });
await new Promise(() => {});
