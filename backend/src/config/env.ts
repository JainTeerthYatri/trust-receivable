import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });
dotenv.config({ path: path.resolve(here, "../../backend/.env") });

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/trustreceivable",
  useMemoryDb: (process.env.USE_MEMORY_DB ?? "true") === "true",
  jwtSecret: required("JWT_SECRET", "trustreceivable-local-demo-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  storageDir: process.env.STORAGE_DIR ?? "./uploads",
  storageUrl: process.env.STORAGE_URL ?? "http://localhost:4000/uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 10),
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? "http://127.0.0.1:8545",
  blockchainChainId: Number(process.env.BLOCKCHAIN_CHAIN_ID ?? 31337),
  blockchainNetworkName: process.env.BLOCKCHAIN_NETWORK_NAME ?? "hardhat",
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY ?? "",
  contractAddress: process.env.CONTRACT_ADDRESS ?? "",
  blockchainMockFallback: (process.env.BLOCKCHAIN_MOCK_FALLBACK ?? "true") === "true"
};
