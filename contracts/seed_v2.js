const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractAddressPath = path.resolve(__dirname, 'deployed_v2_address.txt');
    const contractAddress = fs.readFileSync(contractAddressPath, 'utf8').trim();

    const abiPath = path.resolve(__dirname, 'WeatherAuctionV2.json');
    const { abi } = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log("Seeding Auction V2...");
    // Bid 0.0001 ETH with nickname "SYSTEM_INIT"
    // Note: bid(string nickname)

    const currentBid = await contract.currentHighestBid();
    const bidAmount = currentBid + ethers.parseEther("0.0001"); // increment

    console.log(`Placing bid of ${ethers.formatEther(bidAmount)} ETH...`);

    const tx = await contract.bid("SYSTEM_INIT", { value: bidAmount });
    console.log(`Bid tx: ${tx.hash}`);
    await tx.wait();
    console.log("Seed Bid Confirmed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
