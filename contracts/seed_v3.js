const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractAddressPath = path.resolve(__dirname, 'deployed_v3_address.txt');
    const contractAddress = fs.readFileSync(contractAddressPath, 'utf8').trim();

    // Load BarWars ABI
    const abiPath = path.resolve(__dirname, 'BarWars.json');
    const { abi } = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log("Seeding BarWars (V3)...");

    // Bet BULL (Side = 1)
    console.log("Placing BULL bet (0.001 ETH)...");
    let tx = await contract.bet(1, { value: ethers.parseEther("0.001") });
    await tx.wait();
    console.log(`BULL confirmed: ${tx.hash}`);

    // Bet BEAR (Side = 2)
    console.log("Placing BEAR bet (0.001 ETH)...");
    tx = await contract.bet(2, { value: ethers.parseEther("0.001") });
    await tx.wait();
    console.log(`BEAR confirmed: ${tx.hash}`);

    const stats = await contract.getCurrentStats();
    console.log(`Stats - Pool: ${ethers.formatEther(stats[1])} ETH, Bulls: ${stats[2]}, Bears: ${stats[3]}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
