import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase();

const server = app.listen(env.PORT, () => {
  console.info(`NekoStream API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.info(`${signal} received, closing server...`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
