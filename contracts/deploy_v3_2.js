const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    console.log(`Deploying BarWarsV2 (Multi-Asset) from address: ${wallet.address}`);

    const contractPath = path.resolve(__dirname, 'BarWarsV2.json');
    const { abi, bytecode } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log("Deploying BarWarsV2 contract...");

    const contract = await factory.deploy();

    console.log("Waiting for deployment transaction...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`BarWarsV2 deployed to: ${address}`);

    // Save outputs
    fs.writeFileSync('deployed_v3_2_address.txt', address);

    // Verify ownership
    const owner = await contract.owner();
    console.log(`Contract Owner: ${owner}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
