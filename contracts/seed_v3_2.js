const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://sepolia.base.org");
    const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

    const contractAddress = fs.readFileSync('deployed_v3_2_address.txt', 'utf8').trim();
    const contractPath = path.resolve(__dirname, 'BarWarsV2.json');
    const { abi } = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`Seeding V3.2 Bets on ${contractAddress}...`);

    // Bets:
    // BTC: Bull
    // ETH: Bear
    // SOL: Bull
    // XRP: Bear

    const bets = [
        { s: 'BTC', side: 1 },
        { s: 'ETH', side: 2 },
        { s: 'SOL', side: 1 },
        { s: 'XRP', side: 2 }
    ];

    let nonce = await provider.getTransactionCount(wallet.address);

    for (const b of bets) {
        console.log(`Betting 0.001 ETH on ${b.s} (Side: ${b.side})...`);
        try {
            const tx = await contract.bet(b.s, b.side, {
                value: ethers.parseEther("0.001"),
                nonce: nonce++
            });
            console.log(`Tx sent: ${tx.hash}`);
        } catch (e) {
            console.error(e);
        }
    }
    console.log("Seeding complete. Check UI.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
