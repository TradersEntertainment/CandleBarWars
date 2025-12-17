const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractAddress = fs.readFileSync('deployed_v3_7_address.txt', 'utf8').trim();
    const contractPath = path.resolve(__dirname, 'BarWarsV2.json');
    const { abi } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`Seeding V3.7 Bets (Batch) on ${contractAddress}...`);

    let nonce = await provider.getTransactionCount(wallet.address);

    const batchBets = [
        { s: 'BTC', side: 1, count: 5 }, // 5 Bulls
        { s: 'ETH', side: 2, count: 10 }, // 10 Bears
    ];

    for (const b of batchBets) {
        console.log(`Batch Betting ${b.count}x on ${b.s}...`);
        try {
            const tx = await contract.betBatch(b.s, b.side, b.count, {
                value: ethers.parseEther((0.001 * b.count).toString()),
                nonce: nonce++
            });
            console.log(`Tx sent: ${tx.hash}`);
        } catch (e) { console.error(e); }
    }
    console.log("Seeding complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
