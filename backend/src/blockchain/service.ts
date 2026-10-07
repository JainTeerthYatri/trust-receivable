import { ContractFactory, JsonRpcProvider, Wallet, id, isAddress } from "ethers";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { RECEIVABLE_REGISTRY_ABI } from "./abi.js";
import { BlockchainTransaction } from "../models/BlockchainTransaction.js";
import { Invoice } from "../models/Invoice.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BYTECODE_FALLBACK = "";

type ChainAction =
  | "registerInvoice"
  | "verifyInvoice"
  | "acceptInvoice"
  | "markDelivered"
  | "requestFinancing"
  | "markFinanced"
  | "markPaid"
  | "markDisputed";

export type ChainResult = {
  mode: "LIVE" | "MOCK";
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  network: string;
  timestamp: string;
  explorerUrl: string | null;
};

let cachedAddress = env.contractAddress;
let liveAvailable = false;

function invoiceBytes32(publicId: string) {
  return id(publicId);
}

function hashBytes32(hexHash: string) {
  return `0x${hexHash.replace(/^0x/, "").padEnd(64, "0").slice(0, 64)}`;
}

async function getWallet() {
  const provider = new JsonRpcProvider(env.blockchainRpcUrl, env.blockchainChainId);
  await provider.getBlockNumber();
  if (!env.blockchainPrivateKey) throw new Error("Missing BLOCKCHAIN_PRIVATE_KEY");
  return new Wallet(env.blockchainPrivateKey, provider);
}

export async function initBlockchain() {
  try {
    const wallet = await getWallet();
    liveAvailable = true;
    if (!cachedAddress || !isAddress(cachedAddress)) {
      cachedAddress = await autoDeploy(wallet);
    }
    logger.info(`Blockchain connected (${env.blockchainNetworkName}) contract ${cachedAddress}`);
  } catch (err) {
    liveAvailable = false;
    if (env.blockchainMockFallback) {
      logger.warn("Blockchain unavailable — labeled MOCK mode is active", String(err));
    } else {
      throw err;
    }
  }
}

async function autoDeploy(wallet: Wallet) {
  const artifactPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../blockchain/artifacts/contracts/ReceivableRegistry.sol/ReceivableRegistry.json"
  );
  if (!fs.existsSync(artifactPath)) {
    logger.warn("Contract artifact missing; skipping auto-deploy");
    return cachedAddress;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ContractFactory(artifact.abi, artifact.bytecode || BYTECODE_FALLBACK, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  cachedAddress = address;
  logger.info(`Auto-deployed ReceivableRegistry at ${address}`);
  return address;
}

export function blockchainStatus() {
  return {
    live: liveAvailable && Boolean(cachedAddress),
    mode: liveAvailable && cachedAddress ? "LIVE" : "MOCK",
    network: env.blockchainNetworkName,
    chainId: env.blockchainChainId,
    contractAddress: cachedAddress || "UNDEPLOYED",
    rpcUrl: env.blockchainRpcUrl
  };
}

export async function executeChainAction(params: {
  invoiceMongoId: string;
  publicId: string;
  invoiceHash: string;
  action: ChainAction;
}): Promise<ChainResult> {
  if (liveAvailable && cachedAddress) {
    try {
      return await sendLiveTx(params);
    } catch (err) {
      logger.warn("Live chain action failed", String(err));
      if (!env.blockchainMockFallback) throw err;
    }
  }
  return sendMockTx(params);
}

async function sendLiveTx(params: {
  invoiceMongoId: string;
  publicId: string;
  invoiceHash: string;
  action: ChainAction;
}): Promise<ChainResult> {
  const wallet = await getWallet();
  const { Contract } = await import("ethers");
  const contract = new Contract(cachedAddress, RECEIVABLE_REGISTRY_ABI, wallet);
  const invoiceId = invoiceBytes32(params.publicId);
  let tx;
  if (params.action === "registerInvoice") {
    tx = await contract.registerInvoice(invoiceId, hashBytes32(params.invoiceHash));
  } else {
    tx = await contract[params.action](invoiceId);
  }
  const receipt = await tx.wait();
  const result: ChainResult = {
    mode: "LIVE",
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber ?? 0,
    contractAddress: cachedAddress,
    network: env.blockchainNetworkName,
    timestamp: new Date().toISOString(),
    explorerUrl: env.blockchainChainId === 31337 ? null : `https://sepolia.etherscan.io/tx/${receipt.hash}`
  };
  await persistTx(params, result);
  return result;
}

function sendMockTx(params: {
  invoiceMongoId: string;
  publicId: string;
  invoiceHash: string;
  action: ChainAction;
}): Promise<ChainResult> {
  const hash = `mock_${params.action}_${params.publicId}_${Date.now().toString(16)}`;
  const result: ChainResult = {
    mode: "MOCK",
    transactionHash: hash,
    blockNumber: 0,
    contractAddress: cachedAddress || "MOCK_REGISTRY",
    network: "development-mock",
    timestamp: new Date().toISOString(),
    explorerUrl: null
  };
  return persistTx(params, result).then(() => result);
}

async function persistTx(
  params: { invoiceMongoId: string; publicId: string; invoiceHash: string; action: ChainAction },
  result: ChainResult
) {
  await BlockchainTransaction.create({
    invoiceId: params.invoiceMongoId,
    invoiceHash: params.invoiceHash,
    transactionHash: result.transactionHash,
    contractAddress: result.contractAddress,
    network: result.network,
    blockNumber: result.blockNumber,
    timestamp: result.timestamp,
    action: params.action,
    mode: result.mode
  });
  await Invoice.findByIdAndUpdate(params.invoiceMongoId, {
    blockchainTxHash: result.transactionHash,
    blockchainStatus: result.mode === "LIVE" ? "CONFIRMED" : "MOCK"
  });
}

export async function readOnChain(publicId: string) {
  if (!liveAvailable || !cachedAddress) {
    return { available: false, mode: "MOCK" as const, record: null };
  }
  const { Contract } = await import("ethers");
  const wallet = await getWallet();
  const contract = new Contract(cachedAddress, RECEIVABLE_REGISTRY_ABI, wallet);
  const rec = await contract.getInvoice(invoiceBytes32(publicId));
  return {
    available: true,
    mode: "LIVE" as const,
    record: {
      invoiceHash: rec.invoiceHash,
      state: Number(rec.state),
      lastActor: rec.lastActor,
      registeredAt: Number(rec.registeredAt),
      updatedAt: Number(rec.updatedAt),
      exists: rec.exists
    }
  };
}
