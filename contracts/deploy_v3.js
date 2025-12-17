const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    console.log(`Deploying BarWars (V3) from address: ${wallet.address}`);

    const contractPath = path.resolve(__dirname, 'BarWars.json');
    const { abi, bytecode } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log("Deploying BarWars contract...");

    // Pass no args to constructor
    const contract = await factory.deploy();

    console.log("Waiting for deployment transaction...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`BarWars deployed to: ${address}`);

    // Save outputs
    fs.writeFileSync('deployed_v3_address.txt', address);

    // Copy ABI to Frontend for convenience
    // fs.copyFileSync('BarWars.json', '../frontend/app/abi_v3.json'); // We can do this manually or via tool later

    // Verify ownership
    const owner = await contract.owner();
    console.log(`Contract Owner: ${owner}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
