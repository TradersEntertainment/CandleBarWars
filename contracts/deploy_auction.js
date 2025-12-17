const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    // 1. Setup Provider & Wallet
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    console.log(`Deploying from address: ${wallet.address}`);

    // 2. Read Compiled Contract
    const contractPath = path.resolve(__dirname, 'WeatherAuction.json');
    const { abi, bytecode } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // 3. Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log("Deploying WeatherAuction contract...");

    // No constructor arguments needed based on contract definition
    const contract = await factory.deploy();

    console.log("Waiting for deployment transaction...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`WeatherAuction deployed to: ${address}`);

    // 4. Save Address
    fs.writeFileSync('deployed_auction_address.txt', address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
