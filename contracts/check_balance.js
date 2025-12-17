const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env", debug: false }); // Disable debug logging

async function check(url, name) {
    try {
        const provider = new ethers.JsonRpcProvider(url);
        // Reduce noise
        const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, provider);

        const balance = await provider.getBalance(wallet.address);
        console.log(`[${name}] Address: ${wallet.address}`);
        console.log(`[${name}] Balance (wei): ${balance.toString()}`);
        console.log(`[${name}] Balance (eth): ${ethers.formatEther(balance)}`);
    } catch (e) {
        console.error(`[${name}] Error: ${e.message}`);
    }
}

async function main() {
    console.log("--- START CHECK ---");
    await check("https://sepolia.base.org", "SEPOLIA");
    await check("https://mainnet.base.org", "MAINNET");
    console.log("--- END CHECK ---");
}

main().catch(console.error);
