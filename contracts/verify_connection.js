const { ethers } = require('ethers');

const RPC_URL = "https://sepolia.base.org";
const CONTRACT_ADDRESS = "0x83e20b37f3747765e470C1D981DCF50646193E3D";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log(`Checking code at ${CONTRACT_ADDRESS}...`);
    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === '0x') {
        console.error("ERROR: No code found at check address! It is an EOA or incorrect chain.");
    } else {
        console.log("SUCCESS: Contract code found. Length:", code.length);
    }
}

main().catch(console.error);
