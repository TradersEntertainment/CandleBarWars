const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractPath = path.resolve(__dirname, 'BarWarsV2.json');
    const { abi, bytecode } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log(`Deploying BarWarsV3.6 (UserStats) from address: ${wallet.address}`);

    const contract = await factory.deploy();
    console.log("Deploying contract...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`Contract deployed to: ${address}`);

    fs.writeFileSync('deployed_v3_6_address.txt', address);

    // Auto-update ABI in frontend
    const frontendAbiPath = path.join(__dirname, '../frontend/app/abi.json');
    fs.writeFileSync(frontendAbiPath, JSON.stringify(abi, null, 4));
    console.log("Updated ABI in frontend.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
