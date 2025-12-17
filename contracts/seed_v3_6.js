const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractAddress = fs.readFileSync('deployed_v3_6_address.txt', 'utf8').trim();
    const contractPath = path.resolve(__dirname, 'BarWarsV2.json');
    const { abi } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`Seeding V3.6 Bets (with User Stats) on ${contractAddress}...`);

    const bets = [
        { s: 'BTC', side: 1 },
        { s: 'BTC', side: 1 }, // 2 Bull
        { s: 'BTC', side: 2 }, // 1 Bear
        { s: 'ETH', side: 1 },
        { s: 'SOL', side: 2 },
        { s: 'XRP', side: 1 }
    ];

    let nonce = await provider.getTransactionCount(wallet.address);

    for (const b of bets) {
        try {
            console.log(`Betting 0.001 ETH on ${b.s}...`);
            await contract.bet(b.s, b.side, {
                value: ethers.parseEther("0.001"),
                nonce: nonce++
            });
        } catch (e) { console.error(e); }
    }
    console.log("Seeding complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
