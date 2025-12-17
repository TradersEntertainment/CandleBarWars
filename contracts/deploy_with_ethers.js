const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    console.log("Deploying with account:", wallet.address);

    const artifactPath = path.resolve(__dirname, "WeatherNFT.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Deploy contract
    // Hardhat ethers v6 uses waitForDeployment, generic ethers v6 uses deployTransaction.wait? 
    // Wait, in ethers v6 factory.deploy() returns a Contract which is a Promise that resolves to the deployed contract?
    // No, factory.deploy() returns a Promise<BaseContract & { deploymentTransaction(): ContractTransactionResponse }>.
    // It is already sent to the network.

    const contract = await factory.deploy();
    console.log("Deploy tx sent:", contract.deploymentTransaction().hash);

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("WeatherNFT deployed to:", address);

    // Save address to a file so the bot can use it
    fs.writeFileSync(path.resolve(__dirname, "deployed_address.txt"), address);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
