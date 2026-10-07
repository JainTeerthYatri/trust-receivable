import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const Factory = await ethers.getContractFactory("ReceivableRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const [deployer] = await ethers.getSigners();

  const payload = {
    contractAddress: address,
    deployer: await deployer.getAddress(),
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString()
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "localhost.json"), JSON.stringify(payload, null, 2));

  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  if (fs.existsSync(backendEnvPath)) {
    let env = fs.readFileSync(backendEnvPath, "utf8");
    if (env.includes("CONTRACT_ADDRESS=")) {
      env = env.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nCONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(backendEnvPath, env);
  }

  console.log("ReceivableRegistry deployed:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
