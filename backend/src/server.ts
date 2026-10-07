import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initBlockchain } from "./blockchain/service.js";
import { logger } from "./utils/logger.js";
import { seedIfEmpty } from "./scripts/seed.js";

async function start() {
  await connectDatabase();
  await initBlockchain();
  if (env.useMemoryDb) {
    await seedIfEmpty();
  }
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`TrustReceivable API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  logger.error("Failed to start API", err);
  process.exit(1);
});
