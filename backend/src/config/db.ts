import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let memory: MongoMemoryServer | null = null;

export async function connectDatabase() {
//  mongoose.set("sanitizeFilter", true);

  if (env.useMemoryDb) {
    memory = await MongoMemoryServer.create({instance: { dbName: "trustreceivable" }, spawn: { timeout: 60000 }});
    const uri = memory.getUri();
    await mongoose.connect(uri);
    logger.info("Connected to in-memory MongoDB (demo)");
    return;
  }

  await mongoose.connect(env.mongoUri);
  logger.info("Connected to MongoDB");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memory) await memory.stop();
}
