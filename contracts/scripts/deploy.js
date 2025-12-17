const hre = require("hardhat");

async function main() {
    console.log("Deploying BarWars...");

    const BarWars = await hre.ethers.getContractFactory("BarWars");
    const barWars = await BarWars.deploy();

    await barWars.waitForDeployment();

    const address = await barWars.getAddress();
    console.log("BarWars deployed to:", address);

    // Save address for bot/frontend
    const fs = require('fs');
    fs.writeFileSync('deployed_v3_8_address.txt', address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
