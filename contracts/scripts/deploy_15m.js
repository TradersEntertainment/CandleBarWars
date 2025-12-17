const hre = require("hardhat");

async function main() {
    console.log("Deploying BarWars (15m Arena)...");

    // Re-use the reliable BarWars contract
    const BarWars = await hre.ethers.getContractFactory("BarWars");
    const barWars = await BarWars.deploy();

    await barWars.waitForDeployment();

    const address = await barWars.getAddress();
    console.log("BarWars (15m) deployed to:", address);

    // Save address for bot/frontend
    const fs = require('fs');
    fs.writeFileSync('deployed_v4_15m_address.txt', address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
