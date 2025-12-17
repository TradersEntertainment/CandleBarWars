const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    console.log(`Deploying V2 from address: ${wallet.address}`);

    const contractPath = path.resolve(__dirname, 'WeatherAuctionV2.json');
    const { abi, bytecode } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log("Deploying WeatherAuctionV2 contract...");

    const contract = await factory.deploy();

    console.log("Waiting for deployment transaction...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`WeatherAuctionV2 deployed to: ${address}`);

    fs.writeFileSync('deployed_v2_address.txt', address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
