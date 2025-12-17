const hre = require("hardhat");

async function main() {
    console.log("Deploying WeatherNFT...");

    const WeatherNFT = await hre.ethers.getContractFactory("WeatherNFT");
    const weatherNFT = await WeatherNFT.deploy();

    await weatherNFT.waitForDeployment();

    const address = await weatherNFT.getAddress();
    console.log("WeatherNFT deployed to:", address);

    // Verify (optional later)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
